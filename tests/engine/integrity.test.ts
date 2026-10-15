import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { engine, assets, DEMO_ASSET_ID, EngineError } from "../../src/engine";
import { assetRegistry } from "../../src/engine/image";
import { finalPitch } from "../../src/fixtures/final-pitch";

const plan = () => engine.createBlueprint(finalPitch, { deckId: "6bac9301-3cf3-4b3f-8a72-549765f465f9", version: 1 });

describe("image container integrity", () => {
  it("rejects a PNG truncated immediately after its valid dimension header", () => {
    expect(() => assetRegistry([{ ...assets[0], data: assets[0].data.slice(0, 33) }])).toThrow(EngineError);
  });
  it("rejects corrupted PNG chunk payloads and trailing bytes", () => {
    const corrupt = assets[0].data.slice();
    corrupt[corrupt.length - 16] ^= 1;
    expect(() => assetRegistry([{ ...assets[0], data: corrupt }])).toThrow(EngineError);
    expect(() => assetRegistry([{ ...assets[0], data: new Uint8Array([...assets[0].data, 0]) }])).toThrow(EngineError);
  });
  it("rejects a JPEG truncated after its valid frame dimensions", async () => {
    const bytes = new Uint8Array(await readFile(new URL("./fixtures/wide.jpg", import.meta.url)));
    let frameEnd = 0;
    for (let i = 2; i + 4 < bytes.length; i++) if (bytes[i] === 255 && bytes[i + 1] === 192) { frameEnd = i + 2 + (bytes[i + 2] << 8 | bytes[i + 3]); break; }
    expect(frameEnd).toBeGreaterThan(0);
    expect(() => assetRegistry([{ id: "truncated", mimeType: "image/jpeg", data: bytes.slice(0, frameEnd) }])).toThrow(EngineError);
  });
});

describe("blueprint/source integrity before reflow", () => {
  it("rejects unplanned images instead of silently dropping them during a layout switch", async () => {
    const b = plan();
    b.slides[0].elements.push({ id: "slide1.unmapped-image", type: "image", assetId: DEMO_ASSET_ID, alt: "Unmapped", x: 1220, y: 500, width: 20, height: 20, zIndex: b.slides[0].elements.length });
    const before = structuredClone(b);
    expect(engine.validateBlueprint(b).some((issue) => issue.code === "UNEXPECTED_ELEMENT")).toBe(true);
    expect(() => engine.reviseBlueprint(b, [{ type: "set_slide_layout", slideId: "slide1", layout: "closing" }])).toThrow(EngineError);
    await expect(engine.compilePowerPoint(b, assets)).rejects.toBeInstanceOf(EngineError);
    expect(b).toEqual(before);
  });
  it("rejects a stored layout whose source block count cannot fit that recipe", () => {
    const b = plan(); b.input.slides[1].layout = "hero"; b.slides[1].layout = "hero";
    expect(engine.validateBlueprint(b).some((issue) => issue.code === "LAYOUT_CONTENT_MISMATCH")).toBe(true);
  });
});
