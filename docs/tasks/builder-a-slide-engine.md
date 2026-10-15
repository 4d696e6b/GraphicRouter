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
- [ ] B should create this exact input through the real service/MCP workflow and
  confirm the resulting deck before final presentation freeze. Generated artifacts
  here are direct engine outputs, not evidence of that service creation.
- Remaining account blockers and browser-control testing are unchanged.
