import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasElement, CanvasResult, CreateCanvasInput } from "../../src/contracts";
import { canvasEngine } from "../../src/engine/canvas";
import { ServiceError } from "../../src/server/errors";

const mocks = vi.hoisted(() => ({ user: vi.fn(), canvasService: vi.fn() }));
vi.mock("../../app/chatgpt-auth", () => ({ getChatGPTUser: mocks.user }));
vi.mock("../../src/server/runtime", () => ({ canvasService: mocks.canvasService }));
import { GET as file } from "../../app/api/canvases/[deckId]/[version]/files/[kind]/route";
import { POST as tool } from "../../app/api/canvas-tools/[name]/route";

const origin = "https://example.test";
const deckId = "12345678-1234-4123-8123-123456789abc";
const brief: CreateCanvasInput = {
  title: "Local HTTP canvas test draft",
  brief: { idea: "Show a supplied headline on a blank canvas.", audience: "Test reviewers", purpose: "Check HTTP authorization and saved-result recovery.", facts: ["This is a local test draft."], unknowns: ["Live Canva fidelity has not been tested."] },
  canvas: { width: 1000, height: 800 },
  theme: { background: "#FFFFFF", foreground: "#151515", muted: "#555555", accent: "#7C3AED" },
  designIntent: "Place one headline with generous surrounding space.",
};
const headline: CanvasElement = { id: "headline", type: "text", text: "Local test draft", x: 80, y: 80, width: 840, height: 120, zIndex: 0, fontFamily: "Arial", fontSize: 48, bold: true, color: { token: "foreground" }, align: "left" };
const edit = { deckId, baseVersion: 1, phase: "content" as const, summary: "Place the supplied local test headline.", operations: [{ type: "add_element" as const, element: headline }] };
function resultFixture(): CanvasResult {
  const blank = canvasEngine.create(brief, { deckId, version: 1 });
  const blueprint = canvasEngine.edit(blank, edit);
  return { blueprint, previewUrl: `${origin}/canvases/${deckId}/2`, canva: { status: "not_started" } };
}
const fileContext = (overrides: Partial<{ deckId: string; version: string; kind: string }> = {}) => ({ params: Promise.resolve({ deckId, version: "2", kind: "pptx", ...overrides }) });
const toolContext = (name: string) => ({ params: Promise.resolve({ name }) });
function jsonRequest(name: string, body = JSON.stringify({ deckId, version: 2 }), requestOrigin: string | null = origin) {
  return new Request(`${origin}/api/canvas-tools/${name}`, { method: "POST", headers: { "Content-Type": "application/json", ...(requestOrigin ? { Origin: requestOrigin } : {}) }, body });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue(null);
  mocks.canvasService.mockImplementation(() => { throw new Error("private mock canvas backend detail"); });
});

describe("canvas HTTP routes with mocked identity/service, real result blueprint", () => {
  it("rejects anonymous file reads and tool calls before constructing the service", async () => {
    const download = await file(new Request(`${origin}/api/canvases/${deckId}/2/files/pptx`), fileContext());
    const mutation = await tool(jsonRequest("edit_canvas", JSON.stringify(edit)), toolContext("edit_canvas"));
    for (const response of [download, mutation]) {
      expect(response.status).toBe(401);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    }
    expect(mocks.canvasService).not.toHaveBeenCalled();
  });

  it.each([
    { kind: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", suffix: "pptx" },
    { kind: "notes", mime: "text/plain;charset=utf-8", suffix: "txt" },
  ])("passes the signed-in owner to $kind downloads and prevents cache leakage", async ({ kind, mime, suffix }) => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const bytes = new Uint8Array([80, 75, 3, 4]), download = vi.fn().mockResolvedValue(bytes);
    mocks.canvasService.mockReturnValue({ download });
    const response = await file(new Request(origin), fileContext({ kind }));
    expect(response.status).toBe(200);
    expect(download).toHaveBeenCalledExactlyOnceWith("signed-owner", deckId, 2, kind);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(response.headers.get("Content-Type")).toBe(mime);
    expect(response.headers.get("Content-Disposition")).toContain(`graphicrouter-canvas-v2.${suffix}`);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("preserves the service's owner-scoped not-found response on downloads", async () => {
    mocks.user.mockResolvedValue({ userId: "another-owner" });
    const download = vi.fn().mockRejectedValue(new ServiceError({ code: "NOT_FOUND", message: "Canvas not found for this user." }));
    mocks.canvasService.mockReturnValue({ download });
    const response = await file(new Request(origin), fileContext());
    expect(response.status).toBe(404);
    expect(download).toHaveBeenCalledExactlyOnceWith("another-owner", deckId, 2, "pptx");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it.each([
    { deckId: "../other", version: "2" },
    { deckId, version: "0" },
    { deckId, version: "1.5" },
    { deckId, version: "not-a-version" },
  ])("rejects malformed paths $deckId / $version before service access", async params => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const response = await file(new Request(origin), fileContext(params));
    expect(response.status).toBe(404);
    expect(mocks.canvasService).not.toHaveBeenCalled();
  });

  it.each(["https://attacker.test", null])("rejects mutation Origin %s before service access", async requestOrigin => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const response = await tool(jsonRequest("edit_canvas", JSON.stringify(edit), requestOrigin), toolContext("edit_canvas"));
    expect(response.status).toBe(401);
    expect(mocks.canvasService).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, unsupported content types and oversized construction batches before service access", async () => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const requests = [
      jsonRequest("edit_canvas", "{ invalid"),
      new Request(`${origin}/api/canvas-tools/edit_canvas`, { method: "POST", headers: { Origin: origin, "Content-Type": "text/plain" }, body: "{}" }),
      jsonRequest("edit_canvas", " ".repeat(128001)),
    ];
    for (const request of requests) {
      const response = await tool(request, toolContext("edit_canvas"));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_FAILED" } });
    }
    expect(mocks.canvasService).not.toHaveBeenCalled();
  });

  it("rejects unknown canvas tool paths before service access", async () => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const response = await tool(jsonRequest("arbitrary_canvas_action"), toolContext("arbitrary_canvas_action"));
    expect(response.status).toBe(404);
    expect(mocks.canvasService).not.toHaveBeenCalled();
  });

  it("returns the committed saved version with HTTP 200 when preview rendering fails, without repeating the write", async () => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const result = resultFixture();
    const call = vi.fn().mockResolvedValue(result), preview = vi.fn().mockRejectedValue(new Error("private mock preview render detail"));
    mocks.canvasService.mockReturnValue({ call, preview });
    const response = await tool(jsonRequest("edit_canvas", JSON.stringify(edit)), toolContext("edit_canvas"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ result, previews: { layout: "", content: "", finished: "" }, constructionPreviews: [], previewError: expect.stringContaining("operation succeeded") });
    expect(body).toMatchObject({ previewError: expect.stringContaining("version is saved") });
    expect(body).toMatchObject({ previewError: expect.stringContaining("without repeating the edit") });
    expect(JSON.stringify(body)).not.toContain("private mock preview");
    expect(call).toHaveBeenCalledExactlyOnceWith("edit_canvas", edit, "signed-owner");
    expect(preview).toHaveBeenCalledExactlyOnceWith("signed-owner", deckId, 2);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("sanitizes unexpected backend exceptions without leaking internal data", async () => {
    mocks.user.mockResolvedValue({ userId: "signed-owner" });
    const response = await file(new Request(origin), fileContext());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private mock");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
