import {z} from "zod";
import {deckVersionSchema} from "./deck";
const stableId=z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/);
export const sourceChunkSchema=z.object({id:stableId,sourceId:stableId,order:z.number().int().min(1).max(100),text:z.string().min(1).max(12000)}).strict();
export const requirementBindingSchema=z.object({pageId:stableId,elementIds:z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,119}$/)).max(20).default([]),location:z.enum(["visible","notes","either"]).default("visible")}).strict();
export const requirementSchema=z.object({
 id:stableId,text:z.string().trim().min(1).max(1500),sourceChunkId:stableId,
 priority:z.enum(["must","should"]).default("must"),scope:z.enum(["global","pages"]).default("pages"),pageIds:z.array(stableId).max(40).default([]),
 exactText:z.string().min(1).max(1000).optional(),bindings:z.array(requirementBindingSchema).max(40).default([]),
 review:z.enum(["pending","satisfied","conflict"]).default("pending"),reviewNote:z.string().max(1000).default(""),
}).strict();
export const requirementsStateSchema=z.object({sources:z.array(sourceChunkSchema).max(100),items:z.array(requirementSchema).max(200),extractionComplete:z.boolean().default(false)}).strict();
export const appendRequirementsSchema=z.object({deckId:z.string().uuid(),baseVersion:z.number().int().min(1).max(250),summary:z.string().trim().min(1).max(500),sources:z.array(sourceChunkSchema).max(10).default([]),requirements:z.array(requirementSchema).max(20).default([]),extractionComplete:z.boolean().optional()}).strict().superRefine((v,ctx)=>{if(!v.sources.length&&!v.requirements.length&&v.extractionComplete===undefined)ctx.addIssue({code:"custom",message:"Supply source chunks or requirements."});});
export const documentReadSchema=deckVersionSchema.extend({detail:z.enum(["summary","full"]).default("summary"),pageIds:z.array(stableId).min(1).max(5).optional()}).strict();
export const documentContextSchema=deckVersionSchema.extend({pageOffset:z.number().int().min(0).max(39).default(0),pageLimit:z.number().int().min(1).max(5).default(3),pageIds:z.array(stableId).min(1).max(5).optional(),elementOffset:z.number().int().min(0).max(199).default(0),elementLimit:z.number().int().min(1).max(200).default(200),requirementOffset:z.number().int().min(0).max(199).default(0),requirementLimit:z.number().int().min(1).max(20).default(20),sourceChunkId:stableId.optional()}).strict();
export const reviewRequirementsSchema=deckVersionSchema.extend({offset:z.number().int().min(0).max(199).default(0),limit:z.number().int().min(1).max(20).default(20)}).strict();
export type Requirement=z.infer<typeof requirementSchema>;
export type RequirementsState=z.infer<typeof requirementsStateSchema>;
