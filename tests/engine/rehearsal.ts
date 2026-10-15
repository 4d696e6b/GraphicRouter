import { createHash } from "node:crypto";
import type { Asset, DeckBlueprint } from "../../src/contracts";
import { engine } from "../../src/engine";
import { escapeXml } from "../../src/engine/svg";
import { readPptx } from "./read-pptx";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const dataUrl = (mime: string, bytes: Uint8Array | string) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export function rehearsalProof(before: DeckBlueprint, after: DeckBlueprint, originalPptx: Uint8Array, revisedPptx: Uint8Array) {
  const original = before.slides.flatMap((slide) => slide.elements), revised = after.slides.flatMap((slide) => slide.elements);
  const changedElementIds = original.filter((element) => !same(element, revised.find((value) => value.id === element.id))).map((element) => element.id);
  const oldTarget = original.find((element) => element.id === "slide3.headline"), newTarget = revised.find((element) => element.id === "slide3.headline");
  const identicalAsideFromPaint = oldTarget?.type === "text" && newTarget?.type === "text" && same({ ...oldTarget, color: newTarget.color }, newTarget);
  const validHeader = same({ ...before, version: after.version, changes: after.changes, validationIssues: after.validationIssues, slides: after.slides }, after);
  const originalZip = readPptx(originalPptx), revisedZip = readPptx(revisedPptx);
  const unchangedSlideIds = before.slides.filter((slide) => same(slide, after.slides.find((value) => value.id === slide.id))).map((slide) => slide.id);
  const unchangedPptxPages = [1, 2, 4, 5].filter((page) => {
    const path = `ppt/slides/slide${page}.xml`;
    return originalZip.has(path) && originalZip.get(path) === revisedZip.get(path);
  });
  if (!validHeader || before.deckId !== after.deckId || after.version !== before.version + 1 || original.length !== revised.length || changedElementIds.length !== 1 || changedElementIds[0] !== "slide3.headline" || !identicalAsideFromPaint || newTarget?.type !== "text" || !("hex" in newTarget.color) || newTarget.color.hex.toUpperCase() !== "#7C3AED" || unchangedSlideIds.length !== 4 || unchangedPptxPages.length !== 4) {
    throw new Error("The prepared replay failed its exact-revision proof. Do not present this package as a one-element change.");
  }
  const slide3 = revisedZip.get("ppt/slides/slide3.xml");
  const headlineShape = slide3?.match(/<p:sp>[\s\S]*?<\/p:sp>/g)?.find((shape) => shape.includes('name="slide3.headline"'));
  if (!headlineShape?.includes('val="7C3AED"')) throw new Error("The revised PowerPoint does not contain the expected named headline and colour.");
  return {
    kind: "precomputed-engine-replay" as const,
    limitation: "Prepared engine outputs, not a live ChatGPT/Canva call or proof of imported shape editability.",
    deckId: before.deckId, versions: { original: before.version, revised: after.version },
    changedElementIds, unchangedSlideIds, unchangedPptxPages,
    originalBlueprintSha256: digest(before), revisedBlueprintSha256: digest(after),
    originalPptxSha256: createHash("sha256").update(originalPptx).digest("hex"),
    revisedPptxSha256: createHash("sha256").update(revisedPptx).digest("hex"),
  };
}

/** Test/handoff artifact only. There are no routes, auth, MCP calls, or fake API results. */
export function buildRehearsal(before: DeckBlueprint, after: DeckBlueprint, assets: Asset[], pptx: { original: Uint8Array; revised: Uint8Array }) {
  const snapshot = JSON.stringify(before);
  const proof = rehearsalProof(before, after, pptx.original, pptx.revised);
  const frames = before.slides.map((slide, index) => ({
    headline: before.input.slides[index].headline.replace(/\n/g, " "),
    notes: slide.notes,
    views: Object.fromEntries((["layout", "content", "finished"] as const).map((stage) => [stage, dataUrl("image/svg+xml", engine.renderSlideSvg(slide, before.theme, stage, assets))])),
  }));
  const revisedSlide = dataUrl("image/svg+xml", engine.renderSlideSvg(after.slides[2], after.theme, "finished", assets));
  if (JSON.stringify(before) !== snapshot) throw new Error("Replay generation changed the original snapshot.");
  const payload = { frames, revisedSlide, proof, title: before.input.title };
  const notes = before.slides.map((slide) => `${slide.id}\n\nThree-minute core\n${slide.notes.core}\n\nFive-minute expanded\n${slide.notes.expanded}`).join("\n\n---\n\n");
  const fileType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const thumbnails = frames.map((frame, index) => `<button type="button" class="thumbnail" data-slide="${index}" aria-label="Slide ${index + 1}: ${escapeXml(frame.headline)}" aria-pressed="${index === 0}"><img alt="" src="${frame.views.finished}"/><span>${String(index + 1).padStart(2, "0")} ${escapeXml(frame.headline)}</span></button>`).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>GraphicRouter / offline rehearsal</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#FAF9F6;color:#191724;font:16px Arial,sans-serif}button,select,a{font:inherit}button,select{border:1px solid #DBD6E5;background:#FFF;color:#191724;border-radius:8px;padding:10px 14px;cursor:pointer}button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #7C3AED;outline-offset:3px}button[aria-pressed=true]{border-color:#7C3AED;background:#F0E8FF}header{padding:24px 32px;border-bottom:1px solid #E1DDE7;background:#FFF}header strong{letter-spacing:.1em;font-size:13px;color:#6D28D9}.notice{font-size:14px;line-height:1.6;color:#62606B;max-width:1000px;margin:12px 0 0}.layout{max-width:1500px;margin:auto;padding:28px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:28px}nav{display:flex;flex-direction:column;gap:12px}.thumbnail{text-align:left;padding:7px;font-size:12px;line-height:1.5}.thumbnail img{display:block;width:100%;margin-bottom:7px;border-radius:4px}.thumbnail span{display:block;padding:0 4px}.tools{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:16px}.tools label{font-size:14px}.tools select{margin-left:5px}#version{margin-left:auto;border:1px solid #DCD6E6;border-radius:20px;padding:7px 12px;font-size:13px;background:white}#slide{display:block;width:100%;aspect-ratio:16/9;border:1px solid #E1DDE7;background:#FFF}#status{min-height:48px;line-height:1.6;color:#62606B;font-size:14px;margin:14px 0}.action{background:#7C3AED;color:#FFF;border-color:#7C3AED}h1{font-size:24px;letter-spacing:-.03em;margin:0 0 18px}.bottom{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:22px}details,.timer{background:#FFF;border:1px solid #E1DDE7;border-radius:12px;padding:18px}summary{cursor:pointer;font-weight:700}#notes{white-space:pre-wrap;line-height:1.75;color:#494550}.timer label{font-size:13px;display:block}.timer select{width:100%;margin:10px 0}.clock{font-size:38px;font-variant-numeric:tabular-nums;margin:14px 0}.downloads{display:flex;flex-wrap:wrap;gap:16px;margin-top:22px;font-size:14px}.downloads a{color:#6D28D9}.timer p{font-size:12px;line-height:1.6;color:#62606B}#slideCount{font-size:13px;color:#62606B}@media(max-width:800px){header{padding:20px}.layout{display:block;padding:16px}nav{flex-direction:row;overflow:auto;margin-bottom:20px}.thumbnail{flex:0 0 160px}.bottom{grid-template-columns:1fr}#version{margin-left:0}h1{font-size:21px}}
</style></head><body>
<header><strong>GRAPHICROUTER / OFFLINE REHEARSAL</strong><p class="notice">Precomputed engine outputs. This replay makes no live ChatGPT or Canva calls. Use it to rehearse or as a clearly labelled engine-only backup; account-level verification remains separate.</p></header>
<main class="layout"><nav aria-label="Slides">${thumbnails}</nav><section aria-label="Presentation rehearsal"><h1 id="headline"></h1>
<div class="tools"><button id="previous" type="button" aria-label="Previous slide">←</button><span id="slideCount"></span><button id="next" type="button" aria-label="Next slide">→</button><label>Construction stage <select id="stage"><option value="layout">Layout</option><option value="content">Content</option><option value="finished" selected>Finished</option></select></label><span id="version">Prepared v${before.version}</span></div>
<img id="slide" alt=""/><p id="status" role="status"></p>
<div class="tools"><button id="revision" type="button" class="action">Replay verified headline edit</button><button id="original" type="button">Return to original</button></div>
<div class="bottom"><details open><summary>Speaker notes</summary><p id="notes"></p></details><aside class="timer"><label for="duration">Rehearsal length</label><select id="duration"><option value="180">Three-minute core</option><option value="300">Five-minute expanded</option></select><div class="clock" id="clock" role="timer" aria-label="Rehearsal time remaining">03:00</div><button type="button" id="timer">Start timer</button> <button type="button" id="reset">Reset</button><p>Allow 30 seconds for the demonstration. The timer measures your rehearsal; it does not confirm speaking pace.</p></aside></div>
<div class="downloads"><a download="graphicrouter-pitch-v1.pptx" href="${dataUrl(fileType, pptx.original)}">Download original PPTX</a><a download="graphicrouter-pitch-v2-violet.pptx" href="${dataUrl(fileType, pptx.revised)}">Download revised PPTX</a><a download="speaker-notes.txt" href="${dataUrl("text/plain;charset=utf-8", notes)}">Download notes</a><a download="revision-proof.json" href="${dataUrl("application/json", JSON.stringify(proof, null, 2))}">Download verification report</a></div>
</section></main>
<script id="rehearsal-data" type="application/json">${scriptJson(payload)}</script>
<script>
"use strict";
const data=JSON.parse(document.getElementById("rehearsal-data").textContent);
let selected=0,revised=false,elapsed=0,started=null;
const byId=(id)=>document.getElementById(id),stage=byId("stage"),duration=byId("duration");
function render(){const frame=data.frames[selected],showRevision=revised&&selected===2&&stage.value==="finished";byId("headline").textContent=frame.headline;byId("slide").src=showRevision?data.revisedSlide:frame.views[stage.value];byId("slide").alt="Slide "+(selected+1)+", "+stage.value+(showRevision?", prepared violet revision":"");byId("slideCount").textContent=(selected+1)+" / "+data.frames.length;byId("version").textContent="Prepared v"+(revised?data.proof.versions.revised:data.proof.versions.original);byId("notes").textContent=duration.value==="180"?frame.notes.core:frame.notes.expanded;byId("status").textContent=revised?"Verified prepared revision: only slide 3’s headline paint changed. Four other slide blueprints and exported slide files stayed unchanged. This is a replay, not a live tool call.":"Original prepared snapshot. Choose a construction stage or replay the verified edit. Use arrow keys to change slides.";document.querySelectorAll("[data-slide]").forEach((button)=>button.setAttribute("aria-pressed",String(Number(button.dataset.slide)===selected)));byId("previous").disabled=selected===0;byId("next").disabled=selected===data.frames.length-1;}
document.querySelectorAll("[data-slide]").forEach((button)=>button.addEventListener("click",()=>{selected=Number(button.dataset.slide);render();}));
byId("previous").addEventListener("click",()=>{selected=Math.max(0,selected-1);render();});byId("next").addEventListener("click",()=>{selected=Math.min(data.frames.length-1,selected+1);render();});
stage.addEventListener("change",render);byId("revision").addEventListener("click",()=>{revised=true;selected=2;stage.value="finished";render();});byId("original").addEventListener("click",()=>{revised=false;render();});
document.addEventListener("keydown",(event)=>{if(event.target.closest("input,select,textarea"))return;if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();selected=Math.max(0,Math.min(data.frames.length-1,selected+(event.key==="ArrowRight"?1:-1)));render();}});
function tick(){const seconds=elapsed+(started===null?0:(performance.now()-started)/1000),remaining=Math.max(0,Math.ceil(Number(duration.value)-seconds));byId("clock").textContent=String(Math.floor(remaining/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");if(remaining===0&&started!==null){elapsed=seconds;started=null;byId("timer").textContent="Finished";byId("timer").disabled=true;}}
byId("timer").addEventListener("click",()=>{if(started===null){started=performance.now();byId("timer").textContent="Pause";}else{elapsed+=(performance.now()-started)/1000;started=null;byId("timer").textContent="Resume";}tick();});
function resetTimer(){elapsed=0;started=null;byId("timer").textContent="Start timer";byId("timer").disabled=false;tick();}
byId("reset").addEventListener("click",resetTimer);duration.addEventListener("change",()=>{resetTimer();render();});setInterval(tick,250);render();tick();
</script></body></html>`;
  return { html, proof };
}
