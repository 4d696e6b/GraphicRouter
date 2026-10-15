import type { Asset, PreviewStage, SlideBlueprint, Theme } from "../contracts";
import { previewStages } from "../contracts";
import { fail } from "./errors";
import { assetRegistry, imageDataUri, requireAsset } from "./image";
import { resolvePaint } from "./paint";
import { layoutText } from "./text";
import { assertRenderable } from "./validation";

export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
const n = (value: number) => Number(value.toFixed(3));

export function renderSlideSvg(slide: SlideBlueprint, theme: Theme, stage: PreviewStage, assets: Asset[]): string {
  if (!previewStages.includes(stage)) fail("INVALID_STAGE", "stage", "Choose layout, content, or finished.");
  assertRenderable(slide, theme);
  const registry = assetRegistry(assets);
  const body = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex).map((element) => {
    const id = escapeXml(element.id), x = n(element.x), y = n(element.y), w = n(element.width), h = n(element.height);
    if (stage === "layout") {
      if (element.type === "line") return `<line data-element-id="${id}" x1="${x}" y1="${y}" x2="${n(element.x + element.width)}" y2="${n(element.y + element.height)}" stroke="#A5A1AE" stroke-width="1"/>`;
      return `<g data-element-id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#B4AFBF" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${x + 5}" y="${y + 15}" font-family="Arial" font-size="12" fill="#62606B">${escapeXml(element.id.slice(0, 55))}</text></g>`;
    }
    if (element.type === "text") {
      const { lines, lineHeight } = layoutText(element.text, element.width, element.fontSize, element.bold);
      const anchor = element.align === "left" ? "start" : element.align === "center" ? "middle" : "end";
      const textX = n(element.x + (element.align === "center" ? element.width / 2 : element.align === "right" ? element.width : 0));
      return `<text data-element-id="${id}" font-family="Arial, Helvetica, sans-serif" font-size="${element.fontSize}" font-weight="${element.bold ? 700 : 400}" font-kerning="none" text-anchor="${anchor}" fill="${stage === "finished" ? resolvePaint(element.color, theme) : theme.foreground}" xml:space="preserve">${lines.map((line, index) => `<tspan x="${textX}" y="${n(element.y + element.fontSize * 0.94 + index * lineHeight)}">${escapeXml(line)}</tspan>`).join("")}</text>`;
    }
    if (element.type === "line") return `<line data-element-id="${id}" x1="${x}" y1="${y}" x2="${n(element.x + element.width)}" y2="${n(element.y + element.height)}" stroke="${stage === "finished" ? resolvePaint(element.color, theme) : "#B4AFBF"}" stroke-width="${element.thickness}"/>`;
    if (element.type === "shape") {
      const fill = stage === "finished" ? resolvePaint(element.fill, theme) : "hex" in element.fill && element.fill.hex.toUpperCase() === "#FFFFFF" ? "#FFFFFF" : "#E5E3EB";
      return element.shape === "ellipse"
        ? `<ellipse data-element-id="${id}" cx="${n(element.x + element.width / 2)}" cy="${n(element.y + element.height / 2)}" rx="${w / 2}" ry="${h / 2}" fill="${fill}"/>`
        : `<rect data-element-id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
    }
    if (stage === "content") return `<g data-element-id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#E5E3EB"/><text x="${x + 12}" y="${y + 24}" font-family="Arial" font-size="14" fill="#62606B">IMAGE</text></g>`;
    const { asset } = requireAsset(registry, element.assetId);
    return `<image data-element-id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="${imageDataUri(asset)}"><title>${escapeXml(element.alt)}</title></image>`;
  }).join("");
  const headline = slide.elements.find((e) => e.id === `${slide.id}.headline`);
  const label = headline?.type === "text" ? headline.text : slide.id;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title"><title id="title">${escapeXml(`${label} — ${stage}`)}</title><rect width="1600" height="900" fill="${theme.background}"/>${body}</svg>`;
}
