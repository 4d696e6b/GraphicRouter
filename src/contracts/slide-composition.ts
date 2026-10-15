import { z } from "zod";
import { canvasThemeSchema } from "./canvas";
export const composeSlideSchema = z.object({
  kind: z.enum(["hero", "editorial", "comparison", "process", "timeline", "metrics", "closing"]),
  idPrefix: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,39}$/),
  headline: z.string().trim().min(1).max(100), kicker: z.string().trim().max(40).default(""),
  body: z.string().trim().max(260).default(""), footer: z.string().trim().max(160).default(""),
  blocks: z.array(z.object({ label: z.string().trim().min(1).max(55), body: z.string().trim().max(140).default(""), value: z.string().trim().max(24).optional() }).strict()).max(4).default([]),
  theme: canvasThemeSchema,
}).strict().superRefine((v, ctx) => {
  if (["comparison", "process", "timeline", "metrics"].includes(v.kind) && v.blocks.length < 2) ctx.addIssue({ code: "custom", message: "This visual needs at least2 supplied content blocks." });
  if (["hero", "closing"].includes(v.kind) && v.blocks.length > 3) ctx.addIssue({ code: "custom", message: "Use up to3 focal nodes in this composition." });
  if (!["metrics", "timeline"].includes(v.kind) && v.blocks.some(b => b.value !== undefined)) ctx.addIssue({ code: "custom", message: "Values belong to metrics or timeline compositions; preserve other detail in body/notes." });
  if (v.kind === "comparison" && v.blocks.length !== 2) ctx.addIssue({ code: "custom", message: "Compare exactly2 supplied sides." });
  if (v.kind === "metrics" && v.blocks.some(b => !b.value)) ctx.addIssue({ code: "custom", message: "Every metric needs its actual supplied value; no invented statistics." });
});
