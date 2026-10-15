import { planCanvaEditSchema, parseCanvaReference, reviewCanvaEditSchema, type ReviewCanvaEditInput } from "../contracts/canva-edit";
import { canvaEditWorkflow } from "../briefing/canva-edit-workflow";
/** Pure orchestration plan. Actual provider calls remain in the connected Canva app. */
export function planCanvaEdit(raw: unknown) {
  const input = planCanvaEditSchema.parse(raw), reference = parseCanvaReference(input.design);
  return {
    kind: "canva_edit_plan", status: "provider_read_required", mode: input.mode,
    source: reference, requestCharacters: input.request.length, requestHandling: "Reuse the original requested changes from the user without repeating token-bearing links in summaries.", pageNumbers: input.pageNumbers ?? [],
    nextCall: reference.kind === "shortlink"
      ? { tool: "resolve-shortlink", arguments: { shortlink_id: reference.shortlinkId }, then: "get-design using the exact returned full URL, including its collaboration token." }
      : { tool: "get-design", argumentsFrom: reference.kind === "design_url" ? "Pass the FULL original user-supplied URL, including any collaboration token, directly to design_id. The safeReference is redacted and must not replace it." : "Pass the source designId to design_id." },
    workingFile: input.mode === "edit_original" ? "Use the returned source design ID. No copy, new design, generation or PowerPoint import." : "User explicitly selected edit_copy: copy-design once, then use only that returned copy's ID.",
    instructions: canvaEditWorkflow,
    scope: "This result only validates a reference and plans connected-tool work; it has not read, edited, copied or saved any Canva design. Permissions, element IDs and capabilities must come from actual provider responses.",
  };
}
/** Checks supplied captured properties, not Canva itself or an external save lock. */
export function reviewCanvaEdit(raw: unknown) {
  const input: ReviewCanvaEditInput = reviewCanvaEditSchema.parse(raw), issues: { code: string; target: string; message: string }[] = [];
  const add = (code: string, target: string, message: string) => issues.push({ code, target, message });
  const { before, after } = input;
  if (before.designId !== after.designId) add("DESIGN_CHANGED", "designId", "Both snapshots must be from the same working Canva file.");
  if (before.transactionId !== after.transactionId) add("TRANSACTION_CHANGED", "transactionId", "Use before/after snapshots from the same active transaction; stale drafts must be reread.");
  if (!before.complete || !after.complete) add("PARTIAL_SNAPSHOT", "pages", "Capture every exposed element/property on each selected page; incomplete snapshots cannot establish preservation.");
  if (JSON.stringify(before.pages.map(p => p.id)) !== JSON.stringify(after.pages.map(p => p.id))) add("PAGE_STRUCTURE_CHANGED", "pages", "Selected page order or membership changed; reread matching pages. This checkpoint does not authorize page restructuring.");
  let changed = 0;
  for (const oldPage of before.pages) {
    const page = after.pages.find(p => p.id === oldPage.id); if (!page) continue;
    if (page.index !== oldPage.index || page.width !== oldPage.width || page.height !== oldPage.height) add("PAGE_GEOMETRY_CHANGED", page.id, "Page index or dimensions changed outside this element-edit scope.");
    for (const old of oldPage.elements) {
      const current = page.elements.find(e => e.id === old.id), target = `${page.id}/${old.id}`;
      if (!current) {
        changed++;
        if (!input.deleted.some(d => d.pageId === page.id && d.elementId === old.id)) add("UNREQUESTED_DELETION", target, "An unrelated element disappeared.");
        continue;
      }
      const expected = input.targets.find(t => t.pageId === page.id && t.elementId === old.id)?.expected;
      for (const key of new Set([...Object.keys(old.properties), ...Object.keys(current.properties)])) {
        if (Object.hasOwn(old.properties, key) === Object.hasOwn(current.properties, key) && old.properties[key] === current.properties[key]) continue;
        changed++;
        if (!expected || !Object.hasOwn(expected, key)) add("UNREQUESTED_PROPERTY_CHANGE", `${target}.${key}`, "A captured property changed outside the requested targets.");
      }
    }
    for (const current of page.elements) if (!oldPage.elements.some(e => e.id === current.id)) {
      changed++;
      if (!input.added.some(a => a.pageId === page.id && a.elementId === current.id)) add("UNREQUESTED_ADDITION", `${page.id}/${current.id}`, "An element was added without an explicit addition target.");
    }
  }
  for (const target of input.targets) {
    const old = before.pages.find(p => p.id === target.pageId)?.elements.find(e => e.id === target.elementId);
    const current = after.pages.find(p => p.id === target.pageId)?.elements.find(e => e.id === target.elementId);
    if (!old && !input.added.some(a => a.pageId === target.pageId && a.elementId === target.elementId)) add("TARGET_NOT_IN_SOURCE", `${target.pageId}/${target.elementId}`, "Target must come from the current transaction, or an explicitly authorized new element.");
    if (!current) add("MISSING_TARGET", `${target.pageId}/${target.elementId}`, "A requested element is absent after editing.");
    else for (const [key, expected] of Object.entries(target.expected)) if (!Object.hasOwn(current.properties, key) || current.properties[key] !== expected) add("TARGET_VALUE_MISMATCH", `${target.pageId}/${target.elementId}.${key}`, "Requested value does not match the captured result exactly.");
  }
  for (const target of input.added) {
    const old = before.pages.find(p => p.id === target.pageId)?.elements.some(e => e.id === target.elementId), current = after.pages.find(p => p.id === target.pageId)?.elements.some(e => e.id === target.elementId);
    if (old || !current) add("ADDITION_NOT_MET", `${target.pageId}/${target.elementId}`, "An explicit addition must be absent before and present after.");
  }
  for (const target of input.deleted) {
    const old = before.pages.find(p => p.id === target.pageId)?.elements.some(e => e.id === target.elementId), current = after.pages.find(p => p.id === target.pageId)?.elements.some(e => e.id === target.elementId);
    if (!old || current) add("DELETION_NOT_MET", `${target.pageId}/${target.elementId}`, "An explicit deletion must be present before and absent after.");
  }
  if (input.visualReview !== "passed") add(input.visualReview === "problems_found" ? "VISUAL_PROBLEMS" : "VISUAL_REVIEW_REQUIRED", "preview", "Inspect the latest draft preview and critical close-ups; resolve visible problems.");
  return {
    kind: "canva_edit_review", designId: after.designId, transactionId: after.transactionId,
    decision: issues.length ? "blocked" : changed ? "ready_for_user_review" : "no_changes",
    changedCapturedProperties: changed, pagesCompared: before.pages.length, issueCount: issues.length, issues: issues.slice(0,100), truncated: issues.length > 100,
    savePolicy: "Show the latest preview and readable change summary; obtain explicit user approval before Canva commit-editing-transaction. A ready result is not save approval. Verify committed status and reread the same design afterward.",
    scope: "Only caller-supplied selected-page snapshots and captured properties are compared. This does not fetch Canva, certify uncaptured/other pages, semantic intent, visual accuracy, native layers or facts, or enforce the provider's commit approval. Run review_canva_design separately for layer/copy checks.",
  };
}
