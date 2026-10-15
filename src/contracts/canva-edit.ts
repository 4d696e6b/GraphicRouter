import { z } from "zod";
const designId = z.string().regex(/^D[A-Za-z0-9_-]{5,119}$/);
export function parseCanvaReference(raw: string) {
  if (designId.safeParse(raw).success) return { kind: "design_id" as const, designId: raw, safeReference: raw };
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Supply a full Canva design/share URL, canva.link shortlink, or returned design ID."); }
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Use an HTTPS Canva link without embedded credentials or a custom port.");
  if (url.hostname === "canva.link") {
    const match = url.pathname.match(/^\/([A-Za-z0-9_-]{1,120})\/?$/);
    if (match) return { kind: "shortlink" as const, shortlinkId: match[1], safeReference: `https://canva.link/${match[1]}` };
  }
  if (url.hostname === "canva.com" || url.hostname === "www.canva.com") {
    const match = url.pathname.match(/^\/design\/(D[A-Za-z0-9_-]{5,119})(?:\/[A-Za-z0-9_-]+){0,3}\/?$/);
    if (match) return { kind: "design_url" as const, designId: match[1], safeReference: `https://www.canva.com/design/${match[1]}` };
  }
  throw new Error("Use a canva.com/design/… editor/share link or canva.link shortlink; folders and other websites are not design references.");
}
export const canvaReferenceSchema = z.string().trim().min(1).max(2048).superRefine((value, ctx) => {
  try { parseCanvaReference(value); } catch { ctx.addIssue({ code: "custom", message: "Supply a full HTTPS Canva design/share URL, canva.link shortlink, or returned D-prefixed design ID." }); }
});
export const planCanvaEditSchema = z.object({
  design: canvaReferenceSchema, request: z.string().trim().min(1).max(16000),
  mode: z.enum(["edit_original", "edit_copy"]).default("edit_original"),
  pageNumbers: z.array(z.number().int().min(1).max(100)).min(1).max(20).optional(),
}).strict();
const id = z.string().min(1).max(160);
const property = z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,79}$/);
const value = z.union([z.string().max(6000), z.number().finite(), z.boolean(), z.null()]);
const properties = z.record(property, value).refine(v => Object.keys(v).length > 0 && Object.keys(v).length <= 40, "Capture 1–40 exposed element properties.");
const snapshot = z.object({
  designId, transactionId: id,
  pages: z.array(z.object({
    id, index: z.number().int().min(1).max(100), width: z.number().finite().positive().max(20000), height: z.number().finite().positive().max(20000),
    elements: z.array(z.object({ id, properties }).strict()).max(200),
  }).strict()).min(1).max(5),
  complete: z.boolean(),
}).strict();
export const reviewCanvaEditSchema = z.object({
  before: snapshot, after: snapshot,
  targets: z.array(z.object({ pageId: id, elementId: id, expected: properties }).strict()).max(100),
  added: z.array(z.object({ pageId: id, elementId: id }).strict()).max(40).default([]),
  deleted: z.array(z.object({ pageId: id, elementId: id }).strict()).max(40).default([]),
  visualReview: z.enum(["not_checked", "problems_found", "passed"]),
}).strict().superRefine((input, ctx) => {
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 600000) ctx.addIssue({ code: "custom", message: "Compare at most600000 UTF-8 bytes; use a smaller page batch without omitting its objects." });
  for (const key of ["before", "after"] as const) {
    const pages = input[key].pages;
    if (new Set(pages.map(p => p.id)).size !== pages.length || new Set(pages.map(p => p.index)).size !== pages.length) ctx.addIssue({ code: "custom", path: [key], message: "Page IDs and indexes must be unique." });
    for (const p of pages) if (new Set(p.elements.map(e => e.id)).size !== p.elements.length) ctx.addIssue({ code: "custom", path: [key], message: "Element IDs must be unique within a page." });
  }
  for (const key of ["targets", "added", "deleted"] as const) {
    const ids = input[key].map(t => JSON.stringify([t.pageId, t.elementId]));
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: [key], message: "List each target once." });
  }
  if (input.added.some(a => input.deleted.some(d => d.pageId === a.pageId && d.elementId === a.elementId))) ctx.addIssue({ code: "custom", message: "An element cannot be both added and deleted." });
  if (input.targets.some(t => input.deleted.some(d => d.pageId === t.pageId && d.elementId === t.elementId))) ctx.addIssue({ code: "custom", message: "A deleted element cannot have a remaining target value." });
});
export type ReviewCanvaEditInput = z.infer<typeof reviewCanvaEditSchema>;
