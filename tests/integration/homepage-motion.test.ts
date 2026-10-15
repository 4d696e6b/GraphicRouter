import { describe, expect, it } from "vitest";
import { claimIntro, normalizedPointer, springStep } from "../../website/homepage-motion.js";

describe("homepage intro and ambient motion", () => {
  it("claims the intro once per session and skips reloads, history and anchors", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) };
    expect(claimIntro(storage)).toBe(true); expect(claimIntro(storage)).toBe(false);
    expect(claimIntro(null, "reload")).toBe(false);
    expect(claimIntro(null, "back_forward")).toBe(false);
    expect(claimIntro(null, "navigate", true)).toBe(false);
    expect(claimIntro(null, "navigate", false, true)).toBe(false);
  });
  it("handles blocked session storage without blocking page initialization", () => {
    const blocked = { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } };
    expect(claimIntro(blocked)).toBe(true);
    expect(claimIntro(blocked, "navigate", false, true)).toBe(false);
  });
  it("normalizes cached hero bounds and clamps pointer extremes", () => {
    const bounds = { left: 100, top: 200, width: 800, height: 600 };
    expect(normalizedPointer(500, 500, bounds)).toEqual({ x: 0, y: 0 });
    expect(normalizedPointer(100, 200, bounds)).toEqual({ x: -1, y: -1 });
    expect(normalizedPointer(2000, 3000, bounds)).toEqual({ x: 1, y: 1 });
  });
  it("follows gradually, settles exactly and returns without a large overshoot", () => {
    let state = { position: 0, velocity: 0 };
    const first = springStep(state.position, state.velocity, 64, 1 / 60);
    expect(first.position).toBeGreaterThan(0); expect(first.position).toBeLessThan(4);
    for (let i = 0; i < 1200; i++) {
      state = springStep(state.position, state.velocity, 64, 1 / 60);
      expect(state.position).toBeGreaterThanOrEqual(0); expect(state.position).toBeLessThanOrEqual(64.1);
    }
    expect(state).toEqual({ position: 64, velocity: 0 });
    for (let i = 0; i < 1200; i++) state = springStep(state.position, state.velocity, 0, 1 / 60);
    expect(state).toEqual({ position: 0, velocity: 0 });
    expect(springStep(0, 0, 64, 10)).toEqual(springStep(0, 0, 64, .032));
  });
});
