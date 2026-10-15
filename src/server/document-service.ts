import { createDocumentSchema, editDocumentSchema, deckVersionSchema, inspectDocumentSchema, type Asset, type CanvasRasterizer, type DocumentBlueprint, type DocumentResult, type DocumentToolName, type CanvaImport } from "../contracts";
import { documentEngine, pageCanvas, reviewDocument } from "../engine/document";
import { canvasEngine } from "../engine/canvas";
import { EngineError } from "../engine/errors";
import type { DeckStore } from "./store";
import type { FileStore, CanvaPort } from "./service";
import { fail, ServiceError } from "./errors";
import { CanvaConnectionRequired } from "../integrations/canva/errors";

export class DocumentService {
  constructor(private deps:{store:DeckStore<DocumentBlueprint>;files:FileStore;canva:CanvaPort;assets:Asset[];origin:string;raster?:CanvasRasterizer}){}
  private compose(run:()=>DocumentBlueprint){try{const doc=run();for(const p of doc.pages)for(const e of p.elements)if(e.type==="image"&&!this.deps.assets.some(a=>a.id===e.assetId))fail("VALIDATION_FAILED",`Unknown registered asset on ${p.id}: ${e.assetId}. No version saved.`);return doc;}catch(error){if(error instanceof ServiceError)throw error;if(error instanceof EngineError)fail(error.code,error.message);fail("VALIDATION_FAILED","Document composition failed. Check pages, native objects and resource limits; the saved version is unchanged.");}}
  private async read(owner:string,id:string,version:number){const doc=await this.deps.store.read(owner,id,version);if(doc.schemaVersion!==3||doc.kind!=="document")fail("NOT_FOUND","This is not a multi-page document. Use its original deck/canvas tools.");return doc;}
  private result(doc:DocumentBlueprint,canva:CanvaImport={status:"not_started"}):DocumentResult{return{blueprint:doc,previewUrl:`${this.deps.origin}/documents/${doc.deckId}/${doc.version}`,canva,review:reviewDocument(doc)};}
  private connection():CanvaImport{return{status:"connection_required",connectUrl:`${this.deps.origin}/api/canva/connect`};}
  key(doc:DocumentBlueprint,kind:"pptx"|"notes"){return `documents/${doc.deckId}/v${doc.version}/${kind}`;}
  private urls(doc:DocumentBlueprint){const path=`${this.deps.origin}/api/documents/${doc.deckId}/${doc.version}/files`;return{pptxUrl:`${path}/pptx`,notesUrl:`${path}/notes`};}
  private async exists(key:string){return this.deps.files.exists?this.deps.files.exists(key):!!await this.deps.files.get(key);}
  async call(name:DocumentToolName,raw:unknown,owner:string|null):Promise<DocumentResult>{
    if(!owner)fail("UNAUTHORIZED","Sign in with ChatGPT to access documents.");
    const schema=name==="create_document"?createDocumentSchema:name==="edit_document"?editDocumentSchema:deckVersionSchema;
    const parsed=schema.safeParse(raw);if(!parsed.success)fail("VALIDATION_FAILED",parsed.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
    if(name==="create_document"){const doc=this.compose(()=>documentEngine.create(raw,{deckId:crypto.randomUUID(),version:1}));await this.deps.store.create(owner,doc);return this.result(doc);}
    if(name==="edit_document"){const input=editDocumentSchema.parse(raw),current=await this.read(owner,input.deckId,input.baseVersion),next=this.compose(()=>documentEngine.edit(current,input));await this.deps.store.append(owner,input.baseVersion,next);return this.result(next);}
    const input=deckVersionSchema.parse(raw),doc=await this.read(owner,input.deckId,input.version);let state=await this.deps.store.importState(doc.deckId,doc.version);
    if(name==="get_document"&&state.status==="pending"){
      const jobId=state.jobId;try{state=await this.deps.store.saveImport(doc.deckId,doc.version,await this.deps.canva.poll(owner,jobId));}
      catch(error){state=error instanceof CanvaConnectionRequired?this.connection():{status:"failed",jobId,code:"CANVA_POLL_FAILED",message:"Status unavailable. Use get_document to retry the saved job; no second import started."};}
    }
    if(name==="export_document"||name==="send_document_to_canva"){
      const files=await this.export(doc);
      if(name==="send_document_to_canva"&&state.status==="not_started"){
        if(!await this.deps.canva.connected(owner))state=this.connection();
        else{
          let bytes:Uint8Array|null;try{bytes=await this.deps.files.get(this.key(doc,"pptx"));}catch{fail("EXPORT_FAILED","Saved export could not be read. No Canva import started.");}
          if(!bytes)fail("EXPORT_FAILED","Export unavailable; retry export before import.");
          if(await this.deps.store.claimImport(doc.deckId,doc.version)){
            try{state=await this.deps.canva.start(owner,bytes,`${doc.title.slice(0,35)} · v${doc.version}`);}
            catch(error){if(error instanceof CanvaConnectionRequired){await this.deps.store.releaseUnstartedImport(doc.deckId,doc.version);return{...this.result(doc,this.connection()),files};}state={status:"failed",code:"IMPORT_OUTCOME_UNKNOWN",message:"Canva did not confirm the outcome. Check Canva before another import; your editable PowerPoint is preserved."};}
            state=await this.deps.store.saveImport(doc.deckId,doc.version,state);
          }else state=await this.deps.store.importState(doc.deckId,doc.version);
        }
      }
      return{...this.result(doc,state),files};
    }
    const result=this.result(doc,state);try{if(await this.exists(this.key(doc,"pptx"))&&await this.exists(this.key(doc,"notes")))result.files=this.urls(doc);}catch{/* Stored source remains readable. */}return result;
  }
  private async export(doc:DocumentBlueprint){
    try{this.compose(()=>doc);if(doc.pages.some(p=>!p.elements.length))fail("VALIDATION_FAILED","Compose or remove every blank page before export.");
      if(!await this.exists(this.key(doc,"pptx"))){const bytes=await documentEngine.compile(doc,this.deps.assets);await this.deps.files.put(this.key(doc,"pptx"),bytes,"application/vnd.openxmlformats-officedocument.presentationml.presentation");}
      if(!await this.exists(this.key(doc,"notes")))await this.deps.files.put(this.key(doc,"notes"),new TextEncoder().encode(`${doc.title}\n\nDesign: ${doc.designIntent}\nFacts:\n${doc.brief.facts.join("\n")}\nUnknowns:\n${doc.brief.unknowns.join("\n")}\n\n${doc.pages.map((p,i)=>`${i+1}. ${p.title}\nSection: ${p.section}\nMessage: ${p.message}\n${p.notes}`).join("\n\n")}`),"text/plain;charset=utf-8");
      return this.urls(doc);
    }catch(error){if(error instanceof ServiceError)throw error;if(error instanceof EngineError)fail(error.code,error.message);fail("EXPORT_FAILED","Document export failed; saved pages and earlier files remain available.");}
  }
  async download(owner:string|null,id:string,version:number,kind:string){if(!owner)fail("UNAUTHORIZED","Sign in to download documents.");if(kind!=="pptx"&&kind!=="notes")fail("NOT_FOUND","File not found.");const doc=await this.read(owner,id,version),bytes=await this.deps.files.get(this.key(doc,kind));if(!bytes)fail("NOT_FOUND","Export this document version first.");return bytes;}
  async preview(owner:string|null,id:string,version:number){if(!owner)fail("UNAUTHORIZED","Sign in to preview documents.");const doc=await this.read(owner,id,version);return doc.pages.map(p=>({id:p.id,svg:canvasEngine.render(pageCanvas(doc,p),"finished",this.deps.assets)}));}
  async inspect(owner:string|null,raw:unknown){
    if(!owner)fail("UNAUTHORIZED","Sign in to inspect documents.");const parsed=inspectDocumentSchema.safeParse(raw);if(!parsed.success)fail("VALIDATION_FAILED","Supply a saved document, page ID and optional in-bounds crop.");
    const input=parsed.data,doc=await this.read(owner,input.deckId,input.version),page=doc.pages.find(p=>p.id===input.pageId);if(!page)fail("NOT_FOUND","Page not found in this document.");
    const region=input.region;if(region&&(region.x+region.width>doc.canvas.width||region.y+region.height>doc.canvas.height))fail("VALIDATION_FAILED","Keep the crop within this page.");
    if(!this.deps.raster)fail("NOT_IMPLEMENTED","Page image inspection is unavailable; do not claim visual review.");
    try{let svg=canvasEngine.render(pageCanvas(doc,page),"finished",this.deps.assets);if(region)svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}" viewBox="0 0 ${region.width} ${region.height}">${svg.replace("<svg ",`<svg x="${-region.x}" y="${-region.y}" `)}</svg>`;
      return{image:await this.deps.raster(svg,region??doc.canvas),report:{deckId:doc.deckId,version:doc.version,pageId:page.id,review:reviewDocument(doc),reviewInstructions:"Inspect this source page and the storyboard for story progression, hierarchy and readability. Check critical crops and the actual Canva rendering separately. This image does not certify Canva fidelity or factual accuracy."}};
    }catch{fail("EXPORT_FAILED","Could not render this page image; the saved document is unchanged. Visual review is incomplete.");}
  }
}
