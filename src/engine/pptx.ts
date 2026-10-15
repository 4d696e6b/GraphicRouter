import PptxGenJS from "pptxgenjs";
import type { Asset, DeckBlueprint } from "../contracts";
import { assertNoErrors, EngineError } from "./errors";
import { assetRegistry, containImage, imageDataUri, requireAsset } from "./image";
import { resolvePaint } from "./paint";
import { layoutText } from "./text";
import { validateBlueprint } from "./validation";

const inches = (pixels: number) => pixels / 120;
const points = (pixels: number) => pixels * 72 / 120;

export async function compilePowerPoint(blueprint: DeckBlueprint, assets: Asset[]): Promise<Uint8Array> {
  assertNoErrors(validateBlueprint(blueprint));
  const registry = assetRegistry(assets);
  // Validate every reference before starting a partial export.
  for (const slide of blueprint.slides) for (const e of slide.elements) if (e.type === "image") requireAsset(registry, e.assetId);
  try {
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "GRAPHICROUTER", width: inches(1600), height: inches(900) });
    pptx.layout = "GRAPHICROUTER";
    pptx.author = "GraphicRouter";
    pptx.subject = blueprint.input.brief.purpose;
    pptx.title = `${blueprint.input.title} — v${blueprint.version}`;
    pptx.company = "GraphicRouter";
    pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };
    for (const plan of blueprint.slides) {
      const slide = pptx.addSlide();
      slide.background = { color: blueprint.theme.background.slice(1) };
      slide.addNotes(blueprint.input.durationSeconds === 180 ? plan.notes.core : plan.notes.expanded);
      for (const element of [...plan.elements].sort((a, b) => a.zIndex - b.zIndex)) {
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
    throw new EngineError("The PowerPoint writer could not finish this export. The stored blueprint is unchanged.", [], "EXPORT_FAILED");
  }
}
