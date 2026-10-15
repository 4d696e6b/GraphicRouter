import { createDocumentSchema, documentBlueprintSchema, editDocumentSchema, type Asset, type CanvasBlueprint, type DocumentBlueprint, type DocumentPage, type ValidationIssue } from "../contracts";
import { canvasEngine, compileCanvasPages } from "./canvas";
import { EngineError, assertNoErrors } from "./errors";
import { reviewDesign } from "./design-review";
const reject = (message:string):never => {throw new EngineError(message,[{severity:"error",code:"INVALID_DOCUMENT",path:"document",message}]);};
/** Internal projection only; never exposed as fabricated page revision history. */
export function pageCanvas(doc:DocumentBlueprint,page:DocumentPage):CanvasBlueprint {
  return {schemaVersion:2,kind:"canvas",deckId:doc.deckId,version:page.elements.length?2:1,title:page.title,brief:doc.brief,canvas:doc.canvas,theme:doc.theme,designIntent:doc.designIntent,
    elements:structuredClone(page.elements),changes:[],construction:[{version:1,phase:"blank",summary:"Blank page.",elementCount:0},...(page.elements.length?[{version:2,phase:"content" as const,summary:"Current document page projection.",elementCount:page.elements.length}]:[])],validationIssues:[]};
}
export function validateDocument(raw:DocumentBlueprint):ValidationIssue[] {
  const parsed=documentBlueprintSchema.safeParse(raw);
  if(!parsed.success)return parsed.error.issues.map(i=>({severity:"error",code:"INVALID_DOCUMENT",path:i.path.join("."),message:i.message}));
  const doc=parsed.data,issues:ValidationIssue[]=[];
  const error=(path:string,message:string)=>issues.push({severity:"error",code:"INVALID_DOCUMENT",path,message});
  const invalidXml=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/u;
  for(const [path,value] of [["title",doc.title],["designIntent",doc.designIntent],...doc.pages.flatMap(p=>[[`${p.id}.message`,p.message],[`${p.id}.section`,p.section],[`${p.id}.notes`,p.notes]])])if(invalidXml.test(value))error(path,"Remove XML control characters before export.");
  if(doc.history.length!==doc.version||doc.history.some((v,i)=>v.version!==i+1))error("history","Preserve one ordered revision entry per version.");
  if(new Set(doc.pages.map(p=>p.id)).size!==doc.pages.length)error("pages","Page IDs must be unique.");
  if(doc.pages.reduce((sum,p)=>sum+p.elements.length,0)>1000)error("pages","Use at most 1000 native objects per document.");
  for(const page of doc.pages)for(const issue of canvasEngine.validate(pageCanvas(doc,page)))issues.push({...issue,path:`${page.id}.${issue.path}`});
  return issues;
}
export function reviewDocument(doc:DocumentBlueprint):ValidationIssue[] {
  const issues=validateDocument(doc); if(issues.some(i=>i.severity==="error"))return issues;
  for(const p of doc.pages){
    if(!p.elements.length)issues.push({severity:"warning",code:"BLANK_PAGE",path:p.id,message:"Compose this page before export."});
    if(doc.format==="presentation"&&!p.notes.trim())issues.push({severity:"warning",code:"MISSING_NOTES",path:p.id,message:"Add speaker notes for rehearsal."});
    issues.push(...reviewDesign(pageCanvas(doc,p)).map(i=>({...i,path:`${p.id}.${i.path}`})));
  }
  const messages=new Set<string>();
  for(const p of doc.pages){if(messages.has(p.message.trim().toLowerCase()))issues.push({severity:"warning",code:"REPEATED_MESSAGE",path:p.id,message:"This page repeats another page's takeaway; check story progression."});messages.add(p.message.trim().toLowerCase());}
  return issues.slice(0,1000);
}
export const documentEngine={
  create(raw:unknown,identity:{deckId:string;version:number}):DocumentBlueprint {
    const input=createDocumentSchema.parse(raw);
    if(identity.version!==1)reject("Create documents at version one.");
    const doc:DocumentBlueprint={...input,...identity,schemaVersion:3,kind:"document",pages:input.pages.map(p=>({...p,elements:[]})),changes:[],history:[{version:1,summary:"Planned ordered blank pages from the supplied storyboard."}]};
    assertNoErrors(validateDocument(doc)); return doc;
  },
  edit(current:DocumentBlueprint,raw:unknown):DocumentBlueprint {
    assertNoErrors(validateDocument(current)); const input=editDocumentSchema.parse(raw);
    if(input.deckId!==current.deckId||input.baseVersion!==current.version)reject("Fetch the current document version before editing.");
    if(current.version>=100)reject("Document has reached 100 revisions; create a new document to continue.");
    const next=structuredClone(current);next.version++;next.changes=[];
    for(const op of input.operations){
      if(op.type==="add_page"){
        if(next.pages.length>=40||next.pages.some(p=>p.id===op.page.id))reject("Use at most 40 pages with unique IDs.");
        const at=op.afterPageId===null?-1:next.pages.findIndex(p=>p.id===op.afterPageId);
        if(op.afterPageId!==null&&at<0)reject("The insertion anchor page does not exist.");
        next.pages.splice(at+1,0,{...op.page,elements:[]});next.changes.push({target:op.page.id,description:"Added a blank page."});
      }else if(op.type==="reorder_pages"){
        if(op.pageIds.length!==next.pages.length||new Set(op.pageIds).size!==next.pages.length||op.pageIds.some(id=>!next.pages.some(p=>p.id===id)))reject("List every current page ID exactly once.");
        next.pages=op.pageIds.map(id=>next.pages.find(p=>p.id===id)!);next.changes.push({target:"pages",description:"Reordered existing pages without changing their content."});
      }else{
        const index=next.pages.findIndex(p=>p.id===op.pageId);if(index<0)reject("Target page does not exist.");
        const page=next.pages[index];
        if(op.type==="remove_page"){if(next.pages.length===1)reject("Keep at least one page.");next.pages.splice(index,1);}
        else if(op.type==="update_page")next.pages[index]={...page,...op.content};
        else {
          const projection=pageCanvas(next,page);
          page.elements=canvasEngine.edit(projection,{deckId:next.deckId,baseVersion:projection.version,phase:"revision",summary:input.summary,operations:op.operations}).elements;
        }
        next.changes.push({target:op.pageId,description:op.type==="edit_elements"?`Applied ${op.operations.length} native element changes.`:op.type==="remove_page"?"Removed this page.":"Updated this page's story and notes."});
      }
    }
    next.history.push({version:next.version,summary:input.summary});assertNoErrors(validateDocument(next));return next;
  },
  async compile(doc:DocumentBlueprint,assets:Asset[]){
    assertNoErrors(validateDocument(doc));
    if(doc.pages.some(p=>!p.elements.length))reject("Every page must contain native objects before export; remove unused blank pages.");
    return compileCanvasPages(doc.pages.map(p=>({blueprint:pageCanvas(doc,p),notes:`${p.title}\nMessage: ${p.message}\nSection: ${p.section}\n\n${p.notes}`})),assets);
  },
};
