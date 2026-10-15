import { mkdir, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { canvasEngine } from "../../src/engine/canvas";
import { assets } from "../../src/engine/assets";
import { portraitCanvas, portraitStructure, portraitContent, landscapeCanvas, landscapeStructure, landscapeContent } from "../../src/fixtures/freeform-infographic";
import { readPptx } from "./read-pptx";

describe("distinct authored freeform compositions use the same template-free engine", () => {
  for (const [name, input, structure, content] of [["portrait", portraitCanvas, portraitStructure, portraitContent], ["landscape", landscapeCanvas, landscapeStructure, landscapeContent]] as const) {
    it(`constructs and exports the ${name} infographic without a slide recipe`, async () => {
      const blank = canvasEngine.create(input, { deckId: crypto.randomUUID(), version: 1 });
      const foundation = canvasEngine.edit(blank, { deckId: blank.deckId, baseVersion: 1, phase: "structure", summary: "Place the geometric structure and reading path.", operations: structure.map(element => ({ type: "add_element", element })) });
      const final = canvasEngine.edit(foundation, { deckId: blank.deckId, baseVersion: 2, phase: "content", summary: "Add the hierarchy, labels and supplied factual content.", operations: content.map(element => ({ type: "add_element", element })) });
      expect(blank.elements).toEqual([]);
      expect(final.elements).toEqual([...structure, ...content]);
      expect(final.validationIssues).toEqual([]);
      const svg = canvasEngine.render(final, "finished", assets), bytes = await canvasEngine.compile(final, assets);
      const archive = readPptx(bytes);
      expect([...archive.keys()].filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))).toHaveLength(1);
      const page = archive.get("ppt/slides/slide1.xml")!;
      for (const element of final.elements) expect(page).toContain(`name="${element.id}"`);
      if (process.env.GRAPHICROUTER_ARTIFACTS === "1") {
        const dir = `artifacts/freeform/${name}`;
        await mkdir(dir, { recursive: true });
        await writeFile(`${dir}/finished.svg`, svg);
        await writeFile(`${dir}/blank.svg`, canvasEngine.render(blank, "finished", assets));
        await writeFile(`${dir}/structure.svg`, canvasEngine.render(foundation, "finished", assets));
        await writeFile(`${dir}/graphicrouter.pptx`, bytes);
        await writeFile(`${dir}/blueprint.json`, JSON.stringify(final, null, 2));
        await writeFile(`${dir}/tool-inputs.json`, JSON.stringify({ create: input, structure, content }, null, 2));
      }
    });
  }
});
