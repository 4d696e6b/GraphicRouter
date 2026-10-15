import PptxGenJS from "pptxgenjs";
import { z } from "zod";
import {
  canvasElementSchema, canvasSizeSchema, canvasThemeSchema, createCanvasSchema,
  deckVersionSchema, editCanvasSchema, previewStages,
} from "../contracts";
import type { Asset, CanvasBlueprint, CanvasElement, CanvasEngine, ValidationIssue } from "../contracts";
import { assertNoErrors, EngineError, fail } from "./errors";
import { assetRegistry, containImage, imageDataUri, requireAsset } from "./image";
import { contrastRatio, resolvePaint } from "./paint";
import { escapeXml } from "./svg";
import { layoutText } from "./text";
import { parseInput } from "./validation";

const MAX_ELEMENTS = 200;
const MAX_VERSIONS = 100;
const phaseSchema = z.enum(["blank", "structure", "content", "polish", "revision"]);
const issueSchema = z.object({ severity: z.enum(["error", "warning"]), code: z.string().min(1).max(100), path: z.string().max(500), message: z.string().max(2000) }).strict();
const blueprintSchema = deckVersionSchema.extend({
  schemaVersion: z.literal(2), kind: z.literal("canvas"),
  title: createCanvasSchema.shape.title, brief: createCanvasSchema.shape.brief,
  canvas: canvasSizeSchema, theme: canvasThemeSchema, designIntent: createCanvasSchema.shape.designIntent,
  elements: z.array(canvasElementSchema).max(MAX_ELEMENTS),
  changes: z.array(z.object({ operation: z.enum(["add_element", "replace_element", "remove_element"]), target: z.string().min(1).max(120), description: z.string().min(1).max(500) }).strict()).max(40),
  construction: z.array(z.object({ version: z.number().int().positive().max(MAX_VERSIONS), phase: phaseSchema, summary: z.string().min(1).max(500), elementCount: z.number().int().min(0).max(MAX_ELEMENTS) }).strict()).min(1).max(MAX_VERSIONS),
  validationIssues: z.array(issueSchema).max(1000),
}).strict();

const intersects = (a: CanvasElement, b: CanvasElement) => a.x < b.x + b.width - 0.01 && a.x + a.width > b.x + 0.01 && a.y < b.y + b.height - 0.01 && a.y + a.height > b.y + 0.01;
const contains = (outer: CanvasElement, inner: CanvasElement) => outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.width >= inner.x + inner.width && outer.y + outer.height >= inner.y + inner.height;
const xmlControl = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/u;
const n = (value: number) => Number(value.toFixed(3));
const inches = (pixels: number) => pixels / 120;
const points = (pixels: number) => pixels * 72 / 120;

function validate(blueprint: CanvasBlueprint): ValidationIssue[] {
  const result = blueprintSchema.safeParse(blueprint);
  if (!result.success) return result.error.issues.map((issue) => ({ severity: "error", code: "INVALID_BLUEPRINT", path: issue.path.join("."), message: issue.message }));
  const b = result.data;
  const issues: ValidationIssue[] = [];
  const issue = (code: string, path: string, message: string, severity: "error" | "warning" = "error") => {
    if (severity === "warning" && issues.length >= 1000) return;
    issues.push({ severity, code, path, message });
  };
  if (!Number.isSafeInteger(b.version) || b.version > MAX_VERSIONS) issue("VERSION_LIMIT", "version", "Canvas versions must be between 1 and 100. Duplicate the canvas to continue after version 100.");
  if (b.construction.length !== b.version || b.construction.some((step, index) => step.version !== index + 1 || (index === 0 ? step.phase !== "blank" || step.elementCount !== 0 : step.phase === "blank"))) {
    issue("INVALID_CONSTRUCTION", "construction", "Keep one ordered construction entry per version, starting with the empty blank canvas.");
  }
  if (b.construction.at(-1)?.elementCount !== b.elements.length) issue("INVALID_CONSTRUCTION", "construction", "The latest construction entry must match the current element count.");
  if (b.version === 1 && (b.elements.length || b.changes.length)) issue("INVALID_CONSTRUCTION", "elements", "The first version must be a blank canvas. Add elements through an edit.");
  for (const [path, value] of [["title", b.title], ["brief.purpose", b.brief.purpose], ["designIntent", b.designIntent], ...b.construction.map((step, index) => [`construction.${index}.summary`, step.summary])] as [string, string][]) if (xmlControl.test(value)) issue("UNSUPPORTED_CHARACTER", path, "Remove XML control characters before exporting this canvas.");

  const ids = new Set<string>(), layers = new Set<number>();
  const ordered = [...b.elements].sort((a, c) => a.zIndex - c.zIndex);
  for (const element of ordered) {
    const path = element.id;
    if (ids.has(element.id)) issue("DUPLICATE_ID", path, "Each canvas element needs a unique stable ID.");
    if (layers.has(element.zIndex)) issue("DUPLICATE_LAYER", path, "Each element needs a unique layer index; larger indexes appear on top.");
    ids.add(element.id); layers.add(element.zIndex);
    if (element.x + element.width > b.canvas.width + 0.001 || element.y + element.height > b.canvas.height + 0.001) issue("OUT_OF_BOUNDS", path, `Keep this element inside the ${b.canvas.width}×${b.canvas.height} canvas.`);
    if (element.type === "line" ? element.width === 0 && element.height === 0 : element.width <= 0 || element.height <= 0) issue("EMPTY_GEOMETRY", path, "Provide a visible positive size for this element.");
    if (element.type === "image" && xmlControl.test(element.alt)) issue("UNSUPPORTED_CHARACTER", path, "Remove XML control characters from the image description.");
    if (element.type !== "text") continue;
    try {
      if (!element.text.trim()) issue("EMPTY_TEXT", path, "Give this text element visible content, or remove the element.");
      const layout = layoutText(element.text, element.width, element.fontSize, element.bold);
      if (layout.height > element.height + 0.01) issue("TEXT_OVERFLOW", path, `Text needs ${Math.ceil(layout.height)}px but this box has ${element.height}px. Shorten the text or enlarge its box; no text was shrunk or discarded.`);
      const panel = ordered.filter((candidate) => candidate.type === "shape" && candidate.zIndex < element.zIndex && contains(candidate, element)).at(-1);
      const background = panel?.type === "shape" ? resolvePaint(panel.fill, b.theme) : b.theme.background;
      if (contrastRatio(resolvePaint(element.color, b.theme), background) < (element.fontSize >= 30 || (element.bold && element.fontSize >= 24) ? 3 : 4.5)) issue("LOW_CONTRAST", path, "Increase the contrast between this text and its background for readability.", "warning");
    } catch (error) {
      if (error instanceof EngineError) error.issues.forEach((item) => issues.push({ ...item, path }));
      else throw error;
    }
  }
  const texts = ordered.filter((element) => element.type === "text");
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    if (a.text.replace(/\s+/g, " ").trim() === b.text.replace(/\s+/g, " ").trim() && (["x", "y", "width", "height"] as const).every(key => Math.abs(a[key] - b[key]) < 1)) issue("DUPLICATE_TEXT_LAYER", a.id, `Duplicate text overlays ${b.id}. Remove the obsolete copy before saving or exporting.`);
    if (intersects(texts[i], texts[j])) issue("TEXT_OVERLAP", texts[i].id, `This text box overlaps ${texts[j].id}. Check that the overlap is intentional.`, "warning");
  }
  return issues;
}

function checked(blueprint: CanvasBlueprint): CanvasBlueprint {
  const issues = validate(blueprint);
  assertNoErrors(issues);
  return { ...blueprint, validationIssues: issues };
}

function registryFor(blueprint: CanvasBlueprint, assets: Asset[]) {
  const registry = assetRegistry(assets);
  for (const element of blueprint.elements) if (element.type === "image") requireAsset(registry, element.assetId);
  return registry;
}

export const canvasEngine: CanvasEngine = {
  create(input, identity) {
    const parsed = parseInput(createCanvasSchema, input);
    const { deckId, version } = parseInput(deckVersionSchema, identity, "identity");
    if (version !== 1) fail("INVALID_VERSION", "identity.version", "Create the blank canvas at version 1, then add elements through edits.");
    return checked({
      schemaVersion: 2, kind: "canvas", deckId, version, ...parsed,
      elements: [], changes: [], construction: [{ version, phase: "blank", summary: "Created the blank canvas and visual direction.", elementCount: 0 }], validationIssues: [],
    });
  },

  edit(current, input) {
    assertNoErrors(validate(current));
    const parsed = parseInput(editCanvasSchema, input);
    if (parsed.deckId !== current.deckId) fail("IDENTITY_MISMATCH", "deckId", "This edit belongs to a different canvas. Fetch the intended canvas before editing.");
    if (parsed.baseVersion !== current.version) fail("STALE_VERSION", "baseVersion", `This canvas is at version ${current.version}. Fetch its latest version before editing; the stored version is unchanged.`);
    if (current.version >= MAX_VERSIONS) fail("VERSION_LIMIT", "version", "This canvas has reached 100 versions. Duplicate it to continue; the stored canvas is unchanged.");
    const next = structuredClone(current);
    next.version++;
    next.changes = [];
    for (const operation of parsed.operations) {
      if (operation.type === "add_element") {
        if (next.elements.some((element) => element.id === operation.element.id)) fail("DUPLICATE_ID", operation.element.id, "This element ID already exists. Replace that element, or use a new stable ID.");
        if (next.elements.length >= MAX_ELEMENTS) fail("ELEMENT_LIMIT", "elements", "Use at most 200 elements on a canvas. Remove an element before adding another.");
        next.elements.push(structuredClone(operation.element));
        next.changes.push({ operation: operation.type, target: operation.element.id, description: `Added ${operation.element.type} element ${operation.element.id}.` });
      } else {
        const index = next.elements.findIndex((element) => element.id === operation.elementId);
        if (index < 0) fail("UNKNOWN_TARGET", operation.elementId, "This canvas has no element with that ID. Fetch the canvas and use an existing element ID.");
        if (operation.type === "replace_element") {
          if (operation.element.id !== operation.elementId) fail("ID_CHANGE", operation.elementId, "Keep the same element ID when replacing it so unrelated references remain stable.");
          next.elements[index] = structuredClone(operation.element);
          next.changes.push({ operation: operation.type, target: operation.elementId, description: `Updated only element ${operation.elementId}.` });
        } else {
          next.elements.splice(index, 1);
          next.changes.push({ operation: operation.type, target: operation.elementId, description: `Removed element ${operation.elementId}.` });
        }
      }
    }
    next.construction.push({ version: next.version, phase: parsed.phase, summary: parsed.summary, elementCount: next.elements.length });
    return checked(next);
  },

  validate,

  render(blueprint, stage, assets, visibleCount) {
    assertNoErrors(validate(blueprint));
    if (!previewStages.includes(stage)) fail("INVALID_STAGE", "stage", "Choose layout, content, or finished.");
    if (visibleCount !== undefined && (!Number.isSafeInteger(visibleCount) || visibleCount < 0 || visibleCount > blueprint.elements.length)) fail("INVALID_VISIBLE_COUNT", "visibleCount", "Show an integer number of elements between zero and the canvas element count.");
    const registry = registryFor(blueprint, assets);
    const theme = blueprint.theme;
    const body = [...blueprint.elements].sort((a, b) => a.zIndex - b.zIndex).slice(0, visibleCount ?? blueprint.elements.length).map((element) => {
      const id = escapeXml(element.id), x = n(element.x), y = n(element.y), w = n(element.width), h = n(element.height);
      if (stage === "layout") {
        if (element.type === "line") return `<line data-element-id="${id}" x1="${x}" y1="${y}" x2="${n(element.x + element.width)}" y2="${n(element.y + element.height)}" stroke="#A5A1AE" stroke-width="1"/>`;
        return `<g data-element-id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#B4AFBF" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${n(element.x + 5)}" y="${n(element.y + 15)}" font-family="Arial" font-size="12" fill="#62606B">${id}</text></g>`;
      }
      if (element.type === "text") {
        const { lines, lineHeight } = layoutText(element.text, element.width, element.fontSize, element.bold);
        const anchor = element.align === "left" ? "start" : element.align === "center" ? "middle" : "end";
        const textX = n(element.x + (element.align === "center" ? element.width / 2 : element.align === "right" ? element.width : 0));
        return `<text data-element-id="${id}" font-family="Arial, Helvetica, sans-serif" font-size="${element.fontSize}" font-weight="${element.bold ? 700 : 400}" font-kerning="none" text-anchor="${anchor}" fill="${stage === "finished" ? resolvePaint(element.color, theme) : theme.foreground}" xml:space="preserve">${lines.map((line, index) => `<tspan x="${textX}" y="${n(element.y + element.fontSize * 0.94 + index * lineHeight)}">${escapeXml(line)}</tspan>`).join("")}</text>`;
      }
      if (element.type === "line") return `<line data-element-id="${id}" x1="${x}" y1="${y}" x2="${n(element.x + element.width)}" y2="${n(element.y + element.height)}" stroke="${stage === "finished" ? resolvePaint(element.color, theme) : "#B4AFBF"}" stroke-width="${element.thickness}"/>`;
      if (element.type === "shape") {
        const fill = stage === "finished" ? resolvePaint(element.fill, theme) : "#E5E3EB";
        return element.shape === "ellipse"
          ? `<ellipse data-element-id="${id}" cx="${n(element.x + element.width / 2)}" cy="${n(element.y + element.height / 2)}" rx="${n(element.width / 2)}" ry="${n(element.height / 2)}" fill="${fill}"/>`
          : `<rect data-element-id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
      }
      if (stage === "content") return `<g data-element-id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#E5E3EB"/><text x="${n(element.x + 12)}" y="${n(element.y + 24)}" font-family="Arial" font-size="14" fill="#62606B">IMAGE</text></g>`;
      const { asset } = requireAsset(registry, element.assetId);
      return `<image data-element-id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="${imageDataUri(asset)}"><title>${escapeXml(element.alt)}</title></image>`;
    }).join("");
    const { width, height } = blueprint.canvas;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(`${blueprint.title} — ${stage}`)}"><title>${escapeXml(blueprint.title)}</title><rect width="${width}" height="${height}" fill="${theme.background}"/>${body}</svg>`;
  },

  async compile(blueprint, assets) { return compileCanvasPages([{ blueprint }], assets); },
};

/** Same object renderer/exporter for single canvases and bounded page documents. */
export async function compileCanvasPages(pages: { blueprint: CanvasBlueprint; notes?: string }[], assets: Asset[]): Promise<Uint8Array> {
  if (!pages.length || pages.length > 40) fail("PAGE_LIMIT", "pages", "Export between 1 and 40 pages.");
    for (const page of pages) { assertNoErrors(validate(page.blueprint)); registryFor(page.blueprint, assets); }
    const blueprint = pages[0].blueprint;
    try {
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "GRAPHICROUTER_CANVAS", width: inches(blueprint.canvas.width), height: inches(blueprint.canvas.height) });
      pptx.layout = "GRAPHICROUTER_CANVAS";
      pptx.author = "GraphicRouter";
      pptx.company = "GraphicRouter";
      pptx.title = `${blueprint.title} — v${blueprint.version}`;
      pptx.subject = blueprint.brief.purpose;
      pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };
      for (const page of pages) {
      const blueprint = page.blueprint, registry = registryFor(blueprint, assets);
      if (blueprint.canvas.width !== pages[0].blueprint.canvas.width || blueprint.canvas.height !== pages[0].blueprint.canvas.height) fail("MIXED_PAGE_SIZE", "pages", "All pages in one PowerPoint must share dimensions.");
      const slide = pptx.addSlide();
      slide.background = { color: blueprint.theme.background.slice(1) };
      slide.addNotes(page.notes ?? `Design direction: ${blueprint.designIntent}\n${blueprint.construction.at(-1)!.summary}`);
      for (const element of [...blueprint.elements].sort((a, b) => a.zIndex - b.zIndex)) {
        const position = { x: inches(element.x), y: inches(element.y), w: inches(element.width), h: inches(element.height), objectName: element.id };
        if (element.type === "text") {
          const { lines, lineHeight } = layoutText(element.text, element.width, element.fontSize, element.bold);
          slide.addText(lines.join("\n"), { ...position, fontFace: "Arial", fontSize: points(element.fontSize), bold: element.bold, color: resolvePaint(element.color, blueprint.theme).slice(1), align: element.align, valign: "top", margin: 0, paraSpaceAfter: 0, paraSpaceBefore: 0, lineSpacing: points(lineHeight), fit: "none", wrap: false, isTextBox: true, charSpacing: 0, lang: "en-US" });
        } else if (element.type === "shape") {
          slide.addShape(element.shape === "ellipse" ? pptx.ShapeType.ellipse : pptx.ShapeType.rect, { ...position, fill: { color: resolvePaint(element.fill, blueprint.theme).slice(1) }, line: { transparency: 100 } });
        } else if (element.type === "line") {
          slide.addShape(pptx.ShapeType.line, { ...position, line: { color: resolvePaint(element.color, blueprint.theme).slice(1), width: points(element.thickness), beginArrowType: "none", endArrowType: "none" } });
        } else {
          const image = requireAsset(registry, element.assetId), box = containImage(element, image);
          slide.addImage({ ...position, x: inches(box.x), y: inches(box.y), w: inches(box.width), h: inches(box.height), data: imageDataUri(image.asset), altText: element.alt });
        }
      }
      }
      const bytes = await pptx.write({ outputType: "uint8array", compression: true });
      if (!(bytes instanceof Uint8Array)) throw new Error("The PPTX writer returned an unsupported output type.");
      return bytes;
    } catch (error) {
      if (error instanceof EngineError) throw error;
      throw new EngineError("The PowerPoint writer could not finish this canvas export. The stored blueprint is unchanged.", [], "EXPORT_FAILED");
    }
}
