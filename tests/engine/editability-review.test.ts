import { describe, expect, it } from "vitest";
import { reviewCanvaDesign } from "../../src/engine/editability-review";
import type { ReviewCanvaDesignInput } from "../../src/contracts";
const url = "https://example.org/docs/models/demo";
const clean = (): ReviewCanvaDesignInput => ({ designId: "DA_TEST_design", pageIndex: 1, width: 600, height: 900,
  texts: [{ id: "value", text: "128,000 tokens", box: { x: 40, y: 40, width: 260, height: 50 } }, { id: "source", text: "Official source", link: url, box: { x: 40, y: 800, width: 260, height: 40 } }],
  images: [{ id: "illustration", textInImage: "none" }], requiredText: ["128,000 tokens"], expectedLinks: [url], visualReview: "passed" });
describe("bounded editable-design snapshot review; not OCR or a Canva fetch", () => {
  it("accepts native text and linked short source labels, preserving the snapshot", () => {
    const input = clean(), before = structuredClone(input), result = reviewCanvaDesign(input);
    expect(result.decision).toBe("ready_for_user_review"); expect(result.issues).toEqual([]); expect(input).toEqual(before);
    expect(result.evidenceScope).toContain("supplied element snapshot"); expect(result.evidenceScope).toContain("not a backend commit lock");
  });
  it("blocks text in image pixels even when native text exists, and never treats unchecked images as verified", () => {
    const input = clean(); input.images[0].textInImage = "present";
    expect(reviewCanvaDesign(input)).toMatchObject({ decision: "blocked", issues: [expect.objectContaining({ code: "TEXT_BAKED_IN_IMAGE" })] });
    input.images[0].textInImage = "not_checked";
    expect(reviewCanvaDesign(input).decision).toBe("needs_visual_review");
    input.texts = []; expect(reviewCanvaDesign(input).issues.some(i => i.code === "NO_NATIVE_TEXT")).toBe(true);
  });
  it("detects overlapped duplicate labels while allowing repeated values in distinct positions", () => {
    const input = clean(); input.texts.push({ ...structuredClone(input.texts[0]), id: "obsolete-label" });
    expect(reviewCanvaDesign(input).issues).toContainEqual(expect.objectContaining({ code: "DUPLICATE_TEXT_LAYER" }));
    input.texts[2].box.y = 200; expect(reviewCanvaDesign(input).decision).toBe("ready_for_user_review");
    input.texts[2].text = "Different copy"; input.texts[2].box.y = 45;
    expect(reviewCanvaDesign(input).decision).toBe("needs_visual_review");
  });
  it("checks whole required labels rather than accepting a corrupted word prefix", () => {
    const input = clean(); input.texts[0].text = "128,000 tokenss";
    expect(reviewCanvaDesign(input).issues).toContainEqual(expect.objectContaining({ code: "MISSING_EXACT_TEXT" }));
    input.texts[0].text = "128,000\n tokens"; expect(reviewCanvaDesign(input).decision).toBe("ready_for_user_review");
    input.expectedTextById = { source: "128,000 tokens" };
    expect(reviewCanvaDesign(input).issues.some(i => i.code === "WRONG_TEXT_TARGET")).toBe(true);
    input.expectedTextById = { value: "128,000 tokens" }; input.texts[0].text = "128,000 tokens or 256,000 tokens";
    expect(reviewCanvaDesign(input).issues.some(i => i.code === "WRONG_TEXT_TARGET")).toBe(true);
  });
  it("catches syntactically valid but corrupted paths, and checks actual native hyperlinks", () => {
    const input = clean(); input.texts[1].text = "https://example.org/docsmodels/demo"; delete input.texts[1].link;
    const result = reviewCanvaDesign(input);
    expect(result.issues.map(i => i.code)).toEqual(expect.arrayContaining(["UNVERIFIED_LINK", "MISSING_LINK"]));
    input.texts[1].text = "Official source"; input.texts[1].link = url + "#details";
    expect(reviewCanvaDesign(input).decision).toBe("ready_for_user_review");
  });
  it("rejects off-page objects and incomplete post-edit visual checks", () => {
    const input = clean(); input.texts[0].box.x = 590; input.visualReview = "problems_found";
    expect(reviewCanvaDesign(input).issues.map(i => i.code)).toEqual(expect.arrayContaining(["OUT_OF_BOUNDS", "VISUAL_REVIEW_INCOMPLETE"]));
  });
  it("retains blocker severity even when the bounded issue list is full", () => {
    const input = clean();
    input.images = Array.from({ length: 101 }, (_, i) => ({ id: `image-${i}`, textInImage: "not_checked" as const }));
    input.requiredText = ["Missing required copy"];
    const result = reviewCanvaDesign(input);
    expect(result.issues).toHaveLength(100);
    expect(result.decision).toBe("blocked");
    expect(result.issueSummary).toMatchObject({ blockerCount: 1, truncated: true });
  });
  it("bounds inputs and rejects duplicate identities, unsafe links and nonfinite geometry", () => {
    const input = clean(); input.images[0].id = "value";
    expect(reviewCanvaDesign(input).issues.some(i => i.code === "DUPLICATE_ELEMENT_ID")).toBe(true);
    for (const link of ["javascript:alert(1)", "https://name:password@example.org/", "not a URL"]) expect(() => reviewCanvaDesign({ ...clean(), expectedLinks: [link] })).toThrow();
    expect(() => reviewCanvaDesign({ ...clean(), texts: Array(201).fill(clean().texts[0]) })).toThrow();
    expect(() => reviewCanvaDesign({ ...clean(), width: Infinity })).toThrow();
  });
});
