import { z } from "zod";

export const SCHEMA_VERSION = 1 as const;
export const CANVAS = { width: 1600, height: 900 } as const;
export const slideRoles = ["hook", "answer", "workflow", "proof", "next"] as const;
export const layouts = ["hero", "cards", "comparison", "process", "closing"] as const;
export const previewStages = ["layout", "content", "finished"] as const;

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use #RRGGBB.");
export const slideIdSchema = z.string().regex(/^slide[1-5]$/);

export const slideInputSchema = z.object({
  id: slideIdSchema,
  role: z.enum(slideRoles),
  layout: z.enum(layouts),
  headline: z.string().trim().min(1).max(80),
  takeaway: z.string().trim().min(1).max(240),
  blocks: z.array(z.object({
    heading: z.string().trim().min(1).max(40),
    body: z.string().trim().min(1).max(180),
  }).strict()).max(3),
  notes: z.object({ core: z.string().max(4000), expanded: z.string().max(7000) }).strict(),
  assetId: z.string().min(1).max(100).optional(),
}).strict();

export const createDeckSchema = z.object({
  title: z.string().trim().min(1).max(100),
  brief: z.object({
    idea: z.string().trim().min(1).max(4000),
    audience: z.string().trim().min(1).max(500),
    purpose: z.string().trim().min(1).max(1000),
    facts: z.array(z.string().trim().min(1).max(2000)).max(30),
    unknowns: z.array(z.string().trim().min(1).max(1000)).max(20),
  }).strict(),
  durationSeconds: z.union([z.literal(180), z.literal(300)]),
  artDirection: z.string().trim().min(1).max(1000),
  accent: hexColorSchema,
  slides: z.array(slideInputSchema).length(5),
}).strict().superRefine(({ slides }, ctx) => {
  if (new Set(slides.map((slide) => slide.id)).size !== 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slides"], message: "Slide IDs must be unique." });
  }
  if (slides.some((slide, index) => slide.id !== `slide${index + 1}` || slide.role !== slideRoles[index])) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slides"], message: "Use slide1–slide5 in hook, answer, workflow, proof, next order." });
  }
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type SlideInput = z.infer<typeof slideInputSchema>;
export type Layout = (typeof layouts)[number];
export type PreviewStage = (typeof previewStages)[number];

export const revisionOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("replace_text"), elementId: z.string().min(1), text: z.string().trim().min(1).max(400) }).strict(),
  z.object({ type: z.literal("update_notes"), slideId: slideIdSchema, notes: slideInputSchema.shape.notes }).strict(),
  z.object({ type: z.literal("set_element_color"), elementId: z.string().min(1), color: hexColorSchema }).strict(),
  z.object({ type: z.literal("set_deck_accent"), color: hexColorSchema }).strict(),
  z.object({ type: z.literal("set_slide_layout"), slideId: slideIdSchema, layout: z.enum(layouts) }).strict(),
]);

export const deckVersionSchema = z.object({
  deckId: z.string().uuid(),
  version: z.number().int().positive(),
}).strict();

export const reviseDeckSchema = z.object({
  deckId: z.string().uuid(),
  baseVersion: z.number().int().positive(),
  operations: z.array(revisionOperationSchema).min(1).max(20),
}).strict();

export type RevisionOperation = z.infer<typeof revisionOperationSchema>;
export type ReviseDeckInput = z.infer<typeof reviseDeckSchema>;
export type DeckVersionInput = z.infer<typeof deckVersionSchema>;
