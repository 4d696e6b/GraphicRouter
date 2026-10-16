import { describe, expect, it, vi } from "vitest";
import { testDatabase } from "./database";
import { D1DeckStore } from "../../src/server/store";
import { cleanupExpiredDesigns, exportStillActive, RETENTION_MS, retentionAdministrator, requireRetentionAdministrator } from "../../src/server/retention";
import { R2FileStore } from "../../src/server/files";
import { handleMcp } from "../../src/mcp/server";

async function fixture() {
  const { db, sql } = testDatabase();
  const store = new D1DeckStore<{deckId: string; version: number; text: string}>(db);
  const expired = crypto.randomUUID(), active = crypto.randomUUID();
  for (const deckId of [expired, active]) await store.create("customer", { deckId, version: 1, text: "PRIVATE DESIGN CONTENT" });
  sql.prepare("UPDATE decks SET created_at = ? WHERE id = ?").run(Date.now() - RETENTION_MS - 5000, expired);
  const keys = new Set([`decks/${expired}/v1/pptx`, `canvases/${expired}/v1/notes`, `documents/${expired}/v2/pptx`, `documents/${active}/v1/pptx`, "unrelated/file"]);
  const bucket = { list: vi.fn(async ({prefix}: {prefix: string}) => ({ objects: [...keys].filter(key => key.startsWith(prefix)).map(key => ({key})), truncated: false })), delete: vi.fn(async (input: string | string[]) => { for (const key of typeof input === "string" ? [input] : input) keys.delete(key); }) };
  return { db, sql, store, expired, active, keys, bucket: bucket as unknown as Pick<R2Bucket, "list" | "delete"> };
}

describe("30-day saved-design retention", () => {
  it("hides expired data from reads/edits before cleanup and preserves current data and ownership", async () => {
    const f = await fixture();
    await expect(f.store.read("customer", f.expired, 1)).rejects.toMatchObject({detail: {code:"NOT_FOUND"}});
    await expect(f.store.append("customer", 1, {deckId:f.expired, version:2, text:"revision"})).rejects.toMatchObject({detail:{code:"NOT_FOUND"}});
    await expect(f.store.read("other-user", f.active, 1)).rejects.toMatchObject({detail:{code:"NOT_FOUND"}});
    expect((await f.store.read("customer", f.active, 1)).text).toBe("PRIVATE DESIGN CONTENT");
    expect(await exportStillActive(f.db, `decks/${f.expired}/v1/pptx`)).toBe(false);
    expect(await exportStillActive(f.db, `documents/${f.active}/v1/notes`)).toBe(true);
    expect(await exportStillActive(f.db, "decks/../../canva_tokens")).toBe(false);
  });
  it("keeps deletion/update guards for active designs and refuses unqueued expired deletion", async () => {
    const f = await fixture();
    expect(() => f.sql.prepare("DELETE FROM deck_versions WHERE deck_id = ?").run(f.expired)).toThrow("IMMUTABLE_VERSION");
    f.sql.prepare("INSERT INTO retention_queue VALUES (?, 0)").run(f.active);
    expect(() => f.sql.prepare("DELETE FROM deck_versions WHERE deck_id = ?").run(f.active)).toThrow("IMMUTABLE_VERSION");
    expect(() => f.sql.prepare("UPDATE deck_versions SET blueprint = '{}' WHERE deck_id = ?").run(f.active)).toThrow("IMMUTABLE_VERSION");
    expect(() => f.sql.prepare("INSERT INTO deck_versions VALUES (?, 2, '{}', ?)").run(f.expired, Date.now())).toThrow("DESIGN_EXPIRED");
  });
  it("purges expired database content and all export families without touching active designs or OAuth connections", async () => {
    const f = await fixture();
    f.sql.prepare("INSERT INTO canva_imports VALUES (?, 1, '{}')").run(f.expired);
    f.sql.prepare("INSERT INTO canva_tokens (owner, encrypted) VALUES ('customer', 'encrypted-test-token')").run();
    const report = await cleanupExpiredDesigns(f.db, f.bucket);
    expect(report).toEqual({queued:1,processed:1,deletedFiles:3,failures:0,remainingDue:0});
    expect(f.sql.prepare("SELECT count(*) AS count FROM decks").get()).toEqual({count:1});
    expect(f.sql.prepare("SELECT count(*) AS count FROM deck_versions").get()).toEqual({count:1});
    expect(f.sql.prepare("SELECT count(*) AS count FROM canva_imports").get()).toEqual({count:0});
    expect(f.sql.prepare("SELECT count(*) AS count FROM canva_tokens").get()).toEqual({count:1});
    expect([...f.keys]).toEqual([`documents/${f.active}/v1/pptx`,"unrelated/file"]);
    expect(JSON.stringify(report)).not.toContain(f.expired);
  });
  it("retains queue entries after bucket failures and retries safely, including late files", async () => {
    const f = await fixture();
    vi.mocked(f.bucket.delete).mockRejectedValueOnce(new Error("TEST bucket outage"));
    const failed = await cleanupExpiredDesigns(f.db, f.bucket);
    expect(failed.failures).toBe(1); expect(failed.remainingDue).toBe(1);
    expect((await cleanupExpiredDesigns(f.db, f.bucket)).deletedFiles).toBe(3);
    // Simulate a delayed writer or old host racing the purge. Tombstones survive.
    f.keys.add(`documents/${f.expired}/v1/pptx`);
    f.sql.prepare("UPDATE retention_queue SET checked_at = 0").run();
    expect((await cleanupExpiredDesigns(f.db, f.bucket)).deletedFiles).toBe(1);
  });
  it("removes an export that expires while the bucket write is in flight", async () => {
    const active = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false), remove = vi.fn(async () => {});
    const put = vi.fn(async () => null);
    const files = new R2FileStore({put} as unknown as Pick<R2Bucket,"put"|"get"|"head">, {active,remove});
    await expect(files.put("test-key", new Uint8Array([1]),"test")).rejects.toMatchObject({detail:{code:"NOT_FOUND"}});
    expect(remove).toHaveBeenCalledWith("test-key");
    const denied = new R2FileStore({put} as unknown as Pick<R2Bucket,"put"|"get"|"head">, {active:async()=>false,remove});
    await expect(denied.put("test-key",new Uint8Array([1]),"test")).rejects.toThrow();
    expect(put).toHaveBeenCalledTimes(1);
  });
  it("requires the configured trusted owner email and never exposes maintenance to ordinary MCP callers", async () => {
    expect(retentionAdministrator(undefined,"owner@example.test")).toBe(false);
    expect(retentionAdministrator("owner@example.test",undefined)).toBe(false);
    expect(retentionAdministrator("customer@example.test","owner@example.test")).toBe(false);
    expect(() => requireRetentionAdministrator("customer@example.test","owner@example.test")).toThrow();
    const maintenance = vi.fn(async () => ({queued:0,processed:0,deletedFiles:0,failures:0,remainingDue:0}));
    async function rpc(owner: string|null, enabled:boolean, method:string) {
      const req = new Request("https://example.test/mcp",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params: method === "tools/list" ? {} : {name:"run_retention_cleanup",arguments:{}}})});
      return (await handleMcp(req,owner,()=>{throw new Error("no service");},undefined,undefined,enabled?maintenance:undefined)).json() as Promise<{result:{tools:{name:string;annotations:Record<string,boolean>}[];isError?:boolean;structuredContent:{failures:number}};error?:unknown}>;
    }
    for (const [owner,enabled] of [[null,true],["customer",false]] as const) {
      const list = await rpc(owner,enabled,"tools/list");
      expect(list.result.tools.some((t:{name:string})=>t.name==="run_retention_cleanup")).toBe(false);
      const denied = await rpc(owner,enabled,"tools/call"); expect(denied.result?.isError ?? !!denied.error).toBe(true);
    }
    expect(maintenance).not.toHaveBeenCalled();
    const list = await rpc("owner",true,"tools/list");
    expect(list.result.tools.find((t:{name:string})=>t.name==="run_retention_cleanup")?.annotations).toMatchObject({destructiveHint:true,readOnlyHint:false,openWorldHint:false});
    expect((await rpc("owner",true,"tools/call")).result.structuredContent.failures).toBe(0);
    expect(maintenance).toHaveBeenCalledTimes(1);
  });
});
