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

Read the existing provider and service in draft PR #3 without merging that branch.
Its expected exports exactly match this implementation. After this engine PR lands
through main, Builder B can replace `src/server/engine-provider.ts` with:

```ts
export { engine } from "../engine";
export { assets } from "../engine/assets";
```

There are no shared-contract or dependency changes to coordinate. Builder B should
then exercise real create/revise/preview/export through `DeckService` and preserve
`EngineError` messages/issues when mapping errors; its current generic compose catch
otherwise hides the actionable text-fit/target diagnostics. This note does not change
B's service code or claim that its installed-account checks have run.

Builder B's unavailable Sites access and missing Canva app credentials still block
its production path. The successful imports below used this chat's existing Canva
connection for a separate manual spike; they do not configure B's credentials.

A local visual PDF backup was also generated from the same blueprint previews.
That file is a raster presentation backup, not a Canva PDF export; editable objects
remain in the PPTX. PDF generation is not a method in the shared engine port.

## Verification recorded

- `npm run check`: strict TypeScript plus 38 passing tests, including malformed
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
