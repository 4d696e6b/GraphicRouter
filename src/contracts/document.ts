import { z } from "zod";
import { createCanvasSchema, canvasElementSchema, canvasOperationSchema } from "./canvas";
import { deckVersionSchema } from "./deck";
import type { CanvaImport, ExportFiles } from "./tools";
import type { ValidationIssue } from "./engine";
const pageId = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/);
export const pageContentSchema = z.object({
  title: z.string().trim().min(1).max(100), message: z.string().trim().min(1).max(500),
  section: z.string().trim().max(100).default(""), notes: z.string().max(6000).default(""),
}).strict();
export const pageShellSchema = pageContentSchema.extend({ id: pageId }).strict();
export const documentFormatSchema = z.enum(["presentation", "carousel", "tall_infographic"]);
export const createDocumentSchema = createCanvasSchema.extend({
  format: documentFormatSchema, pages: z.array(pageShellSchema).min(1).max(40),
}).strict();
export const documentOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("edit_elements"), pageId, operations: z.array(canvasOperationSchema).min(1).max(40) }).strict(),
  z.object({ type: z.literal("update_page"), pageId, content: pageContentSchema }).strict(),
  z.object({ type: z.literal("add_page"), page: pageShellSchema, afterPageId: pageId.nullable() }).strict(),
  z.object({ type: z.literal("remove_page"), pageId }).strict(),
  z.object({ type: z.literal("reorder_pages"), pageIds: z.array(pageId).min(1).max(40) }).strict(),
]);
export const editDocumentSchema = z.object({ deckId:z.string().uuid(), baseVersion:z.number().int().min(1).max(100), summary:z.string().trim().min(1).max(500), operations:z.array(documentOperationSchema).min(1).max(40) }).strict().superRefine((input,ctx)=>{
  const count=input.operations.reduce((sum,op)=>sum+(op.type==="edit_elements"?op.operations.length:1),0);
  if(count>40)ctx.addIssue({code:"custom",path:["operations"],message:"Use at most 40 total changes per revision."});
});
export const inspectDocumentSchema = deckVersionSchema.extend({ pageId,
  region:z.object({x:z.number().int().nonnegative(),y:z.number().int().nonnegative(),width:z.number().int().min(64).max(4000),height:z.number().int().min(64).max(4000)}).strict().optional(),
}).strict();
export const documentBlueprintSchema = createDocumentSchema.extend({
  schemaVersion:z.literal(3),kind:z.literal("document"),deckId:z.string().uuid(),version:z.number().int().min(1).max(100),
  pages:z.array(pageShellSchema.extend({elements:z.array(canvasElementSchema).max(200)}).strict()).min(1).max(40),
  changes:z.array(z.object({target:z.string().max(240),description:z.string().max(500)}).strict()).max(40),
  history:z.array(z.object({version:z.number().int().min(1).max(100),summary:z.string().min(1).max(500)}).strict()).min(1).max(100),
}).strict();
export type DocumentBlueprint=z.infer<typeof documentBlueprintSchema>;
export type DocumentPage=DocumentBlueprint["pages"][number];
export type CreateDocumentInput=z.infer<typeof createDocumentSchema>;
export interface DocumentResult {blueprint:DocumentBlueprint;previewUrl:string;canva:CanvaImport;files?:ExportFiles;review:ValidationIssue[]}
export const DOCUMENT_TOOL_NAMES=["create_document","edit_document","get_document","export_document","send_document_to_canva"] as const;
export type DocumentToolName=(typeof DOCUMENT_TOOL_NAMES)[number];
