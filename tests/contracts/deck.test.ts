import { describe, expect, it } from "vitest";
import { createDeckSchema, deckVersionSchema, reviseDeckSchema } from "../../src/contracts/deck";
import { sampleDeck } from "../../src/fixtures/sample-deck";

describe("shared create_deck contract", () => {
  it("accepts the shared five-slide fixture", () => {
    expect(createDeckSchema.parse(sampleDeck)).toEqual(sampleDeck);
  });
  it("rejects missing, duplicate, and reordered slides", () => {
    expect(createDeckSchema.safeParse({ ...sampleDeck, slides: sampleDeck.slides.slice(1) }).success).toBe(false);
    const slides = structuredClone(sampleDeck.slides);
    slides[1].id = "slide1";
    expect(createDeckSchema.safeParse({ ...sampleDeck, slides }).success).toBe(false);
    expect(createDeckSchema.safeParse({ ...sampleDeck, slides: [...sampleDeck.slides].reverse() }).success).toBe(false);
  });
  it("rejects excessive headline copy and unsupported durations", () => {
    const input = structuredClone(sampleDeck);
    input.slides[0].headline = "x".repeat(81);
    expect(createDeckSchema.safeParse(input).success).toBe(false);
    expect(createDeckSchema.safeParse({ ...sampleDeck, durationSeconds: 600 }).success).toBe(false);
  });
  it("does not silently discard unknown top-level fields", () => {
    expect(createDeckSchema.safeParse({ ...sampleDeck, arbitraryCode: "do not execute" }).success).toBe(false);
  });
});

describe("shared revision contract", () => {
  const deckId = "9bcfdf57-49a4-4e02-94c1-b6f87132d8af";
  it("accepts the stage-demo colour revision", () => {
    expect(reviseDeckSchema.safeParse({ deckId, baseVersion: 1, operations: [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }] }).success).toBe(true);
  });
  it("rejects arbitrary operations, empty batches, and malformed colours", () => {
    for (const operations of [[], [{ type: "execute_code", code: "example" }], [{ type: "set_deck_accent", color: "violet" }]]) {
      expect(reviseDeckSchema.safeParse({ deckId, baseVersion: 1, operations }).success).toBe(false);
    }
  });
  it("requires a stable deck identity and positive version", () => {
    expect(deckVersionSchema.safeParse({ deckId, version: 1 }).success).toBe(true);
    expect(deckVersionSchema.safeParse({ deckId, version: 0 }).success).toBe(false);
    expect(deckVersionSchema.safeParse({ deckId: "another person's arbitrary path", version: 1 }).success).toBe(false);
  });
});
