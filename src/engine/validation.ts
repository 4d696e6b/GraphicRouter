import { z } from "zod";
import { createDeckSchema, deckVersionSchema, hexColorSchema, layouts, revisionOperationSchema, slideIdSchema, slideRoles } from "../contracts";
import type { DeckBlueprint, SlideElement, ValidationIssue } from "../contracts";
import { EngineError, assertNoErrors } from "./errors";
import { contrastRatio, resolvePaint } from "./paint";
import { layoutText } from "./text";

const paint = z.union([z.object({ token: z.enum(["background", "foreground", "muted", "accent"]) }).strict(), z.object({ hex: hexColorSchema }).strict()]);
const geometry = {
  id: z.string().min(1).max(150), x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(),
  width: z.number().finite().nonnegative(), height: z.number().finite().nonnegative(), zIndex: z.number().int().nonnegative(),
};
const elementSchema = z.discriminatedUnion("type", [
  z.object({ ...geometry, type: z.literal("text"), text: z.string().min(1).max(7000), fontFamily: z.literal("Arial"), fontSize: z.number().finite().min(1).max(160), bold: z.boolean(), color: paint, align: z.enum(["left", "center", "right"]) }).strict(),
  z.object({ ...geometry, type: z.literal("shape"), shape: z.enum(["rectangle", "ellipse"]), fill: paint }).strict(),
  z.object({ ...geometry, type: z.literal("line"), color: paint, thickness: z.number().finite().positive().max(40) }).strict(),
  z.object({ ...geometry, type: z.literal("image"), assetId: z.string().min(1).max(100), alt: z.string().max(1000) }).strict(),
]);
const themeSchema = z.object({ background: hexColorSchema, foreground: hexColorSchema, muted: hexColorSchema, accent: hexColorSchema }).strict();
const slideBlueprintSchema = z.object({
  id: slideIdSchema, role: z.enum(slideRoles), layout: z.enum(layouts), takeaway: z.string().min(1).max(240),
  notes: z.object({ core: z.string().max(4000), expanded: z.string().max(7000) }).strict(), elements: z.array(elementSchema).min(1).max(200),
}).strict();
const blueprintSchema = deckVersionSchema.extend({
  schemaVersion: z.literal(1), input: createDeckSchema,
  canvas: z.object({ width: z.literal(1600), height: z.literal(900) }).strict(),
  theme: themeSchema,
  slides: z.array(slideBlueprintSchema).length(5),
  changes: z.array(z.object({ operation: z.enum(["replace_text", "update_notes", "set_element_color", "set_deck_accent", "set_slide_layout"]), target: z.string(), description: z.string() }).strict()).max(20),
  validationIssues: z.array(z.object({ severity: z.enum(["error", "warning"]), code: z.string(), path: z.string(), message: z.string() }).strict()).max(1000),
});

export function parseInput<T>(schema: z.ZodType<T>, value: unknown, prefix = "input"): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({ severity: "error", code: "INVALID_INPUT", path: [prefix, ...issue.path].filter(Boolean).join("."), message: issue.message }));
  throw new EngineError(`${issues[0].path}: ${issues[0].message}`, issues);
}

export const parseOperations = (value: unknown) => parseInput(z.array(revisionOperationSchema).min(1).max(20), value, "operations");

export function assertRenderable(slide: DeckBlueprint["slides"][number], theme: DeckBlueprint["theme"]): void {
  parseInput(z.object({ slide: slideBlueprintSchema, theme: themeSchema }), { slide, theme }, "preview");
  const ids = new Set<string>(), layers = new Set<number>();
  for (const element of slide.elements) {
    const errors: ValidationIssue[] = [];
    const add = (code: string, message: string) => errors.push({ severity: "error", code, path: element.id, message });
    if (ids.has(element.id) || layers.has(element.zIndex)) add("DUPLICATE_ELEMENT", "Element IDs and layer indexes must be unique.");
    ids.add(element.id); layers.add(element.zIndex);
    if (element.x + element.width > 1600.001 || element.y + element.height > 900.001) add("OUT_OF_BOUNDS", "The element extends beyond the slide.");
    if (element.type === "line" ? element.width === 0 && element.height === 0 : element.width <= 0 || element.height <= 0) add("EMPTY_GEOMETRY", "This element must have a visible positive size.");
    if (element.type === "text" && layoutText(element.text, element.width, element.fontSize, element.bold).height > element.height + 0.01) add("TEXT_OVERFLOW", "Shorten the copy or use a wider layout; this text does not fit.");
    assertNoErrors(errors);
  }
}

const intersects = (a: SlideElement, b: SlideElement) => a.x < b.x + b.width - 0.01 && a.x + a.width > b.x + 0.01 && a.y < b.y + b.height - 0.01 && a.y + a.height > b.y + 0.01;

export function validateBlueprint(blueprint: DeckBlueprint): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  function issue(code: string, path: string, message: string, severity: "error" | "warning" = "error") { issues.push({ code, path, message, severity }); }
  const result = blueprintSchema.safeParse(blueprint);
  if (!result.success) return result.error.issues.map((item) => ({ severity: "error", code: "INVALID_BLUEPRINT", path: item.path.join("."), message: item.message }));
  const b = result.data;
  if (!Number.isSafeInteger(b.version)) issue("INVALID_VERSION", "version", "Version must be a safe positive integer.");
  if (b.theme.accent !== b.input.accent) issue("SOURCE_MISMATCH", "theme.accent", "The theme and source accent must agree.");
  const ids = new Set<string>();
  for (const [index, slide] of b.slides.entries()) {
    const input = b.input.slides[index], path = `slides.${index}`;
    if (slide.id !== input.id || slide.role !== input.role || slide.layout !== input.layout || slide.takeaway !== input.takeaway || slide.notes.core !== input.notes.core || slide.notes.expanded !== input.notes.expanded) {
      issue("SOURCE_MISMATCH", path, "Slide metadata must agree with its stored input.");
    }
    const expected: Record<string, string> = { [`${input.id}.headline`]: input.headline, [`${input.id}.takeaway`]: input.takeaway };
    input.blocks.forEach((block, i) => { expected[`${input.id}.block${i + 1}.heading`] = block.heading; expected[`${input.id}.block${i + 1}.body`] = block.body; });
    for (const [id, text] of Object.entries(expected)) {
      const element = slide.elements.find((e) => e.id === id);
      if (!element || element.type !== "text" || element.text !== text) issue("SOURCE_MISMATCH", id, "A source text field is missing or differs from its element. No content may be dropped.");
    }
    if (input.assetId && !slide.elements.some((e) => e.type === "image" && e.id === `${slide.id}.image` && e.assetId === input.assetId)) issue("SOURCE_MISMATCH", `${slide.id}.image`, "The source image must remain present.");
    const layers = new Set<number>();
    for (const element of slide.elements) {
      const ep = element.id;
      if (ids.has(ep)) issue("DUPLICATE_ID", ep, "Element IDs must be unique across the deck.");
      ids.add(ep);
      if (!ep.startsWith(`${slide.id}.`)) issue("INVALID_ID", ep, "Use the owning slide's semantic ID prefix.");
      if (layers.has(element.zIndex)) issue("DUPLICATE_LAYER", ep, "Layer indexes must be unique within a slide.");
      layers.add(element.zIndex);
      if (element.x + element.width > 1600.001 || element.y + element.height > 900.001) issue("OUT_OF_BOUNDS", ep, "This element extends beyond the 1600×900 slide.");
      if (element.type === "line" ? element.width === 0 && element.height === 0 : element.width <= 0 || element.height <= 0) issue("EMPTY_GEOMETRY", ep, "This element must have a visible positive size.");
      if (element.type === "text") {
        try {
          const layout = layoutText(element.text, element.width, element.fontSize, element.bold);
          if (layout.height > element.height + 0.01) issue("TEXT_OVERFLOW", ep, `Text needs ${Math.ceil(layout.height)}px but this box has ${element.height}px. Shorten the copy or switch composition; it was not shrunk.`);
          let background = b.theme.background;
          const panels = slide.elements.filter((e) => e.type === "shape" && e.shape === "rectangle" && e.zIndex < element.zIndex && e.x <= element.x && e.y <= element.y && e.x + e.width >= element.x + element.width && e.y + e.height >= element.y + element.height).sort((a, c) => a.zIndex - c.zIndex);
          const panel = panels.at(-1);
          if (panel?.type === "shape") background = resolvePaint(panel.fill, b.theme);
          // Process step numbers sit inside an accent ellipse, not the slide background.
          const marker = slide.elements.find((e) => e.type === "shape" && e.shape === "ellipse" && e.zIndex < element.zIndex && e.x <= element.x && e.y <= element.y && e.x + e.width >= element.x + element.width && e.y + e.height >= element.y + element.height);
          if (marker?.type === "shape") background = resolvePaint(marker.fill, b.theme);
          if (contrastRatio(resolvePaint(element.color, b.theme), background) < (element.fontSize >= 30 || (element.bold && element.fontSize >= 24) ? 3 : 4.5)) issue("LOW_CONTRAST", ep, "This text colour may be difficult to read against its background.", "warning");
        } catch (error) {
          if (error instanceof EngineError) error.issues.forEach((e) => issues.push({ ...e, path: ep }));
          else throw error;
        }
      }
    }
    const content = slide.elements.filter((e) => e.type === "text" || e.type === "image");
    for (let i = 0; i < content.length; i++) for (let j = i + 1; j < content.length; j++) {
      if (intersects(content[i], content[j])) issue("CONTENT_OVERLAP", content[i].id, `This content box overlaps ${content[j].id}.`);
    }
  }
  return issues;
}

export function checked(blueprint: DeckBlueprint): DeckBlueprint {
  const issues = validateBlueprint(blueprint);
  assertNoErrors(issues);
  return { ...blueprint, validationIssues: issues };
}
