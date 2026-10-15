import {referenceStudy} from "./studies";
import { z } from "zod";
import library from "./library.json";
export const skillIds=["infographic-frameworks","presentation-storytelling","long-presentations","tall-and-carousel","art-direction","illustration-assets","data-storytelling","format-and-brand","quality-review"] as const;
export const getDesignSkillSchema=z.object({skill:z.enum(skillIds),includeStudy:z.boolean().default(false)}).strict();
export const planDesignSchema=z.object({
  format:z.enum(["infographic","presentation","long_presentation","tall_infographic","carousel","adaptation"]),
  purpose:z.enum(["inform","teach","persuade","compare","report"]),
  relationship:z.enum(["process","comparison","timeline","hierarchy","annotation","statistics","geography"]).optional(),
  complexity:z.enum(["quick","balanced","detailed"]).default("balanced"),
  pageCount:z.number().int().min(1).max(40).optional(),durationSeconds:z.number().int().min(30).max(14400).optional(),
  briefCharacters:z.number().int().min(0).max(2000000).optional(),
  hasData:z.boolean().default(false),hasBrand:z.boolean().default(false),needsIllustration:z.boolean().default(false),
}).strict();
export function getDesignSkill(raw:unknown){const {skill,includeStudy}=getDesignSkillSchema.parse(raw);return {...structuredClone(library.find(s=>s.id===skill)!),...(includeStudy?{nativeStudy:referenceStudy(skill)}:{})};}
export function planDesign(raw:unknown){
  const input=planDesignSchema.parse(raw);const selected=new Set<string>();
  if(input.format==="presentation"||input.format==="long_presentation")selected.add("presentation-storytelling");
  else if(input.format!=="adaptation")selected.add("infographic-frameworks");
  if(input.format==="long_presentation"||((input.format==="presentation")&&(input.pageCount??0)>5))selected.add("long-presentations");
  if(input.format==="tall_infographic"||input.format==="carousel")selected.add("tall-and-carousel");
  selected.add("art-direction");
  if(input.needsIllustration)selected.add("illustration-assets");
  if(input.hasData||input.relationship==="statistics")selected.add("data-storytelling");
  if(input.hasBrand||input.format==="adaptation")selected.add("format-and-brand");
  selected.add("quality-review");
  const document=["presentation","long_presentation","carousel","tall_infographic"].includes(input.format);
  return {input,skills:library.filter(s=>selected.has(s.id)).map(({id,title,description})=>({id,title,description})),
    framework:input.relationship??(input.purpose==="compare"?"comparison":input.purpose==="teach"?"process":"choose from the actual relationship; do not force a template"),
    sequence:["Reuse the brief and verified facts; load selected skills with get_design_skill.","For detailed/long briefs, create the storyboard and preserve original chunks + a requirement ledger with append_document_requirements; reconcile conflicts before geometry.",document?"Use create_document for ordered blank page shells, then edit_document for native objects and notes.":"Use create_canvas then edit_canvas for a native single page; adaptation creates a new source-preserving composition.","Inspect source pages and critical crops; revise material issues.","Export/import the exact saved version, inspect actual Canva layers and follow required save approval."],
    limits:{pages:40,elementsPerPage:200,totalDocumentElements:4000,revisions:250,sourceBriefCharacters:120000,sourceChunkCharacters:12000,serializedDocumentBytes:1800000,editsPerBatch:40,dimensionRange:[320,4000],nativeFont:"Arial; measured English glyphs",assets:"Registered images and native geometric components; no arbitrary upload/font ingestion"},
    contextStrategy:{pageBatch:3,requirementBatch:20,readTool:"get_document_context",auditTool:"review_document_requirements",preserveOriginal:true,briefExceedsNativeLimit:(input.briefCharacters??0)>120000,instructions:"Keep the original in <=12000-character ordered chunks (120000 total), split larger work explicitly. Register mandatory wording/location/page bindings, compare extraction against the whole brief, then compose/review chapters. Mutations return compact checkpoints; fetch exact page objects before edits and audit all requirements before final export."},
    caveats:["Workflow selection is deterministic from explicit inputs; ChatGPT supplies the narrative and design judgement.","No independent fact, beauty or imported editability guarantee.","Existing Canva-source and generation choices must be preserved; this plan does not silently authorize switching routes.","All headings/values/labels are native text, separate from backgrounds and illustrations."],
  };
}
