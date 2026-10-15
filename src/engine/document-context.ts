import type {DocumentBlueprint,DocumentResult} from "../contracts";
import {auditRequirements,requirementSummary} from "./requirements";
/** Small model-facing checkpoint; raw brief, full notes, objects and SVGs stay out. */
export function compactDocument(result:DocumentResult){
 const doc=result.blueprint,blank=doc.pages.filter(p=>!p.elements.length).map(p=>p.id),audit=requirementSummary(doc);
 return{kind:"document_summary",deckId:doc.deckId,version:doc.version,title:doc.title,format:doc.format,canvas:doc.canvas,theme:doc.theme,pageCount:doc.pages.length,objectCount:doc.pages.reduce((n,p)=>n+p.elements.length,0),
  pages:doc.pages.map((p,i)=>({id:p.id,number:i+1,title:p.title,section:p.section,objectCount:p.elements.length,notesCharacters:p.notes.length})),
  changes:doc.changes,requirements:audit,blankPages:blank,previewUrl:result.previewUrl,canva:result.canva,files:result.files,
  review:{total:result.review.length,issues:result.review.slice(0,10),truncated:result.review.length>10},
  resume:{baseVersion:doc.version,nextAction:audit.sourceChunks&&!audit.extractionComplete?"Resume source extraction with get_document_context, then save/upsert requirements.":blank.length?"Fetch the next 1–3 pages with get_document_context, compose at most40 changes and inspect them.":audit.blocking?"Call review_document_requirements; resolve mandatory checks, do not silently waive them.":"Inspect final pages, review registered requirements and export when ready.",pageIds:blank.slice(0,3),instruction:"Fetch exact saved page objects before editing; use the returned version for the next write. Never resend the entire deck/brief for a narrow change. No summary is a guarantee that every original instruction was extracted."}};
}
export function requirementReview(doc:DocumentBlueprint,offset:number,limit:number){const all=auditRequirements(doc);return{deckId:doc.deckId,version:doc.version,summary:requirementSummary(doc),items:all.slice(offset,offset+limit),offset,nextOffset:offset+limit<all.length?offset+limit:null,scope:"Exact-copy presence and binding checks only; semantic satisfaction and extraction completeness are caller-reported. No independent fact/Canva/visual verification."};}
