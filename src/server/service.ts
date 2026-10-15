import { createDeckSchema, deckVersionSchema, reviseDeckSchema, type Asset, type CanvaImport, type DeckBlueprint, type DeckResult, type PreviewStage, type SlideEngine, type ToolName } from "../contracts";
import type { DeckStore } from "./store";
import { fail, ServiceError } from "./errors";

export interface FileStore {
  put(key: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
}
export interface CanvaPort {
  connected(owner: string): Promise<boolean>;
  start(owner: string, bytes: Uint8Array, title: string): Promise<CanvaImport>;
  poll(owner: string, jobId: string): Promise<CanvaImport>;
}
export class DeckService {
  constructor(private deps: { store: DeckStore; files: FileStore; engine: SlideEngine; assets: Asset[]; canva: CanvaPort; origin: string }) {}
  private validate(b: DeckBlueprint) {
    const issues = this.deps.engine.validateBlueprint(structuredClone(b));
    const errors = issues.filter(i => i.severity === "error");
    if (errors.length) fail("VALIDATION_FAILED", errors.map(i => `${i.path}: ${i.message}`).join("; "));
  }
  async call(name: ToolName, raw: unknown, owner: string | null): Promise<DeckResult> {
    if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to access your presentations.");
    const schema = name === "create_deck" ? createDeckSchema : name === "revise_deck" ? reviseDeckSchema : deckVersionSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) fail("VALIDATION_FAILED", parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
    if (name === "create_deck") {
      const b = this.deps.engine.createBlueprint(createDeckSchema.parse(raw), { deckId: crypto.randomUUID(), version: 1 });
      this.validate(b);
      await this.deps.store.create(owner, b);
      return this.result(b);
    }
    if (name === "revise_deck") {
      const input = reviseDeckSchema.parse(raw);
      const current = await this.deps.store.read(owner, input.deckId, input.baseVersion);
      const next = this.deps.engine.reviseBlueprint(structuredClone(current), input.operations);
      if (next.deckId !== current.deckId || next.version !== input.baseVersion + 1) fail("VALIDATION_FAILED", "Engine returned an invalid deck version.");
      this.validate(next);
      await this.deps.store.append(owner, input.baseVersion, next);
      return this.result(next);
    }
    const input = deckVersionSchema.parse(raw);
    const b = await this.deps.store.read(owner, input.deckId, input.version);
    let state = await this.deps.store.importState(b.deckId, b.version);
    if (name === "get_deck" && state.status === "pending") {
      try {
        const updated = await this.deps.canva.poll(owner, state.jobId);
        await this.deps.store.saveImport(b.deckId, b.version, updated);
        state = updated;
      } catch { /* Keep the pending job on transient failures; never start a new job. */ }
    }
    if (name === "export_deck" || name === "send_to_canva") {
      const files = await this.export(b);
      if (name === "send_to_canva" && state.status === "not_started") {
        if (!await this.deps.canva.connected(owner)) state = { status: "connection_required", connectUrl: `${this.deps.origin}/api/canva/connect` };
        else if (await this.deps.store.claimImport(b.deckId, b.version)) {
          try {
            const bytes = await this.deps.files.get(this.key(b, "pptx"));
            if (!bytes) fail("EXPORT_FAILED", "Saved PowerPoint is unavailable. Export again.");
            state = await this.deps.canva.start(owner, bytes, `${b.input.title.slice(0, 35)} · v${b.version}`);
          } catch {
            state = { status: "failed", code: "IMPORT_OUTCOME_UNKNOWN", message: "Canva import did not confirm an outcome. Check Canva before retrying. Download the saved PPTX for manual upload." };
          }
          await this.deps.store.saveImport(b.deckId, b.version, state);
        } else state = await this.deps.store.importState(b.deckId, b.version);
      }
      return { ...this.result(b, state), files };
    }
    const result = this.result(b, state);
    if (await this.deps.files.get(this.key(b, "pptx")) && await this.deps.files.get(this.key(b, "notes"))) result.files = this.exportUrls(b);
    return result;
  }
  private result(b: DeckBlueprint, canva: CanvaImport = { status: "not_started" }): DeckResult {
    return { blueprint: b, previewUrl: `${this.deps.origin}/decks/${b.deckId}/${b.version}`, canva };
  }
  key(b: DeckBlueprint, kind: "pptx" | "notes") { return `decks/${b.deckId}/v${b.version}/${kind}`; }
  private exportUrls(b: DeckBlueprint) {
    const root = `${this.deps.origin}/api/decks/${b.deckId}/${b.version}/files`;
    return { pptxUrl: `${root}/pptx`, notesUrl: `${root}/notes` };
  }
  private async export(b: DeckBlueprint) {
    try {
      this.validate(b);
      if (!await this.deps.files.get(this.key(b, "pptx"))) {
        const bytes = await this.deps.engine.compilePowerPoint(structuredClone(b), this.deps.assets);
        if (!bytes.length) fail("EXPORT_FAILED", "Engine returned an empty PowerPoint.");
        await this.deps.files.put(this.key(b, "pptx"), bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      }
      const notes = b.slides.map(s => `${s.id}\n\n180-second pitch\n${s.notes.core}\n\n300-second pitch\n${s.notes.expanded}`).join("\n\n---\n\n");
      await this.deps.files.put(this.key(b, "notes"), new TextEncoder().encode(notes), "text/plain;charset=utf-8");
      return this.exportUrls(b);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      fail("EXPORT_FAILED", "PowerPoint export failed. Your blueprint and prior files are preserved; retry export or contact the creator.");
    }
  }
  async download(owner: string | null, id: string, version: number, kind: string) {
    if (!owner) fail("UNAUTHORIZED", "Sign in to download this deck.");
    if (kind !== "pptx" && kind !== "notes") fail("NOT_FOUND", "File not found.");
    const b = await this.deps.store.read(owner, id, version);
    const bytes = await this.deps.files.get(this.key(b, kind));
    if (!bytes) fail("NOT_FOUND", "Export this version before downloading.");
    return bytes;
  }
  async preview(owner: string | null, id: string, version: number, stage: PreviewStage) {
    if (!owner) fail("UNAUTHORIZED", "Sign in to preview this deck.");
    const b = await this.deps.store.read(owner, id, version);
    return { blueprint: b, slides: b.slides.map(slide => this.deps.engine.renderSlideSvg(structuredClone(slide), b.theme, stage, this.deps.assets)) };
  }
}
