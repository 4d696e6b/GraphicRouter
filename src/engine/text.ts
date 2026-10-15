import { fontMetrics } from "./font-metrics";
import { fail } from "./errors";

export const LINE_HEIGHT = 1.2;
const WIDTH_SAFETY = 1.04;

export function measureText(text: string, fontSize: number, bold: boolean): number {
  const widths: Record<string, number> = bold ? fontMetrics.bold : fontMetrics.regular;
  let advance = 0;
  for (const character of text) {
    const width = widths[character];
    if (width === undefined) fail("UNSUPPORTED_GLYPH", "text", `The English/Arial v1 renderer cannot measure ${JSON.stringify(character)}. Use supported English text or punctuation.`);
    advance += width;
  }
  return advance * fontSize * WIDTH_SAFETY;
}

/** Explicit line breaks are shared by SVG and PPTX. Never shrink or truncate. */
export function layoutText(text: string, width: number, fontSize: number, bold: boolean): { lines: string[]; height: number; lineHeight: number } {
  if (![width, fontSize].every((value) => Number.isFinite(value) && value > 0)) {
    fail("INVALID_TEXT_GEOMETRY", "text", "Text width and font size must be positive finite values.");
  }
  if (text.length > 7000) fail("EXCESS_TEXT", "text", "Shorten this text before rendering.");
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    const words = paragraph.trim().split(/[ \t\u00a0]+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = "";
    for (const word of words) {
      if (measureText(word, fontSize, bold) > width) {
        fail("WORD_TOO_WIDE", "text", `The word ${JSON.stringify(word.slice(0, 30))} cannot fit this text box. Shorten it or choose a wider composition.`);
      }
      const candidate = line ? `${line} ${word}` : word;
      if (line && measureText(candidate, fontSize, bold) > width) { lines.push(line); line = word; }
      else line = candidate;
    }
    lines.push(line);
  }
  return { lines, height: lines.length * fontSize * LINE_HEIGHT, lineHeight: fontSize * LINE_HEIGHT };
}
