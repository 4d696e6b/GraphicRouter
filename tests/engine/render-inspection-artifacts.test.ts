import { mkdir, writeFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { canvasEngine } from "../../src/engine/canvas";
import { renderInspectionPng } from "../../src/engine/raster";
import { assets } from "../../src/engine/assets";
import { portraitCanvas, portraitStructure, portraitContent, landscapeCanvas, landscapeStructure, landscapeContent } from "../../src/fixtures/freeform-infographic";

it("inspects actual stored objects in two distinct compositions", async () => {
  for (const [name, input, structure, content] of [["portrait", portraitCanvas, portraitStructure, portraitContent], ["landscape", landscapeCanvas, landscapeStructure, landscapeContent]] as const) {
    let b = canvasEngine.create(input, { deckId: crypto.randomUUID(), version: 1 });
    for (const [phase, elements] of [["structure", structure], ["content", content]] as const) b = canvasEngine.edit(b, { deckId: b.deckId, baseVersion: b.version, phase, summary: `Place ${phase}.`, operations: elements.map(element => ({ type: "add_element", element })) });
    const result = await renderInspectionPng(canvasEngine.render(b, "finished", assets), b.canvas);
    expect(result.bytes.length).toBeGreaterThan(5000);
    if (process.env.GRAPHICROUTER_ARTIFACTS === "1") {
      await mkdir("artifacts/inspection", { recursive: true });
      await writeFile(`artifacts/inspection/${name}.png`, result.bytes);
    }
  }
});
