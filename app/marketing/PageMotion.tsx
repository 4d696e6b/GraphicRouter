"use client";
import { useEffect, useState } from "react";

export function MotionPreferenceButton() {
  const [paused, setPaused] = useState(false);
  return <button type="button" aria-pressed={paused} onClick={() => {
    const next = !paused; setPaused(next);
    document.getElementById("marketing-site")!.dataset.motionPreference = next ? "reduce" : "auto";
    window.dispatchEvent(new Event("graphicrouter:motion"));
  }}>{paused ? "Resume page motion" : "Reduce page motion"}</button>;
}

export function PageMotion() {
  useEffect(() => {
    const root = document.getElementById("marketing-site")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const staticMotion = () => reduced.matches || root.dataset.motionPreference === "reduce";
    const animations = new Map<Animation, HTMLElement>();
    function play(target: HTMLElement, title = false, delay = 0) {
      if (staticMotion() || target.contains(document.activeElement)) return;
      const animation = target.animate(title ? [{ transform: "translate3d(0,105%,0) rotate(3deg)" }, { transform: "translate3d(0,0,0) rotate(0)" }] : [{ transform: "translate3d(0,32px,0)" }, { transform: "translate3d(0,0,0)" }], { duration: title ? 1000 : 700, delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
      animations.set(animation, target);
      void animation.finished.then(() => { animation.cancel(); animations.delete(animation); }, () => animations.delete(animation));
    }
    const observer = new IntersectionObserver(entries => entries.filter(entry => entry.isIntersecting).forEach((entry, index) => { observer.unobserve(entry.target); play(entry.target as HTMLElement, false, Math.min(index * 75, 225)); }), { threshold: .08 });
    function sync() {
      root.dataset.motion = staticMotion() ? "reduced" : "enabled";
      if (staticMotion()) { animations.forEach((_, animation) => animation.cancel()); animations.clear(); }
      else animations.forEach((_, animation) => document.hidden ? animation.pause() : animation.play());
    }
    const visibility = new IntersectionObserver(entries => { for (const entry of entries) (entry.target as HTMLElement).dataset.playing = String(entry.isIntersecting && !document.hidden); });
    root.querySelectorAll<HTMLElement>("[data-loop]").forEach(element => visibility.observe(element));
    function hidden() { root.dataset.visible = String(!document.hidden); sync(); }
    function focus(event: FocusEvent) { animations.forEach((target, animation) => { if (event.target instanceof Node && target.contains(event.target)) animation.cancel(); }); }
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(element => observer.observe(element));
    if (!location.hash) root.querySelectorAll<HTMLElement>("[data-title]").forEach((element, index) => play(element, true, 100 + index * 120));
    root.addEventListener("focusin", focus); document.addEventListener("visibilitychange", hidden); reduced.addEventListener("change", sync); window.addEventListener("graphicrouter:motion", sync); hidden();
    return () => { observer.disconnect(); visibility.disconnect(); animations.forEach((_, animation) => animation.cancel()); root.removeEventListener("focusin", focus); document.removeEventListener("visibilitychange", hidden); reduced.removeEventListener("change", sync); window.removeEventListener("graphicrouter:motion", sync); };
  }, []);
  return null;
}
