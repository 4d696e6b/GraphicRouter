import type { DeckBlueprint, Paint, RevisionOperation, SlideElement } from "../contracts";
import { createDeckSchema } from "../contracts";
import { fail } from "./errors";
import { composeSlide } from "./layouts";
import { checked, parseInput, parseOperations, validateBlueprint } from "./validation";
import { assertNoErrors } from "./errors";

function getPaint(element: SlideElement): Paint | undefined {
  return element.type === "shape" ? element.fill : element.type === "image" ? undefined : element.color;
}

function setPaint(element: SlideElement, paint: Paint) {
  if (element.type === "image") fail("UNSUPPORTED_TARGET", element.id, "Image pixels cannot be recoloured. Choose a text, shape, or line element.");
  if (element.type === "shape") element.fill = structuredClone(paint);
  else element.color = structuredClone(paint);
}

export function reviseBlueprint(current: DeckBlueprint, operations: RevisionOperation[]): DeckBlueprint {
  assertNoErrors(validateBlueprint(current));
  const parsed = parseOperations(operations);
  const next = structuredClone(current);
  next.version++;
  next.changes = [];
  const findSlide = (id: string) => {
    const slide = next.slides.find((s) => s.id === id);
    if (!slide) fail("UNKNOWN_TARGET", id, `No slide named ${id}. The prior version is unchanged.`);
    return slide;
  };
  const findElement = (id: string) => {
    const slide = next.slides.find((s) => s.elements.some((e) => e.id === id));
    if (!slide) fail("UNKNOWN_TARGET", id, `No element named ${id}. The prior version is unchanged.`);
    return { slide, element: slide.elements.find((e) => e.id === id)! };
  };
  for (const operation of parsed) {
    if (operation.type === "replace_text") {
      const { element, slide } = findElement(operation.elementId);
      if (element.type !== "text") fail("UNSUPPORTED_TARGET", element.id, "Only text elements accept replacement copy.");
      const input = next.input.slides.find((s) => s.id === slide.id)!;
      const part = element.id.slice(slide.id.length + 1);
      if (part === "headline") input.headline = operation.text;
      else if (part === "takeaway") { input.takeaway = operation.text; slide.takeaway = operation.text; }
      else {
        const match = /^block([1-3])\.(heading|body)$/.exec(part);
        if (!match || !input.blocks[Number(match[1]) - 1]) fail("UNSUPPORTED_TARGET", element.id, "Only headline, takeaway, and block copy are editable. Structural labels stay fixed.");
        input.blocks[Number(match[1]) - 1][match[2] as "heading" | "body"] = operation.text;
      }
      element.text = operation.text;
      next.changes.push({ operation: operation.type, target: element.id, description: `Replaced text in ${element.id}.` });
    } else if (operation.type === "set_element_color") {
      const { element } = findElement(operation.elementId);
      setPaint(element, { hex: operation.color });
      next.changes.push({ operation: operation.type, target: element.id, description: `Changed only ${element.id} to ${operation.color}.` });
    } else if (operation.type === "update_notes") {
      const slide = findSlide(operation.slideId);
      slide.notes = structuredClone(operation.notes);
      next.input.slides.find((s) => s.id === slide.id)!.notes = structuredClone(operation.notes);
      next.changes.push({ operation: operation.type, target: slide.id, description: `Updated core and expanded speaker notes for ${slide.id}.` });
    } else if (operation.type === "set_deck_accent") {
      next.input.accent = operation.color;
      next.theme.accent = operation.color;
      next.changes.push({ operation: operation.type, target: "theme.accent", description: `Changed the shared accent to ${operation.color}; explicit element colours and supplied images remain unchanged.` });
    } else {
      const slide = findSlide(operation.slideId), index = next.slides.indexOf(slide);
      const input = next.input.slides[index];
      const baseline = composeSlide(input, index);
      input.layout = operation.layout;
      const replacement = composeSlide(input, index);
      for (const old of slide.elements) {
        const original = baseline.elements.find((e) => e.id === old.id);
        const oldPaint = getPaint(old), defaultPaint = original && getPaint(original);
        if (oldPaint && JSON.stringify(oldPaint) !== JSON.stringify(defaultPaint)) {
          const target = replacement.elements.find((e) => e.id === old.id);
          if (!target || target.type === "image") fail("OVERRIDE_WOULD_BE_LOST", old.id, `This layout cannot preserve the colour override on ${old.id}. Choose a compatible layout; the prior version is unchanged.`);
          setPaint(target, oldPaint);
        }
      }
      next.slides[index] = replacement;
      next.changes.push({ operation: operation.type, target: slide.id, description: `Switched ${slide.id} to ${operation.layout}, preserving its copy, notes, image, and compatible colour overrides.` });
    }
  }
  next.input = parseInput(createDeckSchema, next.input);
  return checked(next);
}
