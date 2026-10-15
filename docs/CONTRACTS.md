# Shared interface specification — v1

The executable contract is in `src/contracts/`; both branches start with it.
Schemas validate tool inputs; types describe the engine/service handoff. These
definitions intentionally do not implement rendering, persistence, or MCP handlers.

## Model input

`createDeckSchema` accepts the title, verified brief, duration (180 or 300), art
direction, accent in `#RRGGBB`, and exactly five structured slides. IDs and roles
are fixed in order. Each slide has a headline, one takeaway, up to three content
blocks, and core/expanded notes. `assetId` refers to a bundled asset, not an arbitrary
remote URL. Runtime content budgets are upper bounds, not a guarantee that text fits;
Builder A performs actual layout-specific fit checks.

ChatGPT creates these arguments from the user's facts. Schema validity does not
prove factual accuracy; tool instructions must forbid unsupported evidence and
expose unknowns rather than silently filling them.

## Engine handoff

Builder A exports `engine: SlideEngine` from `src/engine/index.ts`:

- `createBlueprint(input, {deckId, version})`: produce an immutable element plan.
- `reviseBlueprint(current, operations)`: return version + 1, preserving the input.
- `validateBlueprint(blueprint)`: return structured issues with severity/path/message.
- `compilePowerPoint(blueprint, assets)`: return native PPTX bytes as `Uint8Array`.
- `renderSlideSvg(slide, theme, stage, assets)`: render a safe preview from the plan.

No database, HTTP, OAuth, filesystem, or user identity belongs in this port.
Asset data is supplied by the caller. Preserve `slide3.headline` for the stage demo.
Other element IDs use stable semantic names such as `slide2.block1.heading`.

Canvas: 1600×900 logical pixels, top-left origin, ascending zIndex paints on top.
Export: 120 logical px/in; font sizes also use logical px, converted with 72/120
to PowerPoint points. All palettes resolve through `Theme`; a per-element hex paint
overrides a theme token. SVG text is escaped and no untrusted markup is executed.
Layout switching is allowed only when the existing content fits the new recipe;
otherwise return an actionable error. Never silently discard content.

## Service and tool handoff

### Supplemental briefing tool (user-directed dialog extension)

The five deck-operation contracts remain unchanged. `start_briefing` is a sixth,
read-only MCP entry point registered outside DeckService/TOOL_NAMES. Its schema in
`src/briefing/questions.ts` accepts optional context (4000 characters) and a bounded
record of known question keys (1500 characters per answer). It authorizes the owner,
returns `kind: briefing`, a transient briefingId, `status: awaiting_answers`,
questionCount 20, briefingUrl, and supplied context/answers; `_meta.briefing` feeds
the existing MCP App resource. It creates no database record, file, deck or import.

The view collects one answer at a time, blocks unsupported formats, and requires
format/topic/audience/outcome before submission. Optional answers can be skipped.
The user's submit click sends the full brief in one host user message requesting
the five existing deck tools. It does not itself create slides. Host rejection or
loss of connection retains answers and exposes a manual copy-back message; no
automatic send retry or duplicate import occurs. Unsent data is held only in the
open view. `/briefing` is a standalone fallback with copy-back, not an autonomous
model service. No persisted deck or engine contract changes are required.

Builder B owns the five names in `TOOL_NAMES` and registers their schemas from
`src/contracts`. All successful calls return `DeckResult`; export adds file URLs.
The preview resource receives the same stored blueprint as the model response.

The service owns IDs, ownership, durable versions, and timestamps. Reject stale
`baseVersion` atomically. The engine increments a valid version but cannot enforce
database concurrency. Use structured `ToolError` codes at the service boundary.

Canva states: not_started, connection_required, pending, succeeded, failed. Reuse a
stored import job for a given deck/version; `get_deck` may refresh that job status.
Do not initiate another import when polling. Authenticated file URLs must not be
treated as public Canva download URLs; use binary import from the backend.

Canva design IDs differ across imports. Manual Canva edits do not sync back.
Never put tokens, secrets, or another user's data in a model/widget response.

## Changing a contract

Agree the change between the two builders, update this document and contract tests
on a small shared commit, and merge that commit to `main` before both branches
consume it. Do not hide a breaking shape change in a feature implementation.


## Freeform infographic extension (user-directed scope correction)

The user clarified that GraphicRouter must use ChatGPT to compose an infographic
from a blank canvas, adding editable objects according to the brief. This replaces
the template-only restriction for new graphics. The legacy five-slide APIs and
stored schemaVersion 1 decks remain unchanged.

New additive contracts live in src/contracts/canvas.ts. CanvasBlueprint is
schemaVersion 2, kind canvas, with deckId/version identifiers (reusing the immutable
storage mechanism), title, brief, dimensions, theme, designIntent, ordered elements,
changes, construction log and validationIssues. No five-slide surrogate is created.
Create starts blank. Edit applies typed add/replace/remove element operations in
order; every successful batch creates one immutable version. Stable IDs and unique
layers identify objects. Rendering and native export read these same stored objects.

The canvas engine exports create/edit/validate/render/compile. New MCP names are
create_canvas, edit_canvas, get_canvas, export_canvas, send_canvas_to_canva. Both
get/export/import take deckId/version; edit takes baseVersion and typed operations.
These are additive and do not alter TOOL_NAMES or the existing SlideEngine handoff.
The generic JSON version store accepts documents with deckId/version. Canvas and
legacy service paths check document kind on reads to prevent format confusion.

Creation accepts bounded dimensions, a supplied-fact brief, explicit palette and
short public design decisions. Supported objects initially remain Arial text,
rectangles, ellipses, straight lines and registered PNG/JPEG assets. Unsupported
fonts/glyphs/assets fail visibly. Intentional shape overlap is allowed; text fit,
bounds, IDs, layers and colours are validated. No arbitrary code or raw SVG enters
storage. Native import is asynchronous, owner-scoped and immutable per version.
