import type { Paint, SlideBlueprint, SlideElement, SlideInput } from "../contracts";
import { fail } from "./errors";

/** Explicit opt-in keeps historical blueprints on their original recipes. */
export const usesStudio = (direction: string) => /^GraphicRouter Studio\b/i.test(direction.trim());
const ink: Paint = { hex: "#11131D" }, white: Paint = { hex: "#F9F8F4" };
const accent: Paint = { token: "accent" }, muted: Paint = { hex: "#666779" };

export function composeStudioSlide(input: SlideInput, index: number): SlideBlueprint {
  const elements: SlideElement[] = [], dark = input.layout === "hero" || input.layout === "comparison";
  const foreground = dark ? white : ink, secondary: Paint = dark ? { hex: "#BDC0D0" } : muted;
  const text = (part: string, value: string, x: number, y: number, width: number, height: number, size: number, bold = false, color = foreground) => elements.push({ id: `${input.id}.${part}`, type: "text", text: value, x, y, width, height, fontSize: size, fontFamily: "Arial", bold, color, align: "left", zIndex: elements.length });
  const shape = (part: string, x: number, y: number, width: number, height: number, fill: Paint, kind: "rectangle" | "ellipse" = "rectangle") => elements.push({ id: `${input.id}.${part}`, type: "shape", shape: kind, x, y, width, height, fill, zIndex: elements.length });
  const line = (part: string, x: number, y: number, width: number, height = 0, color: Paint = accent, thickness = 2) => elements.push({ id: `${input.id}.${part}`, type: "line", x, y, width, height, color, thickness, zIndex: elements.length });
  const n = input.blocks.length;
  const fits = input.layout === "cards" ? n >= 1 && n <= 3 : input.layout === "comparison" ? n === 2 : input.layout === "process" ? n >= 2 && n <= 3 : n <= 1;
  if (!fits) fail("LAYOUT_CONTENT_MISMATCH", `${input.id}.layout`, `${input.layout} cannot display ${n} blocks. Use cards for 1–3, process for 2–3, comparison for 2, or hero/closing for 0–1. No copy was discarded.`);
  shape("surface", 0, 0, 1600, 900, dark ? ink : { hex: "#F4F2EC" });
  shape("accent-rule", 96, 64, 36, 6, accent);
  text("eyebrow", "GRAPHICROUTER", 150, 49, 650, 30, 18, true, foreground);
  const large = input.layout === "hero" || input.layout === "closing";
  const headlineWidth = input.layout === "hero" ? 910 : 1408;
  text("headline", input.headline, 96, large ? 170 : 145, headlineWidth, large ? 250 : 168, large ? 96 : 64, true);
  text("takeaway", input.takeaway, 100, large ? 470 : 340, input.layout === "hero" ? 850 : 1360, large ? 154 : 110, large ? 34 : 30, false, secondary);

  if (input.layout === "hero") {
    // A miniature slide built out of separate native panels, lines, and nodes.
    shape("visual.shadow", 1108, 226, 390, 416, { hex: "#282A3B" });
    shape("visual.canvas", 1076, 194, 390, 416, white);
    shape("visual.title", 1110, 236, 216, 18, ink);
    shape("visual.subtitle", 1110, 271, 284, 6, { hex: "#D6D5DE" });
    line("visual.route", 1150, 369, 224, 0, accent, 4);
    line("visual.branch", 1262, 369, 0, 119, accent, 4);
    for (const [i, x, y] of [[1, 1150, 369], [2, 1374, 369], [3, 1262, 488]]) {
      shape(`visual.node${i}`, x - 28, y - 28, 56, 56, i === 3 ? ink : accent, "ellipse");
    }
    shape("visual.caption", 1110, 552, 175, 5, { hex: "#D6D5DE" });
    shape("visual.selection.top", 1049, 169, 18, 18, accent);
    shape("visual.selection.bottom", 1474, 617, 18, 18, accent);
  }
  if (large) {
    if (n) {
      text("block1.heading", input.blocks[0].heading, 100, 688, 1040, 44, 29, true);
      text("block1.body", input.blocks[0].body, 100, 748, 1040, 60, 24, false, secondary);
    }
    if (input.layout === "closing") {
      line("motif.line", 1260, 724, 150, 0, accent, 3);
      shape("motif.dot", 1426, 690, 68, 68, accent, "ellipse");
    }
  } else if (input.layout === "cards" && n === 1) {
    text("block1.number", "01", 96, 506, 230, 158, 120, true, accent);
    text("block1.heading", input.blocks[0].heading, 396, 500, 1050, 120, 52, true);
    text("block1.body", input.blocks[0].body, 400, 651, 1040, 125, 32, false, secondary);
  } else {
    const gap = 28, width = (1408 - gap * (n - 1)) / n;
    input.blocks.forEach((block, i) => {
      const x = 96 + i * (width + gap), p = `block${i + 1}`;
      if (input.layout === "process") {
        shape(`${p}.panel`, x, 496, width, 156, { hex: "#FFFFFF" });
        const gray: Paint = { hex: "#DEDCE5" };
        shape(`${p}.mini.title`, x + 28, 524, width * .51, 10, i === n - 1 ? ink : gray);
        shape(`${p}.mini.line`, x + 28, 548, width * .72, 5, gray);
        for (let cell = 0; cell < 3; cell++) shape(`${p}.mini.cell${cell}`, x + 28 + cell * ((width - 76) / 3), 578, (width - 100) / 3, 44, i === n - 1 && cell === 1 ? accent : gray);
        text(`${p}.number`, String(i + 1).padStart(2, "0"), x, 460, 60, 28, 17, true, accent);
        text(`${p}.heading`, block.heading, x, 678, width - 20, 56, 31, true);
        text(`${p}.body`, block.body, x, 744, width - 20, 84, 24, false, secondary);
      } else {
        shape(`${p}.panel`, x, 488, width, 310, dark ? { hex: "#242634" } : { hex: "#FFFFFF" });
        shape(`${p}.rule`, x, 488, 5, 310, accent);
        text(`${p}.number`, String(i + 1).padStart(2, "0"), x + 30, 520, width - 60, 30, 20, true, dark ? white : accent);
        text(`${p}.heading`, block.heading, x + 30, 576, width - 60, 92, 36, true);
        text(`${p}.body`, block.body, x + 30, 684, width - 60, 92, 28, false, secondary);
      }
    });
  }
  if (input.assetId) elements.push({ id: `${input.id}.image`, type: "image", assetId: input.assetId, alt: "Supplied presentation image", x: 1436, y: 40, width: 64, height: 64, zIndex: elements.length });
  line("footer.rule", 96, 842, 1408, 0, dark ? { hex: "#383A48" } : { hex: "#D2D0C8" }, 1);
  text("footer.brand", "PRESENTATIONS YOU CAN DIRECT", 96, 863, 1000, 20, 12, true, secondary);
  text("footer.page", `${String(index + 1).padStart(2, "0")} / 05`, 1410, 861, 110, 24, 15, false, secondary);
  return { id: input.id, role: input.role, layout: input.layout, takeaway: input.takeaway, notes: structuredClone(input.notes), elements };
}
