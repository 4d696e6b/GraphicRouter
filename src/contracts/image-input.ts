import { z } from "zod";
const id = z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,79}$/);
const publicImageUrl = z.string().max(2048).url().refine(raw => {
  const u = new URL(raw), host = u.hostname.toLowerCase();
  return u.protocol === "https:" && !u.username && !u.password && !u.port && host.includes(".") && !host.endsWith(".local") && !host.endsWith(".localhost") && !/^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) && !host.includes(":") && !/^\d+(\.\d+){3}$/.test(host);
}, "Use an already public HTTPS image URL; private/local files use chat_attachment.");
const source = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("chat_attachment"), name: z.string().trim().min(1).max(200), bytesAccessible: z.boolean().default(false) }).strict(),
  z.object({ kind: z.literal("public_url"), url: publicImageUrl }).strict(),
  z.object({ kind: z.literal("canva_asset"), assetId: z.string().trim().min(1).max(160) }).strict(),
]);
export const planImageInputSchema = z.object({
  images: z.array(z.object({
    id, source, role: z.enum(["place", "style_reference", "edit_instruction", "extract_content"]),
    instruction: z.string().trim().min(1).max(2000),
    target: z.string().trim().min(1).max(500).optional(),
    dimensions: z.object({ width: z.number().int().positive().max(50000), height: z.number().int().positive().max(50000) }).strict().optional(),
    box: z.object({ x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(), width: z.number().finite().positive().max(20000), height: z.number().finite().positive().max(20000) }).strict().optional(),
  }).strict()).min(1).max(10),
}).strict().superRefine((input, ctx) => {
  if (new Set(input.images.map(i => i.id)).size !== input.images.length) ctx.addIssue({ code: "custom", message: "Give each supplied picture a unique ID." });
});
