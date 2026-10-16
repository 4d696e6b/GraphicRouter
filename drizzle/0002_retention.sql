CREATE TABLE retention_queue (
  deck_id text PRIMARY KEY NOT NULL,
  checked_at integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX retention_queue_due ON retention_queue (checked_at, deck_id);
--> statement-breakpoint
CREATE INDEX decks_retention_created ON decks (created_at);
--> statement-breakpoint
DROP TRIGGER immutable_version_delete;
--> statement-breakpoint
CREATE TRIGGER immutable_version_delete BEFORE DELETE ON deck_versions
WHEN NOT EXISTS (
  SELECT 1 FROM decks d JOIN retention_queue q ON q.deck_id = d.id
  WHERE d.id = OLD.deck_id AND d.created_at <= CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) - 2592000000
)
BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE_VERSION');
END;
--> statement-breakpoint
CREATE TRIGGER expired_version_insert BEFORE INSERT ON deck_versions
WHEN EXISTS (
  SELECT 1 FROM decks WHERE id = NEW.deck_id
  AND created_at <= CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) - 2592000000
)
BEGIN
  SELECT RAISE(ABORT, 'DESIGN_EXPIRED');
END;
