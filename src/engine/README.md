# GraphicRouter slide engine — Builder A handoff

Implemented on `feat/slide-engine` without changing shared contracts, package files,
platform code, or the other builder's branch.

## Use the shared port

```ts
import { engine, assets, EngineError } from "@/src/engine";
import { finalPitch } from "@/src/fixtures/final-pitch";

const blueprint = engine.createBlueprint(finalPitch, {
  deckId: crypto.randomUUID(),
  version: 1,
});
const svg = engine.renderSlideSvg(blueprint.slides[2], blueprint.theme, "finished", assets);
const revised = engine.reviseBlueprint(blueprint, [{
  type: "set_element_color",
  elementId: "slide3.headline",
  color: "#7C3AED",
}]);
const pptxBytes = await engine.compilePowerPoint(revised, assets);
```

All five `SlideEngine` methods are implemented. The service still owns authorization,
IDs, storage, atomic stale-version checks, and import job state. No HTTP, OAuth,
filesystem access, or another model API is used by the engine methods. Pass asset
bytes explicitly. Keep the exporter on the server; do not bundle it into the widget.

`EngineError` exposes `code` (`VALIDATION_FAILED` or `EXPORT_FAILED`) and structured
`issues`. Catch it at the service boundary and return a useful model/UI error.
Warnings such as `LOW_CONTRAST` do not block an otherwise valid blueprint. Geometry,
text overflow, missing assets, invalid targets, and incompatible switches do block.

## Behavior

- Five recipes: hero/closing accept 0–1 blocks; cards accepts 1–3; comparison accepts
  exactly 2; process accepts 2–3. No source content is discarded to fit a recipe.
- SVG and PPTX use the same geometry, z-order, colours, images, and explicit text
  line breaks. Layout and content stages are schematic; finished uses actual paints.
- Arial numeric advance widths are bundled, not font binaries. A 4% width safety
  margin is used. English, Latin-name characters, and common punctuation are supported;
  unsupported glyphs (including emoji/CJK in v1) return an actionable error.
- Text never silently shrinks. All geometry is 1600×900 logical px. PPTX uses
  120 px/in and 72/120 pt per logical px, on a 13 1/3 × 7 1/2 inch slide.
- Stable IDs include `slide3.headline` and `slide2.block1.heading`. Decorative labels
  cannot receive replace_text; text, lines, and shapes can be recoloured.
- Revisions clone the prior blueprint, increment one version for the whole batch,
  update matching source fields, and fail atomically. Explicit colour overrides
  survive compatible layout changes; an override that would disappear rejects the
  entire switch instead. Global accent changes preserve explicit paints and images.
- PNG/JPEG assets are contained without stretching. Limits: 8 assets, 2 MiB each,
  8 MiB combined, 4096×4096 maximum dimensions. Missing images never export as placeholders.
  PNG chunk boundaries/checksums/end markers and JPEG frame/scan/end structure are
  checked before export. This is container validation, not full pixel decoding.
- Validation rejects elements absent from the selected recipe, missing required
  elements, and incompatible source block counts before revision or export. This
  prevents a layout switch from silently discarding an unplanned stored object.
- PPTX objects use semantic object names and remain separate native text/shape/line/
  image objects. Core or expanded speaker notes are selected by durationSeconds.

## Reproduce generated handoff files

```sh
GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/handoff.test.ts
```

The immediately uploadable two-slide fixture is committed at
`src/fixtures/canva-import-probe.pptx` (58 KiB). It contains independently named
headline/body text boxes, rectangle, circle, line, and PNG image on each page.
The expected editor targets are `probe1.headline`, `probe1.rectangle`,
`probe1.circle`, `probe1.line`, and `probe1.image` (also on page 2).
SHA-256: `bc6601857aec4b545d6e1d522f8be2e348d95ea36cfe4ada1ae49f1861ee8c66`.
The test verifies the committed file still contains all six named objects per page.

The command regenerates a probe plus ignored files under `artifacts/builder-a/`:
engine-stage pitch v1, violet v2, an expanded-notes PPTX, both blueprints, 15 SVG
stage views, a preview HTML page, and a speaker-notes Markdown file. Serve that
folder with a local static server to view the full storyboard. The five-slide pitch
has 295 core words plus a 30-second demo and 580 expanded words plus demo; rehearse
actual pacing. It does not claim the unfinished plugin is installed or deployed.

The same command also creates `offline-rehearsal.html` and `revision-proof.json`.
The HTML is self-contained: five thumbnails, three construction stages, prepared
violet revision, core/expanded notes, timer, and embedded PPTX downloads work without
a server or external requests. Open the file locally. It is visibly labelled a
**precomputed engine replay**, not a live ChatGPT/Canva demonstration or recording.
The report verifies the one-element blueprint change, four unchanged native slide
XML files, and artifact hashes. Generation rejects unrelated edits or an original
PPTX incorrectly supplied as the revision. Browser interaction testing is pending:
the current admin policy prevented both Canva and localhost access.

## Builder B PR #3 integration

### Updated local-workflow pitch

`src/fixtures/local-workflow-pitch.ts` is a separate pitch reflecting Builder B's
recorded evidence at `f23b071`: real-engine local service flow with simulated local
identity and separate manual Canva text/image checks. The original engine-stage
fixture stays available. Hosted ChatGPT, app OAuth, shape/line editing, and font
matching remain explicitly unverified. The exact updated pitch has passed direct
local DeckService creation/export checks described below; its hosted account
workflow remains unverified.

Run `GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/local-workflow-pitch.test.ts`.
Outputs under `artifacts/builder-a/local-workflow/` include the exact `create-deck.json`
for B to submit through the service, original/violet/expanded PPTX files, notes,
revision proof, and a self-contained offline rehearsal. All five rendered slide
previews were visually inspected with no clipping. The fixture passes fit checks
and the one-element revision proof. Actual speaking pace and browser controls still
need rehearsal. This does not certify B's unmerged branch or hosted account behavior.

B's remote branch at `f23b071` already wires the provider to these exports.
PR #3 remains draft and unmerged; A read its evidence without merging the branch.
The provider exports are:

```ts
export { engine } from "../engine";
export { assets } from "../engine/assets";
```

There are no shared-contract or dependency changes to coordinate. Builder B should
preserve the real create/revise/preview/export checks through `DeckService` and
`EngineError` diagnostics; its latest evidence records these locally. This does not
claim installed-account checks have run. The new pitch input still needs its hosted
workflow and stage rehearsal before presentation freeze.

Builder B's unavailable Sites access and missing Canva app credentials still block
its production path. The successful imports below used this chat's existing Canva
connection for a separate manual spike; they do not configure B's credentials.

A local visual PDF backup was also generated from the same blueprint previews.
That file is a raster presentation backup, not a Canva PDF export; editable objects
remain in the PPTX. PDF generation is not a method in the shared engine port.

## Verification recorded

- `npm run check`: strict TypeScript plus 39 passing tests, including malformed
  PNG/JPEG containers and recipe/source integrity regressions. Replay assertions
  also reject unrelated changes, incorrect revised files, and unsafe script text.
- `npm run build`: framework shell builds; it does not imply completed integration.
- Export tests inspect OOXML for five slides, 16:9 dimensions, Arial sizes, text,
  rectangle/ellipse/line objects, a separate PNG, notes, and a contained JPEG.
- Revision tests compare unrelated elements and all four untouched slide XML files.
- Generated SVGs were rendered for visual inspection of all five finished slides.
- A Vite-bundled local Cloudflare Worker generated the five-slide native PPTX with
  nodejs_compat, returning 131810 bytes, ZIP signature 80/75/3/4, and no validation errors.
- Actual Canva imports succeeded: a two-slide probe and the five-slide pitch.
- Canva readback reported all five pages editable at 1920×1080, 53 separate text
  objects, and the logo as an editable image. The 1.2× coordinate scale preserves 16:9.
- Inspection transactions were cancelled without changing the imported designs.

Creator-account Canva links (access may require the same connected account):

- Probe: https://www.canva.com/design/DAHYDAZWi7s/edit
- Engine-stage pitch: https://www.canva.com/design/DAHYDFvxszc/edit

**Remaining joint checks:** actual shape/line recolouring in the Canva editor, visual
font matching after import, application OAuth/import path, installed ChatGPT tool
calls, full stage rehearsal, and a recorded end-to-end backup. Text/media readback
and successful import are not proof of those remaining checks.

## Reproduce Worker compatibility test

```sh
node tests/engine/bundle-worker.mjs
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config tests/engine/worker-probe.jsonc --local --port 5197 --inspector-port 0 --persist-to .wrangler/state
```

In a second terminal, request `http://127.0.0.1:5197`. The response reports slide count,
PPTX byte count/signature, and validation errors. This is a test-only Worker, not an
MCP endpoint or deployed website. Stop it after verification.

## Exact updated pitch through the local service

`tests/engine/service-pitch.test.ts` runs once B's service and test database helper
are present. A's standalone branch explicitly skips this one test. It was run in an
isolated archive of B's `a5dc616` with the current A-owned directories overlaid:
**86 tests and the combined production build pass**. No B code was edited or merged.
The test creates the exact `localWorkflowPitch` using DeckService, real engine, and
SQLite migrations; compares all 15 service SVG previews to engine output; exports
both PPTX versions; verifies complete blueprint/untouched-slide preservation; and
checks stale-edit and anonymous-download rejection.

Run `GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/service-pitch.test.ts` in the
combined tree. It writes `artifacts/builder-a/service-pitch/` with service-returned
PPTX files, notes, revision proof, and a prepared offline replay. Review outputs have
also been copied to that path in A's checkout with `verification-context.json`.
The file adapter is an in-memory Map and identity is an explicit local test owner.
Canva is deliberately unavailable. These checks do not exercise HTTP, hosted
identity, actual R2, ChatGPT, or app OAuth; B's separately recorded local HTTP/Worker
checks remain distinct. This is a reusable acceptance check for A's final pitch,
not another service implementation.

## Portable presentation recovery package

After generating either local-workflow or service-pitch artifacts, run:

```sh
node tests/engine/package-backup.mjs artifacts/builder-a/local-workflow
node tests/engine/package-backup.mjs artifacts/builder-a/service-pitch
```

This local utility uses the installed `sharp` module and Python 3 with Pillow,
reportlab, and PyMuPDF (verified on the builder machine; no production dependency
or shared package file was changed). It first checks PPTX hashes against the replay
proof. It renders the actual SVGs, creates and inspects a five-page 16:9 raster PDF,
and creates a four-frame GIF persistently labelled **precomputed engine replay**.
The GIF is a scripted animation, not a screen recording or live integration proof.
The ZIP includes PPTX, notes, offline HTML, PDF, replay, context, and per-file SHA-256
hashes. Archive CRCs and hashes are verified. Re-run packaging after regenerating
any source artifacts; otherwise the old ZIP reflects the earlier snapshot.

Generated `graphicrouter-stage-backup.zip` files are in the corresponding artifact
folder. The service-pitch package uses service-returned PPTX/notes. The local-workflow
package also includes expanded-notes PPTX and exact create input. A PDF last-page
render and the violet replay frame were visually inspected. A corrupted source PPTX
was rejected before packaging. The PDF is a raster engine backup, not a Canva PDF
export; editable objects remain in the PPTX.

Final account-dependent acceptance remains open: hosted ChatGPT/widget use, app
OAuth/import, Canva shape/line/font checks, actual speaking pace, and a recorded
live demonstration. Do not present the GIF or offline HTML as that recording.

The final recovery proof now checks byte-for-byte equality of all decompressed
native `ppt/` parts other than slide 3, including notes and media. Slide 3 must equal
the original XML with only the named headline's text paint changed. Unrelated native
notes fail even when the supplied blueprint itself is correct. The proof records
`unchangedNativePartCount`; exported version/title/timestamp metadata outside ppt/
may differ. This is evidence about the native export, not Canva conversion.

Each recovery ZIP also contains `stage-runbook.md`: three-minute timing targets,
exact edit/version steps, what to show in Canva, and language for switching to an
accurately labelled local demo or precomputed replay. Its 273-word core plan leaves
30 seconds for the demo. Real presenter pace and the complete live path still need
rehearsal before declaring presentation freeze.

## Canva-first Studio design update

The user's test in “Create GraphicRouter pitch deck” exposed two shortcomings:
Canva was treated as an optional handoff after PowerPoint, and the classic recipes
produced repetitive, text-heavy pages. New presentations should use artDirection
starting with `GraphicRouter Studio` (the MCP planner now specifies this default).
This selects an editorial system: ink-black hero/proof pages, warm ivory supporting
pages, oversized hierarchy, native routing illustrations, and illustrated process
stages. Other artDirection values retain the original recipes so saved decks do not
acquire missing/orphan elements or change during validation/revision. This is an
explicit supported visual preset, not an arbitrary natural-language style renderer.

All five recipes still use the shared contracts and separate editable native objects.
Studio keeps one stored blueprint for previews and PowerPoint, targeted immutable
revisions, source-content validation, and exact native-part preservation. No model
service, image generation, contract/schema change, or dependency was added.

`src/fixtures/studio-pitch.ts` and `tests/engine/studio.test.ts` reproduce the
redesigned deck, stages, original/violet PPTX and offline proof under artifacts/studio:
`GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/studio.test.ts`.

The prototype's main deliverable is the actual editable Canva design URL. The MCP
planner/output guidance now continues to send_to_canva after creating the blueprint,
and the preview emphasizes Create editable Canva deck. Pending/auth/import failure
states do not claim delivery; PowerPoint is labelled a portable fallback. Sites still
needs the application's Canva client ID/secret for its own OAuth import path.

A separate manual connector import of the redesigned deck succeeded:
https://www.canva.com/d/P_YCbT66Mmc10ti (design DAHYDU0fM4U, five editable pages,
53 text objects and an editable image). A draft format_text operation changed only
slide 3's selected headline colour successfully; the transaction was cancelled to
preserve the original. This proves that selected text formatting operation through
the Canva connector, not the application's OAuth import or full shape/font fidelity.
