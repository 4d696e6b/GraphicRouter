import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import type { DeckBlueprint, RevisionOperation, SlideElement } from "../../src/contracts";
import { engine, assets, DEMO_ASSET_ID, EngineError } from "../../src/engine";
import { sampleDeck } from "../../src/fixtures/sample-deck";
import { layoutText } from "../../src/engine/text";
import { readPptx } from "./read-pptx";
import { assetRegistry, containImage } from "../../src/engine/image";

const identity = { deckId: "9bcfdf57-49a4-4e02-94c1-b6f87132d8af", version: 1 };
function input() { const value = structuredClone(sampleDeck); value.slides[0].assetId = DEMO_ASSET_ID; return value; }
function plan() { return engine.createBlueprint(input(), identity); }
function freeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
const el = (b: DeckBlueprint, id: string) => b.slides.flatMap((s) => s.elements).find((e) => e.id === id)!;
function errorCode(action: () => unknown, code: string) {
  try { action(); throw new Error("Expected an engine error."); }
  catch (error) { expect(error).toBeInstanceOf(EngineError); expect((error as EngineError).issues.some((i) => i.code === code)).toBe(true); }
}

describe("composition and validation", () => {
  it("is deterministic and independent of the caller's input", () => {
    const source = input(), original = structuredClone(source);
    const first = engine.createBlueprint(freeze(source), identity);
    expect(first).toEqual(engine.createBlueprint(original, identity));
    expect(source).toEqual(original);
    first.input.slides[0].notes.core = "not shared";
    expect(source.slides[0].notes.core).toBe(original.slides[0].notes.core);
  });
  it("composes all five recipes with complete copy, a stable headline, and no errors", () => {
    const b = plan();
    expect(b.slides.map((s) => s.layout)).toEqual(["hero", "cards", "process", "comparison", "closing"]);
    expect(engine.validateBlueprint(b).filter((i) => i.severity === "error")).toEqual([]);
    expect(el(b, "slide3.headline").type).toBe("text");
    expect(b.slides[0].elements.some((e) => e.type === "image")).toBe(true);
  });
  it("rejects invalid identity and source schema", () => {
    errorCode(() => engine.createBlueprint(input(), { deckId: "invalid", version: 1 }), "INVALID_INPUT");
    const source = input(); source.slides.pop();
    errorCode(() => engine.createBlueprint(source, identity), "INVALID_INPUT");
  });
  it("supports Latin names and reports unsupported glyphs explicitly", () => {
    const source = input(); source.slides[0].headline = "A pitch for Café Élan";
    expect(engine.createBlueprint(source, identity).validationIssues).toEqual([]);
    source.slides[0].headline = "Launch 🚀";
    errorCode(() => engine.createBlueprint(source, identity), "UNSUPPORTED_GLYPH");
  });
  it("never drops blocks to make a recipe fit", () => {
    const source = input(); source.slides[1].layout = "hero";
    errorCode(() => engine.createBlueprint(source, identity), "LAYOUT_CONTENT_MISMATCH");
  });
  it("rejects long unbroken words and excess lines without shrinking", () => {
    const source = input(); source.slides[0].headline = "W".repeat(70);
    errorCode(() => engine.createBlueprint(source, identity), "WORD_TOO_WIDE");
    source.slides[0].headline = "hello ".repeat(12).trim();
    errorCode(() => engine.createBlueprint(source, identity), "TEXT_OVERFLOW");
  });
  it("finds negative/NaN geometry, out-of-bounds boxes, duplicates, and missing content", () => {
    for (const value of [-1, NaN]) {
      const b = plan(); el(b, "slide3.headline").x = value;
      expect(engine.validateBlueprint(b).some((i) => i.code === "INVALID_BLUEPRINT")).toBe(true);
    }
    const b = plan(); el(b, "slide3.headline").x = 1500;
    expect(engine.validateBlueprint(b).some((i) => i.code === "OUT_OF_BOUNDS")).toBe(true);
    const duplicate = plan(); duplicate.slides[0].elements.push(structuredClone(duplicate.slides[0].elements[0]));
    expect(engine.validateBlueprint(duplicate).some((i) => i.code === "DUPLICATE_ID")).toBe(true);
    const missing = plan(); missing.slides[2].elements = missing.slides[2].elements.filter((e) => e.id !== "slide3.headline");
    expect(engine.validateBlueprint(missing).some((i) => i.code === "SOURCE_MISMATCH")).toBe(true);
  });
  it("detects overlapping content boxes and reports low contrast", () => {
    const b = plan(); el(b, "slide3.takeaway").y = 170;
    expect(engine.validateBlueprint(b).some((i) => i.code === "CONTENT_OVERLAP")).toBe(true);
    const low = engine.reviseBlueprint(plan(), [{ type: "set_element_color", elementId: "slide3.headline", color: "#FAF9F6" }]);
    expect(low.validationIssues.some((i) => i.code === "LOW_CONTRAST" && i.severity === "warning")).toBe(true);
  });
});

describe("precise immutable revisions", () => {
  it("changes only slide3.headline paint plus version/change metadata", () => {
    const current = freeze(plan()), original = structuredClone(current);
    const next = engine.reviseBlueprint(current, [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }]);
    const expected = structuredClone(original);
    const target = el(expected, "slide3.headline"); if (target.type === "text") target.color = { hex: "#7C3AED" };
    expected.version = 2; expected.changes = next.changes; expected.validationIssues = next.validationIssues;
    expect(next).toEqual(expected);
    expect(current).toEqual(original);
    expect(next.input).toEqual(current.input);
  });
  it("updates text and source without moving any boxes", () => {
    const current = plan();
    const next = engine.reviseBlueprint(current, [{ type: "replace_text", elementId: "slide3.headline", text: "Design with direction." }]);
    expect(next.input.slides[2].headline).toBe("Design with direction.");
    const before = el(current, "slide3.headline"), after = el(next, "slide3.headline");
    expect({ ...after, text: before.type === "text" ? before.text : "" }).toEqual(before);
  });
  it("updates block copy, takeaway, and both sets of speaker notes", () => {
    const next = engine.reviseBlueprint(plan(), [
      { type: "replace_text", elementId: "slide2.block1.body", text: "A clear story." },
      { type: "replace_text", elementId: "slide2.takeaway", text: "One point per slide." },
      { type: "update_notes", slideId: "slide2", notes: { core: "Core", expanded: "Expanded" } },
    ]);
    expect(next.input.slides[1].blocks[0].body).toBe("A clear story.");
    expect(next.slides[1].takeaway).toBe("One point per slide.");
    expect(next.slides[1].notes).toEqual({ core: "Core", expanded: "Expanded" });
  });
  it("changes the theme while preserving explicit overrides and image assets", () => {
    const override = engine.reviseBlueprint(plan(), [{ type: "set_element_color", elementId: "slide3.headline", color: "#123456" }]);
    const next = engine.reviseBlueprint(override, [{ type: "set_deck_accent", color: "#13579B" }]);
    expect(next.theme.accent).toBe("#13579B");
    expect(next.input.accent).toBe("#13579B");
    expect(el(next, "slide3.headline")).toEqual(el(override, "slide3.headline"));
    expect(el(next, "slide1.image")).toEqual(el(override, "slide1.image"));
  });
  it("switches compatible layouts without losing copy or colour overrides", () => {
    const current = engine.reviseBlueprint(plan(), [{ type: "set_element_color", elementId: "slide3.block1.heading", color: "#123456" }]);
    const next = engine.reviseBlueprint(current, [{ type: "set_slide_layout", slideId: "slide3", layout: "cards" }]);
    expect(next.slides[2].layout).toBe("cards");
    expect(next.input.slides[2].blocks).toEqual(current.input.slides[2].blocks);
    expect((el(next, "slide3.block1.heading") as Extract<SlideElement, { type: "text" }>).color).toEqual({ hex: "#123456" });
    expect(next.slides.filter((s) => s.id !== "slide3")).toEqual(current.slides.filter((s) => s.id !== "slide3"));
  });
  it("rejects switches that would lose styled decorative elements", () => {
    const current = engine.reviseBlueprint(plan(), [{ type: "set_element_color", elementId: "slide3.block1.marker", color: "#123456" }]);
    errorCode(() => engine.reviseBlueprint(current, [{ type: "set_slide_layout", slideId: "slide3", layout: "cards" }]), "OVERRIDE_WOULD_BE_LOST");
  });
  it("rolls back the entire batch when a later operation fails", () => {
    const current = freeze(plan()), before = structuredClone(current);
    errorCode(() => engine.reviseBlueprint(current, [{ type: "set_element_color", elementId: "slide3.headline", color: "#123456" }, { type: "replace_text", elementId: "slide9.missing", text: "new" }]), "UNKNOWN_TARGET");
    expect(current).toEqual(before);
  });
  it("rejects invalid operations and noneditable targets", () => {
    errorCode(() => engine.reviseBlueprint(plan(), []), "INVALID_INPUT");
    errorCode(() => engine.reviseBlueprint(plan(), [{ type: "execute_code" }] as unknown as RevisionOperation[]), "INVALID_INPUT");
    errorCode(() => engine.reviseBlueprint(plan(), [{ type: "replace_text", elementId: "slide3.footer.brand", text: "custom" }]), "UNSUPPORTED_TARGET");
    errorCode(() => engine.reviseBlueprint(plan(), [{ type: "set_element_color", elementId: "slide1.image", color: "#123456" }]), "UNSUPPORTED_TARGET");
  });
  it("does not accept source-budget or geometry overflow during a revision", () => {
    errorCode(() => engine.reviseBlueprint(plan(), [{ type: "replace_text", elementId: "slide3.headline", text: "x".repeat(81) }]), "INVALID_INPUT");
    errorCode(() => engine.reviseBlueprint(plan(), [{ type: "set_slide_layout", slideId: "slide2", layout: "closing" }]), "LAYOUT_CONTENT_MISMATCH");
  });
});

describe("SVG preview and native PowerPoint export", () => {
  it("renders all three stages without mutating the stored plan", () => {
    const b = freeze(plan());
    const layout = engine.renderSlideSvg(b.slides[0], b.theme, "layout", assets);
    const content = engine.renderSlideSvg(b.slides[0], b.theme, "content", assets);
    const finished = engine.renderSlideSvg(b.slides[0], b.theme, "finished", assets);
    expect(layout).toContain('stroke-dasharray="6 5"');
    expect(content).toContain(">IMAGE<"); expect(content).not.toContain("data:image/png");
    expect(finished).toContain("data:image/png;base64,");
    expect(finished).toContain('data-element-id="slide1.headline"');
  });
  it("escapes text and attributes rather than executing markup", () => {
    const source = input(); source.slides[0].headline = '<script>"&</script>';
    const b = engine.createBlueprint(source, identity);
    const svg = engine.renderSlideSvg(b.slides[0], b.theme, "finished", assets);
    expect(svg).toContain("&lt;script&gt;&quot;&amp;&lt;/script&gt;");
    expect(svg).not.toContain("<script>");
  });
  it("rejects missing/corrupt/duplicated assets and unsafe preview input", async () => {
    const b = plan();
    errorCode(() => engine.renderSlideSvg(b.slides[0], b.theme, "finished", []), "MISSING_ASSET");
    errorCode(() => engine.renderSlideSvg(b.slides[0], b.theme, "finished", [assets[0], assets[0]]), "INVALID_ASSET");
    await expect(engine.compilePowerPoint(b, [])).rejects.toBeInstanceOf(EngineError);
    await expect(engine.compilePowerPoint(b, [{ ...assets[0], data: new Uint8Array([1, 2]) }])).rejects.toBeInstanceOf(EngineError);
    const invalid = structuredClone(b.slides[0]); invalid.elements[0].x = NaN;
    errorCode(() => engine.renderSlideSvg(invalid, b.theme, "finished", assets), "INVALID_INPUT");
  });
  it("contains a rectangular JPEG consistently in SVG and PPTX without stretching", async () => {
    const b = plan(), image = el(b, "slide1.image") as Extract<SlideElement, { type: "image" }>;
    const jpeg = { id: DEMO_ASSET_ID, mimeType: "image/jpeg" as const, data: new Uint8Array(await readFile(new URL("./fixtures/wide.jpg", import.meta.url))) };
    const size = assetRegistry([jpeg]).get(DEMO_ASSET_ID)!;
    expect({ width: size.width, height: size.height }).toEqual({ width: 64, height: 32 });
    expect(containImage(image, size)).toEqual({ x: 1248, y: 240, width: 256, height: 128 });
    expect(engine.renderSlideSvg(b.slides[0], b.theme, "finished", [jpeg])).toContain('preserveAspectRatio="xMidYMid meet" href="data:image/jpeg;base64,');
    const xml = readPptx(await engine.compilePowerPoint(b, [jpeg])).get("ppt/slides/slide1.xml")!;
    const picture = xml.match(/<p:pic>[\s\S]*?<\/p:pic>/)![0];
    expect(picture).toContain('y="1828800"'); expect(picture).toContain('cy="975360"');
  });
  it("rejects oversized image data before invoking the compiler", () => {
    errorCode(() => assetRegistry([{ ...assets[0], data: new Uint8Array(2 * 1024 * 1024 + 1) }]), "ASSET_TOO_LARGE");
    const b = plan();
    errorCode(() => engine.renderSlideSvg(b.slides[0], b.theme, "animated" as "finished", assets), "INVALID_STAGE");
  });
  it("shares explicit wrap decisions and readable Arial units", () => {
    const b = plan();
    const title = el(b, "slide1.headline") as Extract<SlideElement, { type: "text" }>;
    const wrapped = layoutText(title.text, title.width, title.fontSize, title.bold);
    expect(wrapped.height).toBeLessThanOrEqual(title.height);
    const svg = engine.renderSlideSvg(b.slides[0], b.theme, "finished", assets);
    expect(svg.match(/<tspan /g)!.length).toBeGreaterThan(0);
    for (const line of wrapped.lines) expect(svg).toContain(line);
  });
  it("exports five slides with native named text/shapes/lines, a separate picture, and notes", async () => {
    const b = freeze(plan()), zip = readPptx(await engine.compilePowerPoint(b, assets));
    expect([...zip.keys()].filter((key) => /^ppt\/slides\/slide\d+\.xml$/.test(key))).toHaveLength(5);
    expect(zip.get("ppt/presentation.xml")).toContain('cx="12192000" cy="6858000"');
    const first = zip.get("ppt/slides/slide1.xml")!;
    expect(first).toContain('name="slide1.headline"');
    expect(first).toContain('typeface="Arial"');
    expect(first).toContain('sz="4920"'); // 82 logical px -> 49.2 pt.
    expect(first).toContain('<a:prstGeom prst="rect">');
    expect(first).toContain('<a:prstGeom prst="line">');
    expect(first).toContain("<p:pic>");
    expect([...zip.keys()].some((key) => key.startsWith("ppt/media/") && key.endsWith(".png"))).toBe(true);
    expect(zip.get("ppt/notesSlides/notesSlide1.xml")).toContain("Draft:");
    expect(zip.get("ppt/slides/slide3.xml")).toContain('<a:prstGeom prst="ellipse">');
  });
  it("exports the revised literal colour on only the named headline", async () => {
    const original = plan(), revised = engine.reviseBlueprint(original, [{ type: "set_element_color", elementId: "slide3.headline", color: "#123456" }]);
    const first = readPptx(await engine.compilePowerPoint(original, assets));
    const second = readPptx(await engine.compilePowerPoint(revised, assets));
    for (const slide of [1, 2, 4, 5]) expect(second.get(`ppt/slides/slide${slide}.xml`)).toBe(first.get(`ppt/slides/slide${slide}.xml`));
    expect(second.get("ppt/slides/slide3.xml")).toContain('val="123456"');
    expect(second.get("ppt/slides/slide3.xml")!.split('val="123456"')).toHaveLength(2);
  });
});
