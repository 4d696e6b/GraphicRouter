import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasService } from "../../src/server/canvas-service";
import { D1DeckStore } from "../../src/server/store";
import { canvasEngine } from "../../src/engine/canvas";
import { renderInspectionPng } from "../../src/engine/raster";
import { assets } from "../../src/engine/assets";
import { handleMcp } from "../../src/mcp/server";
import { portraitCanvas, portraitStructure, portraitContent } from "../../src/fixtures/freeform-infographic";
import { testDatabase } from "./database";
import type { CanvasBlueprint } from "../../src/contracts";

const databases: ReturnType<typeof testDatabase>["sql"][] = [];
afterEach(() => { for (const sql of databases.splice(0)) sql.close(); });
async function setup(raster = renderInspectionPng) {
  const { db, sql } = testDatabase(); databases.push(sql);
  const store = new D1DeckStore<CanvasBlueprint>(db);
  const put = vi.fn(async () => {}), start = vi.fn(async () => ({ status: "not_started" as const }));
  const service = new CanvasService({ store, engine: canvasEngine, assets, origin: "https://example.test", raster, files: { get: async () => null, put }, canva: { connected: async () => false, start, poll: async () => ({ status: "not_started" }) } });
  let b = (await service.call("create_canvas", portraitCanvas, "owner")).blueprint;
  for (const [phase, objects] of [["structure", portraitStructure], ["content", portraitContent]] as const) b = (await service.call("edit_canvas", { deckId: b.deckId, baseVersion: b.version, phase, summary: `Place ${phase}.`, operations: objects.map(element => ({ type: "add_element", element })) }, "owner")).blueprint;
  return { b, service, store, put, start };
}
const version = (b: CanvasBlueprint) => ({ deckId: b.deckId, version: b.version });

describe("authenticated model-visible design inspection", () => {
  it("returns a real PNG and actionable diagnostics without changing the saved version", async () => {
    const { b, service, store, put, start } = await setup(), before = structuredClone(b);
    const result = await service.inspect("owner", version(b));
    expect([...result.image.bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(result.image.width).toBe(1080); expect(result.image.height).toBe(1600);
    expect(result.report.issues).toContainEqual(expect.objectContaining({ code: "SMALL_AT_PHONE_WIDTH", severity: "warning" }));
    expect(result.report.reviewInstructions).toContain("not the imported Canva");
    expect(await store.read("owner", b.deckId, b.version)).toEqual(before);
    expect(put).not.toHaveBeenCalled(); expect(start).not.toHaveBeenCalled();
  });
  it("supports an in-bounds detail crop but rejects anonymous and cross-owner reads first", async () => {
    const { b, service } = await setup();
    await expect(service.inspect(null, version(b))).rejects.toMatchObject({ detail: { code: "UNAUTHORIZED" } });
    await expect(service.inspect("another-owner", version(b))).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    const detail = await service.inspect("owner", { ...version(b), region: { x: 64, y: 100, width: 900, height: 300 } });
    expect(detail.image.width).toBe(900); expect(detail.image.height).toBe(300);
    expect(detail.report.region).toEqual({ x: 64, y: 100, width: 900, height: 300 });
    await expect(service.inspect("owner", { ...version(b), region: { x: 500, y: 100, width: 900, height: 300 } })).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED" } });
  });
  it("exposes the PNG in MCP image content rather than hidden widget metadata", async () => {
    const { b, service } = await setup();
    const request = new Request("https://example.test/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "inspect_canvas", arguments: version(b) } }) });
    const response = await handleMcp(request, "owner", () => { throw new Error("Legacy service must not be used"); }, () => service);
    const json = await response.json() as { result: { isError?: boolean; content: { type: string; data?: string; mimeType?: string }[]; structuredContent: { deckId: string } } };
    expect(json.result.isError).not.toBe(true);
    expect(json.result.structuredContent.deckId).toBe(b.deckId);
    const image = json.result.content.find(item => item.type === "image")!;
    expect(image.mimeType).toBe("image/png");
    expect([...Buffer.from(image.data!, "base64").subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
  it("does not turn renderer failure into a successful visual review or leak backend details", async () => {
    const { b, service, store } = await setup(async () => { throw new Error("private renderer details"); });
    await expect(service.inspect("owner", version(b))).rejects.toMatchObject({ detail: { code: "EXPORT_FAILED", message: expect.not.stringContaining("private renderer") } });
    expect(await store.read("owner", b.deckId, b.version)).toEqual(b);
  });
});
