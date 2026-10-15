# Builder A — slide engine and presentation quality

Branch: `feat/slide-engine`. Start from the common initialization commit.
Tracking: https://github.com/4d696e6b/GraphicRouter/issues/1

Status: **engine implemented and tested; ready for Builder B integration. Joint stage checks remain.**

## Paste this into your Codex chat

```text
You are Builder A for GraphicRouter. Implement the slide engine on
feat/slide-engine. Read AGENTS.md, docs/PRODUCT.md, docs/CONTRACTS.md,
docs/COORDINATION.md, and this task before editing. Check your branch first.

Own src/engine/**, src/fixtures/**, and tests/engine/**. Export engine: SlideEngine
from src/engine/index.ts using the existing shared port. Implement deterministic
five-slide composition, immutable targeted revisions, geometry/text-fit validation,
native PPTX export, and SVG construction-stage previews from the same blueprint.
Use the existing dependencies and keep platform/storage/Canva code out of the engine.

First prove a native text/shape/image PPTX fixture and hand it to Builder B for a
real Canva import check. Then finish all five recipes and the exact headline-colour
revision acceptance test. Do not wait for the service to start pure engine work.
Create the actual pitch fixture only from verified project capabilities; the existing
sample input is draft material, not evidence of implementation.

Add focused tests, run npm run check, update this task with evidence, commit in
small increments, push your branch, and open a PR into main when the engine handoff
is usable. Do not implement Builder B's work or publish the Site. Report requests
for shared-contract/dependency changes explicitly before making incompatible edits.
```

## Work order

### A1 — import-fidelity spike (first two hours)

- [x] Generate a small native PPTX fixture with two slides, text, a rectangle,
  circle, line, and bundled PNG/JPEG. This raw compiler spike can be independent
  of the fixed-five-slide model-input schema.
- [x] Give B the file and the exact objects to test in Canva.
- [x] Verify 16:9 sizing and initial Arial wrapping; record actual import results.

### A2 — usable engine handoff (target hour 8)

- [x] Implement `engine: SlideEngine` with all five port methods.
- [x] Add hero/cards/comparison/process/closing recipes and layout fit rules.
- [x] Generate stable semantic element IDs, including `slide3.headline`.
- [x] Use one blueprint for SVG stages and PPTX; resolve theme and hex paints alike.
- [x] Bundle at least one PNG/JPEG in an engine-owned asset module and expose it
  through `src/engine/assets.ts` as `assets: Asset[]` for B to pass to the port.
- [x] Export native text, shape, line, and image objects; never flatten whole slides.
- [x] Reject overflow, invalid bounds, unsupported assets/layouts, and invalid targets
  with clear errors. Preserve the previous blueprint on every failure.
- [x] Send B the engine PR and a working five-slide fixture.

### A3 — precise revisions and real pitch (hours 8–16)

- [x] Implement all five typed operations with version + 1 and a readable diff.
- [x] Test that a headline-colour revision changes only the requested paint plus
  version/change metadata; input and every unrelated element remain unchanged.
- [x] Preserve colour overrides when a later layout switch rebuilds that slide,
  or explicitly reject combinations the implementation cannot preserve.
- [x] Generate a real GraphicRouter pitch fixture with core and expanded notes;
  remove draft claims only when they have actual implementation evidence.
- [ ] Visually inspect all slides and help B verify actual imported editability.

### A4 — freeze and submission support

- [ ] Freeze deck/live-edit path at hour 16 with B.
- [x] Save a local PPTX; make a PDF backup using a verified available exporter.
- [ ] Rehearse the core script and the live colour edit; help record an honest backup.

## Tests and handoff

Test repeatable geometry; exact revision preservation; all supported operations;
failed revisions leaving input unchanged; invalid target/overflow errors; SVG
escaping; and PPTX object/content presence. A generated ZIP/PPTX is not sufficient
evidence of Canva fidelity: that final check is manual in the actual account.

Handoff includes the exported engine/assets, one valid five-slide input, test
results, known limitations, and an import-tested PPTX. Check `npm run check` before
every PR; B handles platform/build integration.

## Evidence and blockers

- Implemented the complete shared engine port, five recipes, all five operations,
  PNG/JPEG asset handling, shared SVG/PPTX line layout, and structured errors.
- `npm run check`: 38 tests pass; `npm run build` passes. A local Cloudflare Worker
  also generated the five-slide PPTX successfully with the intended compatibility flag.
- Actual Canva imports succeeded for the probe and five-slide engine-stage pitch.
  Readback found five editable 1920×1080 pages, 53 text objects, and an editable logo.
- All finished SVGs were visually inspected. Core notes: 295 words plus demo;
  expanded notes: 580 words plus demo. Local PPTX/SVG/notes files and a five-page
  visual PDF backup are available. The 58 KiB import probe is committed at
  `src/fixtures/canva-import-probe.pptx`; derived pitch artifacts remain ignored.
- No shared-contract or dependency changes were needed. See `src/engine/README.md`
  for imports, error handling, fixture generation, Canva links, and test evidence.
- Pending with Builder B: actual shape/line recolouring, imported font matching,
  installed ChatGPT workflow, full rehearsal, and a recorded integrated backup.
  The pitch content explicitly separates tested engine capabilities from integration.
- Builder B can integrate through the PR; the imported Canva designs require the
  creator's account access. No Canva OAuth/application code was implemented by A.

## Immediate integration handoff

- Fixture: `src/fixtures/canva-import-probe.pptx` (two slides, six named native
  objects per page, including the bundled PNG).
- Export command from the repo root:
  `GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/handoff.test.ts`.
  Regenerated path: `artifacts/builder-a/canva-import-probe.pptx`.
- Exports: `engine: SlideEngine` in `src/engine/index.ts`, and `assets: Asset[]`
  in `src/engine/assets.ts`, unchanged from the agreed shared contracts.
- Reviewed draft PR #3's provider/service read-only. B can replace the provider
  with re-exports from `../engine` and `../engine/assets`, then run real service
  create/revise/preview/export checks. No B code was merged or edited here.
- Dependency requests: none. Suggested B follow-up: preserve EngineError's useful
  messages/issues when mapping it to service errors.
- The existing Canva connection in this chat imported the probe and real pitch;
  this is independent of B's unavailable Sites access and unconfigured app OAuth.
  Actual Canva shape/line recolouring, imported font matching, hosted plugin calls,
  and full pitch rehearsal remain pending.

## Follow-up after PR #4 merged

- [x] Add regressions and reject truncated/damaged PNG containers and JPEGs
  missing scan/end structure. No new dependencies; no claim of full pixel decoding.
- [x] Reject orphan/missing recipe elements and incompatible source block counts
  before export or layout revision, preserving the working version on failure.
- [x] Generate a portable, clearly labelled offline engine replay with embedded
  PPTX downloads, three preview stages, speaker notes, and a rehearsal timer.
- [x] Generate revision-proof hashes and verify only `slide3.headline` changed;
  reject unrelated edits and an unchanged PPTX passed off as the revised export.
- [x] Repeat check (38 tests), production build, and local Worker export:
  five slides, 131810 bytes, ZIP signature 80/75/3/4, no validation errors.
- [ ] Check offline replay controls visually. Browser security could not verify
  the admin policy for either localhost or Canva, so browser access was denied.
  No browser security workaround was used. Generated outputs and proof assertions
  pass; UI operation and actual speaking pace remain unverified.
- New files: `artifacts/builder-a/offline-rehearsal.html` and
  `artifacts/builder-a/revision-proof.json`, reproduced by the existing artifact command.
- Builder B integration exports and shared contracts are unchanged. No dependency
  requests. PR #4 is merged; B can bring main into its own branch and wire the
  existing provider. The offline replay does not complete B's OAuth/Sites checks.

## Updated pitch handoff after B integrated the engine

- [x] Read B's latest remote task evidence at `f23b071`; provider now uses the real
  engine/assets, and B records the actual local service and manual Canva checks.
  No B branch was merged or B-owned file edited by A.
- [x] Add separate `src/fixtures/local-workflow-pitch.ts`, preserving the original
  engine-stage fixture. It states local simulated-identity evidence and manual
  Canva text/image checks accurately, with hosted/OAuth/editor gaps explicit.
- [x] Export core/expanded PPTX, violet revision, offline replay, notes, and exact
  service input at `artifacts/builder-a/local-workflow/create-deck.json`.
- [x] Check all five rendered previews visually: no clipping. Verify exact revision
  preservation again. `npm run check`: 39 tests pass; production build passes.
- [x] Create this exact input through direct local DeckService calls in an isolated
  combined review tree. Hosted MCP creation and final stage rehearsal remain pending.
- Remaining account blockers and browser-control testing are unchanged.

## Builder B review correction

- Reproduced B's `fa9bf40` finding: the offline proof incorrectly accepted changed
  notes on slide 3 alongside the headline recolour. Added the exact negative case
  and confirmed it failed before the fix.
- The proof now compares complete slide objects after normalizing only the target
  paint, so target-slide notes and other metadata cannot be overlooked.
- `GRAPHICROUTER_ARTIFACTS=1 npm run check`: 39 tests pass; generated pitch/replay
  artifacts refreshed. This fixes the test/handoff proof, not the production engine
  revision path, whose preservation checks already pass. No B files changed.

## Exact pitch service acceptance

- Added A-owned `tests/engine/service-pitch.test.ts`: creates the exact updated pitch
  through B's DeckService with real engine and SQLite migrations, validates all 15
  preview SVGs, exports original/revised PPTX, and runs the full revision proof.
- Confirmed stale writes and anonymous downloads reject, while stored v1 and v2
  remain intact. No B source, contracts, dependencies, or configuration changed.
- A-only check: 39 pass, one explicitly skipped because service files are absent.
  Combined snapshot of B `a5dc616` plus current A directories: 86 tests pass and
  production build passes. Snapshot is ignored under artifacts; no branch merge.
- Reusable command in combined tree:
  `GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/service-pitch.test.ts`.
- Service-returned PPTX/notes and prepared replay copied into
  `artifacts/builder-a/service-pitch/`, with verification context and hashes.
- Limits: direct service calls, local test owner, in-memory file adapter, real SQLite
  migrations. No HTTP, real R2, hosted identity, ChatGPT account call, or Canva OAuth.
  The recording, stage pacing, and remaining account checks still require follow-up.

## Recovery package completion

- PR #5 is merged at main `f1fe81a`; brought main into A's branch without rewriting
  published commits. The service-pitch acceptance commit remains on A's branch.
- Added reproducible local recovery packaging under tests/engine: five-page 16:9
  raster PDF, a four-frame explicitly labelled precomputed replay, checksummed ZIP,
  editable PPTX, notes, offline HTML, revision proof, and context limitations.
- Both local-workflow and service-pitch packages generated. PDF page count/size,
  GIF frame count, ZIP CRCs, and each file's SHA-256 verified. Source PPTX hash
  mismatch rejects before creating outputs. PDF last page and replay revision frame
  visually inspected. No claim of live recording or Canva PDF export.
- Temporary combined integration snapshot was moved outside the project after
  TypeScript included ignored artifacts in its recursive input scan. No config or
  production code was changed to hide that local review artifact.
- Remaining A checklist items require the live accounts/presenter: imported shape/
  line/font check, complete stage freeze, actual speaking pace, and live recording.
  These remain unchecked, rather than being inferred from the offline package.

## Full-project recheck — B aa16ed1

- Reviewed B's latest pushed implementation, tool registration, runtime bindings,
  preview, immutable storage, Canva client, setup notes, and acceptance evidence.
- Rebuilt an isolated combined tree: 87 existing tests pass; production build
  passes. First build hit ENOSPC during Sites artifact packaging; retry after disk
  space became available completed successfully. No branch or B source was edited.
- B now records the exact updated pitch created through local Worker/D1/R2 HTTP
  and local MCP, plus offline-replay browser controls. These are stronger local
  checks; identity is still simulated and hosted ChatGPT/app OAuth remain unverified.
- **B follow-up, P2:** src/server/service.ts lines 64–72 catches all poll errors but
  only handles CanvaConnectionRequired. Other failures (including the Canva client's
  CANVA_IMPORT_FAILED for HTTP 403/429/500) disappear, returning success/pending with
  no useful explanation. Reproduced with real DeckService/SQLite: seed existing
  pending job, have canva.poll throw ServiceError CANVA_IMPORT_FAILED, call get_deck;
  result silently returns the same pending job and omits the error message.
- Suggested B correction: preserve the pending job in storage, but propagate an
  actionable tool error for non-auth poll failures so the UI can show retry-refresh
  guidance. Never erase/restart the import. Regression should assert that the same
  job persists and no second start occurs while the caller sees the error.
- Reproduction is a review-only test in the isolated snapshot, not a production
  file or an A-owned service change. One reproduction test passed by confirming
  the current incorrect silent behavior; it is not counted in the 87 green checks.
- PR #3 remains open/draft; PR #6 open/mergeable. Shared main does not yet contain
  B's service or A's latest acceptance/package utility. No merge/publication attempted.
- Outstanding complete-product acceptance: resolve the poll-error gap; integrate the
  two open PRs; restore existing Site access; configure app Canva credentials; verify
  hosted tools/widget and real app import; inspect Canva shape/line/font fidelity;
  rehearse actual three-minute pitch/live edit and record it; finish submission.
- B's reported account blockers remain project_not_found for the preserved Site and
  unavailable developer credentials. No claim those were fixed from GitHub access.

## Worker A final handoff hardening

- Reproduced an additional handoff-proof gap with a valid PPTX containing unrelated
  slide-three speaker-note edits while supplying the correct revised blueprint.
  The new negative assertion failed before the fix.
- Proof now compares every native `ppt/` part as decompressed bytes (including
  notes, media, relationships, masters, and untouched slides); only slide3.xml can
  differ, and its complete content must equal the original with just the named
  headline paint substituted. Version/title/timestamp properties outside ppt/ are
  not treated as unrelated slide content. Blueprint preservation remains complete.
- A-only check: 39 pass / one explicit service skip. Combined B aa16ed1 review:
  87 tests pass and production build passes, with the new negative case included.
- Refreshed original/violet decks, notes, proof, PDF/GIF/HTML and both ZIP backups.
  Added src/fixtures/stage-runbook.md to each checksummed ZIP: timed cue sheet,
  exact edit request, version handling, asynchronous import boundary, and honest
  recovery language. Core is 273 spoken words, planning target 150 seconds plus
  30-second demo; actual speaking pace is not yet verified.
- No Worker B files, contracts, dependencies, or account configuration changed.
  The live account/editor/rehearsal checks remain explicitly open.

## User-directed Canva-first visual redesign

- User clarified the product remains a ChatGPT plugin and the main result must be
  a beautiful editable Canva presentation, rather than stopping at PowerPoint.
- Inspected the actual test chat and confirmed successful signed-in creation/export.
  Fixed the output guidance and preview handoff priorities under the user's expanded
  authorization; no second builder/chat was messaged or contracts changed.
- Added opt-in GraphicRouter Studio art direction with dark/ivory editorial contrast,
  stronger hierarchy, native routing illustration and illustrated process stages.
  Historical art directions keep exact original recipes; immutable revisions preserve
  the chosen system. All source fields remain represented, with no shrinking/discard.
- Added a factual five-slide Studio pitch. Rendered/inspected the five-slide contact
  sheet and imported the native PPTX into Canva as DAHYDU0fM4U. Readback: five editable
  pages, 53 text objects, editable logo. Targeted headline formatting returned success
  in a draft; cancelled transaction 6353972201106751147 to preserve the final deck.
- `npm run check`: 92 tests pass; production build passes. New cases cover Studio
  composition/classic compatibility/native revision fidelity and Canva-delivery UI
  completion states. No new production dependencies or arbitrary freeform placement.
- Actual Canva result: https://www.canva.com/d/P_YCbT66Mmc10ti . This used the connected
  Canva plugin's file import; the service's own Canva client ID/secret are still absent.
  Remaining imported shape/line/font fidelity and full stage rehearsal are unverified.


## User-directed presentation briefing — 2026-10-15

- [x] Added an adaptive conversation before create_deck: audience/action,
  message/verified evidence, setting/language/time, visual direction/brand/references
  and useful visual material. Maximum three questions per message; reuse supplied
  answers and honor explicit quick-draft/designer-choice requests.
- [x] Added composition review guidance for hierarchy, contrast, spacing, concise
  copy and narrative. Preserve current supported fonts/layouts/assets and never
  promise arbitrary uploads or exact brand/reference reproduction.
- [x] Exposed policy in both MCP initialize instructions and create_deck metadata;
  preserved all five schemas, existing storage and narrow revision behavior.
- [x] npm run check: TypeScript and 93 tests pass. npm run build passes. New transport
  regression verifies both host discovery paths contain the pre-creation briefing.
- [x] Documented six conversation checks in src/mcp/README.md.
- [ ] Live model conversation checks remain unverified: metadata tests cannot prove
  that ChatGPT asks the right follow-ups or certify subjective slide beauty.
- Scope includes MCP instructions under the user's request to update this plugin;
  no shared contracts, dependencies, credentials or builder service logic changed.


## User-directed question dialog — 2026-10-15

- Inspected “Design a beautiful presentation”: the initial assistant asked five
  prose questions without a tool call; the user's one-page infographic request
  then caused a switch to image generation. This was an unsupported-format escape,
  not a failed Canva import.
- [x] Added supplemental read-only start_briefing tool, retaining the five existing
  deck-operation schemas and source-of-truth behavior. Documented the bounded
  briefing contract in docs/CONTRACTS.md; no database migration or new dependency.
- [x] Implemented an in-app dialog with 20 questions, one visible at a time, context
  prefills, progress, optional skip, back, review and answer editing. Four essentials
  gate submission. Unsupported one-page formats cannot be submitted as decks.
- [x] User-triggered MCP Apps user-message handoff carries the entire brief and asks
  for GraphicRouter creation/Canva delivery. Host rejection retains the answer view
  and a copy-back fallback. No automatic send retry, storage write or image tool.
- [x] Added standalone /briefing fallback; local HTTP returns 200. Unsent answers
  are intentionally view-local; closing/reloading can lose them, disclosed in UI.
- [x] npm run check: TypeScript and 100 tests pass. npm run build passes, including
  /briefing. Tests cover discovery/access/bounds, required fields, unsupported format,
  all-20-answer preservation, one-question markup, escaping and host handoff errors.
- [ ] Actual host dialog display, user click-through, continuation by the model and
  subjective Canva quality remain live checks. Browser inventory failed with an
  app-server error; direct IAB preview then failed its security policy verification.
  No browser-control fallback or policy bypass was attempted.
- Updated scope was requested by the user after the prose-only interview proved
  insufficient. The extra tool is an intake entry point; all original engine and
  deck-tool interfaces remain compatible.


## User-directed blank-canvas infographic implementation — 2026-10-15

The user clarified that ChatGPT must compose an infographic from a blank canvas,
then add editable objects according to the project requirements. This supersedes
the earlier template-only five-slide restriction. The original deck path is retained.

- [x] Added documented schemaVersion2 canvas contracts and pure canvasEngine; no
  recipe/layout selection occurs. Creation is genuinely blank; typed ordered edits
  choose coordinates, sizes, typography, palette and layers. Prior versions remain
  immutable; replacement retains stable IDs and unrelated elements.
- [x] Custom320–4000px dimensions, max200 objects, max40 operations/pass and100versions.
  Native text/rectangle/ellipse/line/registered PNG-JPEG, shared measured Arial text,
  safe SVG and one-page native PPTX. Geometry, fit, glyphs, bounds and assets validate;
  contrast/text overlap produce visible review warnings. No arbitrary code/raw SVG.
- [x] Added create_canvas/edit_canvas/get_canvas/export_canvas/send_canvas_to_canva,
  authenticated generic version storage, owner/file/type boundaries, immutable file
  URLs and claim/poll recovery. Original five deck schemas and all old fixtures pass.
- [x] Added variable-aspect canvas UI, three preview stages, object-reveal frames,
  version construction log and individual-element change summary. API preview errors
  after a committed write return the saved result and Refresh guidance.
- [x] Briefing supports one-page portrait/square/landscape/custom,20 questions about
  content/medium/density/design; no longer forces infographics into five slides.
  Full handoff explicitly requests blank→native structure/content/polish→Canva.
- [x] npm run check passes:148 tests in21 files and TypeScript. Production build
  passes with new canvas tool/file/page routes. Bounded read-only integration audit
  found no concrete P1/P2 issue; auth/stale/write/preview/import recovery reviewed.
- [x] Reproduced two distinct authored examples using the same template-free engine.
  Command: GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/freeform-proof.test.ts.
  Files: artifacts/freeform/{portrait,landscape}/{blank.svg,structure.svg,finished.svg,
  graphicrouter.pptx,blueprint.json,tool-inputs.json}. Rendered SVGs via local PyMuPDF
  and inspected portrait/landscape preview.png. No overlap/contrast validation issues.
  Native PPTX readback verifies one page and individually named objects.
- [ ] Live new-format Canva fidelity/editability and installed-host canvas UI/model
  continuation remain unverified. A separate connected-Canva upload spike rejected
  the PPTX as Unsupported file format ZIP; no design was created. The app binary
  adapter was not called by that spike, so no app-import failure is inferred.
- Limits: currently measured English/Arial, simple geometry and registered images;
  no custom fonts, arbitrary asset ingestion, rotation, gradients or complex vector
  illustration. Composition freedom is not a promise of every graphic capability.
  Subjective quality still needs human review at actual reading size.

## Adaptive briefing and image inspection — 2026-10-15

The user requested complexity first, an early Canva-template choice, fewer relevant
questions, and stronger infographic quality. This authorizes coordinated changes
across briefing, MCP, engine, service, contracts and build dependencies in this chat.

- [x] Replaced the fixed interview with Quick/Balanced/Detailed routes of 6/9/14
  questions, plus one template-source question when applicable. Existing answers
  are reused, hidden answers retained, optional questions skippable, and bounded
  topic-specific wording supported. Complexity and template choices stay fixed.
- [x] Template mode hands off to connected Canva tools for accessible Brand
  Templates or a supplied design. It requires inspecting the source, working on a
  copy, and user approval of native editing previews before committing. Blank mode
  retains the GraphicRouter blueprint as truth; native mode uses the Canva copy.
  Missing access cannot silently become a blank-canvas result or an image tool.
- [x] Added authenticated read-only inspect_canvas, returning actual PNG image
  content and a review report. It supports bounded detail crops, offline bundled
  fonts/static WASM, at most two concurrent renders, and no external resource fetch.
  Inspections never save versions, export files, or initiate Canva imports.
- [x] Added advisory checks for phone-size text, dense copy, weak hierarchy and
  edge spacing. Guidance requires visual inspection and useful targeted revisions,
  rather than declaring quality from metadata or cosmetic stage updates.
- [x] npm run check: TypeScript and 165 tests in 26 files pass. npm run build passes.
  Tests cover adaptive routing/context/compatibility, actual visible glyph PNGs,
  renderer limits/retry, owner isolation, safe failures, crops, MCP image blocks,
  unchanged stored versions, and native export after a targeted quality revision.
  A release review caught safety filters treating visible copy as attributes;
  inspection now accepts "Online = 45%"/"URL (optional)" while rejecting onload.
- [x] Actual local production Worker returned a 1080×1600 overview PNG (104791
  bytes) and 900×300 crop through MCP. The short route returned six questions and
  the original blank version remained unchanged. This used explicit local test
  identity and isolated storage, without real Canva credentials or a live import.
- [x] Inspected portrait/landscape output and a concrete phone-readable revision.
  Reproduce: GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/quality-revision.test.ts.
  Outputs: artifacts/inspection/phone-{before,refined}.png, phone-refined.pptx and
  phone-refined-blueprint.json. Unrelated shapes and the prior version are unchanged;
  the refined example has no native validation or advisory review issues.
- [ ] New hosted dialog click-through/model continuation and actual native Canva
  template editing remain account-dependent checks. The connected account returned
  no accessible Brand Templates during discovery; no template edit was fabricated.
  Browser preview security verification prevented UI click-through; it was not
  bypassed. Successful local HTTP/SSR tests are not a live browser acceptance claim.
- Limits: inspection uses OFL Liberation Sans as an Arial-compatible substitute;
  verify the imported Canva typography separately. Existing English/Arial/simple
  native object limitations remain. Inspection enables visual feedback; it does not
  guarantee subjective beauty or prove Canva editability from a source PNG/PPTX.
- Publication blocker in this Codex session: both get_site and fresh source write
  credential requests return NOT_FOUND/project_not_found for the exact existing
  manifest ID. The earlier credential expired. Site identity/audience and runtime
  secrets are preserved; no replacement Site or permission bypass was attempted.
  Source/build can be reviewed on GitHub, but this update is not live until the
  original Site is accessible from the connected account/workspace again.

## Clear Canva creation versus existing-source routing — 2026-10-15

The user requested this fix after review of “Create handwashing infographic”. That
chat searched Brand Templates twice, got no results, asked for a new route, and
successfully created design DAHYENnOta4 with Canva create-design after approval.
Current get-design verified the one-page design exists. Empty Brand Templates do
not imply failed Canva connectivity or identify the user's plan.

- [x] Added three explicit starting points, with new Canva design first. New-design
  briefs avoid source questions/searches and continue directly from supplied facts.
- [x] Existing-source work uses exact links/account-design search as appropriate,
  preserves originals, and offers early fallback permission. Missing strict sources
  can still require one focused clarification; hidden permission cannot switch a
  selected blank-canvas route. Legacy source/selection values remain compatible.
- [x] Shared public Canva workflow policy now feeds initialization, tool discovery
  and completed handoff. It includes brand exceptions, image-versus-layout scope,
  honest source-of-truth semantics, polling/quotas, visual review and required native
  edit approval. Supported prompt keys are explicit after a trace used content.
- [x] Focused briefing/MCP tests: 22 pass, including new-Canva routing, exact answer
  retention, source requirement versus authorized fallback, legacy compatibility,
  hidden fallback isolation and discovery consistency.
- [x] Full npm run check passes TypeScript and 169 tests in 26 files. The production
  Sites build passes. Private test-Site deployment is recorded by release evidence.
- [x] Also reviewed “Create Astra vs Argon infographic”: after two empty Brand
  Template searches, the assistant offered alternatives and interpreted "approve"
  as permission for GraphicRouter blank-canvas composition. create_canvas/edit_canvas
  built 31 basic objects, inspect_canvas ran twice, export succeeded, and app import
  required Canva sign-in. This differs from the native Canva generation path used
  for the illustrated handwashing result. No API-price fact checking was performed
  in this routing review, and the existing designs were not altered.
- [x] Route choices now show their visual/toolkit differences before selection.
  Policy preserves the selected engine across subjects and does not treat a bare
  approval after multiple alternatives as blank-canvas authorization. It cannot
  promise identical aesthetics across different routes or force host compliance.
- No new Canva generation was requested or started for this policy change. Existing
  chat success is an observed generation check, not proof of a new model's future
  choices. Model continuation and subjective layout quality still need real use.
- Current work is authorized across the intake/MCP/UI directories. Apply the same
  source changes to GitHub without copying the private test Site identity or secrets;
  publish only GraphicRouter Test in this account.

## Native layer requirement and stability review — 2026-10-15

The user's project-wide hardening request and explicit separate-text clarification
authorize this chat's coordinated cross-directory work; legacy owner boundaries
are preserved for unrelated features. Shared review contract is additive and
recorded in docs/CONTRACTS.md before shared integration.

- [x] Require independent native text for every heading/value/label/source, with
  text-free backgrounds/illustrations. Recommend native composition first; retain
  explicit source/generation choices as inspected drafts, without silent switches.
- [x] Add read-only owner-authenticated review_canva_design with strict resource
  bounds: whole-word and per-ID copy, source URLs, bounds, duplicate/colliding text,
  image-text and last-preview review. No model service, external fetch or writes.
  Unknown image lettering cannot pass. Ready still needs Canva's native approval.
- [x] Propagate the same policy through MCP discovery and every completed brief.
  Require isolated cancelled background audits; forbid covering old baked copy,
  committing diagnostic deletions, or claiming inaccessible previews inspected.
- [x] Block identical native text overlays before saving/exporting while preserving
  the prior version. Show source layer counts and separate import success from
  a claim of verified Canva editability in previews.
- [x] Stream bounded UTF-8 JSON at browser/MCP routes before service access; reject
  mismatched Canva poll job IDs without replacing/restarting the saved job.
- [x] Review source paths for owner isolation, immutable writes, write-once exports,
  concurrent import claims, late polls and uncertain auth/transport outcomes. The
  full suite exercises these safeguards; no production account success is inferred.
- [x] npm run check: TypeScript and 184 tests across 29 files pass. The production
  Sites build passes. Repeat after final documentation/preview changes before
  publication. Tests include native PPTX object separation and preserved prior
  blueprints, SDK rejection, image-text blockers and capped issue severity.
- [x] npm audit --omit=dev: zero known production dependency vulnerabilities after
  compatible patches (next/eslint-config-next 16.3.8 and transitive overrides).
  Full audit still reports 30 build/development dependency findings (2 low,
  8 moderate, 20 high), zero critical. This is not a clean full audit or proof of
  runtime exploitability. Do not apply incompatible toolchain downgrades to hide it.
- [x] Audited actual saved design DAHYEeILt2E from “Create a Canva design”: 33 native
  richtexts and 36 image fills, including a page-level image. A movable image is
  not proof of editable lettering. An isolated text-removal audit was cancelled;
  the saved design and the other chat's pending draft were not committed/changed.
  The diagnostic was shown, but could not be independently inspected through the
  available image reader. Image text remains not_checked; no false visual pass.
- [x] Ran the actual supplied object snapshot through the new check: blocked,
  reporting unmatched/missing exact links, unchecked image text and incomplete
  visual review. Local ignored evidence: artifacts/stability/canva-audit-input.json
  and canva-audit-report.json. Copy checks are not verification of API price facts.
- [x] Published only the owner-private GraphicRouter Test Site, version 4, at
  https://graphicrouter-test.pacharapol-pim.chatgpt.site. Deployment succeeded
  with MCP enabled and the existing secret revision 2. Source commit:
  166412750a5487024facbe98c6def91f591d4302; deployment:
  appgdep_6ad0a69ca088819196ff4e0faa62ea49. Original Site was not deployed.
- [x] Connected start_briefing call after publication returned the new native-text,
  no-bitmap-overlay and review_canva_design policy, without a deck/file/import write.
  Policy is included in current call results as well as discovery/completed briefs
  because this chat's tool descriptions are cached. The newly added tool itself
  has not yet appeared in this chat's cached catalogue; use a new chat/refresh the
  plugin connection to discover it. Its RPC/schema/auth behavior is covered by
  local integration tests; no live invocation of that newly discovered name is
  claimed. No native Canva edits were committed by this release check.

Limitations: the host can bypass advisory review through separate Canva tools;
this checkpoint cannot enforce their commit lock or independently authenticate a
caller-supplied snapshot. It performs no OCR/factual audit. Native Canva structure
and saved fidelity need real page-by-page inspection. Existing English/Arial,
simple-geometry and registered-asset limits remain; no universal beauty guarantee.
The user's existing faulty Canva draft has not been automatically repaired/saved,
and no new generation credits were consumed during this review.
