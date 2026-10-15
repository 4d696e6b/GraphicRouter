import { describe, expect, it } from "vitest";
import type { CanvasBlueprint, CanvasElement } from "../../src/contracts";
import { reviewDesign } from "../../src/engine/design-review";

const label = (id: string, text: string, x: number, y: number, fontSize: number, bold = false): CanvasElement => ({
  id, type: "text", text, x, y, width: 850, height: 150, zIndex: y,
  fontFamily: "Arial", fontSize, bold, color: { token: "foreground" }, align: "left",
});
function graphic(elements: CanvasElement[]): CanvasBlueprint {
  return {
    schemaVersion: 2, kind: "canvas", deckId: "ce657f8e-ef6c-441f-96c0-fabcf0783ca4", version: 2,
    title: "Plan a clear route", brief: { idea: "Explain three connected steps", audience: "Readers on a phone", purpose: "Make the sequence clear", facts: ["Plan, arrange, inspect"], unknowns: [] },
    canvas: { width: 1080, height: 1920 }, theme: { background: "#FFFFFF", foreground: "#161616", muted: "#666666", accent: "#7C3AED" },
    designIntent: "A phone infographic with a prominent message and a simple route.",
    elements, changes: [], construction: [{ version: 1, phase: "blank", summary: "Blank", elementCount: 0 }, { version: 2, phase: "content", summary: "Content", elementCount: elements.length }], validationIssues: [],
  };
}

describe("advisory canvas design review", () => {
  it("accepts a concise hierarchy and intentional full-bleed artwork without imposing a template", () => {
    const b = graphic([
      { id: "bleed", type: "shape", shape: "ellipse", x: 0, y: 0, width: 1080, height: 350, zIndex: 0, fill: { token: "accent" } },
      label("headline", "Plan the route first", 100, 100, 84, true),
      label("step-one", "Arrange ideas in the order people need them.", 100, 500, 40),
      label("step-two", "Inspect the complete composition at reading size.", 100, 850, 40),
    ]);
    expect(reviewDesign(b)).toEqual([]);
  });

  it("spots technically valid text that becomes tiny on a phone and gives a viewing condition", () => {
    const b = graphic([label("headline", "A readable title", 100, 100, 84, true), label("small-explanation", "This explanation is too small at feed size.", 100, 500, 24)]);
    const warnings = reviewDesign(b);
    expect(warnings).toContainEqual(expect.objectContaining({ code: "SMALL_AT_PHONE_WIDTH", path: "small-explanation", severity: "warning", message: expect.stringContaining("375px wide") }));
    expect(warnings.find((issue) => issue.code === "SMALL_AT_PHONE_WIDTH")?.message).toContain("For print");
    expect(warnings.every((issue) => issue.severity === "warning")).toBe(true);
  });

  it("identifies dense prose and a uniformly treated reading order without rating beauty", () => {
    const paragraph = Array.from({ length: 85 }, (_, index) => `detail${index}`).join(" ");
    const b = graphic([
      label("opening", "These are the ideas to understand before you start", 100, 100, 42),
      label("body", paragraph, 100, 500, 42),
      label("closing", "Keep this next step in mind when you finish reading", 100, 950, 42),
    ]);
    const warnings = reviewDesign(b);
    expect(warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DENSE_COPY", path: "body", message: expect.stringContaining("Preserve supplied facts") }),
      expect.objectContaining({ code: "WEAK_TYPE_HIERARCHY" }),
    ]));
    expect(warnings.every((issue) => issue.severity === "warning")).toBe(true);
  });

  it("respects weight-based hierarchy and flags text at the crop boundary without changing history", () => {
    const b = graphic([
      label("headline", "The main message must stand out from the details", 5, 100, 42, true),
      label("body", "A deliberate difference in weight can establish a clear reading order", 100, 500, 42),
      label("closing", "Finish with one useful next step for the reader", 100, 950, 42),
    ]);
    const before = structuredClone(b);
    const warnings = reviewDesign(b);
    expect(warnings).toContainEqual(expect.objectContaining({ code: "TEXT_NEAR_EDGE", path: "headline" }));
    expect(warnings.some((issue) => issue.code === "WEAK_TYPE_HIERARCHY")).toBe(false);
    expect(b).toEqual(before);
    expect(reviewDesign(graphic([]))).toEqual([]);
  });
});
