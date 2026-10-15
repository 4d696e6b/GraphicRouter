import type { DocumentResult } from "../contracts";
import type { DocumentService } from "../server/document-service";
export interface DocumentData {result:DocumentResult;previews:{id:string;svg:string}[];previewError?:string}
export async function documentData(service:DocumentService,owner:string,result:DocumentResult):Promise<DocumentData>{
  try{return{result,previews:await service.preview(owner,result.blueprint.deckId,result.blueprint.version)};}
  catch{return{result,previews:[],previewError:"This operation succeeded and the version is saved. Previews are unavailable; refresh instead of repeating the edit."};}
}
