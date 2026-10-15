import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { renderInspectionPng } from "../../src/engine/raster";

function pngData(bytes: Uint8Array) {
  const b = Buffer.from(bytes), chunks: Buffer[] = [];
  expect([...b.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20);
  for (let offset = 8; offset < b.length;) {
    const size = b.readUInt32BE(offset), type = b.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(b.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  return { width, height, scanlines: inflateSync(Buffer.concat(chunks)) };
}
const svg = (width: number, height: number, content = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#FFFFFF"/>${content}</svg>`;
describe("real offline PNG inspection renderer", () => {
  it("renders regular and bold text as real visible pixels with no external font access", async () => {
    const blank = await renderInspectionPng(svg(600, 400), { width: 600, height: 400 });
    for (const weight of [400, 700]) {
      const result = await renderInspectionPng(svg(600, 400, `<text x="40" y="130" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="${weight}" fill="#123D3A">Readable design</text>`), { width: 600, height: 400 });
      const png = pngData(result.bytes);
      expect(png.width).toBe(600); expect(png.height).toBe(400);
      expect(png.scanlines).not.toEqual(pngData(blank.bytes).scanlines);
      expect(result.bytes.length).toBeGreaterThan(blank.bytes.length + 500);
      expect(result.fontNote).toContain("Liberation Sans");
      expect(result.fontNote).toContain("PowerPoint keep Arial");
    }
  });
  it("bounds portrait and square pixel allocations while preserving aspect ratio", async () => {
    for (const [width, height] of [[1080, 1920], [4000, 4000]]) {
      const result = await renderInspectionPng(svg(width, height), { width, height });
      const png = pngData(result.bytes);
      expect(Math.max(png.width, png.height)).toBeLessThanOrEqual(1600);
      expect(png.width * png.height).toBeLessThanOrEqual(2_000_000);
      expect(Math.abs(png.width / png.height - width / height)).toBeLessThan(0.002);
    }
  });
  it("renders ordinary copy that resembles markup without relaxing attribute checks", async () => {
    const text = '<title>Online = 45% — URL (optional)</title><text x="40" y="100" font-family="Arial" font-size="32">Online = 45% &amp; URL (optional)</text>';
    const result = await renderInspectionPng(svg(600, 400, text), { width: 600, height: 400 });
    const blank = await renderInspectionPng(svg(600, 400), { width: 600, height: 400 });
    expect(pngData(result.bytes).scanlines).not.toEqual(pngData(blank.bytes).scanlines);
    await expect(renderInspectionPng(svg(600, 400, '<rect onload="alert(1)"/>'), { width: 600, height: 400 })).rejects.toThrow("safe engine");
  });
  it("rejects unbounded geometry, external resources, executable markup and mismatched dimensions", async () => {
    for (const size of [{ width: NaN, height: 400 }, { width: 4001, height: 400 }, { width: 0, height: 400 }]) await expect(renderInspectionPng(svg(600, 400), size)).rejects.toThrow();
    for (const body of ['<script>alert(1)</script>', '<image href="https://example.test/private.png"/>', '<foreignObject/>', '<rect style="fill:url(https://example.test)"/>']) await expect(renderInspectionPng(svg(600, 400, body), { width: 600, height: 400 })).rejects.toThrow();
    await expect(renderInspectionPng(svg(600, 400), { width: 600, height: 399 })).rejects.toThrow("match");
    await expect(renderInspectionPng("<svg " + "x".repeat(4_000_001), { width: 600, height: 400 })).rejects.toThrow("4 MB");
  });
  it("bounds concurrent image allocations and allows a later retry", async () => {
    const source = svg(600, 400);
    await renderInspectionPng(source, { width: 600, height: 400 });
    const results = await Promise.allSettled([0, 1, 2].map(() => renderInspectionPng(source, { width: 600, height: 400 })));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(2);
    const failed = results.find(result => result.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason.message).toContain("busy");
    await expect(renderInspectionPng(source, { width: 600, height: 400 })).resolves.toMatchObject({ width: 600, height: 400 });
  });
});
