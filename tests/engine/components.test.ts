import { describe, expect, it } from "vitest";
import { canvasElementSchema } from "../../src/contracts";
import { composeComponent, componentInputSchema } from "../../src/engine/components";
import { EngineError } from "../../src/engine/errors";
import { canvasEngine } from "../../src/engine/canvas";
import { readPptx } from "./read-pptx";

const common = { idPrefix: "figure", x: 60, y: 60, width: 1000, height: 500, startZIndex: 10, foreground: "#182D29", accent: "#187865", muted: "#E1E9E5" };
const bars = { ...common, kind: "bar_chart" as const, units: "USD", data: [{ label: "First", value: 10 }, { label: "Second", value: 2 }, { label: "Zero", value: 0 }] };

describe("native visual components", () => {
  it("encodes horizontal bars with one exact zero baseline and common geometry scale, with separate unmodified labels", () => {
    const before = structuredClone(bars), result = composeComponent(bars);
    const first = result.elements.find(item => item.id === "figure.bar-1")!, second = result.elements.find(item => item.id === "figure.bar-2")!;
    expect(first.width / second.width).toBeCloseTo(5);
    expect(first.x).toBe(second.x);
    expect(result.elements.find(item => item.id === "figure.zero-baseline")).toMatchObject({ x: first.x, width: 0 });
    expect(result.elements.find(item => item.id === "figure.bar-3")).toBeUndefined();
    expect(result.elements.filter(item => item.type === "text").map(item => item.text)).toEqual(expect.arrayContaining(["Units: USD", "First", "Second", "Zero", "10", "2", "0"]));
    expect(result.elements.every(item => item.type !== "image")).toBe(true);
    expect(result.elements.every(item => canvasElementSchema.safeParse(item).success)).toBe(true);
    expect(new Set(result.elements.map(item => item.id)).size).toBe(result.elements.length);
    expect(result.elements.map(item => item.zIndex)).toEqual(result.elements.map((_, index) => 10 + index));
    expect(bars).toEqual(before);
    const again = composeComponent(bars); result.elements[0].x = 999;
    expect(again.elements[0].x).toBe(60);
  });

  it("handles all-zero, identical, fractional and tiny observed values without inventing positive bars", () => {
    const zero = composeComponent({ ...bars, data: [{ label: "A", value: 0 }, { label: "B", value: 0 }] });
    expect(zero.elements.some(item => item.id.includes(".bar-"))).toBe(false);
    expect(zero.notes.join(" ")).toContain("reference scale");
    const result = composeComponent({ ...bars, data: [{ label: "A", value: 0.1 }, { label: "B", value: 0.1 }, { label: "C", value: 1e-12 }] });
    expect(result.elements.find(item => item.id === "figure.bar-1")!.width).toBe(result.elements.find(item => item.id === "figure.bar-2")!.width);
    expect(result.elements.find(item => item.id === "figure.value-3")).toMatchObject({ text: "1e-12" });
    expect(result.elements.find(item => item.id === "figure.bar-3")!.width).toBeGreaterThan(0);
  });

  it("uses explicitly stepped category connections with accurate positive and negative positions", () => {
    const result = composeComponent({ ...common, kind: "line_chart", units: "points", data: [{ label: "A", value: -10 }, { label: "B", value: 0 }, { label: "C", value: 20 }] });
    const baseline = result.elements.find(item => item.id === "figure.zero-baseline")!;
    const vertical = result.elements.find(item => item.id === "figure.segment-1-vertical")!;
    const vertical2 = result.elements.find(item => item.id === "figure.segment-2-vertical")!;
    expect(vertical.y).toBeCloseTo(baseline.y);
    expect(vertical.height / vertical2.height).toBeCloseTo(0.5);
    expect(vertical2.y + vertical2.height).toBeCloseTo(baseline.y);
    expect(result.elements.find(item => item.id === "figure.scale")).toMatchObject({ text: "Y-axis: -10 to 20 points" });
    expect(result.elements.find(item => item.id === "figure.label-1")).toMatchObject({ text: "A\n-10" });
    expect(result.notes.join(" ")).toContain("stepped line chart");
    expect(result.notes.join(" ")).toContain("equally spaced categories");
    expect(result.elements.filter(item => item.type === "line").every(item => item.width === 0 || item.height === 0)).toBe(true);
  });

  it("keeps a twelve-point mixed-sign chart in one edit batch and handles constant zero lines", () => {
    const result = composeComponent({ ...common, width: 1200, kind: "line_chart", units: "score", data: Array.from({ length: 12 }, (_, index) => ({ label: `P${index + 1}`, value: index % 2 ? -index : index })) });
    expect(result.elements.length).toBeLessThanOrEqual(40);
    expect(result.elements.filter(item => item.id.startsWith("figure.label-"))).toHaveLength(12);
    expect(result.elements.every(item => item.zIndex <= 10000 && item.x >= common.x && item.x + item.width <= common.x + 1200 && item.y >= common.y && item.y + item.height <= common.y + common.height)).toBe(true);
    const zero = composeComponent({ ...common, kind: "line_chart", units: "score", data: [{ label: "A", value: 0 }, { label: "B", value: 0 }] });
    expect(zero.notes.join(" ")).toContain("reference display scale");
    expect(zero.elements.every(item => Number.isFinite(item.x) && Number.isFinite(item.y))).toBe(true);
    const descending = composeComponent({ ...common, kind: "line_chart", units: "score", data: [{ label: "A", value: 10 }, { label: "B", value: 2 }] });
    expect(descending.elements.find(item => item.id === "figure.segment-1-vertical")!.height).toBeGreaterThan(0);
  });

  it("creates all seven text-free icons as independent bounded primitives", () => {
    for (const name of ["check", "arrow-right", "target", "clock", "person", "document", "steps"] as const) {
      const result = composeComponent({ ...common, kind: "icon", width: 160, height: 100, name });
      expect(result.elements.length).toBeGreaterThan(1);
      expect(result.elements.length).toBeLessThanOrEqual(40);
      expect(result.elements.every(item => item.type === "shape" || item.type === "line")).toBe(true);
      expect(result.elements.every(item => canvasElementSchema.safeParse(item).success && item.x >= common.x && item.y >= common.y && item.x + item.width <= common.x + 160 && item.y + item.height <= common.y + 100)).toBe(true);
      expect(new Set(result.elements.map(item => item.id)).size).toBe(result.elements.length);
    }
  });

  it("rejects unsupported, unbounded, negative bar and unreadable inputs without silently dropping data", () => {
    for (const input of [
      { ...bars, data: [{ label: "A", value: -1 }] },
      { ...bars, data: [{ label: "A", value: Infinity }] },
      { ...bars, data: Array.from({ length: 9 }, () => ({ label: "A", value: 1 })) },
      { ...bars, kind: "line_chart", data: Array.from({ length: 13 }, () => ({ label: "A", value: 1 })) },
      { ...bars, data: [{ label: "A".repeat(25), value: 1 }] },
      { ...bars, units: "" }, { ...bars, startZIndex: 9962 }, { ...bars, remoteUrl: "https://example.com/image.svg" },
      { ...bars, kind: "icon", name: "unknown" },
    ]) expect(componentInputSchema.safeParse(input).success).toBe(false);
    expect(() => composeComponent({ ...bars, width: 400 })).toThrow(EngineError);
    expect(() => composeComponent({ ...bars, x: 3500 })).toThrow(EngineError);
    expect(() => composeComponent({ ...bars, data: [{ label: "WWWWWWWWWWWWWWWWWWWWWWWW", value: 1 }] })).toThrow(EngineError);
    expect(() => composeComponent({ ...bars, data: [{ label: "สวัสดี", value: 1 }] })).toThrow(EngineError);
    expect(() => composeComponent({ ...bars, data: [{ label: "A", value: 1e12 }, { label: "B", value: 1e-320 }] })).toThrow(EngineError);
    expect(() => composeComponent({ ...common, kind: "line_chart", units: "score", data: [{ label: "A", value: 1 }, { label: "B", value: 1e-300 }] })).toThrow(EngineError);
  });

  it("exports composed charts as native text and shapes with no image fallback", async () => {
    const result = composeComponent(bars), deckId = "6bac9301-3cf3-4b3f-8a72-549765f465f9";
    const blank = canvasEngine.create({ title: "Supplied data chart", brief: { idea: "Compare supplied observations", audience: "Reviewers", purpose: "Check native chart composition", facts: [], unknowns: [] }, canvas: { width: 1600, height: 900 }, theme: { background: "#FFFFFF", foreground: common.foreground, muted: common.muted, accent: common.accent }, designIntent: "Native bars with separately editable labels." }, { deckId, version: 1 });
    const composed = canvasEngine.edit(blank, { deckId, baseVersion: 1, phase: "content", summary: "Add the supplied data chart", operations: result.elements.map(element => ({ type: "add_element", element })) });
    expect(composed.validationIssues.filter(issue => issue.severity === "error")).toEqual([]);
    const file = readPptx(await canvasEngine.compile(composed, []));
    const xml = file.get("ppt/slides/slide1.xml")!;
    expect(xml).not.toContain("<p:pic>");
    for (const element of result.elements) expect(xml).toContain(`name="${element.id}"`);
    expect(xml).toContain("Units: USD");
    expect(xml).toContain("First");
    expect(blank.elements).toEqual([]);
  });
});
