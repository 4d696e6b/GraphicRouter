import type { CanvaImport, DeckBlueprint } from "../contracts";
import { fail } from "./errors";
import { RETENTION_MS } from "./retention";

export interface VersionedDocument { deckId: string; version: number }
export interface DeckStore<T extends VersionedDocument = DeckBlueprint> {
  create(owner: string, blueprint: T): Promise<void>;
  read(owner: string, id: string, version: number): Promise<T>;
  append(owner: string, baseVersion: number, blueprint: T): Promise<void>;
  importState(id: string, version: number): Promise<CanvaImport>;
  claimImport(id: string, version: number): Promise<boolean>;
  releaseUnstartedImport(id: string, version: number): Promise<void>;
  saveImport(id: string, version: number, state: CanvaImport): Promise<CanvaImport>;
}

/** D1 batch + triggers enforce immutable, contiguous versions atomically. */
export class D1DeckStore<T extends VersionedDocument = DeckBlueprint> implements DeckStore<T> {
  constructor(private db: D1DatabaseSession) {}
  async create(owner: string, b: T) {
    await this.db.batch([
      this.db.prepare("INSERT INTO decks (id, owner, latest_version, created_at) VALUES (?, ?, 0, ?)").bind(b.deckId, owner, Date.now()),
      this.insert(b),
    ]);
  }
  private insert(b: T) {
    return this.db.prepare("INSERT INTO deck_versions (deck_id, version, blueprint, created_at) VALUES (?, ?, ?, ?)").bind(b.deckId, b.version, JSON.stringify(b), Date.now());
  }
  async read(owner: string, id: string, version: number) {
    const row = await this.db.prepare("SELECT v.blueprint FROM deck_versions v JOIN decks d ON d.id = v.deck_id WHERE d.owner = ? AND d.id = ? AND v.version = ? AND d.created_at > ?").bind(owner, id, version, Date.now() - RETENTION_MS).first<{ blueprint: string }>();
    if (!row) fail("NOT_FOUND", "Deck version not found for this user.");
    return JSON.parse(row.blueprint) as T;
  }
  async append(owner: string, baseVersion: number, b: T) {
    const current = await this.db.prepare("SELECT latest_version FROM decks WHERE id = ? AND owner = ? AND created_at > ?").bind(b.deckId, owner, Date.now() - RETENTION_MS).first<{ latest_version: number }>();
    if (!current) fail("NOT_FOUND", "Deck not found for this user.");
    if (current.latest_version !== baseVersion) fail("VERSION_CONFLICT", "Read the current version before revising.", current.latest_version);
    try { await this.insert(b).run(); }
    catch (error) {
      const latest = await this.db.prepare("SELECT latest_version FROM decks WHERE id = ? AND owner = ? AND created_at > ?").bind(b.deckId, owner, Date.now() - RETENTION_MS).first<{ latest_version: number }>();
      if (latest && latest.latest_version !== baseVersion) fail("VERSION_CONFLICT", "Another revision won. Read the current version before revising.", latest.latest_version);
      throw error;
    }
  }
  async importState(id: string, version: number): Promise<CanvaImport> {
    const row = await this.db.prepare("SELECT state FROM canva_imports WHERE deck_id = ? AND version = ?").bind(id, version).first<{ state: string }>();
    return row ? JSON.parse(row.state) : { status: "not_started" };
  }
  async claimImport(id: string, version: number) {
    const state: CanvaImport = { status: "failed", code: "IMPORT_OUTCOME_UNKNOWN", message: "Import is starting or its outcome is uncertain. Do not retry automatically. Use the saved PPTX for manual upload, or check Canva before creating a new deck version." };
    const result = await this.db.prepare("INSERT OR IGNORE INTO canva_imports (deck_id, version, state) VALUES (?, ?, ?)").bind(id, version, JSON.stringify(state)).run();
    return result.meta.changes === 1;
  }
  async saveImport(id: string, version: number, state: CanvaImport) {
    // Polls can finish out of order. A completed job must never regress to an
    // older pending/failure response. The unknown-outcome sentinel is the claim
    // written immediately before the first import request; its writer may finish it.
    await this.db.prepare(`UPDATE canva_imports SET state = ? WHERE deck_id = ? AND version = ?
      AND (json_extract(state, '$.status') = 'pending'
        OR (json_extract(state, '$.status') = 'failed'
          AND json_extract(state, '$.code') = 'IMPORT_OUTCOME_UNKNOWN'
          AND json_extract(state, '$.jobId') IS NULL))`).bind(JSON.stringify(state), id, version).run();
    return this.importState(id, version);
  }
  async releaseUnstartedImport(id: string, version: number) {
    // Never remove a known pending/finished job. This is used only after a proven
    // preflight failure or explicit authentication rejection of a new import.
    await this.db.prepare(`DELETE FROM canva_imports WHERE deck_id = ? AND version = ?
      AND json_extract(state, '$.status') = 'failed'
      AND json_extract(state, '$.code') = 'IMPORT_OUTCOME_UNKNOWN'
      AND json_extract(state, '$.jobId') IS NULL`).bind(id, version).run();
  }
}
