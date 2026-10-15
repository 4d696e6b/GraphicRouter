import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanvasBlueprint, CanvasElement, CreateCanvasInput, EditCanvasInput } from "../../src/contracts";
import { canvasEngine } from "../../src/engine/canvas";
import { assets, DEMO_ASSET_ID } from "../../src/engine/assets";
import { engine as slideEngine } from "../../src/engine";
import { CanvasService } from "../../src/server/canvas-service";
import { DeckService, type CanvaPort, type FileStore } from "../../src/server/service";
import { D1DeckStore } from "../../src/server/store";
import { CanvaConnectionRequired } from "../../src/integrations/canva/errors";
import { sampleDeck } from "../../src/fixtures/sample-deck";
import { readPptx } from "../engine/read-pptx";
import { testDatabase } from "./database";

const owner = "canvas-test-owner";
const origin = "https://example.test";
const jobId = "mock-canva-job";
const input: CreateCanvasInput = {
  title: "GraphicRouter local infographic draft",
  brief: {
    idea: "Explain a supplied design brief using separately editable objects.",
    audience: "Local test reviewers",
    purpose: "Verify blank-canvas construction, without claiming a live Canva import.",
    facts: ["The project is called GraphicRouter."],
    unknowns: ["Live Canva import fidelity for this draft has not been checked."],
  },
  canvas: { width: 1200, height: 900 },
  theme: { background: "#F7F5EF", foreground: "#151515", muted: "#666666", accent: "#7C3AED" },
  designIntent: "Give one headline generous space beside a separately editable brand image.",
};
const panel: CanvasElement = { id: "intro.panel", type: "shape", shape: "rectangle", x: 64, y: 64, width: 680, height: 300, zIndex: 0, fill: { hex: "#FFFFFF" } };
const headline: CanvasElement = { id: "intro.headline", type: "text", text: "GraphicRouter", x: 96, y: 100, width: 580, height: 80, zIndex: 1, fontFamily: "Arial", fontSize: 48, bold: true, color: { token: "foreground" }, align: "left" };
const image: CanvasElement = { id: "intro.image", type: "image", assetId: DEMO_ASSET_ID, alt: "Bundled GraphicRouter mark", x: 792, y: 96, width: 128, height: 128, zIndex: 2 };
const rule: CanvasElement = { id: "intro.rule", type: "line", x: 96, y: 260, width: 550, height: 0, zIndex: 3, color: { token: "accent" }, thickness: 4 };
const databases: ReturnType<typeof testDatabase>["sql"][] = [];
afterEach(() => { for (const sql of databases.splice(0)) sql.close(); });

function setup() {
  const { db, sql } = testDatabase();
  databases.push(sql);
  const store = new D1DeckStore<CanvasBlueprint>(db);
  const objects = new Map<string, Uint8Array>();
  const files: FileStore = {
    put: vi.fn(async (key, bytes) => { objects.set(key, bytes); }),
    get: vi.fn(async key => objects.get(key) ?? null),
    exists: vi.fn(async key => objects.has(key)),
  };
  // Only Canva is mocked. Engine composition/export and SQLite migrations are real.
  const canva = {
    connected: vi.fn(async () => true),
    start: vi.fn<CanvaPort["start"]>(async () => ({ status: "pending", jobId })),
    poll: vi.fn<CanvaPort["poll"]>(async () => ({ status: "succeeded", jobId, designId: "mock-design", editUrl: "https://www.canva.com/design/mock-design/edit" })),
  };
  const engine = { ...canvasEngine };
  const service = new CanvasService({ store, files, engine, assets, canva, origin });
  return { service, store, objects, files, engine, canva, db, sql };
}
type Setup = ReturnType<typeof setup>;

function addInput(blueprint: CanvasBlueprint): EditCanvasInput {
  return {
    deckId: blueprint.deckId, baseVersion: blueprint.version, phase: "content",
    summary: "Place a headline, panel, image and rule using supplied content.",
    operations: [panel, headline, image, rule].map(element => ({ type: "add_element", element: structuredClone(element) })),
  };
}
async function populated({ service }: Setup) {
  const blank = await service.call("create_canvas", input, owner);
  return service.call("edit_canvas", addInput(blank.blueprint), owner);
}
const versionInput = (b: CanvasBlueprint) => ({ deckId: b.deckId, version: b.version });

describe("freeform canvas service: real engine and SQLite, mocked Canva adapter", () => {
  it("authorizes before composition, validates input and creates an owner-scoped blank canvas", async () => {
    const { service, engine, store } = setup();
    const create = vi.spyOn(engine, "create");
    await expect(service.call("create_canvas", input, null)).rejects.toMatchObject({ detail: { code: "UNAUTHORIZED" } });
    await expect(service.call("create_canvas", { ...input, elements: [headline] }, owner)).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED" } });
    expect(create).not.toHaveBeenCalled();
    const result = await service.call("create_canvas", input, owner);
    expect(result.blueprint).toMatchObject({ schemaVersion: 2, kind: "canvas", version: 1, elements: [], brief: input.brief, canvas: input.canvas });
    expect(result.blueprint.deckId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.previewUrl).toBe(`${origin}/canvases/${result.blueprint.deckId}/1`);
    expect(result.canva).toEqual({ status: "not_started" });
    expect(await store.read(owner, result.blueprint.deckId, 1)).toEqual(result.blueprint);
    await expect(service.call("get_canvas", versionInput(result.blueprint), "another-owner")).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
  });

  it("adds objects then replaces only the requested element while preserving all previous versions", async () => {
    const { service, store, sql } = setup();
    const blank = (await service.call("create_canvas", input, owner)).blueprint;
    const blankSnapshot = structuredClone(blank);
    const placed = (await service.call("edit_canvas", addInput(blank), owner)).blueprint;
    const placedSnapshot = structuredClone(placed);
    const replacement = { ...headline, color: { hex: "#7C3AED" } };
    const revised = (await service.call("edit_canvas", {
      deckId: placed.deckId, baseVersion: 2, phase: "revision", summary: "Change only the headline to violet.",
      operations: [{ type: "replace_element", elementId: headline.id, element: replacement }],
    }, owner)).blueprint;
    expect(revised.version).toBe(3);
    expect(revised.elements.find(e => e.id === headline.id)).toEqual(replacement);
    expect(revised.elements.filter(e => e.id !== headline.id)).toEqual(placed.elements.filter(e => e.id !== headline.id));
    for (const key of ["deckId", "schemaVersion", "kind", "title", "brief", "canvas", "theme", "designIntent"] as const) expect(revised[key]).toEqual(placed[key]);
    expect(revised.changes).toHaveLength(1);
    expect(revised.changes[0]).toMatchObject({ operation: "replace_element", target: headline.id });
    expect(revised.construction.slice(0, -1)).toEqual(placed.construction);
    expect(blank).toEqual(blankSnapshot);
    expect(placed).toEqual(placedSnapshot);
    expect(await store.read(owner, blank.deckId, 1)).toEqual(blankSnapshot);
    expect(await store.read(owner, blank.deckId, 2)).toEqual(placedSnapshot);
    expect(() => sql.prepare("UPDATE deck_versions SET blueprint = '{}' WHERE deck_id = ?").run(blank.deckId)).toThrow("IMMUTABLE_VERSION");
  });

  it("allows only one concurrent write and rejects stale revisions without losing the winner", async () => {
    const { service, store } = setup();
    const blank = (await service.call("create_canvas", input, owner)).blueprint;
    const results = await Promise.allSettled([service.call("edit_canvas", addInput(blank), owner), service.call("edit_canvas", addInput(blank), owner)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({ reason: { detail: { code: "VERSION_CONFLICT", currentVersion: 2 } } });
    expect((await store.read(owner, blank.deckId, 2)).elements).toEqual([panel, headline, image, rule]);
    expect(await store.read(owner, blank.deckId, 1)).toEqual(blank);
    await expect(service.call("edit_canvas", addInput(blank), owner)).rejects.toMatchObject({ detail: { code: "VERSION_CONFLICT", currentVersion: 2 } });
  });

  it.each([
    { name: "out-of-bounds geometry", element: { ...headline, x: 1190 } },
    { name: "text overflow", element: { ...headline, width: 200, height: 12, text: "A long headline needs much more vertical space to fit." } },
  ])("rejects $name and preserves the complete working version and files", async ({ element }) => {
    const context = setup();
    const { service, store, objects } = context;
    const working = (await populated(context)).blueprint;
    await service.call("export_canvas", versionInput(working), owner);
    const savedFiles = new Map(objects);
    await expect(service.call("edit_canvas", {
      deckId: working.deckId, baseVersion: working.version, phase: "revision", summary: "Invalid test revision.",
      operations: [{ type: "replace_element", elementId: headline.id, element }],
    }, owner)).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED" } });
    expect(await store.read(owner, working.deckId, working.version)).toEqual(working);
    await expect(store.read(owner, working.deckId, working.version + 1)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    expect(objects).toEqual(savedFiles);
    expect((await service.call("get_canvas", versionInput(working), owner)).files).toBeDefined();
  });

  it("rejects unknown image assets before saving a revision and preserves the working version", async () => {
    const context = setup();
    const { service, store, canva } = context;
    const working = (await populated(context)).blueprint;
    await expect(service.call("edit_canvas", {
      deckId: working.deckId, baseVersion: working.version, phase: "revision", summary: "Request an unregistered image in this local test.",
      operations: [{ type: "replace_element", elementId: image.id, element: { ...image, assetId: "unknown-unregistered-image" } }],
    }, owner)).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED", message: expect.stringContaining("unknown asset") } });
    expect(await store.read(owner, working.deckId, working.version)).toEqual(working);
    await expect(store.read(owner, working.deckId, working.version + 1)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    expect(canva.start).not.toHaveBeenCalled();
  });

  it("rejects export and import of the blank version before compiling or starting Canva", async () => {
    const { service, engine, objects, canva, store } = setup();
    const compile = vi.spyOn(engine, "compile");
    const blank = (await service.call("create_canvas", input, owner)).blueprint;
    for (const tool of ["export_canvas", "send_canvas_to_canva"] as const) {
      await expect(service.call(tool, versionInput(blank), owner)).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED", message: expect.stringContaining("blank") } });
    }
    expect(compile).not.toHaveBeenCalled();
    expect(objects.size).toBe(0);
    expect(canva.start).not.toHaveBeenCalled();
    expect(await store.importState(blank.deckId, 1)).toEqual({ status: "not_started" });
  });

  it("exports one native PowerPoint page and persists the same blueprint's files for later reads", async () => {
    const context = setup();
    const { service, engine, objects, files } = context;
    const compile = vi.spyOn(engine, "compile");
    const b = (await populated(context)).blueprint;
    const result = await service.call("export_canvas", versionInput(b), owner);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(compile.mock.calls[0][0]).toEqual(b);
    expect(result.files).toEqual({ pptxUrl: `${origin}/api/canvases/${b.deckId}/${b.version}/files/pptx`, notesUrl: `${origin}/api/canvases/${b.deckId}/${b.version}/files/notes` });
    const bytes = await service.download(owner, b.deckId, b.version, "pptx");
    const pptx = readPptx(bytes);
    expect([...pptx.keys()].filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path))).toEqual(["ppt/slides/slide1.xml"]);
    const slideXml = pptx.get("ppt/slides/slide1.xml")!;
    expect(slideXml).toContain("GraphicRouter");
    expect((slideXml.match(/<p:sp>/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(slideXml).toContain("<p:pic>");
    expect([...pptx.keys()].some(path => /^ppt\/media\/.*\.png$/.test(path))).toBe(true);
    const notes = new TextDecoder().decode(await service.download(owner, b.deckId, b.version, "notes"));
    expect(notes).toContain(input.designIntent);
    expect(notes).toContain(input.brief.facts[0]);
    expect(notes).toContain(input.brief.unknowns[0]);
    expect(notes).toContain(b.construction.at(-1)!.summary);
    expect(objects.size).toBe(2);
    expect((await service.call("get_canvas", versionInput(b), owner)).files).toEqual(result.files);
    vi.mocked(files.put).mockClear();
    expect((await service.call("export_canvas", versionInput(b), owner)).files).toEqual(result.files);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(files.put).not.toHaveBeenCalled();
  });

  it("blocks other owners and anonymous users from stored files, edits and all preview stages", async () => {
    const context = setup();
    const { service, engine } = context;
    const b = (await populated(context)).blueprint;
    await service.call("export_canvas", versionInput(b), owner);
    const render = vi.spyOn(engine, "render");
    for (const [identity, code] of [[null, "UNAUTHORIZED"], ["another-owner", "NOT_FOUND"]] as const) {
      for (const kind of ["pptx", "notes"] as const) await expect(service.download(identity, b.deckId, b.version, kind)).rejects.toMatchObject({ detail: { code } });
      await expect(service.preview(identity, b.deckId, b.version)).rejects.toMatchObject({ detail: { code } });
      await expect(service.call("edit_canvas", addInput(b), identity)).rejects.toMatchObject({ detail: { code } });
      await expect(service.call("send_canvas_to_canva", versionInput(b), identity)).rejects.toMatchObject({ detail: { code } });
    }
    expect(render).not.toHaveBeenCalled();
    const previews = await service.preview(owner, b.deckId, b.version);
    expect(Object.keys(previews.previews)).toEqual(["layout", "content", "finished"]);
    expect(previews.previews.finished).toContain("GraphicRouter");
    expect(render.mock.calls.every(([blueprint]) => JSON.stringify(blueprint) === JSON.stringify(b))).toBe(true);
    expect(previews.constructionPreviews).toHaveLength(4);
    expect(previews.constructionPreviews[0]).not.toContain(">GraphicRouter<");
    expect(previews.constructionPreviews.at(-1)).toEqual(previews.previews.finished);
  });

  it("rejects schemaVersion 1 decks through canvas routes and schemaVersion 2 canvases through deck routes", async () => {
    const context = setup();
    const { service, db, files, canva } = context;
    const decks = new DeckService({ store: new D1DeckStore(db), files, canva, assets, engine: slideEngine, origin });
    const legacy = (await decks.call("create_deck", sampleDeck, owner)).blueprint;
    const canvas = (await populated(context)).blueprint;
    for (const name of ["get_canvas", "export_canvas", "send_canvas_to_canva"] as const) await expect(service.call(name, { deckId: legacy.deckId, version: 1 }, owner)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(service.call("edit_canvas", { ...addInput(canvas), deckId: legacy.deckId, baseVersion: 1 }, owner)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(service.preview(owner, legacy.deckId, 1)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(service.download(owner, legacy.deckId, 1, "pptx")).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    for (const name of ["get_deck", "export_deck", "send_to_canva"] as const) await expect(decks.call(name, versionInput(canvas), owner)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(decks.call("revise_deck", { deckId: canvas.deckId, baseVersion: canvas.version, operations: [{ type: "set_deck_accent", color: "#FF0000" }] }, owner)).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(decks.preview(owner, canvas.deckId, canvas.version, "finished")).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(decks.download(owner, canvas.deckId, canvas.version, "pptx")).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    expect(canva.start).not.toHaveBeenCalled();
  });

  it("starts the mocked import once per version under concurrency and polls only its saved job", async () => {
    const context = setup();
    const { service, canva, store } = context;
    const b = (await populated(context)).blueprint, ref = versionInput(b);
    await Promise.all([service.call("send_canvas_to_canva", ref, owner), service.call("send_canvas_to_canva", ref, owner)]);
    expect(canva.start).toHaveBeenCalledTimes(1);
    expect(canva.start.mock.calls[0][0]).toBe(owner);
    expect(canva.start.mock.calls[0][1]).toEqual(await service.download(owner, b.deckId, b.version, "pptx"));
    expect(canva.start.mock.calls[0][2]).toContain(`v${b.version}`);
    expect(await store.importState(b.deckId, b.version)).toEqual({ status: "pending", jobId });
    const result = await service.call("get_canvas", ref, owner);
    expect(result.canva).toEqual({ status: "succeeded", jobId, designId: "mock-design", editUrl: "https://www.canva.com/design/mock-design/edit" });
    expect(result.files).toBeDefined();
    expect(canva.poll.mock.calls).toEqual([[owner, jobId]]);
    await service.call("send_canvas_to_canva", ref, owner);
    await service.call("get_canvas", ref, owner);
    expect(canva.start).toHaveBeenCalledTimes(1);
    expect(canva.poll).toHaveBeenCalledTimes(1);
  });

  it("exposes a transient polling error, retains the pending job and recovers without a second import", async () => {
    const context = setup();
    const { service, canva, store } = context;
    const b = (await populated(context)).blueprint, ref = versionInput(b);
    await service.call("send_canvas_to_canva", ref, owner);
    canva.poll.mockRejectedValueOnce(new Error("private mock upstream error"));
    const failedRefresh = await service.call("get_canvas", ref, owner);
    expect(failedRefresh.canva).toMatchObject({ status: "failed", code: "CANVA_POLL_FAILED", jobId });
    expect(JSON.stringify(failedRefresh)).not.toContain("private mock upstream error");
    expect(failedRefresh.blueprint).toEqual(b);
    expect(failedRefresh.files).toBeDefined();
    expect(await store.importState(b.deckId, b.version)).toEqual({ status: "pending", jobId });
    expect((await service.call("send_canvas_to_canva", ref, owner)).canva).toEqual({ status: "pending", jobId });
    expect((await service.call("get_canvas", ref, owner)).canva.status).toBe("succeeded");
    expect(canva.poll.mock.calls).toEqual([[owner, jobId], [owner, jobId]]);
    expect(canva.start).toHaveBeenCalledTimes(1);
  });

  it("retains a known pending job across lost Canva authorization and resumes that same job", async () => {
    const context = setup();
    const { service, canva, store } = context;
    const b = (await populated(context)).blueprint, ref = versionInput(b);
    await service.call("send_canvas_to_canva", ref, owner);
    canva.poll.mockRejectedValueOnce(new CanvaConnectionRequired());
    const needsConnection = await service.call("get_canvas", ref, owner);
    expect(needsConnection.canva).toEqual({ status: "connection_required", connectUrl: `${origin}/api/canva/connect` });
    expect(await store.importState(b.deckId, b.version)).toEqual({ status: "pending", jobId });
    expect((await service.call("send_canvas_to_canva", ref, owner)).canva).toEqual({ status: "pending", jobId });
    expect((await service.call("get_canvas", ref, owner)).canva.status).toBe("succeeded");
    expect(canva.start).toHaveBeenCalledTimes(1);
  });

  it("keeps exported files available when connection is absent or an import outcome is uncertain", async () => {
    const context = setup();
    const { service, canva, store } = context;
    const b = (await populated(context)).blueprint, ref = versionInput(b);
    canva.connected.mockResolvedValueOnce(false);
    const needsConnection = await service.call("send_canvas_to_canva", ref, owner);
    expect(needsConnection.canva).toEqual({ status: "connection_required", connectUrl: `${origin}/api/canva/connect` });
    expect(needsConnection.files).toBeDefined();
    expect(canva.start).not.toHaveBeenCalled();
    expect(await store.importState(b.deckId, b.version)).toEqual({ status: "not_started" });
    canva.start.mockRejectedValueOnce(new Error("private mock transport outcome"));
    const unknown = await service.call("send_canvas_to_canva", ref, owner);
    expect(unknown.canva).toMatchObject({ status: "failed", code: "IMPORT_OUTCOME_UNKNOWN" });
    expect(unknown.files).toEqual(needsConnection.files);
    expect(JSON.stringify(unknown)).not.toContain("private mock transport outcome");
    await service.call("send_canvas_to_canva", ref, owner);
    expect(canva.start).toHaveBeenCalledTimes(1);
    expect(await service.download(owner, b.deckId, b.version, "pptx")).toBeInstanceOf(Uint8Array);
  });
});
