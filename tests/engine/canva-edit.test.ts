import { describe, it, expect } from "vitest";
import { planCanvaEdit, reviewCanvaEdit } from "../../src/engine/canva-edit";
import { parseCanvaReference, reviewCanvaEditSchema, type ReviewCanvaEditInput } from "../../src/contracts/canva-edit";
const before: ReviewCanvaEditInput["before"] = { designId: "DA_TEST_original", transactionId: "transaction-from-provider", complete: true, pages: [{ id: "page1", index: 1, width: 1080, height: 1920, elements: [
  { id: "headline", properties: { type: "text", text: "Original headline", color: "#112233", left: 60, top: 70, width: 900, height: 100, fontSize: 64, fontWeight: "bold", link: "" } },
  { id: "photo", properties: { type: "image", assetId: "actual-provider-asset", left: 60, top: 350, width: 600, height: 600 } },
  { id: "source", properties: { type: "text", text: "Verified source", link: "https://example.org/source" } },
] }] };
function input() { const after = structuredClone(before); after.pages[0].elements[0].properties.color = "#7C3AED"; return { before: structuredClone(before), after, targets: [{ pageId: "page1", elementId: "headline", expected: { color: "#7C3AED" } }], visualReview: "passed" }; }
describe("same-file Canva planning and supplied snapshot preservation", () => {
  it("keeps same-file mode and redacts collaboration tokens while requiring the full original get-design URL", () => {
    const r = planCanvaEdit({ design: "https://www.canva.com/design/DA_TEST_original/privatePathToken/edit?token=collaborationSecret#otherSecret", request: "Only change headline to violet." });
    expect(r.mode).toBe("edit_original"); expect(r.status).toBe("provider_read_required"); expect(r.source).toMatchObject({ kind: "design_url", designId: before.designId });
    expect(JSON.stringify(r)).not.toMatch(/privatePathToken|collaborationSecret|otherSecret/); expect(r.nextCall).toMatchObject({ tool: "get-design" }); expect(r.workingFile).toContain("No copy"); expect(r.nextCall).toHaveProperty("argumentsFrom");
    expect(planCanvaEdit({ design: before.designId, request: "Use a copy", mode: "edit_copy" }).workingFile).toContain("copy-design once");
  });
  it("resolves shortlinks first and rejects misleading/local/non-design URLs without fetching", () => {
    expect(planCanvaEdit({ design: "https://canva.link/abc123?share=secret", request: "Read and edit" }).nextCall).toMatchObject({ tool: "resolve-shortlink", arguments: { shortlink_id: "abc123" } });
    for (const raw of ["http://www.canva.com/design/DA_TEST_original", "https://canva.com.evil.test/design/DA_TEST_original", "https://user:pass@canva.com/design/DA_TEST_original", "https://canva.com:4430/design/DA_TEST_original", "https://canva.com/folder/DA_TEST_original", "https://127.0.0.1/design/DA_TEST_original", "javascript:alert(1)"]) expect(() => parseCanvaReference(raw)).toThrow();
  });
  it("allows only the requested colour while keeping text, format, source and photo untouched", () => {
    const data = input(), original = structuredClone(data), r = reviewCanvaEdit(data);
    expect(r).toMatchObject({ decision: "ready_for_user_review", changedCapturedProperties: 1, issueCount: 0, pagesCompared: 1 }); expect(r.savePolicy).toContain("explicit user approval"); expect(data).toEqual(original);
    expect(reviewCanvaEdit({ ...data, after: data.before, targets: [] }).decision).toBe("no_changes");
  });
  it("blocks collateral style/source/photo changes even if the target colour matches", () => {
    const d = input(); d.after.pages[0].elements[0].properties.fontSize = 32; d.after.pages[0].elements[2].properties.link = "https://example.org/wrong";
    expect(reviewCanvaEdit(d)).toMatchObject({ decision: "blocked", issueCount: 2 });
    const deleted = input(); deleted.after.pages[0].elements.splice(1,1); expect(reviewCanvaEdit(deleted).issues.some(i => i.code === "UNREQUESTED_DELETION")).toBe(true);
    const added = input(); added.after.pages[0].elements.push({ id: "unexpected", properties: { text: "Unrequested" } }); expect(reviewCanvaEdit(added).issues.some(i => i.code === "UNREQUESTED_ADDITION")).toBe(true);
  });
  it("blocks stale identities, transaction changes, page structure/dimensions, incomplete and visually unchecked snapshots", () => {
    for (const update of [ { designId: "DA_TEST_other" }, { transactionId: "stale" }, { complete: false } ]) {
      const d = input(); Object.assign(d.after, update); expect(reviewCanvaEdit(d).decision).toBe("blocked");
    }
    const d = input(); d.after.pages[0].width = 900; expect(reviewCanvaEdit(d).issues[0].code).toBe("PAGE_GEOMETRY_CHANGED");
    d.after.pages[0].id = "wrong-page"; expect(reviewCanvaEdit(d).issues.some(i => i.code === "PAGE_STRUCTURE_CHANGED")).toBe(true);
    expect(reviewCanvaEdit({ ...input(), visualReview: "not_checked" }).decision).toBe("blocked");
  });
  it("does not mistake removed properties or absent/null/false/zero values for unchanged targets", () => {
    const d = input(); delete (d.after.pages[0].elements[0].properties as Record<string,unknown>).fontWeight;
    expect(reviewCanvaEdit(d).issues.some(i => i.target.endsWith("fontWeight"))).toBe(true);
    const empty = input(); empty.targets = [{ pageId: "page1", elementId: "headline", expected: { color: "" } }]; expect(reviewCanvaEdit(empty).issues.some(i=>i.code==="TARGET_VALUE_MISMATCH")).toBe(true);
    expect(reviewCanvaEdit({ ...input(), targets: [{ pageId: "page1", elementId: "absent", expected: { color: null } }] }).decision).toBe("blocked");
  });
  it("allows only explicit additions/deletions and verifies they occurred", () => {
    const d = input(); d.after.pages[0].elements.splice(1,1);
    expect(reviewCanvaEdit({ ...d, deleted: [{ pageId: "page1", elementId: "photo" }] }).decision).toBe("ready_for_user_review");
    expect(reviewCanvaEdit({ ...input(), deleted: [{ pageId: "page1", elementId: "photo" }] }).issues.some(i=>i.code==="DELETION_NOT_MET")).toBe(true);
    expect(reviewCanvaEdit({ ...input(), added: [{ pageId: "page1", elementId: "missing" }] }).issues.some(i=>i.code==="ADDITION_NOT_MET")).toBe(true);
  });
  it("rejects duplicate IDs and contradictory targets; bounded issue output retains full blocking count", () => {
    const d = input(); d.after.pages[0].elements.push(d.after.pages[0].elements[0]); expect(reviewCanvaEditSchema.safeParse(d).success).toBe(false);
    expect(reviewCanvaEditSchema.safeParse({ ...input(), deleted: [{ pageId: "page1", elementId: "headline" }] }).success).toBe(false);
    const big = input(); big.before.pages[0].elements = Array.from({length:150},(_,i)=>({id:`e${i}`,properties:{text:`old${i}`}})); big.after.pages[0].elements=[]; big.targets=[];
    const r=reviewCanvaEdit(big);expect(r.decision).toBe("blocked");expect(r.issues).toHaveLength(100);expect(r.issueCount).toBe(150);expect(r.truncated).toBe(true);
  });
});
