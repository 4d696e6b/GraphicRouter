"use client";
import { useEffect, useRef } from "react";
import { tabletDeviceLayout, tabletStoryFrame } from "./scene";
import type { TabletData } from "./types";
import s from "./landing.module.css";

const captions = ["01 / THE BRIEF", "02 / SEE THE PLAN", "03 / DIRECT THE DETAILS"];

export function TabletStory({ data }: { data: TabletData }) {
  const root = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), caption = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const element = root.current!, runway = track.current!, frame = stage.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const staticMotion = () => reduced.matches || document.getElementById("marketing-site")?.dataset.motionPreference === "reduce";
    let visible = false, pending = 0;
    function layout() {
      const values = tabletDeviceLayout(frame.clientWidth, frame.clientHeight);
      element.style.setProperty("--device-size", `${values.size}px`);
      element.style.setProperty("--device-left", `${values.left}px`);
      element.style.setProperty("--device-top", `${values.top}px`);
    }
    function paint() {
      pending = 0;
      if (!visible || document.hidden || staticMotion()) return;
      const bounds = runway.getBoundingClientRect();
      const story = tabletStoryFrame(-bounds.top / Math.max(1, bounds.height - innerHeight));
      element.style.setProperty("--camera-zoom", String(story.zoom));
      element.style.setProperty("--screen-offset", String(story.offset));
      element.style.setProperty("--swipe", String(story.swipe));
      element.style.setProperty("--swipe-y", String(story.swipeY));
      frame.dataset.chapter = String(story.chapter);
      frame.dataset.progress = story.progress.toFixed(3);
      if (caption.current) caption.current.textContent = captions[story.chapter];
    }
    function queue() { if (!pending && visible && !document.hidden && !staticMotion()) pending = requestAnimationFrame(paint); }
    function sync() {
      element.dataset.motion = staticMotion() ? "reduced" : "scroll";
      element.dataset.playing = String(visible && !document.hidden && !staticMotion());
      if (pending) cancelAnimationFrame(pending); pending = 0;
      if (staticMotion()) {
        element.style.setProperty("--camera-zoom", "0"); element.style.setProperty("--screen-offset", "0"); element.style.setProperty("--swipe", "0");
        frame.dataset.chapter = "0"; if (caption.current) caption.current.textContent = captions[0];
      }
      layout(); queue();
    }
    const resize = new ResizeObserver(() => { layout(); queue(); }); resize.observe(frame);
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }); observer.observe(frame);
    window.addEventListener("scroll", queue, { passive: true }); window.addEventListener("resize", layout);
    document.addEventListener("visibilitychange", sync); reduced.addEventListener("change", sync); window.addEventListener("graphicrouter:motion", sync); sync();
    return () => { if (pending) cancelAnimationFrame(pending); resize.disconnect(); observer.disconnect(); window.removeEventListener("scroll", queue); window.removeEventListener("resize", layout); document.removeEventListener("visibilitychange", sync); reduced.removeEventListener("change", sync); window.removeEventListener("graphicrouter:motion", sync); };
  }, []);
  return <div ref={root} className={s.stackExperience}>
    <div ref={track} className={s.tabletScrollTrack}>
      <div ref={stage} className={s.tabletStage} data-chapter="0" aria-hidden="true">
        <div className={s.tabletBackdrop}><div className={s.tabletGrid}/><div className={s.tabletOrbit}/><div className={`${s.tabletOrbit} ${s.tabletOrbitInner}`}/></div>
        <div className={s.tabletSceneRail}>
          <div className={`${s.tabletRailColumn} ${s.tabletRailLeft}`}>
            <div className={`${s.tabletRailCard} ${s.tabletRailStack}`}><img src={data.cover} alt=""/><p className={s.tabletRailEyebrow}>YOUR STORY</p><strong>5 slides.<br/>One story.</strong><p>From the problem to the next step.</p></div>
            <div className={`${s.tabletRailCard} ${s.tabletRailRecipe}`}><span className={s.tabletRailSymbol}>▤</span><strong>3 preview stages</strong><p>Layout. Content. Finished.</p></div>
          </div>
          <div className={`${s.tabletRailColumn} ${s.tabletRailRight}`}>
            <div className={`${s.tabletRailCard} ${s.tabletRailPlan}`}><p className={s.tabletRailEyebrow}>YOU’RE IN CONTROL</p><strong>Change one detail.</strong><p className={s.tabletRailSteps}>01  Name the element<br/>02  Direct the change<br/>03  Keep the original</p><span className={s.tabletRailFootnote}>FOCUSED · VERSIONED · YOUR CALL</span></div>
            <div className={`${s.tabletRailCard} ${s.tabletRailGuide}`}><img src={data.content} alt=""/><strong>PowerPoint + speaker notes</strong><p>A working handoff for your next stage.</p></div>
          </div>
        </div>
        <div className={s.tabletSceneLabel}>BRIEF · PREVIEW · REFINE</div>
        <div className={s.tabletDevice}>
          <img className={s.tabletHand} src="/marketing/tablet-hand.png" alt="" width={1254} height={1254}/>
          <div className={s.tabletScreen}><div className={s.tabletScreenContent}>
            <div className={`${s.tabletStoryPanel} ${s.tabletOverviewPanel}`}>
              <div className={s.tabletScreenHeader}><strong>GraphicRouter <span>↗</span></strong><span>Brief / Preview / Refine</span></div>
              <div className={s.tabletOverviewHero}><p className={s.tabletChapterEyebrow}>01 / THE BRIEF</p><h2 className={s.tabletPanelTitle}>Your story.<br/>Ready to present.</h2><p className={s.tabletPanelDescription}>{data.idea}</p><img src={data.cover} alt=""/></div>
              <div className={s.tabletBriefFacts}><div><span>PROJECT</span><strong>{data.title}</strong></div><div><span>AUDIENCE</span><strong>{data.audience}</strong></div><div><span>DIRECTION</span><strong>Five slides. Supplied facts. One clear next step.</strong></div></div>
            </div>
            <div className={s.tabletStoryPanel}>
              <p className={s.tabletChapterEyebrow}>02 / SEE THE PLAN</p><h2 className={s.tabletPanelTitle}>From structure<br/>to the story.</h2><p className={s.tabletPanelDescription}>One blueprint drives every preview. Real engine output, prepared for this demo.</p>
              <div className={s.tabletPreviews}>{(["layout", "content", "finished"] as const).map((view, i) => <div key={view}><span>0{i + 1} / {view}</span><img src={data[view]} alt=""/></div>)}</div>
            </div>
            <div className={s.tabletStoryPanel}>
              <p className={s.tabletChapterEyebrow}>03 / DIRECT THE DETAILS</p><h2 className={s.tabletPanelTitle}>A small change.<br/>Precisely.</h2><p className={s.tabletPanelDescription}>“Change only the headline on slide three to violet.”</p>
              <div className={s.tabletRevision}><span>v1 / ORIGINAL PRESERVED</span><img src={data.finished} alt=""/><span>v2 / PREPARED VIOLET REVISION</span><img src={data.violet} alt=""/><p>Only slide3.headline changes. Other content stays intact.</p></div>
              <p className={s.tabletPanelFooter}>Prepared output. No live calls, saves, or imports.</p>
            </div>
          </div></div>
          <div className={s.tabletGestureWrap}><img src="/marketing/tablet-gesture.png" alt="" width={1254} height={1254}/></div>
        </div>
        <p ref={caption} className={s.tabletStoryCaption}>{captions[0]}</p>
        <div className={s.tabletChapterDots}>{captions.map((item, i) => <span key={item} data-chapter={i}/>)}</div>
      </div>
    </div>
    <ol className={s.chapterSummary} aria-label="The tablet story in three chapters">
      <li><strong>01 / Brief</strong><p>{data.title}. A five-slide story for {data.audience}, using supplied facts.</p></li>
      <li><strong>02 / Preview</strong><p>Layout, content, and finished previews use the same blueprint.</p><img src={data.finished} alt="Prepared original slide three"/></li>
      <li><strong>03 / Refine</strong><p>The prepared revision colours only slide3.headline violet. Earlier output is preserved.</p><img src={data.violet} alt="Prepared slide three with violet headline"/></li>
    </ol>
    <div className={s.tabletCaption}><h2>From the big picture to the details.</h2><p>Shape the story, see the plan, and direct a precise change. Explore prepared output from GraphicRouter’s real engine.</p><a href="#demo">Explore the guided demo →</a></div>
  </div>;
}
