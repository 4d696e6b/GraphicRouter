import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { engine, assets } from "../../src/engine";
import { finalPitch } from "../../src/fixtures/final-pitch";
import { localWorkflowPitch } from "../../src/fixtures/local-workflow-pitch";
import { buildRehearsal } from "./rehearsal";

it("exports the locally verified workflow pitch without upgrading account-level claims", async () => {
  const originalEnginePitch = structuredClone(finalPitch);
  const before = engine.createBlueprint(localWorkflowPitch, { deckId: "5b4353fc-2caf-4a5f-81cb-bf06b9aef5c3", version: 1 });
  expect(before.validationIssues).toEqual([]);
  const after = engine.reviseBlueprint(before, [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }]);
  const original = await engine.compilePowerPoint(before, assets);
  const revised = await engine.compilePowerPoint(after, assets);
  const replay = buildRehearsal(before, after, assets, { original, revised });
  expect(replay.proof.changedElementIds).toEqual(["slide3.headline"]);
  expect(replay.proof.unchangedPptxPages).toEqual([1, 2, 4, 5]);
  expect(finalPitch).toEqual(originalEnginePitch);
  const coreWords = before.slides.flatMap((slide) => slide.notes.core.replace(/\[[^\]]*\]/g, "").split(/\s+/)).length;
  const expandedWords = before.slides.flatMap((slide) => slide.notes.expanded.replace(/\[[^\]]*\]/g, "").split(/\s+/)).length;
  expect(coreWords).toBeGreaterThan(270); expect(coreWords).toBeLessThan(370);
  expect(expandedWords).toBeGreaterThan(500); expect(expandedWords).toBeLessThan(680);
  if (process.env.GRAPHICROUTER_ARTIFACTS !== "1") return;
  const dir = join(process.cwd(), "artifacts", "builder-a", "local-workflow");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "graphicrouter-pitch-v1.pptx"), original);
  await writeFile(join(dir, "graphicrouter-pitch-v2-violet.pptx"), revised);
  await writeFile(join(dir, "offline-rehearsal.html"), replay.html);
  await writeFile(join(dir, "revision-proof.json"), JSON.stringify(replay.proof, null, 2));
  await writeFile(join(dir, "create-deck.json"), JSON.stringify(localWorkflowPitch, null, 2));
  const expanded = structuredClone(localWorkflowPitch); expanded.durationSeconds = 300;
  const expandedPlan = engine.createBlueprint(expanded, { deckId: before.deckId, version: 1 });
  await writeFile(join(dir, "graphicrouter-pitch-expanded.pptx"), await engine.compilePowerPoint(expandedPlan, assets));
  await writeFile(join(dir, "speaker-notes.md"), [
    "# GraphicRouter — locally verified workflow pitch", "",
    `Core: ${coreWords} words plus 30-second demo. Expanded: ${expandedWords} words plus demo. Actual speaking pace remains unverified.`, "",
    "Based on Builder B's evidence at f23b071. Local simulated identity and manual Canva connector checks do not prove hosted ChatGPT or application OAuth. Shape/line editing and font matching remain pending.", "",
    ...before.slides.flatMap((slide) => [`## ${slide.id}`, "", "### Core", "", slide.notes.core, "", "### Expanded", "", slide.notes.expanded, ""]),
  ].join("\n"));
});
