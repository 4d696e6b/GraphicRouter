import { reviewCanvaDesignSchema, type ReviewCanvaDesignInput } from "../contracts/design-review";

type Box = ReviewCanvaDesignInput["texts"][number]["box"];
const normalized = (text: string) => text.normalize("NFC").replace(/\s+/gu, " ").trim();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const urlKey = (value: string) => { const url = new URL(value); url.hash = ""; return url.href; };
const urlsIn = (text: string) => text.match(/https?:\/\/(?:(?!https?:\/\/)[^\s<>"'])+/gu)?.map(value => value.replace(/[.,;!?)]+$/u, "")) ?? [];
const hasCopy = (actual: string, expected: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(normalized(expected))}($|[^\\p{L}\\p{N}])`, "u").test(normalized(actual));
function overlap(a: Box, b: Box) {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return w * h / Math.min(a.width * a.height, b.width * b.height);
}
/** Does not fetch Canva, perform OCR, change a design, or certify caller claims. */
export function reviewCanvaDesign(raw: unknown) {
  const input = reviewCanvaDesignSchema.parse(raw);
  const issues: { code: string; target: string; message: string; severity: "blocker" | "review" }[] = [];
  let blockerCount = 0, reviewCount = 0;
  const add = (code: string, target: string, message: string, severity: "blocker" | "review" = "blocker") => {
    if (severity === "blocker") blockerCount++; else reviewCount++;
    if (issues.length < 100) issues.push({ code, target, message, severity });
  };
  const ids = new Set<string>();
  for (const element of [...input.texts, ...input.images]) {
    if (ids.has(element.id)) add("DUPLICATE_ELEMENT_ID", element.id, "Use distinct IDs from the actual Canva snapshot.");
    ids.add(element.id);
    if (element.box && (element.box.x + element.box.width > input.width + 0.1 || element.box.y + element.box.height > input.height + 0.1)) add("OUT_OF_BOUNDS", element.id, "This object extends outside the page; check clipping.");
  }
  if (!input.texts.length) add("NO_NATIVE_TEXT", "texts", "No independent text objects were supplied. A full-page picture is not an editable infographic.");
  for (const image of input.images) {
    if (image.textInImage === "present") add("TEXT_BAKED_IN_IMAGE", image.id, "Design copy remains inside image pixels. Replace/rebuild the affected background or section; do not overlay replacement text and claim it is editable.");
    if (image.textInImage === "not_checked") add("IMAGE_TEXT_NOT_CHECKED", image.id, "Inspect this image without the editable text in an isolated, cancelled audit transaction. An editable image flag does not prove its lettering is editable.", "review");
  }
  const allText = normalized(input.texts.map(element => element.text).join(" "));
  for (const expected of input.requiredText) {
    if (!hasCopy(allText, expected)) add("MISSING_EXACT_TEXT", "requiredText", `Required copy is missing or altered: ${expected}`);
  }
  for (const [id, expected] of Object.entries(input.expectedTextById ?? {})) {
    const element = input.texts.find(text => text.id === id);
    if (!element || normalized(element.text) !== normalized(expected)) add("WRONG_TEXT_TARGET", id, "Expected text does not match this specific text object exactly; finding a snippet elsewhere on the page does not fix this label.");
  }
  for (let i = 0; i < input.texts.length; i++) for (let j = i + 1; j < input.texts.length; j++) {
    const a = input.texts[i], b = input.texts[j], ratio = overlap(a.box, b.box);
    if (ratio > 0.5 && normalized(a.text).toLocaleLowerCase("en") === normalized(b.text).toLocaleLowerCase("en")) add("DUPLICATE_TEXT_LAYER", a.id, `Duplicate copy overlaps ${b.id}; remove the obsolete layer.`);
    else if (ratio > 0.1) add("TEXT_COLLISION", a.id, `Text overlaps ${b.id}; inspect and resolve the collision.`, "review");
  }
  const expected = new Set(input.expectedLinks.map(urlKey)), observed = new Set<string>();
  for (const text of input.texts) for (const link of [...urlsIn(text.text), ...(text.link ? [text.link] : [])]) {
    try {
      const key = urlKey(link); observed.add(key);
      if (!expected.has(key)) add("UNVERIFIED_LINK", text.id, "A visible URL or hyperlink does not match the exact expected links. Check its spelling and source before delivery.");
    } catch { add("MALFORMED_LINK", text.id, "A visible link is malformed. Prefer a short native text label with the exact verified HTTPS hyperlink."); }
  }
  for (const link of expected) if (!observed.has(link)) add("MISSING_LINK", "expectedLinks", `Expected source link is absent from the supplied native text/hyperlinks: ${link}`);
  if (input.visualReview !== "passed") add("VISUAL_REVIEW_INCOMPLETE", "page", input.visualReview === "problems_found" ? "The latest preview still has visible problems. Repair and inspect it again before approval." : "Inspect the full page and close-ups of critical labels, numbers, diagrams and sources after the last edit.", "review");
  const decision = blockerCount ? "blocked" : reviewCount ? "needs_visual_review" : "ready_for_user_review";
  return { designId: input.designId, pageIndex: input.pageIndex, decision, issues, nativeTextCount: input.texts.length, imageCount: input.images.length,
    issueSummary: { blockerCount, reviewCount, truncated: blockerCount + reviewCount > issues.length },
    evidenceScope: "Checks only the supplied element snapshot and caller-reported image/visual inspection. Does not fetch Canva, perform OCR, independently verify facts, or guarantee image text is absent. Re-run for every page and after edits. External Canva tools can bypass this advisory checkpoint; it is not a backend commit lock.",
    nextStep: decision === "ready_for_user_review" ? "Show the latest checked preview and obtain any approval required by Canva before saving. Do not claim saved changes before commit succeeds." : "Do not present this draft as complete or fully editable. Resolve blockers and perform missing inspections; retain the working source and unrelated elements." };
}
