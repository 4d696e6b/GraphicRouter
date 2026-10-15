// Camera geometry adapted from RepoSetup 763b333 (MIT). Full notice: notices/RepoSetup-LICENSE.txt.
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export function tabletDeviceLayout(stageWidth, stageHeight) {
  const width = Math.max(1, stageWidth), height = Math.max(1, stageHeight);
  const size = Math.max(1, Math.min(820, (width - 32) / (.57 * 1.2), (height - 96) / (.78 * 1.2)));
  return { size, left: width / 2 - size * .06, top: (height - 72) / 2 + size * .075 };
}
export function tabletStoryFrame(progress) {
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
export function mountScene(root, isReduced) {
  const track = root.querySelector("[data-scroll-track]"), stage = root.querySelector("[data-scroll-stage]"), caption = root.querySelector("[data-scene-caption]");
  if (!track || !stage || !globalThis.ResizeObserver || !globalThis.IntersectionObserver) return () => {};
  let visible = false, frame = 0;
  const captions = ["01 / CHOOSE A DESIGN", "02 / GENERATE AI PROMPT", "03 / CUSTOMIZE IN CANVA"];
  function layout() {
    const size = tabletDeviceLayout(stage.clientWidth, stage.clientHeight);
    for (const [key, value] of Object.entries({ size: size.size, left: size.left, top: size.top })) root.style.setProperty(`--device-${key}`, `${value}px`);
  }
  function paint() {
    frame = 0;
    if (!visible || document.hidden || isReduced()) return;
    const bounds = track.getBoundingClientRect();
    const story = tabletStoryFrame(-bounds.top / Math.max(1, bounds.height - innerHeight));
    for (const [key, value] of Object.entries({ "camera-zoom": story.zoom, "screen-offset": story.offset, swipe: story.swipe, "swipe-y": story.swipeY })) root.style.setProperty(`--${key}`, String(value));
    stage.dataset.chapter = String(story.chapter); stage.dataset.progress = story.progress.toFixed(3);
    caption.textContent = captions[story.chapter];
  }
  function queue() { if (!frame && visible && !document.hidden && !isReduced()) frame = requestAnimationFrame(paint); }
  function sync() {
    root.dataset.motion = isReduced() ? "reduced" : "scroll";
    root.dataset.playing = String(visible && !document.hidden && !isReduced());
    if (frame) cancelAnimationFrame(frame); frame = 0;
    if (isReduced()) { root.style.setProperty("--camera-zoom", "0"); root.style.setProperty("--screen-offset", "0"); root.style.setProperty("--swipe", "0"); stage.dataset.chapter = "0"; caption.textContent = captions[0]; }
    layout(); queue();
  }
  const resize = new ResizeObserver(() => { layout(); queue(); }); resize.observe(stage);
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }); observer.observe(stage);
  window.addEventListener("scroll", queue, { passive: true }); window.addEventListener("resize", layout);
  window.addEventListener("graphicrouter:motion", sync); document.addEventListener("visibilitychange", sync); sync();
  return () => { if (frame) cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); window.removeEventListener("scroll", queue); window.removeEventListener("resize", layout); window.removeEventListener("graphicrouter:motion", sync); document.removeEventListener("visibilitychange", sync); };
}
