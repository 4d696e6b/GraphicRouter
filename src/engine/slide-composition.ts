import { composeSlideSchema } from "../contracts/slide-composition";
import type { CanvasElement } from "../contracts";
import { layoutText } from "./text";
import { fail } from "./errors";
/** Optional native starting geometry, never an automatic replacement for a saved page. */
export function composeSlide(raw: unknown) {
  const p = composeSlideSchema.parse(raw), elements: CanvasElement[] = [];
  const dark = p.kind === "hero" || p.kind === "closing", ink = dark ? p.theme.background : p.theme.foreground;
  const shape = (id: string, x: number, y: number, width: number, height: number, fill: string, kind: "rectangle" | "ellipse" = "rectangle") => elements.push({ id: `${p.idPrefix}.${id}`, type: "shape", shape: kind, x, y, width, height, zIndex: elements.length, fill: { hex: fill } });
  const line = (id: string, x: number, y: number, width: number, height: number, color: string) => elements.push({ id: `${p.idPrefix}.${id}`, type: "line", x, y, width, height, zIndex: elements.length, thickness: 3, color: { hex: color } });
  const text = (id: string, copy: string, x: number, y: number, width: number, height: number, size: number, bold = false, color = ink) => {
    if (!copy) return;
    const actual = layoutText(copy, width, size, bold);
    if (actual.height > height + .001) fail("COMPOSITION_TEXT_FIT", id, "Supplied copy does not fit this visual. Recompose or ask to shorten visible copy; preserve detailed requirements in notes. Nothing was truncated or shrunk.");
    elements.push({ id: `${p.idPrefix}.${id}`, type: "text", text: copy, x, y, width, height, zIndex: elements.length, fontFamily: "Arial", fontSize: size, bold, color: { hex: color }, align: "left" });
  };
  if (dark) shape("background", 0, 0, 1600, 900, p.theme.foreground);
  shape("accent-rule", 80, 70, 64, 6, p.theme.accent);
  text("kicker", p.kicker, 80, 94, 1430, 40, 21, true, dark ? p.theme.background : p.theme.accent);
  text("footer", p.footer, 80, 815, 1440, 52, 18, false, dark ? p.theme.background : p.theme.muted);
  if (p.kind === "hero" || p.kind === "closing") {
    text("headline", p.headline, 80, 190, 950, 330, 68, true);
    text("body", p.body, 80, 560, 900, 180, 28);
    const n = p.blocks.length || 1, start = 250;
    p.blocks.forEach((b, i) => {
      const y = start + i * (440 / n);
      shape(`node-${i}`, 1120, y, 24, 24, p.theme.accent, "ellipse");
      if (i < n - 1) line(`connector-${i}`, 1132, y + 24, 0, 440 / n - 24, p.theme.accent);
      text(`label-${i}`, b.label, 1170, y - 3, 350, 68, 26, true);
      text(`detail-${i}`, b.body, 1170, y + 70, 350, Math.min(140, 440 / n - 80), 20);
    });
    if (!p.blocks.length) { shape("focal-orbit", 1110, 245, 330, 330, p.theme.accent, "ellipse"); shape("focal-centre", 1190, 325, 170, 170, p.theme.foreground, "ellipse"); }
  } else if (p.kind === "editorial") {
    text("headline", p.headline, 80, 190, 820, 300, 60, true);
    text("body", p.body, 80, 550, 820, 210, 27);
    shape("side-rail", 1000, 185, 5, 550, p.theme.accent);
    p.blocks.forEach((b, i) => {
      const y = 190 + i * 140;
      text(`label-${i}`, b.label, 1040, y, 470, 65, 28, true, p.theme.accent);
      text(`detail-${i}`, b.body, 1040, y + 68, 470, 65, 21);
    });
  } else {
    text("headline", p.headline, 80, 175, 1440, 150, 52, true);
    text("body", p.body, 80, 330, 1440, 100, 25);
    if (p.kind === "comparison") {
      p.blocks.forEach((b, i) => {
        const x = 80 + i * 760;
        shape(`panel-${i}`, x, 465, 680, 300, i === 0 ? p.theme.foreground : p.theme.accent);
        text(`label-${i}`, b.label, x + 32, 490, 610, 85, 33, true, p.theme.background);
        text(`detail-${i}`, b.body, x + 32, 595, 610, 145, 26, false, p.theme.background);
      });
    } else if (p.kind === "metrics") {
      const width = 1440 / p.blocks.length;
      p.blocks.forEach((b, i) => {
        const x = 80 + i * width;
        shape(`metric-rule-${i}`, x, 480, width - 40, 5, p.theme.accent);
        text(`value-${i}`, b.value!, x, 515, width - 40, 100, 50, true, p.theme.accent);
        text(`label-${i}`, b.label, x, 635, width - 40, 70, 26, true);
        text(`detail-${i}`, b.body, x, 715, width - 40, 65, 19);
      });
    } else {
      const width = 1440 / p.blocks.length;
      line("progress-connector", 110, 490, width * (p.blocks.length - 1), 0, p.theme.accent);
      p.blocks.forEach((b, i) => {
        const x = 80 + i * width;
        shape(`step-marker-${i}`, x, 460, 60, 60, p.theme.accent, "ellipse");
        text(`step-number-${i}`, String(i + 1), x + 18, 475, 30, 40, 25, true, p.theme.background);
        text(`label-${i}`, b.label, x, 550, width - 30, 90, 29, true);
        text(`detail-${i}`, b.body, x, 655, width - 30, 140, 23);
        if (p.kind === "timeline" && b.value) text(`period-${i}`, b.value, x + 76, 433, width - 105, 25, 18, true, p.theme.accent);
      });
    }
  }
  return { kind: "native_slide_composition", composition: p.kind, canvas: { width: 1600, height: 900 }, elements,
    apply: "Unsaved editable geometry only. Apply to the intended blank document page through edit_document with current baseVersion; preserve stable IDs. Do not overwrite a composed page or unrelated elements. Inspect the actual page and adapt geometry to its story.",
    notes: ["Only caller-supplied copy/values appear; there is no evidence generation.", "Preserve the detailed brief/requirements in the ledger and notes; visual copy is intentionally concise.", "Use varied compositions across a long deck according to meaning. Process/timeline connectors express order, not metric distances.", "All text, markers, connectors and panels are separate native objects; no generated image, arbitrary font or custom image ingestion.", "Geometry/text fit does not establish beauty, contrast of an arbitrary supplied palette or Canva fidelity. Inspect full pages and critical details."],
  };
}
