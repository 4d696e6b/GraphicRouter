# Release quality checkpoint — 2026-10-15 (0.10.1)

Status: candidate for continued owner-private testing. This is not a claim that the
product is fully verified for broad public or marketplace publication. Keep the
existing private Site audience. Final build/deployment evidence is recorded in the
Builder A checklist after completion.

## Redesigned briefing

The hosted page and embedded app use the same scoped, responsive Briefing component:
compact progress/sidebar, concise headings and progressive help, clear starting
choices, a consistently light answer field, exact character count, quieter secondary
actions and editable review rows. Existing answer keys, validation, routing, full
context and complete chat handoff are preserved. No persistence or permission change.

The underlying form still accepts16000 characters per answer and40000 in context.
Answers remain in the open view; closing/reloading can lose an unsent draft. The
inline fallback retains the full prepared handoff after a host failure. A synchronous
submission guard prevents duplicate sends, and navigation resets the form's own
viewport without losing accessible heading focus.

Actual native Chrome QA completed on the local hosted /briefing route and a clearly
labelled isolated React harness (no account/provider writes):

- Readable white input in a dark browser/system context; desktop form and375px
  iframe layout inspected, including the long mobile review CTA with no overflow.
- Pace/route selection, forward/back, exact supplied wording retained, and required
  empty-answer error preventing progress. Question headings receive keyboard focus.
- Prefilled and hidden brand details appear in review and the complete handoff.
- Double-click pending submission produces exactly1 simulated send; navigation and
  edit controls disable while sending. Resolving it shows confirmation without resend.
- Simulated failure leaves answers, an explicit uncertain-handoff message and a
  complete copy fallback. No automatic retry.
- A16000-character source answer preserves its END-MARKER and hidden brand in the
  actual prepared message. This checks UI transport, not host model recall.

Found and fixed: inherited dark input surface, viewport remaining scrolled after a
question change, duplicate-submission window, and mobile review action
wrapping. Custom prompt copy remains escaped and the complete help remains available.
The harness lives only in ignored artifacts/briefing-ui and is not a production route.

## Existing application checks

Full TypeScript/test coverage includes the engine, native export, brief transport,
MCP discovery/auth, source/checklist storage, stale concurrent writes, owner-isolated
reads/downloads, same-origin route checks, bounded streamed JSON, import claims and
uncertain failures. Existing tests also cover native text/copy/image snapshot checks,
same-file edit planning, picture role/source handling,24-slide detailed source stress
and actual native PPTX composition. No blanket factual/aesthetic/Canva guarantee.

Tests before security patches:254 in43 files pass. Repeat after installing the
patched lock and build both GitHub and exact Test source; record actual results in
the task checklist. No separate formal security-review service was run.

## Dependency findings and response

A full npm audit found30 affected dependency entries (20 high,8 moderate,2 low),
while --omit=dev reported0. That production-only result is insufficient: packages
classified as development dependencies also provide bundled RSC runtime code.

Compatible verified patch updates: React/React DOM/react-server-dom-webpack19.2.8,
Vite8.0.16, Babel core7.29.7, Browserslist4.28.7, js-yaml4.3.2, brace-expansion1.1.21
and5.0.12, Undici7.29.1, ws8.21.0 and fflate0.7.5. Existing framework integration,
versions outside these targeted fixes, authorization and secret bindings are retained.
Registry versions and peer ranges were checked. No forced framework downgrade,
unknown replacement package or unverified major migration was applied.

The React RSC advisory is fixed in19.2.8:
https://github.com/advisories/GHSA-wx67-qw84-cm4g

Remaining upstream/toolchain findings must remain visible. The patched-lock audit
currently reports14 affected entries (8 high,4 moderate,2 low). High entries are the
braces3.0.3 stack-exhaustion advisory and its dependent build/glob/lint packages;
no patched compatible3.x version was available. Moderate entries include old esbuild
inside the development Drizzle loader and Wrangler; low entries are related toolchain
packages. These are registry dependency findings, not14 independently demonstrated
application exploits. Do not claim all are harmless because their dev flag is true.

https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
https://github.com/advisories/GHSA-67mh-4wv8-2f99
https://github.com/advisories/GHSA-g7r4-m6w7-qqqr

Task-owned ignored artifacts/release-quality contains the exact before/patched-lock
reports. Recheck registry advisories before a broad release. Upstream remediation or
a separately validated tooling migration and documented risk review remain needed;
blindly accepting npm's suggested major downgrades is not a safe release fix.

## Remaining real-use release gates

- Fresh-chat host discovery/rendering and a complete ChatGPT→Canva rehearsal with
  the intended account, including long-deck completion and the final pitch edit.
- Actual same-file read/draft/approved-save verification on a user-supplied design,
  including preservation of unrelated native objects and handling edit permission.
- Actual attachment byte upload and placement using the intended chat's supported
  mechanism; seeing a picture does not prove upload/placement. Do not use unrelated
  private designs or upload an unrequested test picture to hide this gap.
- Current imported Canva layer/fidelity review. Native PPTX shape/text XML or a
  snapshot-helper pass alone cannot establish imported editability or visual quality.
- Resolve/document outstanding upstream dependency findings and the chosen public
  audience/distribution process before calling the product publicly release-ready.

Original GraphicRouter remains inaccessible from the current connected account and
is not updated. Only the existing owner-private GraphicRouter Test is eligible for
this release; no public audience or marketplace submission is authorized/claimed.
