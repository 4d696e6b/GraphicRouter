import { describe, expect, it } from "vitest";
import { handleMcp } from "../../src/mcp/server";
import { TOOL_NAMES, CANVAS_TOOL_NAMES } from "../../src/contracts";
import { ServiceError } from "../../src/server/errors";
import { DeckService } from "../../src/server/service";
import { D1DeckStore } from "../../src/server/store";
import { testDatabase } from "./database";
import { testEngine } from "./engine-double";
import { sampleDeck } from "../../src/fixtures/sample-deck";

async function rpc(method: string, params: unknown = {}, owner: string | null = null) {
  const request = new Request("https://example.test/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const response = await handleMcp(request, owner, () => { throw new ServiceError({ code: "NOT_IMPLEMENTED", message: "TEST: engine absent" }); });
  return response.json() as Promise<{ result: Record<string, unknown> }>;
}
describe("local MCP transport; does not establish ChatGPT account connection", () => {
  it("discovers the five stable deck tools plus the design briefing", async () => {
    const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } });
    expect(init.result.serverInfo).toMatchObject({ name: "GraphicRouter" });
    const list = await rpc("tools/list");
    const tools = list.result.tools as { name: string; inputSchema: unknown; description: string }[];
    expect(tools.map(t => t.name)).toEqual([...TOOL_NAMES, ...CANVAS_TOOL_NAMES, "inspect_canvas", "start_briefing"]);
    expect(tools[0].description).toContain("Never invent evidence"); expect(tools[0].inputSchema).toMatchObject({ type: "object", required: expect.arrayContaining(["slides", "brief"]) });
  });
  it("exposes the briefing before creation through initialization and tool discovery", async () => {
    const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } });
    const list = await rpc("tools/list");
    const tools = list.result.tools as { name: string; description: string }[];
    // Hosts may surface server instructions or rely on tool descriptions.
    for (const instructions of [init.result.instructions, tools.find(t => t.name === "create_deck")?.description]) {
      expect(instructions).toEqual(expect.any(String));
      for (const topic of ["call start_briefing immediately", "one question per message", "create_canvas", "edit_canvas", "structure", "content", "polish", "ChatGPT chooses the composition", "brief.unknowns", "registered PNG/JPEG", "not hidden chain-of-thought", "apply only that request"]) {
        expect(instructions).toContain(topic);
      }
    }
    expect(tools.map(t => t.name)).toEqual([...TOOL_NAMES, ...CANVAS_TOOL_NAMES, "inspect_canvas", "start_briefing"]);
  });
  it("opens the briefing without calling the deck service and retains supplied context", async () => {
    const answers = { topic: "A supplied topic", audience: "Judges" };
    const result = await rpc("tools/call", { name: "start_briefing", arguments: { context: "Verified project notes", answers } }, "owner");
    expect(result.result).toMatchObject({ structuredContent: { kind: "briefing", questionCount: 2, status: "awaiting_answers", briefingUrl: "https://example.test/briefing", answers }, _meta: { briefing: { context: "Verified project notes", answers } } });
    // rpc's service factory throws; succeeding here proves no deck write/export.
    expect(result.result.isError).not.toBe(true);
  });
  it("protects briefing access and rejects unbounded or unknown answer fields", async () => {
    expect((await rpc("tools/call", { name: "start_briefing", arguments: {} })).result).toMatchObject({ isError: true, structuredContent: { error: { code: "UNAUTHORIZED" } } });
    for (const answers of [{ topic: "x".repeat(1501) }, { password: "not-a-supported-field" }]) {
      expect((await rpc("tools/call", { name: "start_briefing", arguments: { answers } }, "owner")).result.isError).toBe(true);
    }
  });
  it("returns a structured, clearly labelled unavailable result", async () => {
    const call = await rpc("tools/call", { name: "get_deck", arguments: { deckId: crypto.randomUUID(), version: 1 } }, "owner");
    expect(call.result).toMatchObject({ isError: true, structuredContent: { error: { code: "NOT_IMPLEMENTED" } } });
  });
  it("rejects anonymous tools even if the transport is used directly", async () => {
    const call = await rpc("tools/call", { name: "get_deck", arguments: { deckId: crypto.randomUUID(), version: 1 } });
    expect(call.result).toMatchObject({ isError: true, structuredContent: { error: { code: "UNAUTHORIZED" } } });
  });
  it("serves bundled bridge resource without network scripts or secrets", async () => {
    const resource = await rpc("resources/read", { uri: "ui://graphicrouter/presentation.html" });
    const contents = resource.result.contents as { text: string; mimeType: string }[];
    expect(contents[0].mimeType).toContain("text/html"); expect(contents[0].text).toContain("<div id=\"root\"");
    expect(contents[0].text).not.toContain("<script src="); expect(contents[0].text).not.toContain("CANVA_CLIENT_SECRET");
  });
  it("creates a labelled test deck through HTTP and returns its stored blueprint and staged previews", async () => {
    const { db } = testDatabase(), store = new D1DeckStore(db);
    const service = new DeckService({ store, engine: testEngine, assets: [], origin: "https://example.test", files: { get: async () => null, put: async () => {} }, canva: { connected: async () => false, start: async () => ({ status: "not_started" }), poll: async () => ({ status: "not_started" }) } });
    const request = new Request("https://example.test/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "create_deck", arguments: sampleDeck } }) });
    const response = await handleMcp(request, "owner", () => service);
    const json = await response.json() as { result: { isError?: boolean; structuredContent: { blueprint: { deckId: string } }; _meta: { presentation: { previews: Record<string, string[]>; result: unknown } } } };
    expect(json.result.isError).not.toBe(true);
    expect(json.result._meta.presentation.result).toEqual(json.result.structuredContent);
    expect(json.result._meta.presentation.previews.finished).toHaveLength(5);
    expect(json.result._meta.presentation.previews.layout[0]).toContain("TEST DOUBLE");
    const saved = await store.read("owner", json.result.structuredContent.blueprint.deckId, 1);
    expect(saved).toEqual(json.result.structuredContent.blueprint);
  });
});
