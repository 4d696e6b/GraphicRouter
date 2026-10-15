import type { CanvasBlueprint, ValidationIssue } from "../contracts";

/**
 * Advisory checks for an image inspection, not an aesthetic score or a format
 * validator. They never rewrite a canvas or make an existing version invalid.
 */
export function reviewDesign(blueprint: CanvasBlueprint): ValidationIssue[] {
  const texts = blueprint.elements.filter((element) => element.type === "text");
  if (!texts.length) return [];
  const issues: ValidationIssue[] = [];
  const warn = (code: string, path: string, message: string) => issues.push({ severity: "warning", code, path, message });
  const words = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length;

  // A phone-sized projection makes the scale concrete without assuming that a
  // print poster must be legible at thumbnail size. The caller decides whether
  // this viewing condition matters for the supplied brief.
  const phoneWidth = 375;
  const phoneScale = phoneWidth / blueprint.canvas.width;
  const tinyTexts = texts.filter((element) => element.fontSize * phoneScale < 12);
  if (tinyTexts.length) {
    const smallest = Math.min(...tinyTexts.map((element) => element.fontSize * phoneScale));
    warn("SMALL_AT_PHONE_WIDTH", tinyTexts[0].id,
      `${tinyTexts.length} text object${tinyTexts.length === 1 ? " is" : "s are"} below 12px when the complete design is shown ${phoneWidth}px wide (smallest ${smallest.toFixed(1)}px). If this is for a phone or social feed, enlarge important text, shorten copy, or split the design. For print, review at the intended physical size instead.`);
  }

  const totalWords = texts.reduce((sum, element) => sum + words(element.text), 0);
  const longParagraph = texts.find((element) => words(element.text) > 80);
  if (totalWords > 240 || longParagraph) {
    warn("DENSE_COPY", longParagraph?.id ?? "elements",
      `This one-page graphic contains ${totalWords} words${longParagraph ? `; ${longParagraph.id} alone contains ${words(longParagraph.text)} words` : ""}. Review whether this matches the reading context. Prefer shorter labels and a clear visual explanation; move secondary detail to a companion page when appropriate. Preserve supplied facts and required wording.`);
  }

  // Size, weight and paint can each establish hierarchy. Only flag a nearly
  // uniform treatment, and leave intentional typographic compositions alone.
  if (texts.length >= 3 && totalWords >= 18) {
    const minSize = Math.min(...texts.map((element) => element.fontSize));
    const maxSize = Math.max(...texts.map((element) => element.fontSize));
    const weights = new Set(texts.map((element) => element.bold));
    const paints = new Set(texts.map((element) => "hex" in element.color ? element.color.hex.toUpperCase() : blueprint.theme[element.color.token].toUpperCase()));
    if (maxSize / minSize < 1.3 && weights.size === 1 && paints.size === 1) {
      warn("WEAK_TYPE_HIERARCHY", "elements",
        "Text uses nearly the same size, weight and colour throughout. In the rendered image, check that the main message stands out from explanations and sources. Use a deliberate size contrast, weight, or additional space if the reading order is unclear.");
    }
  }

  // Background shapes and edge-to-edge illustration are intentionally excluded.
  // Text near a trim/crop boundary deserves attention, without imposing a grid.
  const safeInset = Math.min(blueprint.canvas.width, blueprint.canvas.height) * 0.03;
  const edgeText = texts.filter((element) => Math.min(element.x, element.y, blueprint.canvas.width - element.x - element.width, blueprint.canvas.height - element.y - element.height) < safeInset);
  if (edgeText.length) {
    warn("TEXT_NEAR_EDGE", edgeText[0].id,
      `${edgeText.length} text object${edgeText.length === 1 ? " is" : "s are"} within ${Math.round(safeInset)}px of a canvas edge. Check crop/trim safety and breathing room in the actual reading medium. Move important copy inward unless the edge alignment is a deliberate, verified design choice.`);
  }
  return issues;
}
