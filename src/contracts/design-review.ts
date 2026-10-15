import { z } from "zod";

const id = z.string().trim().min(1).max(120);
const box = z.object({ x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(), width: z.number().finite().positive().max(20000), height: z.number().finite().positive().max(20000) }).strict();
const httpsUrl = z.string().trim().max(2048).url().refine(value => {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}, "Use an exact HTTPS source URL without credentials.");
/** A bounded, supplied snapshot, not an authenticated Canva API fetch. */
export const reviewCanvaDesignSchema = z.object({
  designId: z.string().regex(/^D[A-Za-z0-9_-]{5,119}$/),
  pageIndex: z.number().int().min(1).max(100),
  width: z.number().finite().positive().max(20000), height: z.number().finite().positive().max(20000),
  texts: z.array(z.object({ id, text: z.string().min(1).max(4000), box, link: httpsUrl.optional() }).strict()).max(200),
  images: z.array(z.object({ id, textInImage: z.enum(["none", "present", "not_checked"]), box: box.optional() }).strict()).max(200),
  requiredText: z.array(z.string().trim().min(1).max(1000)).max(60),
  expectedTextById: z.record(id, z.string().trim().min(1).max(1000)).refine(value => Object.keys(value).length <= 100, "Check at most 100 exact text targets.").optional(),
  expectedLinks: z.array(httpsUrl).max(30),
  visualReview: z.enum(["not_checked", "problems_found", "passed"]),
}).strict();
export type ReviewCanvaDesignInput = z.infer<typeof reviewCanvaDesignSchema>;
