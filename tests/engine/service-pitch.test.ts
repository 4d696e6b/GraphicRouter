import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import type { DeckBlueprint } from "../../src/contracts";
import { localWorkflowPitch } from "../../src/fixtures/local-workflow-pitch";
import { buildRehearsal } from "./rehearsal";

// Runs only in the combined review snapshot or once B's service lands on main.
// Variable imports keep A's standalone branch independent of B-owned modules.
const servicePath = "../../src/server/service.ts";
const storePath = "../../src/server/store.ts";
const databasePath = "../integration/database.ts";
it.skipIf(!existsSync(new URL(servicePath, import.meta.url)))("creates the exact updated pitch through B's real service and preserves its exported revision", async () => {
  const [{ DeckService }, { D1DeckStore }, { testDatabase }, { engine, assets }] = await Promise.all([
    import(/* @vite-ignore */ servicePath), import(/* @vite-ignore */ storePath),
    import(/* @vite-ignore */ databasePath), import("../../src/engine"),
  ]);
  const { db } = testDatabase();
  const store = new D1DeckStore(db), objects = new Map<string, Uint8Array>();
  const service = new DeckService({ store, engine, assets, origin: "https://example.test",
    files: {
      get: async (key: string) => objects.get(key) ?? null,
      put: async (key: string, bytes: Uint8Array) => { objects.set(key, new Uint8Array(bytes)); },
    },
    canva: {
      connected: async () => false,
      start: async () => { throw new Error("Canva is deliberately unavailable in this local test."); },
      poll: async () => { throw new Error("Canva is deliberately unavailable in this local test."); },
    },
  });
  const owner = "builder-a-pitch-local-test";
  const created = await service.call("create_deck", localWorkflowPitch, owner);
  const before: DeckBlueprint = structuredClone(created.blueprint);
  expect(before.input).toEqual(localWorkflowPitch);
  for (const stage of ["layout", "content", "finished"] as const) {
    const preview = await service.preview(owner, before.deckId, 1, stage);
    expect(preview.blueprint).toEqual(before);
    expect(preview.slides).toEqual(before.slides.map(slide => engine.renderSlideSvg(slide, before.theme, stage, assets)));
  }
  await service.call("export_deck", { deckId: before.deckId, version: 1 }, owner);
  const original: Uint8Array = await service.download(owner, before.deckId, 1, "pptx");
  const { blueprint: after } = await service.call("revise_deck", { deckId: before.deckId, baseVersion: 1, operations: [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }] }, owner);
  await service.call("export_deck", { deckId: before.deckId, version: 2 }, owner);
  const revised: Uint8Array = await service.download(owner, before.deckId, 2, "pptx");
  const replay = buildRehearsal(before, after, assets, { original, revised });
  expect(replay.proof.unchangedPptxPages).toEqual([1, 2, 4, 5]);
  expect(await store.read(owner, before.deckId, 1)).toEqual(before);
  expect(await service.download(owner, before.deckId, 1, "pptx")).toEqual(original);
  await expect(service.call("revise_deck", { deckId: before.deckId, baseVersion: 1, operations: [{ type: "set_element_color", elementId: "slide3.headline", color: "#000000" }] }, owner)).rejects.toMatchObject({ detail: { code: "VERSION_CONFLICT" } });
  await expect(service.download(null, before.deckId, 2, "pptx")).rejects.toMatchObject({ detail: { code: "UNAUTHORIZED" } });
  expect(await store.read(owner, before.deckId, 2)).toEqual(after);
  if (process.env.GRAPHICROUTER_ARTIFACTS !== "1") return;
  const dir = join(process.cwd(), "artifacts", "builder-a", "service-pitch");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "graphicrouter-pitch-v1.pptx"), original);
  await writeFile(join(dir, "graphicrouter-pitch-v2-violet.pptx"), revised);
  await writeFile(join(dir, "speaker-notes.md"), await service.download(owner, before.deckId, 2, "notes"));
  await writeFile(join(dir, "offline-rehearsal.html"), replay.html);
  await writeFile(join(dir, "revision-proof.json"), JSON.stringify(replay.proof, null, 2));
});
