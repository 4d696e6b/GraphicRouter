CREATE TRIGGER version_sequence BEFORE INSERT ON deck_versions
WHEN NEW.version != (SELECT latest_version + 1 FROM decks WHERE id = NEW.deck_id)
BEGIN
  SELECT RAISE(ABORT, 'VERSION_CONFLICT');
END;
--> statement-breakpoint
CREATE TRIGGER version_head AFTER INSERT ON deck_versions
BEGIN
  UPDATE decks SET latest_version = NEW.version WHERE id = NEW.deck_id;
END;
--> statement-breakpoint
CREATE TRIGGER immutable_version_update BEFORE UPDATE ON deck_versions
BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE_VERSION');
END;
--> statement-breakpoint
CREATE TRIGGER immutable_version_delete BEFORE DELETE ON deck_versions
BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE_VERSION');
END;
