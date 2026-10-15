import { describe, expect, it } from "vitest";
import { graphemes, proximityInfluence, interpolateInfluence } from "../../website/hero-proximity.js";

describe("hero character proximity", () => {
  it("has a continuous squared falloff and the requested transform limits", () => {
    expect(proximityInfluence(0)).toBe(1);
    expect(proximityInfluence(75)).toBe(.25);
    expect(proximityInfluence(150)).toBe(0);
    expect(proximityInfluence(500)).toBe(0);
    expect(1 + .18 * proximityInfluence(0)).toBe(1.18);
    expect(-3 * proximityInfluence(0)).toBe(-3);
    expect(proximityInfluence(20)).toBeGreaterThan(proximityInfluence(50));
    expect(proximityInfluence(149.99)).toBeLessThan(.000001);
  });
  it("interpolates without overshoot and stops exactly at rest", () => {
    const halfway = interpolateInfluence(0, 1, 16.67);
    expect(halfway).toBeGreaterThan(0); expect(halfway).toBeLessThan(1);
    let value = 1;
    for (let i = 0; i < 100; i++) value = interpolateInfluence(value, 0, 16.67);
    expect(value).toBe(0);
    expect(interpolateInfluence(.2, .2, 16.67)).toBe(.2);
    expect(interpolateInfluence(0, 1, 1000)).toBe(interpolateInfluence(0, 1, 64));
  });
  it("preserves combining marks, Thai marks, emoji and UTF-16 offsets", () => {
    const text = "e\u0301 ก้ 👩🏽‍💻 🇹🇭";
    const segments = graphemes(text)!;
    expect(segments.map(item => item.segment)).toEqual(["é", " ", "ก้", " ", "👩🏽‍💻", " ", "🇹🇭"]);
    for (const item of segments) expect(text.slice(item.index, item.index + item.segment.length)).toBe(item.segment);
    expect(graphemes(text, null)).toBeNull();
  });
});
