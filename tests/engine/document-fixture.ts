import {documentEngine} from "../../src/engine/document";
import type {CreateDocumentInput,DocumentBlueprint,CanvasElement} from "../../src/contracts";
export const documentInput:CreateDocumentInput={title:"Illustrative design workflow",brief:{idea:"Explain a supplied workflow",audience:"Project reviewers",purpose:"Demonstrate native page editing",facts:["Illustrative fixture only; no external claims."],unknowns:["Canva fidelity requires a live check."]},canvas:{width:1600,height:900},theme:{background:"#FAF9F6",foreground:"#191724",muted:"#62606B",accent:"#7C3AED"},designIntent:"One clear message per page, consistent scale and space.",format:"presentation",pages:Array.from({length:8},(_,i)=>({id:`page${i+1}`,title:`Workflow ${i+1}`,message:`Consider the supplied workflow step ${i+1}.`,section:i<4?"Plan":"Compose and review",notes:`Illustrative speaker notes for page ${i+1}.`}))};
export const nativeHeading=(text:string):CanvasElement=>({id:"headline",type:"text",text,x:90,y:100,width:1400,height:180,zIndex:1,fontFamily:"Arial",fontSize:64,bold:true,align:"left",color:{token:"foreground"}});
export function populatedDocument():DocumentBlueprint{
 const blank=documentEngine.create(documentInput,{deckId:"12345678-1234-4123-8123-123456789abc",version:1});
 return documentEngine.edit(blank,{deckId:blank.deckId,baseVersion:1,summary:"Add eight independent native headings.",operations:blank.pages.map((p,i)=>({type:"edit_elements",pageId:p.id,operations:[{type:"add_element",element:nativeHeading(`Design step ${i+1}`)}]}))});
}
