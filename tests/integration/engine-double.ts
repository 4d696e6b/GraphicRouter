import type { DeckBlueprint, SlideEngine } from "../../src/contracts";

/** TEST DOUBLE ONLY. No actual layout, SVG composition, or valid PowerPoint. */
export const testEngine: SlideEngine = {
  createBlueprint(input, identity): DeckBlueprint {
    return { schemaVersion: 1, ...identity, input: structuredClone(input), canvas: { width: 1600, height: 900 },
      theme: { background: "#FAF9F6", foreground: "#191724", muted: "#62606B", accent: input.accent },
      slides: input.slides.map(s => ({ id: s.id, role: s.role, layout: s.layout, takeaway: s.takeaway, notes: structuredClone(s.notes),
        elements: [{ type: "text", id: `${s.id}.headline`, x: 0, y: 0, width: 100, height: 100, zIndex: 1, text: s.headline, fontFamily: "Arial", fontSize: 30, bold: true, color: { token: "foreground" }, align: "left" }],
      })), changes: [], validationIssues: [],
    };
  },
  reviseBlueprint(current, operations) {
    const next = structuredClone(current); next.version++;
    for (const op of operations) {
      if (op.type !== "set_element_color") throw new Error("Test double supports color only");
      const element = next.slides.flatMap(s => s.elements).find(e => e.id === op.elementId);
      if (!element || element.type !== "text") throw new Error("Unknown test element");
      element.color = { hex: op.color };
      next.changes.push({ operation: op.type, target: op.elementId, description: "TEST DOUBLE: changed headline color" });
    }
    return next;
  },
  validateBlueprint: () => [],
  compilePowerPoint: async () => new TextEncoder().encode("TEST DOUBLE: NOT A VALID PPTX"),
  renderSlideSvg: () => '<svg xmlns="http://www.w3.org/2000/svg"><text>TEST DOUBLE</text></svg>',
};
