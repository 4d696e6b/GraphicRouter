import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const decks = sqliteTable("decks", {
  id: text("id").primaryKey(), owner: text("owner").notNull(),
  latestVersion: integer("latest_version").notNull(), createdAt: integer("created_at").notNull(),
});
export const versions = sqliteTable("deck_versions", {
  deckId: text("deck_id").notNull().references(() => decks.id), version: integer("version").notNull(),
  blueprint: text("blueprint").notNull(), createdAt: integer("created_at").notNull(),
}, t => [primaryKey({ columns: [t.deckId, t.version] })]);
export const imports = sqliteTable("canva_imports", {
  deckId: text("deck_id").notNull().references(() => decks.id), version: integer("version").notNull(), state: text("state").notNull(),
}, t => [primaryKey({ columns: [t.deckId, t.version] })]);
export const oauthStates = sqliteTable("canva_oauth_states", {
  hash: text("hash").primaryKey(), owner: text("owner").notNull(), verifier: text("verifier").notNull(), expiresAt: integer("expires_at").notNull(),
});
export const tokens = sqliteTable("canva_tokens", {
  owner: text("owner").primaryKey(), encrypted: text("encrypted").notNull(), refreshLockUntil: integer("refresh_lock_until").notNull().default(0),
});
