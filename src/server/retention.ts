import { fail } from "./errors";

export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
export type RetentionReport = { queued: number; processed: number; deletedFiles: number; failures: number; remainingDue: number };

/** Only trusted Sites identity and explicit server configuration authorize global maintenance. */
export function retentionAdministrator(email: string | undefined, configured: string | undefined) {
  return !!email && !!configured && email.toLowerCase() === configured.toLowerCase();
}

export async function exportStillActive(db: D1DatabaseSession, key: string) {
  const match = /^(?:decks|canvases|documents)\/([a-f\d-]{36})\/v\d+\/(?:pptx|notes)$/.exec(key);
  if (!match) return false;
  return !!await db.prepare("SELECT 1 FROM decks WHERE id = ? AND created_at > ?").bind(match[1], Date.now() - RETENTION_MS).first();
}

/** Fixed retention window; no caller may supply IDs, owners, timestamps or arbitrary keys. */
export async function cleanupExpiredDesigns(db: D1DatabaseSession, bucket: Pick<R2Bucket, "list" | "delete">): Promise<RetentionReport> {
  const cutoff = Date.now() - RETENTION_MS;
  // Queue first, then remove all content in one transaction. The trigger still
  // rejects deletion of unexpired versions. Queue IDs survive R2 failures and
  // are periodically checked again to recover even a late in-flight export.
  const result = await db.batch([
    db.prepare("INSERT OR IGNORE INTO retention_queue (deck_id, checked_at) SELECT id, 0 FROM decks WHERE created_at <= ? LIMIT 100").bind(cutoff),
    db.prepare("DELETE FROM canva_imports WHERE deck_id IN (SELECT d.id FROM decks d JOIN retention_queue q ON q.deck_id = d.id WHERE d.created_at <= ?)").bind(cutoff),
    db.prepare("DELETE FROM deck_versions WHERE deck_id IN (SELECT d.id FROM decks d JOIN retention_queue q ON q.deck_id = d.id WHERE d.created_at <= ?)").bind(cutoff),
    db.prepare("DELETE FROM decks WHERE created_at <= ? AND id IN (SELECT deck_id FROM retention_queue)").bind(cutoff),
    db.prepare("DELETE FROM canva_oauth_states WHERE expires_at <= ?").bind(Date.now()),
  ]);
  const report: RetentionReport = { queued: result[0].meta.changes, processed: 0, deletedFiles: 0, failures: 0, remainingDue: 0 };
  const due = await db.prepare("SELECT q.deck_id FROM retention_queue q WHERE q.checked_at <= ? AND NOT EXISTS (SELECT 1 FROM decks d WHERE d.id = q.deck_id) ORDER BY q.checked_at, q.deck_id LIMIT 20").bind(Date.now() - HOUR).all<{deck_id: string}>();
  for (const { deck_id: id } of due.results) {
    // Only server-generated UUIDs are used to construct bucket prefixes.
    if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/.test(id)) { report.failures++; continue; }
    let truncated = false;
    try {
      for (const family of ["decks", "canvases", "documents"]) {
        const prefix = `${family}/${id}/`;
        const page = await bucket.list({ prefix, limit: 1000 });
        if (page.objects.some(object => !object.key.startsWith(prefix))) throw new Error("Invalid listing");
        if (page.objects.length) { await bucket.delete(page.objects.map(object => object.key)); report.deletedFiles += page.objects.length; }
        truncated ||= page.truncated;
      }
      await db.prepare("UPDATE retention_queue SET checked_at = ? WHERE deck_id = ?").bind(truncated ? 0 : Date.now(), id).run();
      report.processed++;
    } catch {
      // Remain queued; aggregate counts expose no customer IDs or content.
      report.failures++;
    }
  }
  const dueCount = await db.prepare("SELECT (SELECT count(*) FROM retention_queue WHERE checked_at <= ?) + (SELECT count(*) FROM decks WHERE created_at <= ?) AS total").bind(Date.now() - HOUR, cutoff).first<{total: number}>();
  report.remainingDue = dueCount?.total ?? 0;
  return report;
}

export function requireRetentionAdministrator(email: string | undefined, configured: string | undefined) {
  if (!retentionAdministrator(email, configured)) fail("UNAUTHORIZED", "Only the configured Site owner can run retention maintenance.");
}
