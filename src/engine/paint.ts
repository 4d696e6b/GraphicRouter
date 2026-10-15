import type { Paint, Theme } from "../contracts";
import { hexColorSchema } from "../contracts";
import { fail } from "./errors";

export function resolvePaint(paint: Paint, theme: Theme): string {
  const color = paint && ("hex" in paint ? paint.hex : theme[paint.token]);
  if (!hexColorSchema.safeParse(color).success) fail("INVALID_COLOR", "paint", "Every paint must resolve to a six-digit #RRGGBB colour.");
  return color;
}

export function contrastRatio(first: string, second: string): number {
  function luminance(hex: string) {
    const rgb = hex.slice(1).match(/../g)!.map((value) => parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
