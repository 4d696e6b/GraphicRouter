import { mkdir, writeFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { canvasEngine } from "../../src/engine/canvas";
import { reviewDesign } from "../../src/engine/design-review";
import { renderInspectionPng } from "../../src/engine/raster";
import { portraitCanvas, portraitStructure, portraitContent } from "../../src/fixtures/freeform-infographic";
import { assets } from "../../src/engine/assets";
import type { CanvasElement } from "../../src/contracts";

it("uses an inspection finding to improve actual phone readability while preserving the prior draft", async () => {
  let original = canvasEngine.create(portraitCanvas, { deckId: crypto.randomUUID(), version: 1 });
  for (const [phase, elements] of [["structure", portraitStructure], ["content", portraitContent]] as const) original = canvasEngine.edit(original, { deckId: original.deckId, baseVersion: original.version, phase, summary: `Place ${phase}.`, operations: elements.map(element => ({ type: "add_element", element })) });
  const before = structuredClone(original);
  expect(reviewDesign(original).some(issue => issue.code === "SMALL_AT_PHONE_WIDTH")).toBe(true);
  const replacements: CanvasElement[] = original.elements.filter(element => element.type === "text" && element.fontSize < 40).map(element => {
    if (element.type !== "text") return element;
    const next = structuredClone(element);
    if (next.id.endsWith(".body")) { next.fontSize = 40; next.y -= 10; next.height = 112; }
    else if (next.id.endsWith(".heading")) { next.fontSize = 40; }
    else if (next.id.endsWith(".number")) { next.fontSize = 40; next.height = 48; }
    else { next.fontSize = 36; next.height = 48; }
    if (next.id === "verification") next.text = "Prototype example / Canva check pending";
    return next;
  });
  const refined = canvasEngine.edit(original, { deckId: original.deckId, baseVersion: original.version, phase: "polish", summary: "Enlarge supporting text for 375px viewing width and keep the composition editable.", operations: replacements.map(element => ({ type: "replace_element", elementId: element.id, element })) });
  expect(original).toEqual(before);
  expect(refined.validationIssues).toEqual([]);
  expect(reviewDesign(refined)).toEqual([]);
  expect(refined.elements.filter(element => element.type !== "text")).toEqual(original.elements.filter(element => element.type !== "text"));
  const beforePng = await renderInspectionPng(canvasEngine.render(original, "finished", assets), original.canvas);
  const afterPng = await renderInspectionPng(canvasEngine.render(refined, "finished", assets), refined.canvas);
  expect(afterPng.bytes).not.toEqual(beforePng.bytes);
  const pptx = await canvasEngine.compile(refined, assets);
  expect(pptx.length).toBeGreaterThan(5000);
  if (process.env.GRAPHICROUTER_ARTIFACTS === "1") {
    const dir = "artifacts/inspection";
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/phone-before.png`, beforePng.bytes);
    await writeFile(`${dir}/phone-refined.png`, afterPng.bytes);
    await writeFile(`${dir}/phone-refined.pptx`, pptx);
    await writeFile(`${dir}/phone-refined-blueprint.json`, JSON.stringify(refined, null, 2));
  }
});
