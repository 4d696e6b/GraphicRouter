// Native, decorative homepage motion. No page content waits for these effects.
const EASE = "cubic-bezier(0.22,1,0.36,1)";
const INTRO_KEY = "graphicrouter.intro.v1";
let seenInDocument = false;

export function claimIntro(storage, navigation = "navigate", anchor = false, seen = false) {
  let stored = false;
  try { stored = storage?.getItem(INTRO_KEY) === "seen"; storage?.setItem(INTRO_KEY, "seen"); } catch { /* Private mode: retain document/history guards. */ }
  return !seen && !stored && !anchor && navigation !== "reload" && navigation !== "back_forward";
}

export function springStep(position, velocity, target, seconds, stiffness = 60, damping = 18) {
  const dt = Math.min(.032, Math.max(0, seconds));
  const nextVelocity = velocity + ((target - position) * stiffness - velocity * damping) * dt;
  const nextPosition = position + nextVelocity * dt;
  return Math.abs(target - nextPosition) < .015 && Math.abs(nextVelocity) < .015
    ? { position: target, velocity: 0 }
    : { position: nextPosition, velocity: nextVelocity };
}

export function glowPoint(x, y, viewport) {
  return { x: Math.max(0, Math.min(viewport.width, x)), y: Math.max(0, Math.min(viewport.height, y)) };
}

export function mountHomepageMotion(root, isReduced) {
  const hero = root.querySelector(".hero");
  if (!hero) return { enter: false, cleanup() {} };
  const controller = new AbortController(), { signal } = controller;
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  let storage = null;
  try { storage = sessionStorage; } catch { /* Storage is optional. */ }
  const navigation = performance.getEntriesByType("navigation")[0]?.type ?? "navigate";
  const enter = claimIntro(storage, navigation, !!location.hash, seenInDocument) && !isReduced() && !document.hidden;
  seenInDocument = true;
  let disposed = false, intro = null, timer = 0, frame = 0, previous = 0;
  let viewport = { width: innerWidth, height: innerHeight };
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  const animations = new Set();
  const ambient = document.createElement("div");
  ambient.className = "homepageAmbient"; ambient.setAttribute("aria-hidden", "true");
  const move = document.createElement("div"), drift = document.createElement("div");
  move.className = "ambientPointer"; drift.className = "ambientField";
  move.append(drift); ambient.append(move);
  const field = { x: pointer.x, y: pointer.y, vx: 0, vy: 0 };
  move.style.transform = `translate3d(${field.x}px,${field.y}px,0)`;
  root.prepend(ambient);

  function animate(element, keyframes, options, hold = false) {
    if (!element?.animate) return;
    const animation = element.animate(keyframes, options); animations.add(animation);
    void animation.finished.then(() => { if (!hold) animation.cancel(); animations.delete(animation); }, () => animations.delete(animation));
  }
  function finishIntro() {
    clearTimeout(timer); intro?.remove(); intro = null;
    root.dataset.intro = "done";
  }
  function skipIntro() {
    finishIntro(); animations.forEach(animation => animation.cancel()); animations.clear();
    root.querySelectorAll(".hero [data-title]").forEach(element => element.getAnimations?.().forEach(animation => animation.cancel()));
  }
  function showIntro() {
    if (!enter || !Element.prototype.animate) { root.dataset.intro = "skipped"; return; }
    intro = document.createElement("div"); intro.className = "graphicIntro";
    intro.setAttribute("aria-hidden", "true");
    // Own logo and abstract slides; no loading, installation or connection status.
    intro.innerHTML = `<div class="introContent"><div class="introTop"><img src="${new URL("./assets/mark.svg", import.meta.url).href}" alt="" width="28" height="28"><span>GraphicRouter</span><i></i></div><svg class="introPath" viewBox="0 0 240 60" fill="none" aria-hidden="true"><path class="introConnection" d="M48 30h144"/><g class="introSlide"><rect x="15" y="10" width="49" height="38" rx="6"/><path d="M25 23h23m-23 9h15"/></g><g class="introSlide"><rect x="95" y="10" width="49" height="38" rx="6"/><path d="M105 23h23m-23 9h15"/></g><g class="introSlide"><rect x="175" y="10" width="49" height="38" rx="6"/><path d="M185 23h23m-23 9h15"/></g></svg><p>Give your story direction.</p></div>`;
    root.append(intro); root.dataset.intro = "playing";
    timer = setTimeout(finishIntro, 1400); // Always remove the decorative window.
    animate(intro.firstElementChild, [{ opacity: 0, transform: "translateY(10px) scale(.96)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 320, easing: EASE, fill: "both" });
    let mask = false;
    if (globalThis.CSS?.registerProperty && CSS.supports("mask-image", "radial-gradient(circle, transparent 0%, black 100%)")) {
      try { CSS.registerProperty({ name: "--intro-reveal", syntax: "<percentage>", inherits: false, initialValue: "0%" }); } catch { /* Already registered in a restored document. */ }
      intro.classList.add("introRadial"); mask = true;
    }
    animate(intro, mask ? [{ "--intro-reveal": "0%", opacity: 1 }, { "--intro-reveal": "150%", opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }], { delay: 900, duration: 450, easing: EASE, fill: "both" }, true);
    const elements = [hero.querySelector(".pill"), hero.querySelector(".heroDescription"), hero.querySelector(".actions"), hero.querySelector(".brandSummary")];
    elements.forEach((element, i) => animate(element, [{ opacity: .3, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 560, delay: 230 + i * 90, easing: EASE, fill: "both" }));
  }

  const active = () => !disposed && !document.hidden && !isReduced() && fine.matches;
  function tick(time) {
    frame = 0;
    if (!active()) { previous = 0; return; }
    const dt = previous ? (time - previous) / 1000 : 1 / 60; previous = time;
    // Match the reference's viewport-following spring, without repainting a gradient.
    const x = springStep(field.x, field.vx, pointer.x, dt, 170, 24);
    const y = springStep(field.y, field.vy, pointer.y, dt, 170, 24);
    field.x = x.position; field.vx = x.velocity; field.y = y.position; field.vy = y.velocity;
    move.style.transform = `translate3d(${field.x.toFixed(3)}px,${field.y.toFixed(3)}px,0)`;
    if (field.vx || field.vy || field.x !== pointer.x || field.y !== pointer.y) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function queue() { if (!frame && active()) frame = requestAnimationFrame(tick); }
  function release() { ambient.dataset.tracking = "false"; }
  function resizeViewport() {
    viewport = { width: innerWidth, height: innerHeight };
    pointer = glowPoint(pointer.x, pointer.y, viewport); queue();
  }
  function sync() {
    ambient.hidden = isReduced() || !fine.matches;
    ambient.dataset.playing = String(active());
    if (!active()) {
      release(); cancelAnimationFrame(frame); frame = 0; previous = 0;
      field.vx = field.vy = 0;
    }
    if (isReduced() || document.hidden) skipIntro();
  }
  window.addEventListener("pointermove", event => {
    if (!active() || event.pointerType === "touch") return;
    pointer = glowPoint(event.clientX, event.clientY, viewport);
    ambient.dataset.tracking = "true"; queue();
  }, { passive: true, signal });
  document.documentElement.addEventListener("pointerleave", release, { signal });
  window.addEventListener("pointercancel", release, { signal });
  window.addEventListener("blur", release, { signal });
  window.addEventListener("resize", resizeViewport, { passive: true, signal });
  window.addEventListener("graphicrouter:motion", sync, { signal });
  document.addEventListener("visibilitychange", sync, { signal });
  fine.addEventListener("change", sync, { signal });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && intro) skipIntro(); }, { signal });
  root.addEventListener("focusin", () => { if (intro) skipIntro(); }, { signal });
  root.addEventListener("pointerdown", () => { if (intro) skipIntro(); }, { passive: true, signal });
  sync();
  try { showIntro(); } catch { skipIntro(); } // Initialization cannot hide the page.
  return { enter, cleanup() {
    disposed = true; controller.abort();
    cancelAnimationFrame(frame); skipIntro(); ambient.remove(); delete root.dataset.intro;
  } };
}
