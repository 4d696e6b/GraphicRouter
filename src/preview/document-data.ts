import type { DocumentResult } from "../contracts";
import type { DocumentService } from "../server/document-service";
import {requirementSummary} from "../engine/requirements";
export interface DocumentData {result:DocumentResult;previews:{id:string;svg:string}[];previewError?:string;partialPreviews?:boolean;requirementCoverage?:ReturnType<typeof requirementSummary>}
export async function documentData(service:DocumentService,owner:string,result:DocumentResult,pageIds?:string[]):Promise<DocumentData>{
  const b=result.blueprint,requested=pageIds??[...new Set(b.changes.map(c=>c.target).filter(id=>b.pages.some(p=>p.id===id)))].slice(0,3);
  const selected=requested.length?requested.slice(0,5):b.pages.slice(0,3).map(p=>p.id);
  // Original brief/checklist are retrieved explicitly, not repeated in every widget payload.
  const{requirements,...source}=b;
  const safeResult:DocumentResult={...result,blueprint:source};
  const base={result:safeResult,partialPreviews:selected.length<b.pages.length,requirementCoverage:requirementSummary(b)};
  try{return{...base,previews:await service.preview(owner,b.deckId,b.version,selected)};}
  catch{return{...base,previews:[],previewError:"This operation succeeded and the version is saved. Previews are unavailable; refresh instead of repeating the edit."};}
}
