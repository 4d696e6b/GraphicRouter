import { mountScene } from "./scene.js";
import { nextTab, copyText } from "./interactions.js";
import { mountHeroProximity } from "./hero-proximity.js";

function mountPage() {
  const root = document.getElementById("static-site");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => reduced.matches || root.dataset.motionPreference === "reduce";
  const dispose = [], listeners = new AbortController(), signal = listeners.signal;
  const menu = document.querySelector(".mobileMenu"), summary = menu?.querySelector("summary");
  document.addEventListener("keydown", event => { if (event.key === "Escape" && menu?.open) { menu.open = false; summary.focus(); } }, { signal });
  document.addEventListener("pointerdown", event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; }, { signal });
  menu?.addEventListener("click", event => { if (event.target.closest("a")) menu.open = false; }, { signal });
  const mobile = matchMedia("(max-width:760px)");
  mobile.addEventListener("change", () => { if (menu) menu.open = false; }, { signal });

  const tabs = [...document.querySelectorAll('[role="tab"]')], panels = [...document.querySelectorAll('[role="tabpanel"]')];
  function select(index, focus = false) {
    tabs.forEach((tab, i) => { tab.setAttribute("aria-selected", String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index), { signal });
    tab.addEventListener("keydown", event => { const next = nextTab(event.key, index, tabs.length); if (next !== null) { event.preventDefault(); select(next, true); } }, { signal });
  });
  function hash() { if (location.hash === "#revision") select(1); else if (location.hash === "#export-example") select(2); }
  window.addEventListener("hashchange", hash, { signal }); hash();
  document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", async () => {
    const block = button.closest(".codeBlock"), text = block.querySelector("code").textContent;
    const status = await copyText(text);
    if (signal.aborted) return;
    button.textContent = status === "copied" ? "Copied ✓" : "Copy";
    block.querySelector('[role="status"]').textContent = status === "copied" ? "Copied. Use your own verified facts." : "Clipboard unavailable. Select and copy the example text above.";
  }, { signal }));
  const revision = document.querySelector("[data-revision-toggle]");
  revision?.addEventListener("click", () => {
    const changed = revision.dataset.changed !== "true"; revision.dataset.changed = String(changed);
    const image = document.querySelector("[data-revision-image]"); image.src = `assets/slide-3${changed ? "-violet" : ""}.svg`;
    image.alt = changed ? "Prepared slide three with violet headline" : "Prepared original slide three";
    document.querySelector("[data-revision-label]").textContent = changed ? "PREPARED VIOLET VERSION" : "PREPARED ORIGINAL";
    document.querySelector("[data-revision-status]").textContent = changed ? "✓ Only the headline changes. Original preserved." : "Original preserved. Try the prepared comparison.";
    revision.textContent = changed ? "Reset ↺" : "Try it ↗";
  }, { signal });

  const animations = new Map();
  function play(element, title = false, delay = 0) {
    if (isReduced() || element.contains(document.activeElement) || !element.animate) return;
    const animation = element.animate(title ? [{ transform: "translate3d(0,105%,0) rotate(3deg)" }, { transform: "translate3d(0,0,0) rotate(0)" }] : [{ transform: "translate3d(0,32px,0)" }, { transform: "translate3d(0,0,0)" }], { duration: title ? 1000 : 700, easing: "cubic-bezier(.16,1,.3,1)", delay, fill: "both" });
    animations.set(animation, element);
    void animation.finished.then(() => { animation.cancel(); animations.delete(animation); }, () => animations.delete(animation));
  }
  function sync() { root.dataset.motion = isReduced() ? "reduced" : "enabled"; root.dataset.visible = String(!document.hidden); animations.forEach((_, animation) => isReduced() ? animation.cancel() : document.hidden ? animation.pause() : animation.play()); }
  if (globalThis.IntersectionObserver) {
    const reveal = new IntersectionObserver(entries => entries.filter(entry => entry.isIntersecting).forEach((entry, i) => { reveal.unobserve(entry.target); play(entry.target, false, Math.min(i * 75, 225)); }), { threshold: .08 });
    document.querySelectorAll("[data-reveal]").forEach(element => reveal.observe(element));
    const loops = new IntersectionObserver(entries => entries.forEach(entry => { entry.target.dataset.playing = String(entry.isIntersecting); }));
    document.querySelectorAll("[data-loop]").forEach(element => loops.observe(element));
    dispose.push(() => { reveal.disconnect(); loops.disconnect(); });
  }
  if (!location.hash) document.querySelectorAll("[data-title]").forEach((element, i) => play(element, true, 100 + i * 120));
  root.addEventListener("focusin", event => animations.forEach((element, animation) => { if (element.contains(event.target)) animation.cancel(); }), { signal });
  const preference = document.querySelector(".motionControl");
  preference?.addEventListener("click", () => { const paused = root.dataset.motionPreference !== "reduce"; root.dataset.motionPreference = paused ? "reduce" : "auto"; preference.setAttribute("aria-pressed", String(paused)); preference.textContent = paused ? "Resume page motion" : "Reduce page motion"; window.dispatchEvent(new Event("graphicrouter:motion")); }, { signal });
  reduced.addEventListener("change", () => { sync(); window.dispatchEvent(new Event("graphicrouter:motion")); }, { signal });
  window.addEventListener("graphicrouter:motion", sync, { signal }); document.addEventListener("visibilitychange", sync, { signal }); sync();
  document.querySelectorAll("[data-scene]").forEach(element => dispose.push(mountScene(element, isReduced)));
  dispose.push(mountHeroProximity(root.querySelector(".hero"), isReduced));
  return () => { listeners.abort(); dispose.forEach(cleanup => cleanup()); animations.forEach((_, animation) => animation.cancel()); animations.clear(); };
}
let cleanup = mountPage();
window.addEventListener("pagehide", () => cleanup());
window.addEventListener("pageshow", event => { if (event.persisted) cleanup = mountPage(); });
