import { describe, expect, it } from "vitest";
import { claimIntro, glowPoint, springStep } from "../../website/homepage-motion.js";

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
  it("maps viewport pointer coordinates directly instead of nudging fixed fields", () => {
    const viewport = { width: 1440, height: 900 };
    expect(glowPoint(120, 200, viewport)).toEqual({ x: 120, y: 200 });
    expect(glowPoint(1300, 700, viewport)).toEqual({ x: 1300, y: 700 });
    expect(glowPoint(-100, 2000, viewport)).toEqual({ x: 0, y: 900 });
  });
  it("uses the reference spring to follow and settle at the actual pointer", () => {
    let state = { position: 100, velocity: 0 };
    const first = springStep(state.position, state.velocity, 1200, 1 / 60, 170, 24);
    expect(first.position).toBeGreaterThan(100);
    expect(first.position).toBeLessThan(200);
    for (let i = 0; i < 600; i++) state = springStep(state.position, state.velocity, 1200, 1 / 60, 170, 24);
    expect(state).toEqual({ position: 1200, velocity: 0 });
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
