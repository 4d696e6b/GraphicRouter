import { describe, expect, it } from "vitest";
import { DeckService } from "../../src/server/service";
import { D1DeckStore } from "../../src/server/store";
import { engine, assets } from "../../src/server/engine-provider";
import { finalPitch } from "../../src/fixtures/final-pitch";
import { localWorkflowPitch } from "../../src/fixtures/local-workflow-pitch";
import { testDatabase } from "./database";
import { readPptx } from "../engine/read-pptx";

/** Real engine/assets + production SQL; only external storage/Canva are local adapters. */
function setup() {
  const { db } = testDatabase(), store = new D1DeckStore(db), objects = new Map<string, Uint8Array>();
  const service = new DeckService({ store, engine, assets, origin: "https://example.test",
    files: { get: async key => objects.get(key) ?? null, put: async (key, bytes) => { objects.set(key, new Uint8Array(bytes)); } },
    canva: { connected: async () => false, start: async () => { throw new Error("No Canva account in this test"); }, poll: async () => { throw new Error("No Canva account in this test"); } },
  });
  return { store, service };
}
const owner = "real-engine-test-owner";
const violet = { type: "set_element_color" as const, elementId: "slide3.headline", color: "#7C3AED" };
describe("real service → engine → SVG/PPTX integration", () => {
  it.each([["engine-stage", finalPitch], ["local-workflow", localWorkflowPitch]] as const)("creates, previews, revises and exports the %s pitch while preserving unrelated elements and v1", async (_label, pitch) => {
    const { service, store } = setup();
    const created = await service.call("create_deck", pitch, owner), original = structuredClone(created.blueprint);
    expect(original.input).toEqual(pitch);
    const v1 = { deckId: original.deckId, version: 1 };
    for (const stage of ["layout", "content", "finished"] as const) {
      const preview = await service.preview(owner, original.deckId, 1, stage);
      expect(preview.blueprint).toEqual(original); expect(preview.slides).toHaveLength(5);
      expect(preview.slides[2]).toContain('data-element-id="slide3.headline"');
    }
    await service.call("export_deck", v1, owner);
    const firstBytes = await service.download(owner, original.deckId, 1, "pptx"), firstXml = readPptx(firstBytes);
    const revised = await service.call("revise_deck", { deckId: original.deckId, baseVersion: 1, operations: [violet] }, owner);
    expect(revised.blueprint.version).toBe(2);
    const expectedSlides = structuredClone(original.slides);
    const target = expectedSlides[2].elements.find(e => e.id === "slide3.headline")!;
    if (target.type !== "text") throw new Error("Headline must be native text");
    target.color = { hex: violet.color };
    expect(revised.blueprint.slides).toEqual(expectedSlides);
    expect(revised.blueprint.input).toEqual(original.input);
    expect(await store.read(owner, original.deckId, 1)).toEqual(original);
    const preview = await service.preview(owner, original.deckId, 2, "finished");
    expect(preview.slides[2]).toMatch(/data-element-id="slide3.headline"[^>]+fill="#7C3AED"/);
    const exported = await service.call("export_deck", { ...v1, version: 2 }, owner);
    expect(exported.files?.pptxUrl).toContain("/2/files/pptx");
    const secondBytes = await service.download(owner, original.deckId, 2, "pptx"), secondXml = readPptx(secondBytes);
    expect([...secondBytes.slice(0, 4)]).toEqual([80, 75, 3, 4]);
    expect([...secondXml.keys()].filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))).toHaveLength(5);
    for (const slide of [1, 2, 4, 5]) expect(secondXml.get(`ppt/slides/slide${slide}.xml`)).toBe(firstXml.get(`ppt/slides/slide${slide}.xml`));
    expect(secondXml.get("ppt/slides/slide3.xml")).toContain('val="7C3AED"');
    expect(secondXml.get("ppt/slides/slide1.xml")).toContain("<p:pic>");
    expect(secondXml.get("ppt/slides/slide2.xml")).toContain("<p:sp>");
    expect(await service.download(owner, original.deckId, 1, "pptx")).toEqual(firstBytes);
    const notes = new TextDecoder().decode(await service.download(owner, original.deckId, 2, "notes"));
    expect(notes).toContain(original.slides[2].notes.core); expect(notes).toContain(original.slides[2].notes.expanded);
  });
  it("returns invalid-target engine details without creating a version", async () => {
    const { service, store } = setup(), { blueprint: b } = await service.call("create_deck", finalPitch, owner);
    await expect(service.call("revise_deck", { deckId: b.deckId, baseVersion: 1, operations: [{ ...violet, elementId: "slide3.missing" }] }, owner))
      .rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED", message: expect.stringContaining("No element named slide3.missing") } });
    expect(await store.read(owner, b.deckId, 1)).toEqual(b);
    await expect(store.read(owner, b.deckId, 2)).rejects.toThrow();
  });
  it("returns layout/overflow engine diagnostics and preserves the prior deck", async () => {
    const { service, store } = setup(), { blueprint: b } = await service.call("create_deck", finalPitch, owner);
    await expect(service.call("revise_deck", { deckId: b.deckId, baseVersion: 1, operations: [{ type: "replace_text", elementId: "slide3.headline", text: "W".repeat(80) }] }, owner))
      .rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED", message: expect.stringMatching(/fit|Shorten|width|box|overflow/i) } });
    expect(await store.read(owner, b.deckId, 1)).toEqual(b);
  });
});
