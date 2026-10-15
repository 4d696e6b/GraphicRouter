import type { Paint, SlideBlueprint, SlideElement, SlideInput } from "../contracts";
import { fail } from "./errors";
import { composeStudioSlide, usesStudio } from "./studio-layouts";

const foreground: Paint = { token: "foreground" }, accent: Paint = { token: "accent" }, muted: Paint = { token: "muted" };

export function composeSlide(input: SlideInput, index: number, artDirection = ""): SlideBlueprint {
  if (usesStudio(artDirection)) return composeStudioSlide(input, index);
  const elements: SlideElement[] = [];
  const id = (part: string) => `${input.id}.${part}`;
  function text(part: string, content: string, x: number, y: number, width: number, height: number, fontSize: number, bold = false, color = foreground, align: "left" | "center" | "right" = "left") {
    elements.push({ id: id(part), type: "text", text: content, x, y, width, height, fontSize, fontFamily: "Arial", bold, color, align, zIndex: elements.length });
  }
  function shape(part: string, x: number, y: number, width: number, height: number, fill: Paint, kind: "rectangle" | "ellipse" = "rectangle") {
    elements.push({ id: id(part), type: "shape", shape: kind, x, y, width, height, fill, zIndex: elements.length });
  }
  function line(part: string, x: number, y: number, width: number, color = muted, thickness = 1) {
    elements.push({ id: id(part), type: "line", x, y, width, height: 0, color, thickness, zIndex: elements.length });
  }
  const blockCount = input.blocks.length;
  const fits = input.layout === "cards" ? blockCount >= 1 && blockCount <= 3
    : input.layout === "comparison" ? blockCount === 2
    : input.layout === "process" ? blockCount >= 2 && blockCount <= 3
    : blockCount <= 1;
  if (!fits) fail("LAYOUT_CONTENT_MISMATCH", `${input.id}.layout`, `${input.layout} cannot display ${blockCount} content blocks. Use cards for 1–3, comparison for 2, process for 2–3, or hero/closing for 0–1. Content was not discarded.`);

  text("eyebrow", `${String(index + 1).padStart(2, "0")} / ${input.role.toUpperCase()}`, 96, 58, 650, 28, 18, true, accent);
  shape("accent-rule", 96, 114, 80, 6, accent);
  const large = input.layout === "hero" || input.layout === "closing";
  const headlineWidth = input.layout === "hero" && input.assetId ? 1080 : 1408;
  text("headline", input.headline, 96, large ? 176 : 156, headlineWidth, large ? 220 : 158, large ? 82 : 64, true);
  text("takeaway", input.takeaway, 96, large ? 448 : 346, large ? 1096 : 1408, large ? 140 : 104, large ? 34 : 32, false, muted);

  if (input.layout === "hero" || input.layout === "closing") {
    if (blockCount) {
      text("block1.heading", input.blocks[0].heading, 96, 644, 1096, 44, 30, true);
      text("block1.body", input.blocks[0].body, 96, 702, 1096, 78, 24, false, muted);
    }
    if (!input.assetId) {
      shape("motif.dot", 1368, 650, 88, 88, accent, "ellipse");
      line("motif.line", 1240, 694, 104, accent, 4);
    }
  } else {
    const gap = 24, width = (1408 - gap * (blockCount - 1)) / blockCount;
    input.blocks.forEach((block, blockIndex) => {
      const x = 96 + blockIndex * (width + gap), part = `block${blockIndex + 1}`;
      if (input.layout === "process") {
        if (blockIndex < blockCount - 1) line(`${part}.connector`, x + 100, 534, width + gap - 124, accent, 3);
        shape(`${part}.marker`, x, 496, 76, 76, accent, "ellipse");
        text(`${part}.number`, String(blockIndex + 1).padStart(2, "0"), x, 515, 76, 38, 26, true, { hex: "#FFFFFF" }, "center");
        text(`${part}.heading`, block.heading, x, 608, width - 24, 88, 36, true);
        text(`${part}.body`, block.body, x, 708, width - 24, 78, 28, false, muted);
      } else {
        shape(`${part}.panel`, x, 488, width, 292, { hex: "#FFFFFF" });
        shape(`${part}.rule`, x, 488, width, 6, accent);
        text(`${part}.number`, String(blockIndex + 1).padStart(2, "0"), x + 28, 514, width - 56, 26, 18, true, accent);
        text(`${part}.heading`, block.heading, x + 28, 558, width - 56, 88, 36, true);
        text(`${part}.body`, block.body, x + 28, 652, width - 56, 108, 30, false, muted);
      }
    });
  }
  if (input.assetId) {
    const imageLarge = input.layout === "hero" || input.layout === "closing";
    elements.push({ id: id("image"), type: "image", assetId: input.assetId, alt: "Supplied presentation image", x: imageLarge ? 1248 : 1432, y: imageLarge ? (input.layout === "hero" ? 176 : 520) : 48, width: imageLarge ? 256 : 72, height: imageLarge ? 256 : 72, zIndex: elements.length });
  }
  line("footer.rule", 96, 814, 1408);
  text("footer.brand", "GRAPHICROUTER", 96, 842, 600, 24, 14, true, muted);
  text("footer.page", `${String(index + 1).padStart(2, "0")} / 05`, 1360, 838, 144, 28, 18, false, muted, "right");
  return { id: input.id, role: input.role, layout: input.layout, takeaway: input.takeaway, notes: structuredClone(input.notes), elements };
}
