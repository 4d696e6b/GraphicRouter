// Progressive enhancement for the homepage H1 only. Original text owns layout
// and accessibility; decorative glyphs own proximity transforms.
export function proximityInfluence(distance, radius = 150) {
  const proximity = Math.max(0, Math.min(1, 1 - distance / radius));
  return proximity * proximity;
}

export function interpolateInfluence(current, target, elapsed) {
  const next = current + (target - current) * (1 - Math.exp(-Math.min(64, elapsed) / 70));
  return Math.abs(next - target) < .0005 ? target : next;
}

/** @param {string} text @param {typeof Intl.Segmenter | null} [Segmenter] */
export function graphemes(text, Segmenter = globalThis.Intl?.Segmenter) {
  // Unsupported browsers keep the original text rather than split a combining cluster.
  return Segmenter ? [...new Segmenter(undefined, { granularity: "grapheme" }).segment(text)] : null;
}

export function mountHeroProximity(hero, isReduced) {
  const heading = hero?.querySelector("h1#hero-title");
  if (!heading || !globalThis.ResizeObserver || !globalThis.Intl?.Segmenter) return () => {};
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const controller = new AbortController(), { signal } = controller;
  const titles = [...heading.querySelectorAll("[data-title]")];
  const sources = new Map();
  let glyphs = [], pointer = null, frame = 0, measureFrame = 0;
  let previousTime = 0, disposed = false, entered = false, entranceDone = false;
  const enabled = () => fine.matches && !isReduced() && !document.hidden;

  function paint(glyph, value) {
    glyph.value = value;
    glyph.inner.style.transform = value === 0 ? "" : `translate3d(0,${-3 * value}px,0) scale(${1 + .18 * value})`;
    glyph.anchor.style.zIndex = value > .01 ? String(Math.round(value * 100) + 1) : "";
  }
  function tick(time) {
    frame = 0;
    const elapsed = previousTime ? time - previousTime : 16.67;
    previousTime = time;
    let moving = false;
    for (const glyph of glyphs) {
      const target = pointer && enabled() ? proximityInfluence(Math.hypot(pointer.x - glyph.x, pointer.y - glyph.y)) : 0;
      const value = interpolateInfluence(glyph.value, target, elapsed);
      if (value !== glyph.value) paint(glyph, value);
      if (value !== target) moving = true;
    }
    if (moving) frame = requestAnimationFrame(tick);
    else previousTime = 0;
  }
  function queue() {
    if (!frame && glyphs.length && !disposed) frame = requestAnimationFrame(tick);
  }
  function reset(immediate = false) {
    pointer = null; entered = false;
    if (immediate) {
      cancelAnimationFrame(frame); frame = 0; previousTime = 0;
      glyphs.forEach(glyph => paint(glyph, 0));
    } else queue();
  }
  function removeLayers() {
    reset(true);
    for (const title of titles) title.querySelector(".heroGlyphLayer")?.remove();
    glyphs = [];
    delete heading.dataset.proximity;
  }
  function measure() {
    measureFrame = 0;
    if (disposed || !entranceDone || !enabled()) return;
    // Only runs after layout/font invalidation, never in the pointer handler.
    removeLayers();
    for (const title of titles) {
      let source = sources.get(title);
      if (!source) {
        source = document.createElement("span"); source.className = "heroTextSource";
        source.append(...title.childNodes); title.append(source); sources.set(title, source);
      }
      const node = source.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) continue;
      const bounds = title.getBoundingClientRect(), style = getComputedStyle(title);
      const layer = document.createElement("span"); layer.className = "heroGlyphLayer";
      layer.setAttribute("aria-hidden", "true");
      const range = document.createRange();
      for (const { segment, index } of graphemes(node.textContent)) {
        if (/^\s+$/u.test(segment)) continue;
        range.setStart(node, index); range.setEnd(node, index + segment.length);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const left = rect.left - bounds.left, top = rect.top - bounds.top;
        const anchor = document.createElement("span"), inner = document.createElement("span");
        anchor.className = "heroGlyphAnchor"; inner.className = "heroGlyph";
        anchor.style.cssText = `left:${left}px;top:${top}px;width:${rect.width}px;height:${rect.height}px`;
        inner.textContent = segment;
        if (style.backgroundImage !== "none" && style.color === "rgba(0, 0, 0, 0)") {
          inner.classList.add("heroGlyphGradient");
          inner.style.backgroundImage = style.backgroundImage;
          inner.style.backgroundSize = `${bounds.width}px ${bounds.height}px`;
          inner.style.backgroundPosition = `${-left}px ${-top}px`;
        } else inner.style.color = style.color;
        anchor.append(inner); layer.append(anchor);
        glyphs.push({ anchor, inner, value: 0, rect, x: rect.left + rect.width / 2 + scrollX, y: rect.top + rect.height / 2 + scrollY });
      }
      title.append(layer);
    }
    // Match the original shaped-text baseline, including font ascent/line leading.
    // These one-time reads never include a proximity transform.
    const visualRange = document.createRange();
    for (const glyph of glyphs) {
      visualRange.selectNodeContents(glyph.inner);
      const rect = visualRange.getBoundingClientRect();
      glyph.anchor.style.left = `${parseFloat(glyph.anchor.style.left) + glyph.rect.left - rect.left}px`;
      glyph.anchor.style.top = `${parseFloat(glyph.anchor.style.top) + glyph.rect.top - rect.top}px`;
    }
    heading.dataset.proximity = "ready";
  }
  function invalidate() {
    if (measureFrame || disposed) return;
    measureFrame = requestAnimationFrame(measure);
  }
  function sync() {
    if (!enabled()) { cancelAnimationFrame(measureFrame); measureFrame = 0; removeLayers(); }
    else invalidate();
  }
  hero.addEventListener("pointermove", event => {
    if (!enabled() || !entranceDone || event.pointerType === "touch") return;
    entered = true;
    pointer = { x: event.pageX, y: event.pageY };
    queue();
  }, { passive: true, signal });
  hero.addEventListener("pointerleave", () => reset(), { signal });
  hero.addEventListener("pointercancel", () => reset(true), { signal });
  window.addEventListener("blur", () => reset(true), { signal });
  window.addEventListener("scroll", () => { if (entered) reset(); }, { passive: true, signal });
  document.addEventListener("visibilitychange", () => document.hidden ? reset(true) : sync(), { signal });
  window.addEventListener("graphicrouter:motion", sync, { signal });
  fine.addEventListener("change", sync, { signal });
  window.addEventListener("resize", invalidate, { passive: true, signal });
  const observer = new ResizeObserver(invalidate); observer.observe(heading);
  titles.forEach(title => observer.observe(title));
  document.fonts?.addEventListener("loadingdone", invalidate, { signal });
  document.fonts?.ready.then(() => { if (!disposed) invalidate(); });
  // The entrance keeps its own transform on [data-title]. Start once it settles.
  Promise.allSettled(titles.flatMap(title => (title.getAnimations?.() ?? []).map(animation => animation.finished))).then(() => {
    if (disposed) return;
    entranceDone = true; sync();
  });
  return () => {
    disposed = true; controller.abort(); observer.disconnect();
    cancelAnimationFrame(measureFrame); removeLayers();
    for (const [title, source] of sources) title.replaceChildren(...source.childNodes);
  };
}
