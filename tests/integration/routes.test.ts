import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError } from "../../src/server/errors";

const mocks = vi.hoisted(() => ({ user: vi.fn(), service: vi.fn(), canva: vi.fn() }));
vi.mock("../../app/chatgpt-auth", () => ({ getChatGPTUser: mocks.user, chatGPTSignInPath: () => "/signin-with-chatgpt" }));
vi.mock("../../src/server/runtime", () => ({ service: mocks.service, canvaClient: mocks.canva }));
import { GET as file } from "../../app/api/decks/[deckId]/[version]/files/[kind]/route";
import { POST as mcp } from "../../app/mcp/route";
import { POST as tool } from "../../app/api/tools/[name]/route";
import { GET as connect } from "../../app/api/canva/connect/route";
import { testEngine } from "./engine-double";
import { sampleDeck } from "../../src/fixtures/sample-deck";

beforeEach(() => {
  vi.resetAllMocks(); mocks.user.mockResolvedValue(null);
  mocks.service.mockImplementation(() => { throw new Error("TEST private secret backend detail"); });
});
describe("HTTP authorization before storage/file access", () => {
  const url = "https://example.test";
  const deckId = "12345678-1234-4123-8123-123456789abc";
  it("rejects unauthenticated downloads and MCP calls with HTTP 401", async () => {
    const response = await file(new Request(`${url}/api/decks/${deckId}/1/files/pptx`), { params: Promise.resolve({ deckId, version: "1", kind: "pptx" }) });
    expect(response.status).toBe(401); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const rpc = await mcp(new Request(`${url}/mcp`, { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "tools/call", id: 1, params: { name: "get_deck", arguments: { deckId, version: 1 } } }) }));
    expect(rpc.status).toBe(401); expect(mocks.service).not.toHaveBeenCalled();
  });
  it("authorizes files against the signed-in owner and prevents cache leakage", async () => {
    mocks.user.mockResolvedValue({ userId: "owner" });
    const download = vi.fn().mockRejectedValue(new ServiceError({ code: "NOT_FOUND", message: "Deck version not found for this user." }));
    mocks.service.mockReturnValue({ download });
    const response = await file(new Request(url), { params: Promise.resolve({ deckId, version: "1", kind: "pptx" }) });
    expect(response.status).toBe(404); expect(download).toHaveBeenCalledWith("owner", deckId, 1, "pptx");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("rejects malformed deck/file paths before service access", async () => {
    mocks.user.mockResolvedValue({ userId: "owner" });
    const response = await file(new Request(url), { params: Promise.resolve({ deckId: "../other", version: "0", kind: "pptx" }) });
    expect(response.status).toBe(404); expect(mocks.service).not.toHaveBeenCalled();
  });
  it("rejects cross-origin browser mutations", async () => {
    mocks.user.mockResolvedValue({ userId: "owner" });
    const response = await tool(new Request(`${url}/api/tools/export_deck`, { method: "POST", headers: { Origin: "https://attacker.test", "Content-Type": "application/json" }, body: "{}" }), { params: Promise.resolve({ name: "export_deck" }) });
    expect(response.status).toBe(401); expect(mocks.service).not.toHaveBeenCalled();
  });
  it("sanitizes internal storage errors", async () => {
    mocks.user.mockResolvedValue({ userId: "owner" });
    const response = await file(new Request(url), { params: Promise.resolve({ deckId, version: "1", kind: "pptx" }) });
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("secret");
  });
  it("provides an actionable manual fallback if Canva configuration is missing", async () => {
    mocks.user.mockResolvedValue({ userId: "owner" }); mocks.canva.mockReturnValue(null);
    const response = await connect(new Request(`${url}/api/canva/connect`));
    expect(response.status).toBe(503); expect(await response.text()).toContain("upload it manually");
  });
  it("returns a successful committed export and download links when SVG rendering fails", async () => {
    mocks.user.mockResolvedValue({ userId: "owner" });
    const result = { blueprint: testEngine.createBlueprint(sampleDeck, { deckId, version: 1 }), previewUrl: `${url}/decks/${deckId}/1`, canva: { status: "not_started" }, files: { pptxUrl: `${url}/download/pptx`, notesUrl: `${url}/download/notes` } };
    const call = vi.fn().mockResolvedValue(result), preview = vi.fn().mockRejectedValue(new Error("TEST secret render detail"));
    mocks.service.mockReturnValue({ call, preview });
    const response = await tool(new Request(`${url}/api/tools/export_deck`, { method: "POST", headers: { Origin: url, "Content-Type": "application/json" }, body: JSON.stringify({ deckId, version: 1 }) }), { params: Promise.resolve({ name: "export_deck" }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ result, previews: null, previewError: expect.stringContaining("operation succeeded") });
    expect(JSON.stringify(data)).not.toContain("secret render");
    expect(call).toHaveBeenCalledTimes(1);
  });
});
