"use client";
import { useEffect, useRef, useState } from "react";
import type { PreviewStage } from "../../src/contracts";
import type { DemoData } from "./types";
import { nextTab, prompts } from "./content";
import { CopyPrompt } from "./CopyPrompt";
import s from "./landing.module.css";

const panels = [
  { label: "Plan", title: "A clear story before you compose.", description: "Start with the audience, the point, and the facts you can support. Five roles give your presentation a deliberate direction.", chips: ["Supplied facts", "Five slide roles", "Core + expanded notes"] },
  { label: "Preview", title: "See how your story takes shape.", description: "Review the layout, content, and finished composition. Every view comes from the same element blueprint that drives PowerPoint export.", chips: ["One blueprint", "Three preview stages", "Five slides"] },
  { label: "Refine", title: "One detail. A focused change.", description: "“Change only the headline on slide three to violet.” Compare prepared output while the previous version and unrelated content stay intact.", chips: ["Named elements", "Focused revisions", "Original preserved"] },
];
export function GuidedDemo({ data }: { data: DemoData }) {
  const [tab, setTab] = useState(0), [stage, setStage] = useState<PreviewStage>("finished"), [slide, setSlide] = useState(2), [changed, setChanged] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { const hash = () => { if (location.hash === "#revision") setTab(2); }; hash(); window.addEventListener("hashchange", hash); return () => window.removeEventListener("hashchange", hash); }, []);
  return <section className={s.showcase} id="demo" aria-labelledby="demo-heading" data-loop>
    <div className={s.showcaseIntro}><p className={s.eyebrow}>THE PRESENTATION, WITH INTENTION</p><h2 id="demo-heading">See the bigger picture.</h2><p>A few considered steps. A story you can direct.</p></div>
    <span id="revision" className={s.anchor}/>
    <div className={s.showcaseTabs} role="tablist" aria-label="Explore the GraphicRouter workflow">
      {panels.map((panel, i) => <button key={panel.label} ref={element => { tabs.current[i] = element; }} role="tab" id={`workflow-tab-${i}`} aria-controls={`workflow-panel-${i}`} aria-selected={tab === i} tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)} onKeyDown={event => { const next = nextTab(event.key, i, panels.length); if (next !== null) { event.preventDefault(); setTab(next); tabs.current[next]?.focus(); } }}><span>0{i + 1}</span>{panel.label}<span aria-hidden="true">↗</span></button>)}
    </div>
    <div className={s.showcaseBody}>{panels.map((panel, i) => <div className={s.showcasePanel} id={`workflow-panel-${i}`} role="tabpanel" aria-labelledby={`workflow-tab-${i}`} hidden={tab !== i} key={panel.label} tabIndex={0}>
      <div className={s.showcaseCopy}><h3>{panel.title}</h3><p>{panel.description}</p><ul>{panel.chips.map(chip => <li key={chip}>{chip}</li>)}</ul><a href={i === 0 ? "/briefing" : "#quick-start"}>{i === 0 ? "Start with your brief" : "Find your next prompt"} ↗</a></div>
      <div className={s.showcaseVisual}>
        <div className={s.showcaseArt} aria-hidden="true"><img src={data.views.finished[i]} alt=""/></div>
        <div className={s.productWindow}>
          <div className={s.windowBar}><span aria-hidden="true">● ● ●</span><span>PREPARED EXAMPLE / {panel.label.toUpperCase()}</span></div>
          {i === 0 ? <div className={s.planWindow}><p className={s.eyebrow}>{data.audience}</p><h4>{data.title}</h4><p>{data.idea}</p><ol>{data.slides.map((item, index) => <li key={item.role}><span>0{index + 1}</span><div><strong>{["Problem", "Answer", "Workflow", "Proof", "Next step"][index]}</strong><p>{item.headline.replaceAll("\n", " ")}</p></div></li>)}</ol></div> : i === 1 ? <>
            <div className={s.demoToolbar}><span>SLIDE {slide + 1} / 5</span><div role="group" aria-label="Preview stage">{(["layout", "content", "finished"] as const).map(value => <button aria-pressed={stage === value} key={value} onClick={() => setStage(value)}>{value}</button>)}</div></div>
            <img className={s.demoSlide} src={data.views[stage][slide]} alt={`Prepared slide ${slide + 1}, ${stage} preview`}/>
            <div className={s.slideRail} role="group" aria-label="Select a sample slide">{data.slides.map((_, index) => <button key={index} aria-label={`Preview slide ${index + 1}`} aria-pressed={slide === index} onClick={() => setSlide(index)}>0{index + 1}</button>)}</div>
          </> : <>
            <div className={s.demoToolbar}><span>SLIDE 3 / PREPARED v{changed ? 2 : 1}</span><span className={s.violetSwatch}>#7C3AED</span></div>
            <img className={s.demoSlide} src={changed ? data.violet : data.views.finished[2]} alt={`Prepared slide three ${changed ? "v2 with violet headline" : "v1 original"}`}/>
            <div className={s.directionCard}><p role="status">{changed ? "✓ Prepared v2 · only slide3.headline changed · v1 preserved" : "Prepared v1 · original headline"}</p><button onClick={() => setChanged(!changed)}>{changed ? "Reset ↺" : "Try it ↗"}</button></div>
          </>}
          <p className={s.windowDetail}>{i === 0 ? "Sample facts and slide content come from the existing local workflow pitch." : i === 1 ? "Actual engine previews. This sample does not create a deck." : "Switching versions displays prepared output; no new version is saved."}</p>
        </div>
      </div>
    </div>)}</div>
    <div className={s.showcaseFooter}><span>Prepared demo · No live ChatGPT or Canva calls, saves, or imports.</span><a href="/briefing">Start your story →</a></div>
  </section>;
}
export function PromptLibrary() {
  useEffect(() => { const open = () => { if (location.hash.startsWith("#prompt-")) { const item = document.getElementById(location.hash.slice(1)); if (item instanceof HTMLDetailsElement) item.open = true; } }; open(); window.addEventListener("hashchange", open); return () => window.removeEventListener("hashchange", open); }, []);
  return <div className={s.promptLibrary} id="prompts"><h3>Your next conversation, ready to start.</h3><p>Replace brackets with your own facts. Use these when GraphicRouter is available in your ChatGPT account.</p><details id="prompt-create"><summary>Create a story <span>↗</span></summary><CopyPrompt text={prompts.create} label="create story prompt"/></details><details id="prompt-revise"><summary>Change one detail <span>↗</span></summary><CopyPrompt text={prompts.revise} label="violet headline prompt"/></details><details id="prompt-export"><summary>Prepare the handoff <span>↗</span></summary><CopyPrompt text={prompts.export} label="export and handoff prompt"/></details></div>;
}
