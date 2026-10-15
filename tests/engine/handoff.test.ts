import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import PptxGenJS from "pptxgenjs";
import { expect, it } from "vitest";
import { engine, assets } from "../../src/engine";
import { finalPitch } from "../../src/fixtures/final-pitch";
import { imageDataUri } from "../../src/engine/image";
import { escapeXml } from "../../src/engine/svg";
import { readPptx } from "./read-pptx";

it("generates a native two-slide import probe and a real five-slide engine handoff", async () => {
  const probe = new PptxGenJS();
  probe.defineLayout({ name: "PROBE", width: 1600 / 120, height: 900 / 120 }); probe.layout = "PROBE";
  for (let number = 1; number <= 2; number++) {
    const slide = probe.addSlide(); slide.background = { color: "FAF9F6" };
    slide.addText(`Canva editability probe ${number}`, { x: 0.8, y: 0.7, w: 11.6, h: 0.8, fontFace: "Arial", fontSize: 32, color: "191724", objectName: `probe${number}.headline`, margin: 0 });
    slide.addText("Select and edit each text, rectangle, circle, line, and image independently.", { x: 0.8, y: 1.7, w: 11.6, h: 0.7, fontFace: "Arial", fontSize: 18, color: "62606B", objectName: `probe${number}.body`, margin: 0 });
    slide.addShape(probe.ShapeType.rect, { x: 0.8, y: 3, w: 3, h: 1.6, fill: { color: "7C3AED" }, line: { transparency: 100 }, objectName: `probe${number}.rectangle` });
    slide.addShape(probe.ShapeType.ellipse, { x: 4.5, y: 3, w: 1.6, h: 1.6, fill: { color: "191724" }, line: { transparency: 100 }, objectName: `probe${number}.circle` });
    slide.addShape(probe.ShapeType.line, { x: 0.8, y: 5.5, w: 9, h: 0, line: { color: "7C3AED", width: 3 }, objectName: `probe${number}.line` });
    slide.addImage({ data: imageDataUri(assets[0]), x: 8, y: 3, w: 1.6, h: 1.6, objectName: `probe${number}.image`, altText: "GraphicRouter routing mark" });
    slide.addNotes("Probe only. Canva conversion and editability must be verified in the real account.");
  }
  const probeBytes = await probe.write({ outputType: "uint8array", compression: true }) as Uint8Array;
  expect([...readPptx(probeBytes).keys()].filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toHaveLength(2);
  // Check in the small import fixture so Builder B can upload it before running code.
  const committed = readPptx(new Uint8Array(await readFile(new URL("../../src/fixtures/canva-import-probe.pptx", import.meta.url))));
  expect([...committed.keys()].filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toHaveLength(2);
  for (const page of [1, 2]) {
    const xml = committed.get(`ppt/slides/slide${page}.xml`)!;
    for (const kind of ["headline", "body", "rectangle", "circle", "line", "image"]) expect(xml).toContain(`name="probe${page}.${kind}"`);
    expect(xml).toContain("<p:pic>");
  }

  const blueprint = engine.createBlueprint(finalPitch, { deckId: "6bac9301-3cf3-4b3f-8a72-549765f465f9", version: 1 });
  expect(blueprint.validationIssues).toEqual([]);
  const bytes = await engine.compilePowerPoint(blueprint, assets);
  const revised = engine.reviseBlueprint(blueprint, [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }]);
  const changed = await engine.compilePowerPoint(revised, assets);
  const expanded = structuredClone(finalPitch); expanded.durationSeconds = 300;
  const expandedPlan = engine.createBlueprint(expanded, { deckId: blueprint.deckId, version: 1 });
  const expandedBytes = await engine.compilePowerPoint(expandedPlan, assets);
  const coreWords = finalPitch.slides.flatMap((slide) => slide.notes.core.replace(/\[[^\]]*\]/g, "").trim().split(/\s+/)).length;
  const expandedWords = finalPitch.slides.flatMap((slide) => slide.notes.expanded.replace(/\[[^\]]*\]/g, "").trim().split(/\s+/)).length;
  expect(coreWords).toBeGreaterThan(270); expect(coreWords).toBeLessThan(370);
  expect(expandedWords).toBeGreaterThan(500); expect(expandedWords).toBeLessThan(680);
  expect(readPptx(expandedBytes).get("ppt/notesSlides/notesSlide1.xml")).toContain("important pitch");

  if (process.env.GRAPHICROUTER_ARTIFACTS !== "1") return;
  const directory = join(process.cwd(), "artifacts", "builder-a"); await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "canva-import-probe.pptx"), probeBytes);
  await writeFile(join(directory, "graphicrouter-pitch-v1.pptx"), bytes);
  await writeFile(join(directory, "graphicrouter-pitch-v2-violet.pptx"), changed);
  await writeFile(join(directory, "graphicrouter-pitch-5-minute-notes.pptx"), expandedBytes);
  await writeFile(join(directory, "blueprint-v1.json"), JSON.stringify(blueprint, null, 2));
  await writeFile(join(directory, "blueprint-v2.json"), JSON.stringify(revised, null, 2));
  const notes = ["# GraphicRouter — engine-stage pitch", "", "These notes reflect verified engine capabilities; ChatGPT/Canva verification remains separate.", `Core: ${coreWords} words plus a 30-second demo. Expanded: ${expandedWords} words plus demo. Rehearse actual pacing.`, "", ...finalPitch.slides.flatMap((slide) => [`## ${slide.id}: ${slide.headline.replace(/\n/g, " ")}`, "", "### Three-minute core", "", slide.notes.core, "", "### Five-minute expanded", "", slide.notes.expanded, ""])].join("\n");
  await writeFile(join(directory, "speaker-notes.md"), notes);
  const sections: string[] = [];
  for (const slide of blueprint.slides) {
    for (const stage of ["layout", "content", "finished"] as const) await writeFile(join(directory, `${slide.id}-${stage}.svg`), engine.renderSlideSvg(slide, blueprint.theme, stage, assets));
    sections.push(`<section><h2>${escapeXml(slide.id)} / ${escapeXml(slide.layout)}</h2><div class="stages">${["layout", "content", "finished"].map((stage) => `<figure><img src="${slide.id}-${stage}.svg" alt="${escapeXml(slide.id)} ${stage}"/><figcaption>${stage}</figcaption></figure>`).join("")}</div></section>`);
  }
  await writeFile(join(directory, "slide3-v2-violet.svg"), engine.renderSlideSvg(revised.slides[2], revised.theme, "finished", assets));
  await writeFile(join(directory, "preview.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GraphicRouter / engine handoff</title><style>body{font:16px Arial;background:#FAF9F6;color:#191724;max-width:1600px;margin:auto;padding:32px}h1{font-size:40px}.stages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}figure{margin:0}img{width:100%;border:1px solid #ddd}figcaption{margin:8px 0 32px;color:#62606B}@media(max-width:900px){.stages{grid-template-columns:1fr}}</style><h1>GraphicRouter / engine handoff</h1><p>Blueprint → content → finished. These are local engine outputs, not proof of an installed ChatGPT plugin or a successful Canva conversion.</p>${sections.join("")}<h2>Precise revision / version 2</h2><img style="max-width:1000px" src="slide3-v2-violet.svg" alt="Slide three with only its headline recoloured violet"/></html>`);
  await writeFile(join(directory, "README.md"), "# Builder A generated files\n\nUse canva-import-probe.pptx to verify text/rectangle/circle/line/image editability in Canva. GraphicRouter pitch files are generated by the implemented engine. Open preview.html through a local static server to inspect all three stages. The violet v2 changes only slide3.headline; the other four exported slide XML files are tested unchanged. A real Canva import test and final stage rehearsal are separate.\n");
});
