// Adapted from RepoSetup 763b333, MIT. See public/marketing/references/RepoSetup-LICENSE.txt.
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export function tabletDeviceLayout(stageWidth: number, stageHeight: number) {
  const width = Math.max(1, stageWidth), height = Math.max(1, stageHeight);
  const size = Math.max(1, Math.min(820, (width - 32) / (0.57 * 1.2), (height - 96) / (0.78 * 1.2)));
  return { size, left: width / 2 - size * .06, top: (height - 72) / 2 + size * .075 };
}
export function tabletStoryFrame(progress: number) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  let zoom = smooth(p / .18);
  if (p >= .28 && p < .38) zoom = 1 - smooth((p - .28) / .1);
  else if (p >= .38 && p < .48) zoom = smooth((p - .38) / .1);
  else if (p >= .48 && p < .6) zoom = 1;
  else if (p >= .6 && p < .7) zoom = 1 - smooth((p - .6) / .1);
  else if (p >= .7) zoom = smooth((p - .7) / .12);
  const gesture = p >= .28 && p <= .42 ? clamp((p - .28) / .14) : p >= .6 && p <= .74 ? clamp((p - .6) / .14) : 0;
  return { progress: p, zoom, offset: smooth((p - .32) / .08) + smooth((p - .64) / .08), swipe: Math.sin(gesture * Math.PI), swipeY: gesture, chapter: p < .36 ? 0 : p < .68 ? 1 : 2 };
}
