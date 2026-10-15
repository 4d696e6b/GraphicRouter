import { describe, expect, it } from "vitest";
import type { CanvasBlueprint, CanvasElement, CanvasOperation, CreateCanvasInput } from "../../src/contracts";
import { canvasEngine } from "../../src/engine/canvas";
import { assets, DEMO_ASSET_ID } from "../../src/engine/assets";
import { EngineError } from "../../src/engine/errors";
import { readPptx } from "./read-pptx";

const deckId = "6bac9301-3cf3-4b3f-8a72-549765f465f9";
const input: CreateCanvasInput = {
  title: "An editable portrait infographic",
  brief: { idea: "Explain a design workflow.", audience: "Hackathon judges", purpose: "Show editable construction", facts: ["Objects are composed individually."], unknowns: ["Canva fidelity requires a live import check."] },
  canvas: { width: 1080, height: 1920 },
  theme: { background: "#FAF9F6", foreground: "#191724", muted: "#62606B", accent: "#7C3AED" },
  designIntent: "A portrait editorial composition with one clear visual route and generous spacing.",
};
const blank = () => canvasEngine.create(structuredClone(input), { deckId, version: 1 });
const text = (overrides: Partial<Extract<CanvasElement, { type: "text" }>> = {}): Extract<CanvasElement, { type: "text" }> => ({ id: "headline", type: "text", text: "Plan the canvas first", x: 80, y: 90, width: 920, height: 150, zIndex: 3, fontFamily: "Arial", fontSize: 68, bold: true, color: { token: "foreground" }, align: "left", ...overrides });
const panel = (overrides: Partial<Extract<CanvasElement, { type: "shape" }>> = {}): Extract<CanvasElement, { type: "shape" }> => ({ id: "panel", type: "shape", shape: "rectangle", x: 50, y: 50, width: 980, height: 350, zIndex: 1, fill: { hex: "#FFFFFF" }, ...overrides });
const edit = (current: CanvasBlueprint, operations: CanvasOperation[]) => canvasEngine.edit(current, { deckId: current.deckId, baseVersion: current.version, phase: "structure", summary: "Add the composition structure and focal message.", operations });
const populated = () => edit(blank(), [
  { type: "add_element", element: text() },
  { type: "add_element", element: panel() },
  { type: "add_element", element: { id: "marker", type: "shape", shape: "ellipse", x: 80, y: 480, width: 120, height: 120, zIndex: 4, fill: { token: "accent" } } },
  { type: "add_element", element: { id: "route", type: "line", x: 140, y: 600, width: 0, height: 300, zIndex: 2, color: { token: "accent" }, thickness: 6 } },
  { type: "add_element", element: { id: "logo", type: "image", assetId: DEMO_ASSET_ID, alt: "GraphicRouter mark", x: 80, y: 1600, width: 200, height: 200, zIndex: 5 } },
]);

function expectIssue(run: () => unknown, code: string) {
  try { run(); throw new Error(`Expected issue ${code}.`); }
  catch (error) { expect(error).toBeInstanceOf(EngineError); expect((error as EngineError).issues.some((issue) => issue.code === code)).toBe(true); }
}

describe("editable canvas engine", () => {
  it("rejects an obsolete duplicate text overlay without changing the previous version", () => {
    const b = populated(), before = structuredClone(b);
    expectIssue(() => edit(b, [{ type: "add_element", element: text({id:"obsolete-copy", zIndex:6}) }]), "DUPLICATE_TEXT_LAYER");
    expect(b).toEqual(before);
    const next = edit(b, [{ type: "add_element", element: text({id:"separate-caption", y:900, zIndex:6}) }]);
    expect(next.elements).toHaveLength(b.elements.length + 1);
  });
  it("starts with an actual blank portrait canvas and renders zero objects", async () => {
    const b = blank();
    expect(b).toMatchObject({ schemaVersion: 2, kind: "canvas", deckId, version: 1, canvas: { width: 1080, height: 1920 }, elements: [], changes: [], validationIssues: [] });
    expect(b.construction).toEqual([{ version: 1, phase: "blank", summary: expect.any(String), elementCount: 0 }]);
    for (const stage of ["layout", "content", "finished"] as const) {
      const svg = canvasEngine.render(b, stage, [], 0);
      expect(svg).toContain('viewBox="0 0 1080 1920"');
      expect(svg).not.toContain("data-element-id");
    }
    const files = readPptx(await canvasEngine.compile(b, []));
    expect(files.get("ppt/presentation.xml")).toContain('cx="8229600" cy="14630400"');
    expect([...files.keys()].filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toEqual(["ppt/slides/slide1.xml"]);
    expect(files.get("ppt/slides/slide1.xml")).not.toContain("<p:pic>");
    expect(input.theme.accent).toBe("#7C3AED");
  });

  it("adds, replaces, and removes stable IDs without mutating prior blueprints or unrelated elements", () => {
    const original = blank(), before = structuredClone(original);
    const added = edit(original, [{ type: "add_element", element: panel() }, { type: "add_element", element: text() }]);
    expect(original).toEqual(before);
    expect(added.version).toBe(2);
    expect(added.construction).toHaveLength(2);
    const snapshot = structuredClone(added);
    const revised = edit(added, [{ type: "replace_element", elementId: "headline", element: text({ color: { hex: "#7C3AED" } }) }]);
    expect(added).toEqual(snapshot);
    expect(revised.elements.find((element) => element.id === "panel")).toEqual(added.elements.find((element) => element.id === "panel"));
    expect(revised.elements.find((element) => element.id === "headline")).toEqual({ ...text(), color: { hex: "#7C3AED" } });
    expect(revised.changes).toEqual([{ operation: "replace_element", target: "headline", description: "Updated only element headline." }]);
    const removed = edit(revised, [{ type: "remove_element", elementId: "panel" }]);
    expect(removed.elements).toHaveLength(1);
    expect(revised.elements).toHaveLength(2);
    expect(removed.construction.map((step) => step.elementCount)).toEqual([0, 2, 2, 1]);
  });

  it("rejects mismatched identity, stale edits, ID replacement and unknown targets atomically", () => {
    const b = edit(blank(), [{ type: "add_element", element: panel() }]), snapshot = structuredClone(b);
    const request = { deckId, baseVersion: b.version, phase: "revision" as const, summary: "Change one element", operations: [{ type: "remove_element" as const, elementId: "panel" }] };
    expectIssue(() => canvasEngine.edit(b, { ...request, deckId: "8fd87ca8-6413-4012-bfd7-ac163a7a15b9" }), "IDENTITY_MISMATCH");
    expectIssue(() => canvasEngine.edit(b, { ...request, baseVersion: 1 }), "STALE_VERSION");
    expectIssue(() => edit(b, [{ type: "replace_element", elementId: "panel", element: panel({ id: "new-panel" }) }]), "ID_CHANGE");
    expectIssue(() => edit(b, [{ type: "remove_element", elementId: "missing" }]), "UNKNOWN_TARGET");
    expectIssue(() => edit(b, [{ type: "add_element", element: text() }, { type: "remove_element", elementId: "missing" }]), "UNKNOWN_TARGET");
    expect(b).toEqual(snapshot);
  });

  it("validates identity, schema, dimensions, unique layers and unique IDs", () => {
    expectIssue(() => canvasEngine.create(input, { deckId: "not-a-uuid", version: 1 }), "INVALID_INPUT");
    expectIssue(() => canvasEngine.create(input, { deckId, version: 2 }), "INVALID_VERSION");
    expectIssue(() => canvasEngine.create({ ...input, canvas: { width: 1080, height: 5000 } }, { deckId, version: 1 }), "INVALID_INPUT");
    const b = edit(blank(), [{ type: "add_element", element: panel() }]);
    expectIssue(() => edit(b, [{ type: "add_element", element: panel() }]), "DUPLICATE_ID");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ zIndex: 1 }) }]), "DUPLICATE_LAYER");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ x: Number.NaN }) }]), "INVALID_INPUT");
    expectIssue(() => edit(b, [{ type: "add_element", element: { ...text(), unexpected: true } as CanvasElement }]), "INVALID_INPUT");
    const duplicate = structuredClone(b); duplicate.elements.push(panel()); duplicate.construction[1].elementCount++;
    expect(canvasEngine.validate(duplicate).map((issue) => issue.code)).toContain("DUPLICATE_ID");
  });

  it("rejects overflow, empty or out-of-bounds geometry, unsupported glyphs and controls without damaging the blank", () => {
    const b = blank(), snapshot = structuredClone(b);
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ height: 10 }) }]), "TEXT_OVERFLOW");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ x: 1000 }) }]), "OUT_OF_BOUNDS");
    expectIssue(() => edit(b, [{ type: "add_element", element: panel({ width: 0 }) }]), "EMPTY_GEOMETRY");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ text: "สวัสดี" }) }]), "UNSUPPORTED_GLYPH");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ text: "" }) }]), "INVALID_INPUT");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ text: "   " }) }]), "EMPTY_TEXT");
    expectIssue(() => edit(b, [{ type: "add_element", element: text({ text: "Supercalifragilisticexpialidocious", width: 50 }) }]), "WORD_TOO_WIDE");
    expectIssue(() => canvasEngine.create({ ...input, title: "Broken\u0000title" }, { deckId, version: 1 }), "UNSUPPORTED_CHARACTER");
    expect(b).toEqual(snapshot);
  });

  it("allows intentional shape overlap and reports text overlap and low contrast as warnings", () => {
    const b = edit(blank(), [
      { type: "add_element", element: panel() },
      { type: "add_element", element: panel({ id: "second-panel", x: 60, zIndex: 2 }) },
      { type: "add_element", element: text({ color: { hex: "#FFFFFF" } }) },
      { type: "add_element", element: text({ id: "second-label", y: 100, zIndex: 4 }) },
    ]);
    expect(b.validationIssues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "LOW_CONTRAST", severity: "warning" }), expect.objectContaining({ code: "TEXT_OVERLAP", severity: "warning" })]));
    expect(b.validationIssues.every((issue) => issue.severity === "warning")).toBe(true);
    expect(canvasEngine.render(b, "finished", [])).toContain('data-element-id="second-label"');
  });

  it("bounds element count and construction history at 100 immutable versions", () => {
    let b = blank();
    for (let start = 0; start < 200; start += 40) {
      b = edit(b, Array.from({ length: 40 }, (_, index) => ({ type: "add_element" as const, element: panel({ id: `shape-${start + index}`, zIndex: start + index }) })));
    }
    expect(b.elements).toHaveLength(200);
    expectIssue(() => edit(b, [{ type: "add_element", element: panel({ id: "overflow", zIndex: 201 }) }]), "ELEMENT_LIMIT");
    while (b.version < 100) b = edit(b, [{ type: "replace_element", elementId: "shape-0", element: panel({ id: "shape-0", zIndex: 0 }) }]);
    const snapshot = structuredClone(b);
    expect(b.construction).toHaveLength(100);
    expectIssue(() => edit(b, [{ type: "remove_element", elementId: "shape-0" }]), "VERSION_LIMIT");
    expect(b).toEqual(snapshot);
    const damaged = structuredClone(b); damaged.construction.pop();
    expect(canvasEngine.validate(damaged).some((issue) => issue.code === "INVALID_CONSTRUCTION")).toBe(true);
  });

  it("renders construction prefixes in layer order, preserves three stages, and escapes all SVG copy", () => {
    const b = populated();
    const zero = canvasEngine.render(b, "finished", assets, 0);
    expect(zero).not.toContain("data-element-id");
    const two = canvasEngine.render(b, "finished", assets, 2);
    expect(two).toContain('data-element-id="panel"');
    expect(two).toContain('data-element-id="route"');
    expect(two).not.toContain('data-element-id="headline"');
    expectIssue(() => canvasEngine.render(b, "finished", assets, -1), "INVALID_VISIBLE_COUNT");
    expectIssue(() => canvasEngine.render(b, "finished", assets, 1.5), "INVALID_VISIBLE_COUNT");
    expectIssue(() => canvasEngine.render(b, "finished", assets, 6), "INVALID_VISIBLE_COUNT");
    expectIssue(() => canvasEngine.render(b, "bad-stage" as "finished", assets), "INVALID_STAGE");
    const safe = edit(blank(), [{ type: "add_element", element: text({ text: '<script>alert("A&B")</script>', fontSize: 30 }) }]);
    safe.title = '<title> & "quoted"';
    const svg = canvasEngine.render(safe, "finished", []);
    expect(svg).not.toContain("<script>"); expect(svg).toContain("&lt;script&gt;"); expect(svg).toContain("A&amp;B");
    expect(svg).toContain("&lt;title&gt; &amp; &quot;quoted&quot;");
    expect(canvasEngine.render(b, "layout", assets)).toContain('stroke-dasharray="6 5"');
    expect(canvasEngine.render(b, "content", assets)).toContain(">IMAGE</text>");
    expect(canvasEngine.render(b, "content", assets)).not.toContain("data:image/");
    expect(canvasEngine.render(b, "finished", assets)).toContain("data:image/png;base64,");
  });

  it("requires complete registered assets for every render stage and native export", async () => {
    const b = populated(), snapshot = structuredClone(b);
    for (const stage of ["layout", "content", "finished"] as const) expectIssue(() => canvasEngine.render(b, stage, [], 0), "MISSING_ASSET");
    await expect(canvasEngine.compile(b, [])).rejects.toBeInstanceOf(EngineError);
    expectIssue(() => canvasEngine.render(b, "finished", [{ ...assets[0], data: assets[0].data.slice(0, 33) }]), "INVALID_ASSET");
    expect(b).toEqual(snapshot);
  });

  it("exports one portrait page with separate native text, rectangle, ellipse, line and image", async () => {
    const b = populated(), snapshot = structuredClone(b), files = readPptx(await canvasEngine.compile(b, assets));
    const page = files.get("ppt/slides/slide1.xml")!;
    expect([...files.keys()].filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toEqual(["ppt/slides/slide1.xml"]);
    expect(files.get("ppt/presentation.xml")).toContain('cx="8229600" cy="14630400"');
    for (const element of b.elements) expect(page).toContain(`name="${element.id}"`);
    expect(page).toContain('<a:prstGeom prst="rect"');
    expect(page).toContain('<a:prstGeom prst="ellipse"');
    expect(page).toContain('<a:prstGeom prst="line"');
    expect(page.match(/<p:sp>/g)).toHaveLength(4);
    expect(page.match(/<p:pic>/g)).toHaveLength(1);
    expect(page).toContain('<a:srgbClr val="7C3AED"');
    expect(page).toContain('typeface="Arial"');
    expect(page).toContain("Plan the canvas first");
    expect(page.indexOf('name="panel"')).toBeLessThan(page.indexOf('name="route"'));
    expect(page.indexOf('name="route"')).toBeLessThan(page.indexOf('name="headline"'));
    expect(files.get("ppt/notesSlides/notesSlide1.xml")).toContain("Design direction:");
    expect(b).toEqual(snapshot);
  });
});
