import { z } from "zod";
import { canvasElementSchema, hexColorSchema } from "../contracts";
import type { CanvasElement } from "../contracts";
import { fail } from "./errors";
import { layoutText } from "./text";
import { parseInput } from "./validation";

const common = {
  idPrefix: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/),
  x: z.number().finite().min(0).max(4000), y: z.number().finite().min(0).max(4000),
  width: z.number().finite().min(32).max(4000), height: z.number().finite().min(32).max(4000),
  startZIndex: z.number().int().min(0).max(9961),
  foreground: hexColorSchema, accent: hexColorSchema, muted: hexColorSchema,
};
const datum = z.object({ label: z.string().trim().min(1).max(24), value: z.number().finite().min(-1e12).max(1e12) }).strict();
const chart = { units: z.string().trim().min(1).max(24) };

/** Inputs describe native objects only; no supplied SVG, remote assets or generated copy. */
export const componentInputSchema = z.discriminatedUnion("kind", [
  z.object({ ...common, ...chart, kind: z.literal("bar_chart"), data: z.array(datum.extend({ value: z.number().finite().min(0).max(1e12) })).min(1).max(8) }).strict(),
  z.object({ ...common, ...chart, kind: z.literal("line_chart"), data: z.array(datum).min(2).max(12) }).strict(),
  z.object({ ...common, kind: z.literal("icon"), name: z.enum(["check", "arrow-right", "target", "clock", "person", "document", "steps"]) }).strict(),
]);
export type ComponentInput = z.infer<typeof componentInputSchema>;

/** Pure composition. Call edit_canvas with the returned native add_element operations. */
export function composeComponent(raw: unknown): { elements: CanvasElement[]; notes: string[] } {
  const input = parseInput(componentInputSchema, raw, "component");
  if (input.x + input.width > 4000 || input.y + input.height > 4000) fail("COMPONENT_BOUNDS", "component", "Keep the component inside the supported 4000 × 4000 logical-pixel area and inside its destination canvas.");
  const elements: CanvasElement[] = [], notes: string[] = [];
  const geometry = (name: string, x: number, y: number, width: number, height: number) => ({ id: `${input.idPrefix}.${name}`, x, y, width, height, zIndex: input.startZIndex + elements.length });
  const text = (name: string, copy: string, x: number, y: number, width: number, height: number, align: "left" | "center" | "right" = "left", bold = false) => {
    const fontSize = 18;
    if (layoutText(copy, width, fontSize, bold).height > height) fail("COMPONENT_TEXT_OVERFLOW", name, "This label does not fit. Enlarge the component or explicitly shorten its supplied label; no copy was removed or shrunk.");
    elements.push({ ...geometry(name, x, y, width, height), type: "text", text: copy, fontFamily: "Arial", fontSize, bold, color: { hex: input.foreground }, align });
  };
  const shape = (name: string, kind: "rectangle" | "ellipse", x: number, y: number, width: number, height: number, color = input.accent) => {
    elements.push({ ...geometry(name, x, y, width, height), type: "shape", shape: kind, fill: { hex: color } });
  };
  // The canvas contract supports only positive line extents. Orthogonal segments
  // deliberately avoid pretending that descending diagonal interpolation exists.
  const line = (name: string, x1: number, y1: number, x2: number, y2: number, color = input.muted, thickness = 2) => {
    if (x1 === x2 && y1 === y2) return;
    if (x1 !== x2 && y1 !== y2 && (x1 > x2 || y1 > y2)) fail("UNSUPPORTED_COMPONENT_LINE", name, "Use orthogonal or descending-screen-coordinate segments supported by the native canvas.");
    elements.push({ ...geometry(name, Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)), type: "line", thickness, color: { hex: color } });
  };

  if (input.kind === "bar_chart") {
    if (input.width < 480 || input.height < 80 + input.data.length * 32) fail("COMPONENT_TOO_SMALL", "component", "A bar chart needs at least 480px width and 80px plus 32px per data row in height.");
    const max = Math.max(...input.data.map(item => item.value)), scaleMax = max || 1;
    const plotX = input.x + input.width * 0.30, plotWidth = input.width * 0.47;
    const top = input.y + 36, bottom = input.y + input.height - 36, rowHeight = (bottom - top) / input.data.length;
    text("units", `Units: ${input.units}`, input.x, input.y, input.width, 24, "left", true);
    line("zero-baseline", plotX, top, plotX, bottom);
    text("axis-zero", "0", plotX, bottom + 10, 40, 24);
    text("axis-maximum", String(scaleMax), plotX + plotWidth - 145, bottom + 10, 145, 24, "right");
    input.data.forEach((item, index) => {
      const y = top + index * rowHeight;
      text(`label-${index + 1}`, item.label, input.x, y + (rowHeight - 24) / 2, input.width * 0.26, 24);
      if (item.value !== 0) {
        const barWidth = item.value / scaleMax * plotWidth;
        if (barWidth <= 0) fail("CHART_PRECISION", `data.${index}.value`, "These values exceed the numerical range of one proportional chart. Split the comparison or explicitly choose another scale; no minimum-width bar was substituted.");
        shape(`bar-${index + 1}`, "rectangle", plotX, y + rowHeight * 0.22, barWidth, rowHeight * 0.56);
        if (barWidth < 1) notes.push(`Bar ${index + 1} is below one logical pixel on the common scale. Its exact supplied value remains native text; enlarge or split the chart for visual comparison.`);
      }
      text(`value-${index + 1}`, String(item.value), input.x + input.width * 0.80, y + (rowHeight - 24) / 2, input.width * 0.20, 24, "right", true);
    });
    notes.push("Horizontal bars share one explicit zero baseline and one common scale. Values and labels are separate native text objects; zero values intentionally have no positive-width bar.");
    if (!max) notes.push("All supplied values are zero. The displayed 0–1 reference scale is a display convention, not an additional observed value.");
  } else if (input.kind === "line_chart") {
    if (input.width < 480 || input.height < 240) fail("COMPONENT_TOO_SMALL", "component", "A step-line chart needs at least 480 × 240px. More or longer labels may need a larger width.");
    const min = Math.min(0, ...input.data.map(item => item.value)), observedMax = Math.max(0, ...input.data.map(item => item.value));
    const max = min === observedMax ? 1 : observedMax;
    const left = input.x + 80, right = input.x + input.width - 60, top = input.y + 38, bottom = input.y + input.height - 58;
    const plotWidth = right - left, plotHeight = bottom - top;
    const valueY = (value: number) => top + (max - value) / (max - min) * plotHeight;
    const pointX = (index: number) => left + index / (input.data.length - 1) * plotWidth;
    text("scale", `Y-axis: ${min} to ${max} ${input.units}`, input.x, input.y, input.width, 24, "left", true);
    line("y-axis", left, top, left, bottom);
    line("zero-baseline", left, valueY(0), right, valueY(0));
    text("axis-zero", "0", input.x, valueY(0) - 12, 64, 24, "right");
    const labelWidth = Math.min(100, plotWidth / (input.data.length - 1) * 0.88);
    input.data.forEach((item, index) => {
      if (item.value !== 0 && valueY(item.value) === valueY(0)) fail("CHART_PRECISION", `data.${index}.value`, "These nonzero values collapse onto zero at this numerical scale. Split the chart or explicitly choose a suitable scale; no value was silently rounded to zero.");
      text(`label-${index + 1}`, `${item.label}\n${item.value}`, pointX(index) - labelWidth / 2, bottom + 12, labelWidth, 44, "center");
      if (index) {
        const previous = input.data[index - 1];
        line(`segment-${index}-horizontal`, pointX(index - 1), valueY(previous.value), pointX(index), valueY(previous.value), input.accent, 3);
        line(`segment-${index}-vertical`, pointX(index), valueY(previous.value), pointX(index), valueY(item.value), input.accent, 3);
      }
    });
    notes.push("This is an explicitly stepped line chart: horizontal then vertical connections reflect the native line primitive limit, with equally spaced categories. Do not describe the steps as measured intermediate values or continuous interpolation.", "The Y-axis includes zero; its exact range and units are native text. Read values at each labelled category's right-hand endpoint.");
    if (!min && !observedMax) notes.push("All supplied values are zero. The 0–1 Y-axis is a reference display scale only.");
  } else {
    const size = Math.min(input.width, input.height), ox = input.x + (input.width - size) / 2, oy = input.y + (input.height - size) / 2;
    const rect = (name: string, x: number, y: number, w: number, h: number, color = input.accent) => shape(name, "rectangle", ox + x * size, oy + y * size, w * size, h * size, color);
    const circle = (name: string, x: number, y: number, w: number, color = input.accent) => shape(name, "ellipse", ox + x * size, oy + y * size, w * size, w * size, color);
    const stroke = (name: string, x1: number, y1: number, x2: number, y2: number) => line(name, ox + x1 * size, oy + y1 * size, ox + x2 * size, oy + y2 * size, input.foreground, Math.min(40, size * 0.045));
    const dotted = (name: string, x1: number, y1: number, x2: number, y2: number, count: number) => {
      for (let index = 0; index <= count; index++) circle(`${name}-${index}`, x1 + (x2 - x1) * index / count - 0.035, y1 + (y2 - y1) * index / count - 0.035, 0.07, input.foreground);
    };
    if (input.name === "check") { dotted("short-stroke", 0.18, 0.52, 0.40, 0.74, 5); dotted("long-stroke", 0.40, 0.74, 0.84, 0.24, 11); }
    if (input.name === "arrow-right") { stroke("shaft", 0.12, 0.50, 0.83, 0.50); dotted("upper-head", 0.60, 0.24, 0.86, 0.50, 7); dotted("lower-head", 0.86, 0.50, 0.60, 0.76, 7); }
    if (input.name === "target") { circle("outer", 0.08, 0.08, 0.84); circle("middle", 0.25, 0.25, 0.50, input.muted); circle("center", 0.40, 0.40, 0.20, input.foreground); }
    if (input.name === "clock") { circle("face", 0.08, 0.08, 0.84, input.muted); stroke("hour", 0.50, 0.28, 0.50, 0.50); stroke("minute", 0.50, 0.50, 0.72, 0.50); circle("pivot", 0.465, 0.465, 0.07); }
    if (input.name === "person") { circle("head", 0.35, 0.08, 0.30); rect("body", 0.28, 0.43, 0.44, 0.36); rect("left-leg", 0.31, 0.74, 0.13, 0.20, input.foreground); rect("right-leg", 0.56, 0.74, 0.13, 0.20, input.foreground); }
    if (input.name === "document") { rect("page", 0.18, 0.08, 0.64, 0.84, input.muted); for (let i = 0; i < 3; i++) stroke(`line-${i + 1}`, 0.30, 0.32 + i * 0.16, 0.70, 0.32 + i * 0.16); }
    if (input.name === "steps") { rect("step-1", 0.08, 0.68, 0.24, 0.24, input.muted); rect("step-2", 0.38, 0.43, 0.24, 0.49); rect("step-3", 0.68, 0.18, 0.24, 0.74, input.foreground); }
    notes.push("Text-free icon built from independently editable native primitives. Check and arrow strokes use overlapping circles because arbitrary diagonal vector paths are not supported. Add a separate native caption when meaning needs explanation.");
  }
  if (elements.length > 40) fail("COMPONENT_ELEMENT_LIMIT", "component", "This component exceeds one 40-element edit batch.");
  for (const element of elements) parseInput(canvasElementSchema, element, "component.elements");
  return { elements, notes };
}
