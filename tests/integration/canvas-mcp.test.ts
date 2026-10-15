import { afterEach, describe, expect, it } from "vitest";
import { handleMcp } from "../../src/mcp/server";
import { CanvasService } from "../../src/server/canvas-service";
import { D1DeckStore } from "../../src/server/store";
import { canvasEngine } from "../../src/engine/canvas";
import { assets } from "../../src/engine/assets";
import type { CanvasBlueprint, CanvasResult } from "../../src/contracts";
import { portraitCanvas, portraitStructure, portraitContent } from "../../src/fixtures/freeform-infographic";
import { testDatabase } from "./database";

const databases: ReturnType<typeof testDatabase>["sql"][] = [];
afterEach(() => { for (const sql of databases.splice(0)) sql.close(); });
function setup() {
  const { db, sql } = testDatabase(); databases.push(sql);
  const files = new Map<string, Uint8Array>();
  const service = new CanvasService({ store: new D1DeckStore<CanvasBlueprint>(db), files: { put: async (k, v) => { files.set(k, v); }, get: async k => files.get(k) ?? null }, engine: canvasEngine, assets, origin: "https://example.test", canva: { connected: async () => false, start: async () => ({ status: "not_started" }), poll: async () => ({ status: "not_started" }) } });
  return async (name: string, args: unknown, owner: string | null = "owner") => {
    const request = new Request("https://example.test/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) });
    const response = await handleMcp(request, owner, () => { throw new Error("Legacy deck service must not be used for freeform graphics"); }, () => service);
    return (await response.json() as { result: { isError?: boolean; structuredContent: CanvasResult; _meta: { canvas: { result: CanvasResult; previews: { finished: string }; constructionPreviews: string[] } }; content: { text: string }[] } }).result;
  };
}

describe("real canvas tools through local MCP, not a hosted account check", () => {
  it("creates a true blank, constructs the infographic, returns exact app data, and keeps Canva auth explicit", async () => {
    const rpc = setup(), blank = await rpc("create_canvas", portraitCanvas);
    expect(blank.isError).not.toBe(true);
    expect(blank.structuredContent.blueprint.elements).toEqual([]);
    expect(blank.content.at(-1)?.text).toContain("Continue with edit_canvas");
    let b = blank.structuredContent.blueprint;
    for (const [phase, objects] of [["structure", portraitStructure], ["content", portraitContent]] as const) {
      const result = await rpc("edit_canvas", { deckId: b.deckId, baseVersion: b.version, phase, summary: `Compose the ${phase} deliberately.`, operations: objects.map(element => ({ type: "add_element", element })) });
      expect(result.isError).not.toBe(true);
      b = result.structuredContent.blueprint;
      expect(result._meta.canvas.result).toEqual(result.structuredContent);
      expect(result._meta.canvas.previews.finished).toContain('viewBox="0 0 1080 1600"');
      expect(result._meta.canvas.constructionPreviews.length).toBeGreaterThan(1);
    }
    expect(b.elements).toEqual([...portraitStructure, ...portraitContent]);
    const exported = await rpc("send_canvas_to_canva", { deckId: b.deckId, version: b.version });
    expect(exported.structuredContent.canva).toMatchObject({ status: "connection_required" });
    expect(exported.structuredContent.files?.pptxUrl).toContain(`/api/canvases/${b.deckId}/${b.version}/files/pptx`);
    expect(exported.content.at(-1)?.text).toContain("No Canva design link is confirmed");
    expect((await rpc("get_canvas", { deckId: b.deckId, version: 1 })).structuredContent.blueprint.elements).toEqual([]);
  });
  it("rejects anonymous canvas creation before the renderer or storage is used", async () => {
    expect((await setup()("create_canvas", portraitCanvas, null)).isError).toBe(true);
  });
});
