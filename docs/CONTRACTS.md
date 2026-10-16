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
a dynamic questionCount, briefingUrl, and supplied context/answers; `_meta.briefing` feeds
the existing MCP App resource. It creates no database record, file, deck or import.

The view collects one answer at a time, blocks unsupported formats, and requires
complexity/template/topic/audience/outcome before submission (portrait is the optional format default). Optional answers can be skipped.
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


## Adaptive intake and model-visible inspection

start_briefing now accepts optional bounded prompts keyed by existing answer IDs
(title140chars/help500chars), so ChatGPT can tailor wording to the actual topic.
Complexity and template questions cannot be overridden. Existing answer keys and
old complete handoffs remain compatible. New submissions require complexity and
template preference before the core brief. getQuestions selects6/9/14questions,
plus an optional templateSource. Hidden known answers survive branch changes.
Handoff JSON includes explicit workflowMode: graphicrouter_canvas, canva_create,
canva_native (existing source), or legacy choose. sourceFallback is canva_create
only for an existing-source route with explicit early permission; otherwise ask.
The three new choices distinguish native generation from existing-source adaptation
before completion. New native generation adds no source question. Legacy choice
values remain valid; their source/selection requirement is not silently rewritten.
Native Canva modes are host orchestration, not backend connector access. Shared
src/briefing/canva-workflow.ts policy is included in discovery and completed handoff
so a stale source-only instruction cannot override a new-Canva choice.

inspect_canvas is a supplemental read-only MCP tool, outside CANVAS_TOOL_NAMES and
CanvasService.call. It takes deckId/version plus optional integer region geometry.
Ownership and schemaVersion2 are checked before rendering; invalid crops reject.
The tool returns a real image/png content block visible to the model, plus report
JSON with dimensions, fontNote, diagnostics and review guidance. No data URLs or
provider secrets are exposed. It does not save a version, write files, import to
Canva, or claim that the imported Canva design has been inspected.

A CanvasRasterizer injection isolates service tests and keeps rendering failure
explicit. Production uses offline resvg WASM with statically compiled module and
bundled OFL regular/bold fonts. Long side<=1600 and pixelarea<=2million, SVG<=4MB,
at most2 simultaneous renders; external/executable markup rejects. Blueprint
geometry is unchanged. The crop uses a nested translated SVG and the same object
renderer. New diagnostics are advisory only; stored validation history is untouched.

## Supplied Canva page review — additive 0.7.0 contract

review_canva_design is read-only and owner-authenticated, registered outside the
five legacy deck names and the five canvas names. It never loads DeckService,
writes storage, starts imports, fetches Canva, or performs OCR. All earlier tool
contracts and saved blueprint formats remain unchanged.

src/contracts/design-review.ts accepts a strict snapshot: designId, one-based
pageIndex, page width/height, at most 200 native texts (actual id/text/box and optional
HTTPS hyperlink), at most 200 images (actual id, optional box, textInImage set to
none/present/not_checked), at most 60 requiredText snippets, optional
expectedTextById (at most 100 specific targets), at most 30 expected HTTPS links,
and visualReview (not_checked/problems_found/passed). Strings and finite geometry
are bounded. No credentials or unknown fields are accepted. SDK input errors may
be returned before the handler as standard MCP invalid-argument text.

The result is blocked, needs_visual_review or ready_for_user_review, with at most
100 issues, object counts and explicit evidenceScope. Baked text, absent native
copy, duplicate identities/layers, bounds violations and unmatched source URLs
block. Unknown image text, collisions and incomplete visual review require review.
Severity remains accurate even if the issue list is truncated. Required snippets
match normalized whitespace and whole words; per-ID checks prevent correct copy
elsewhere from masking the wrong label. This is a supplied-snapshot check, not an
independent verification of the caller's claims. Repeat per page and after edits.
A ready result does not authorize or bypass native Canva commit approval.

Browser tool routes stream JSON up to 128000 bytes; MCP accepts up to 1000000 bytes.
Overflow and invalid UTF-8/JSON return validation failures before service access.
The import adapter rejects a poll response whose job ID differs from the stored
job; the existing job remains available for retry without another import.

## Design skills and multi-page documents — additive 0.8.0

User authorized all eight proposed skills and their necessary rendering support.
Existing deck (schema 1) and canvas (schema 2) tools remain compatible. New schema 3
`document` stores 1–40 ordered pages at one shared canvas size, a shared theme,
supplied brief, format (presentation/carousel/tall_infographic), design intent,
page IDs/titles/messages/sections/notes/elements and bounded immutable revision log.
Each page supports the existing 200 native objects; a document has at most 1000
objects and 100 versions. Empty pages are draft placeholders, never exportable.

create_document starts blank page shells from the model's storyboard; edit_document
atomically applies at most 40 page/content/element edits, stable IDs and stale-write
checks; get_document reads/polls; export_document compiles all pages into one native
PPTX plus speaker/design notes; send_document_to_canva starts one import per version.
inspect_document renders a chosen saved page/crop and returns an image and story
review. Browser routes/files/preview require owner identity. Source PNGs and native
object counts never prove imported Canva fidelity. Tall pages are bounded to 4000px
per side; split longer content into ordered sections rather than silently shrinking.
All pages in one PPTX have identical dimensions. Format adaptation creates a new
composition/document from reviewed source content; no automatic lossless conversion
or two-way Canva synchronization is promised.

plan_design returns a bounded workflow selection, skills and capability limits from
explicit format/purpose/content relationship; it writes no content or invented
facts. get_design_skill loads one of eight design workflows or their shared quality
review and examples. Markdown skill files are generated from a checked catalog for
portable packaging; runtime retrieval makes guidance available through the MCP app
without requiring an account-level plugin archive editor. compose_component returns
native objects for bounded charts or text-free geometric icons, without storage or
external actions. ChatGPT applies the returned objects through normal versioned edits.

## Long requirement handling — additive 0.9.0

User authorized optimization for long, specific briefs and 20+ slides. Preserve
existing deck/canvas APIs and document storage compatibility. Optional document
requirements state stores exact ordered source chunks (120000 characters total,
<=12000/chunk), up to200 structured requirements and page/element/notes bindings.
create_document can carry this initial state; append_document_requirements performs
an owner-authorized atomic versioned append/upsert with baseVersion. Source chunks
are append-only, stable IDs; conflicting duplicates reject rather than overwrite.
Requirement IDs and sources are validated; deleting/revising a page may invalidate
its bindings, never erase the requirement. Semantic satisfaction is model/human
review; exact required copy is checked deterministically against target text/notes.

get_document_context retrieves a compact resume/checklist, 1–5 pages of full native
objects and only relevant requirements, or one bounded source chunk. Dense-page
elementOffset/elementLimit windows report total and nextElementOffset explicitly;
responses over300000 UTF-8 bytes reject with a smaller-window instruction. No implicit
full raw-brief echo. Document MCP mutation/export/import results default to a compact
summary (no complete blueprint, SVGs or original brief). Full existing UI data remains
in private metadata; only requested/changed page previews render, bounded to5.
get_document supports explicit full detail for compatibility; defaults to summary.

review_document_requirements paginates audit items, separates exact-copy failures
from pending semantic checks, and reports conflicts/unmapped targets without
claiming factual or aesthetic verification. Export rejects unresolved registered
requirements; drafts remain editable and downloadable notes preserve source/ledger.
Document limits increase to4000 objects and250 revisions while keeping200/page,
40 edits/batch,40 pages and <=1800000 serialized UTF-8 bytes for D1 row headroom.
Long briefing context increases to40000 characters with explicit boundaries; longer
material is saved through ordered chunks rather than silently truncated.

The 1800000-byte document ceiling leaves headroom under D1’s 2000000-byte maximum
string/BLOB/row limit: https://developers.cloudflare.com/d1/platform/limits/.
New source chunks invalidate previous semantic satisfaction and reset extraction;
identical replay does not. Extraction completeness and semantic satisfaction are
caller-reported; only registered mandatory checks are export blockers.

## Existing Canva edit orchestration — additive 0.10.0

plan_canva_edit is authenticated/read-only. It validates a Canva design reference
(full HTTPS canva.com design URL, canva.link shortlink, or returned D-prefixed ID),
requested changes and explicit original/copy mode (default edit_original). It
returns a next-tool plan and requirements for actual connected Canva reads,
transaction inspection, narrowly targeted operations, previews, approval and
commit verification. It does not fetch or edit the design. Never echo/persist
collaboration-token URLs in the result: the model passes the user's complete
original share URL directly to get-design. Shortlinks resolve first. No arbitrary
URL fetch, inferred provider permissions, automatic copy/import/generation or sync.

review_canva_edit is authenticated/read-only and checks bounded normalized before/
after snapshots from one working design and editing transaction, at most5 pages
with200 uniquely identified elements each. Flat captured properties use primitive
values; preserve every exposed property and serialize complex fields consistently.
Targets name exact captured property values for existing elements; explicit added/
deleted IDs authorize only those structural differences. All unmatched differences
(including page dimensions/order, deleted elements and extra properties) block
readiness. Missing targets, partial snapshots, identity/transaction mismatch and
unreviewed visuals block readiness. This checks caller-supplied snapshots, never
provider state or independent semantic/visual/factual correctness. Ready means
ready for user review, not authorization or proof of commit.

The new Edit my existing Canva design briefing route collects only source and
requested edits after routing; it preserves all other supplied answers. For a
link plus narrow requested change, skip new-design intake entirely. Existing
template adaptation remains copy-based, and original source blueprints remain
immutable when their Canva imports are subsequently edited natively.

Current tool contracts/docs checked: https://www.canva.dev/docs/apps/mcp/tools/start-editing-transaction/
and https://www.canva.dev/docs/apps/mcp/tools/commit-editing-transaction/. Commit
requires showing the latest preview and explicit user approval in the connected
Canva tool; stale/conflicted snapshots must be reread and edits reviewed again,
without blindly retrying saves or overwriting concurrent changes.

plan_image_input is authenticated/read-only and binds1–10 pictures to explicit
place/style_reference/edit_instruction/extract_content roles and optional targets.
Sources are actual chat attachments (byte accessibility caller-reported), already
public HTTPS URLs or returned Canva asset IDs. Public URL validation rejects local
addresses/credentials; the server never fetches URLs. Result omits public URL query
strings and computes only an optional contain rectangle from supplied dimensions.
A plan has no upload/placement side effects. Actual private attachment upload uses
the provider's supported byte/file mechanism; reference images are not uploaded
automatically. Existing native blueprint assets remain registered-only.

User additionally requested richer design for long text briefs. compose_slide is
authenticated/read-only and returns actual unsaved16:9 native objects for seven
meaning-based compositions, at most40 operations, stable prefixed IDs and supplied
copy only. It validates measured text fit, never truncates or silently shrinks.
Metrics require caller-supplied values. ChatGPT applies it to an intended blank
document page, varies visual structure by meaning and inspects actual output.
It never overwrites existing pages or mutates Canva; there is no aesthetic promise.


## Saved-design retention and owner maintenance — 2026-10-16

All three blueprint formats expire30 days after original decks.created_at; reads,
revision heads and exports reject expired designs without revealing another user’s
record. New versions cannot extend the original creation timestamp. Existing
normal version update/delete guards remain. Migration0002 permits only queued,
expired version deletion and rejects expired version inserts atomically.

run_retention_cleanup is an administrative capability, not a customer design
operation. It is only registered for a signed-in Sites user whose trusted email
matches RETENTION_ADMIN_EMAIL. It accepts a strict empty object; no arbitrary
owner, cutoff or bucket prefix can be supplied. Its result contains queued,
processed, deletedFiles, failures, remainingDue counts only. Metadata explicitly
marks this operation destructive and not open-world. Ordinary customer discovery
retains its tool inventory. An unavailable/unconfigured owner or storage fails
closed. A service bypass token supplies no user identity.

Cleanup removes expired database content transactionally and deletes only that
server-generated UUID’s decks/canvases/documents bucket prefixes. Minimal durable
ID/scan-time tombstones survive for retry, including late files. Each call handles
at most100 new database designs and20 file prefixes sets; repeat bounded calls for
backlog. Active records and per-account Canva tokens are outside this cleanup.
Customer Canva copies are never deleted. The scheduled writer must be verified
through the actual owner connection before calling unattended purging operational.
