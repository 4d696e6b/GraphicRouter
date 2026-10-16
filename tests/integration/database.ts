import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

/** SQL-backed D1 adapter for tests. Executes production migrations and queries. */
export function testDatabase() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  for (const file of ["0000_exotic_human_fly.sql", "0001_version-guards.sql", "0002_retention.sql"]) sql.exec(readFileSync(new URL(`../../drizzle/${file}`, import.meta.url), "utf8"));
  class Statement {
    values: (string | number | null)[] = [];
    constructor(readonly query: string) {}
    bind(...values: (string | number | null)[]) { this.values = values; return this; }
    async all() { return { success: true, results: sql.prepare(this.query).all(...this.values), meta: {} }; }
    async first() { return sql.prepare(this.query).get(...this.values) ?? null; }
    async run() { return { success: true, meta: { changes: Number(sql.prepare(this.query).run(...this.values).changes) } }; }
  }
  const db = {
    prepare(query: string) { return new Statement(query); },
    async batch(statements: Statement[]) {
      sql.exec("BEGIN");
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sql.exec("COMMIT"); return results; }
      catch (error) { sql.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1DatabaseSession;
  return { db, sql };
}
