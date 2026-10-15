import { z } from "zod";
import { createDeckSchema, deckVersionSchema, hexColorSchema } from "./deck";
import type { Asset, Theme, ValidationIssue } from "./engine";
import type { CanvaImport, ExportFiles } from "./tools";

const paint = z.union([z.object({ token: z.enum(["background", "foreground", "muted", "accent"]) }).strict(), z.object({ hex: hexColorSchema }).strict()]);
const geometry = { id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,119}$/), x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(), width: z.number().finite().nonnegative(), height: z.number().finite().nonnegative(), zIndex: z.number().int().nonnegative().max(10000) };
export const canvasElementSchema = z.discriminatedUnion("type", [
  z.object({ ...geometry, type: z.literal("text"), text: z.string().min(1).max(2000), fontFamily: z.literal("Arial"), fontSize: z.number().min(8).max(240), bold: z.boolean(), color: paint, align: z.enum(["left", "center", "right"]) }).strict(),
  z.object({ ...geometry, type: z.literal("shape"), shape: z.enum(["rectangle", "ellipse"]), fill: paint }).strict(),
  z.object({ ...geometry, type: z.literal("line"), color: paint, thickness: z.number().positive().max(40) }).strict(),
  z.object({ ...geometry, type: z.literal("image"), assetId: z.string().min(1).max(100), alt: z.string().max(500) }).strict(),
]);
export type CanvasElement = z.infer<typeof canvasElementSchema>;
export const canvasThemeSchema = z.object({ background: hexColorSchema, foreground: hexColorSchema, muted: hexColorSchema, accent: hexColorSchema }).strict();
export const canvasSizeSchema = z.object({ width: z.number().int().min(320).max(4000), height: z.number().int().min(320).max(4000) }).strict();
export const createCanvasSchema = z.object({
  title: z.string().trim().min(1).max(100), brief: createDeckSchema.innerType().shape.brief,
  canvas: canvasSizeSchema, theme: canvasThemeSchema,
  designIntent: z.string().trim().min(1).max(2000),
}).strict();
export type CreateCanvasInput = z.infer<typeof createCanvasSchema>;
export const canvasOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add_element"), element: canvasElementSchema }).strict(),
  z.object({ type: z.literal("replace_element"), elementId: geometry.id, element: canvasElementSchema }).strict(),
  z.object({ type: z.literal("remove_element"), elementId: geometry.id }).strict(),
]);
export type CanvasOperation = z.infer<typeof canvasOperationSchema>;
export const editCanvasSchema = z.object({ deckId: z.string().uuid(), baseVersion: z.number().int().positive(), phase: z.enum(["structure", "content", "polish", "revision"]), summary: z.string().trim().min(1).max(500), operations: z.array(canvasOperationSchema).min(1).max(40) }).strict();
export type EditCanvasInput = z.infer<typeof editCanvasSchema>;
export interface CanvasBlueprint {
  schemaVersion: 2; kind: "canvas"; deckId: string; version: number;
  title: string; brief: CreateCanvasInput["brief"]; canvas: CreateCanvasInput["canvas"]; theme: Theme; designIntent: string;
  elements: CanvasElement[];
  changes: { operation: CanvasOperation["type"]; target: string; description: string }[];
  construction: { version: number; phase: "blank" | EditCanvasInput["phase"]; summary: string; elementCount: number }[];
  validationIssues: ValidationIssue[];
}
export interface CanvasResult { blueprint: CanvasBlueprint; previewUrl: string; canva: CanvaImport; files?: ExportFiles }
export interface CanvasEngine {
  create(input: CreateCanvasInput, identity: { deckId: string; version: number }): CanvasBlueprint;
  edit(current: CanvasBlueprint, input: EditCanvasInput): CanvasBlueprint;
  validate(blueprint: CanvasBlueprint): ValidationIssue[];
  render(blueprint: CanvasBlueprint, stage: "layout" | "content" | "finished", assets: Asset[], visibleCount?: number): string;
  compile(blueprint: CanvasBlueprint, assets: Asset[]): Promise<Uint8Array>;
}
export const CANVAS_TOOL_NAMES = ["create_canvas", "edit_canvas", "get_canvas", "export_canvas", "send_canvas_to_canva"] as const;
export type CanvasToolName = (typeof CANVAS_TOOL_NAMES)[number];
export { deckVersionSchema as canvasVersionSchema };
