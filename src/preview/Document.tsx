"use client";
import { useState } from "react";
import type { DocumentToolName } from "../contracts";
import type { DocumentData } from "./document-data";
export function Document({data,invoke}:{data:DocumentData;invoke?:(name:DocumentToolName,pageIds?:string[])=>Promise<void>}){
  const[selected,setSelected]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const doc=data.result.blueprint,page=doc.pages[Math.min(selected,doc.pages.length-1)],state=data.result.canva;
  const preview=data.previews.find(p=>p.id===page.id)?.svg;
  const img=(svg:string)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const button={padding:"10px 14px",border:"1px solid #d8d3e4",borderRadius:8,background:"white",color:"#302744",font:"inherit",cursor:"pointer"};
  async function run(name:DocumentToolName){if(!invoke||busy)return;setBusy(true);setError("");try{await invoke(name,[page.id]);}catch(e){setError(e instanceof Error?e.message:"The request failed; refresh before retrying a write.");}finally{setBusy(false);}}
  return <main style={{fontFamily:"Arial,sans-serif",maxWidth:1180,margin:"auto",padding:24,color:"#211c2e",background:"#faf9f6"}}>
    <p style={{color:"#6d28d9",fontWeight:700,fontSize:12}}>GRAPHICROUTER · {doc.format.replace(/_/g," ").toUpperCase()} · VERSION {doc.version}</p>
    <h1>{doc.title}</h1><p>{doc.pages.length} pages · {doc.canvas.width} × {doc.canvas.height} · {doc.pages.reduce((sum,p)=>sum+p.elements.length,0)} native source objects</p>
    <p>{doc.designIntent}</p>
    <section aria-label="Canva delivery" style={{background:"#ede9f5",padding:18,borderRadius:12,lineHeight:1.6}}>
      <strong>{state.status==="succeeded"?"Canva import complete. Check every page's text layers before delivery.":state.status==="pending"?"Importing this document into Canva…":state.status==="connection_required"?"Connect Canva to import this document.":"Review the story and native pages, then import into Canva."}</strong>
      {state.status==="succeeded"&&<p><a href={state.editUrl} target="_blank" rel="noreferrer">Open Canva editor →</a></p>}
      {state.status==="connection_required"&&<p><a href={state.connectUrl} target="_blank" rel="noreferrer">Connect Canva →</a></p>}
      {state.status==="failed"&&<p role="alert">{state.message}</p>}
    </section>
    {data.requirementCoverage&&data.requirementCoverage.registered>0&&<section aria-label="Requirement coverage" style={{padding:"16px 0",lineHeight:1.6}}><strong>Requirements: {data.requirementCoverage.covered} of {data.requirementCoverage.registered} checked · {data.requirementCoverage.blocking} mandatory items unresolved.</strong><p>{data.requirementCoverage.extractionComplete?"Original-brief extraction reported complete; compare the original if unsure.":"Original-brief extraction is still in progress."} These are registered checks; visual and factual review remain separate.</p></section>}
    <nav aria-label="Page storyboard" style={{display:"flex",gap:10,overflowX:"auto",padding:"20px 0"}}>{doc.pages.map((p,i)=>{const thumb=data.previews.find(t=>t.id===p.id)?.svg;return <button key={p.id} type="button" aria-pressed={p.id===page.id} onClick={()=>setSelected(i)} style={{...button,minWidth:160,maxWidth:200,borderColor:p.id===page.id?"#6d28d9":"#d8d3e4"}}>{thumb&&<img src={img(thumb)} alt="" style={{width:140,height:90,objectFit:"contain"}}/>}<span style={{display:"block"}}>{i+1}. {p.title}</span></button>;})}</nav>
    <section aria-label="Selected page"><h2>{page.title}</h2><p>{page.section&&`${page.section} · `}Message: {page.message}</p>{preview?<img src={img(preview)} alt={`${page.title}: composed native source page`} style={{display:"block",width:"100%",maxHeight:720,objectFit:"contain"}}/>:<p role="alert">{data.previewError??(data.partialPreviews?"This page preview is loaded on request to keep long decks responsive. Select Load this page preview below; its saved content and notes are retained.":"Preview unavailable. Saved page content is preserved.")}</p>}
      {!preview&&invoke&&<button type="button" style={button} disabled={busy} onClick={()=>run("get_document")}>Load this page preview</button>}
      <details open><summary>Speaker / companion notes</summary><p style={{whiteSpace:"pre-wrap",lineHeight:1.7}}>{page.notes||"No notes supplied."}</p></details>
      <p>{page.elements.filter(e=>e.type==="text").length} text layers · {page.elements.filter(e=>e.type==="shape"||e.type==="line").length} shapes/lines · {page.elements.filter(e=>e.type==="image").length} images. Source counts do not verify imported Canva layers.</p>
    </section>
    <details><summary>Story and review</summary><ol>{doc.pages.map(p=><li key={p.id}>{p.section&&`${p.section}: `}{p.message}</li>)}</ol>{data.result.review.length>0&&<ul>{data.result.review.map((r,i)=><li key={i}>{r.path}: {r.message}</li>)}</ul>}</details>
    {doc.changes.length>0&&<section><h2>Changes in v{doc.version}</h2><ul>{doc.changes.map((c,i)=><li key={i}>{c.target}: {c.description}</li>)}</ul></section>}
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:24}}>{invoke&&<><button type="button" style={button} disabled={busy} onClick={()=>run("export_document")}>Prepare PowerPoint and notes</button>{state.status!=="succeeded"&&state.status!=="pending"&&!(state.status==="failed")&&<button type="button" style={button} disabled={busy} onClick={()=>run("send_document_to_canva")}>Import native pages into Canva</button>}<button type="button" style={button} disabled={busy} onClick={()=>run("get_document")}>Refresh saved document</button></>}{data.result.files&&<><a href={data.result.files.pptxUrl} target="_blank" rel="noreferrer">Download PowerPoint</a><a href={data.result.files.notesUrl} target="_blank" rel="noreferrer">Download notes</a></>}</div>
    {busy&&<p role="status">Working…</p>}{error&&<p role="alert">{error}</p>}
    <p style={{fontSize:13,lineHeight:1.7,color:"#62596e"}}>Each imported version creates a separate Canva design. Canva edits do not sync back. Source pages contain native text, shapes, lines and registered images; inspect the actual Canva pages for visual fidelity and independent editing.</p>
  </main>;
}
