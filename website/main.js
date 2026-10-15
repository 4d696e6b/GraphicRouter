import { nextTab, copyText } from "./interactions.js";

function mountPage() {
  const controller = new AbortController(), { signal } = controller;
  const menu = document.querySelector(".mobileMenu"), summary = menu?.querySelector("summary");
  document.addEventListener("keydown", event => { if (event.key === "Escape" && menu?.open) { menu.open = false; summary.focus(); } }, { signal });
  document.addEventListener("pointerdown", event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; }, { signal });
  menu?.addEventListener("click", event => { if (event.target.closest("a")) menu.open = false; }, { signal });
  const tabs = [...document.querySelectorAll('[role="tab"]')], panels = [...document.querySelectorAll('[role="tabpanel"]')];
  function select(index, focus = false) {
    tabs.forEach((tab, i) => { tab.setAttribute("aria-selected", String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
    if (focus) tabs[index]?.focus();
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
    button.textContent = status === "copied" ? "Copied ✓" : "Copy prompt";
    block.querySelector('[role="status"]').textContent = status === "copied" ? "Copied. Replace the brackets with your own facts." : "Clipboard unavailable. Select and copy the example text above.";
  }, { signal }));
  const revision = document.querySelector("[data-revision-toggle]");
  revision?.addEventListener("click", () => {
    const changed = revision.dataset.changed !== "true"; revision.dataset.changed = String(changed);
    const image = document.querySelector("[data-revision-image]"); image.src = `assets/slide-3${changed ? "-violet" : ""}.svg`;
    image.alt = changed ? "Prepared slide three with violet headline" : "Prepared original slide three";
    document.querySelector("[data-revision-label]").textContent = changed ? "PREPARED VIOLET VERSION" : "PREPARED ORIGINAL";
    document.querySelector("[data-revision-status]").textContent = changed ? "✓ Only the headline changes. Original preserved." : "Original preserved. Try the prepared comparison.";
    revision.textContent = changed ? "Show the original ↺" : "Try the violet headline ↗";
  }, { signal });
  const study = document.querySelector(".compositionStudy"), layers = [...document.querySelectorAll("[data-layer]")];
  layers.forEach(button => button.addEventListener("click", () => {
    study.dataset.selectedLayer = button.dataset.layer;
    layers.forEach(layer => layer.setAttribute("aria-pressed", String(layer === button)));
    document.querySelector("[data-layer-status]").textContent = `${button.textContent.trim().replace(/^[T◯≡]\s*/, "")} highlighted · Workflow illustration, not a live editor.`;
  }, { signal }));
  return () => controller.abort();
}
let cleanup = mountPage();
window.addEventListener("pagehide", () => cleanup());
window.addEventListener("pageshow", event => { if (event.persisted) cleanup = mountPage(); });
