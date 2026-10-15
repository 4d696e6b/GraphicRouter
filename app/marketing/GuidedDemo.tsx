"use client";

import { useState } from "react";
import type { PreviewStage } from "../../src/contracts";
import styles from "./landing.module.css";

export function GuidedDemo({ views, violet }: { views: Record<PreviewStage, string[]>; violet: Record<PreviewStage, string> }) {
  const [stage, setStage] = useState<PreviewStage>("finished");
  const [slide, setSlide] = useState(2);
  const [changed, setChanged] = useState(false);
  const activeViolet = changed && slide === 2 && stage === "finished";
  const svg = changed && slide === 2 ? violet[stage] : views[stage][slide];
  return <div className={styles.demoWrap} id="demo">
    <div className={styles.demoTopline}><span><i aria-hidden="true"/> INTERACTIVE PRODUCT PREVIEW</span><span>PREPARED SAMPLE</span></div>
    <div className={styles.demoWindow}>
      <div className={styles.windowBar}><span className={styles.windowDots} aria-hidden="true">● ● ●</span><span>GraphicRouter / the presentation plan</span><span aria-hidden="true">↗</span></div>
      <div className={styles.demoToolbar}><span>THE WORKFLOW <span className={styles.version}>v{changed ? 2 : 1}</span></span><div role="group" aria-label="Preview stage">{(["layout", "content", "finished"] as const).map(value => <button key={value} aria-pressed={stage === value} onClick={() => setStage(value)}>{value}</button>)}</div></div>
      <div className={styles.slideCanvas}><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`Prepared slide ${slide + 1}, ${stage} preview${activeViolet ? ", violet headline" : ""}`} width={1600} height={900}/></div>
      <div className={styles.slideRail}><span>5 SLIDES. ONE STORY.</span><div role="group" aria-label="Select a sample slide">{views.finished.map((_, i) => <button aria-label={`Preview slide ${i + 1}`} aria-pressed={slide === i} key={i} onClick={() => setSlide(i)}>{String(i + 1).padStart(2, "0")}</button>)}</div></div>
    </div>
    <div className={styles.directionCard}><span className={styles.directionIcon} aria-hidden="true">↳</span><div><p>“Change only the headline on slide three to violet.”</p><div className={styles.editResult} role="status">{changed ? "✓ Prepared v2 · headline changed · v1 preserved" : "A precise request. A focused revision."}</div></div><button onClick={() => { if (changed) setChanged(false); else { setChanged(true); setSlide(2); setStage("finished"); } }}>{changed ? "Reset" : "Try it"}<span aria-hidden="true"> {changed ? "↺" : "↗"}</span></button></div>
    <p className={styles.demoCaption}>Rendered by GraphicRouter’s real slide engine. This guided sample makes no ChatGPT or Canva calls.</p>
  </div>;
}

const prompts = [
  { label: "01 / Create a story", title: "Give your idea a clear direction.", text: "Create a five-slide, three-minute pitch for [audience] about [idea]. Our goal is [goal]. Use only these verified facts: [facts]. Mark missing evidence as an open question. Include core and expanded speaker notes." },
  { label: "02 / Direct a detail", title: "Change one thing. Keep the rest.", text: "Change only the headline on slide three to violet (#7C3AED). Keep all other elements and notes unchanged, and preserve the previous version." },
  { label: "03 / Prepare the handoff", title: "Take your story with you.", text: "Export the current saved version as PowerPoint with speaker notes. If Canva is connected, start a separate import and show its status. Keep the downloads available while the import processes." },
];
export function PromptLibrary() {
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState(false);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(prompts[index].text); setCopied(index); setError(false); }
    catch { setError(true); setCopied(null); }
  }
  return <><div className={styles.prompts}>{prompts.map((prompt, index) => <article key={prompt.label}><p className={styles.eyebrow}>{prompt.label}</p><h3>{prompt.title}</h3><p className={styles.promptText}>{prompt.text}</p><button onClick={() => copy(index)}>{copied === index ? "Copied ✓" : "Copy prompt ↗"}</button></article>)}</div><p className={styles.copyStatus} role="status">{error ? "Clipboard unavailable. Select and copy the prompt text above." : copied !== null ? "Prompt copied. Replace bracketed details with your own facts before using it." : "Example prompts · replace the brackets with your own facts."}</p></>;
}
