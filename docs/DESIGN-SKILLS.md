# GraphicRouter design skills

Runtime entry: plan_design selects from explicit format, purpose, complexity,
content relationship and known brand/data/illustration needs. get_design_skill
loads instructions/examples and optional unsaved native study geometry. Skills
preserve the chosen source/native route, reuse the brief and never invent evidence.

## Library

- infographic-frameworks: process, comparison, timeline, hierarchy, annotation,
  statistical story and geographic requirements; chooses by content relationship.
- presentation-storytelling: audience objective, story, claim/evidence, visuals,
  transition and notes; flexible native output uses documents.
- long-presentations: chapters, pacing, core route/appendix and storyboard review.
- tall-and-carousel: continuous reading versus useful page stops, phone readability,
  deliberate pagination and bounded tall dimensions.
- art-direction: a coherent palette, grid, type scale, spacing and illustration
  language, with useful concept studies appropriate to complexity.
- illustration-assets: meaningful imagery and rights/source awareness, supported
  native icons, honest limits and text-free backgrounds.
- data-storytelling: explicit units/period/source, honest scales and calculated
  native charts, not guessed geometry or claims from uninspected URLs.
- format-and-brand: new compositions from approved source content, content mapping,
  consistent identity and format-specific density; no source mutation or sync.
- quality-review: actual source/Canva previews and crops, exact copy/links, no baked
  lettering, preserved revisions and required native Canva commit approval.

## Tools and storage

The legacy five deck names and five canvas names remain unchanged. New document
operations: create_document, edit_document, get_document, export_document,
send_document_to_canva; inspect_document is read-only. Documents start with ordered
blank storyboard pages and acquire native objects through bounded edits. Supported
page operations include notes/message/section changes, add/remove/reorder and
object edits. Changes are atomic, owner-scoped and immutable in the existing D1
store; exports are write-once R2 files. No database migration is needed.

compose_component supports bar_chart, line_chart (explicit step connections), and
icon. Charts compute geometry from caller-supplied values. They return elements
and caveats without writing; apply objects to the desired saved page with unique
IDs/layers. Straight descending diagonal lines remain unsupported by the current
primitive, so step connections must not be described as smooth interpolation.

Limits: 40 pages, 200 native elements/page, 4000/document, 40 total changes per
revision, 250 versions, 320–4000px per side and one page size per export. All native
visible type uses measured English Arial. Other fonts/languages, arbitrary assets
or detailed illustrative gestures require supported connected Canva capabilities
or an explicit limitation, not a promise from instructions alone.

## Source and portability

src/design-skills/library.json is the canonical authored instruction catalog.
node scripts/sync-design-skills.mjs writes skills/<id>/SKILL.md and examples.json.
Tests compare the generated guidance/examples with the runtime catalog. This lets
an eligible plugin package reuse the same files later without diverging behavior.
The available tools in this release do not include an account-plugin archive editor;
no separate packaged-host skill installation is claimed. The MCP skill loader is
implemented and bundled into the existing app.

get_design_skill(includeStudy=true) supplies editable reference geometry; examples
are conspicuously illustrative and never become the user's facts. Reproduce PNG,
PPTX and blueprint artifacts with:

```sh
GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/design-skills/studies.test.ts
```

These are source design studies, not proof of imported Canva fidelity. Every final
Canva page still needs actual layer and visual review. Native generation can mix
image lettering and text; it stays a draft until it passes those checks. No more
generation credits are consumed automatically after a failed review.

## Long and detailed briefs (0.9.0)

Preserve the full original brief before composing chapters. append_document_requirements
saves ordered, append-only chunks and requirement IDs with source references, priority,
page/object/notes bindings and optional exact copy. Source text is bounded to120000
characters total,12000/chunk; the checklist supports200 items. The intake dialog can
hold40000 context characters and16000 per answer. Over-limit material rejects explicitly;
it is never silently clipped. Split larger native projects deliberately with the user.

get_document now defaults to a compact checkpoint: page inventory, current version,
change summary, blank pages, review counts and resume instruction. get_document_context
reads only1–5 pages and up to20 relevant requirements, or one original source chunk.
Dense page objects can be paginated with elementOffset/elementLimit; follow the explicit
nextElementOffset to recover every object. Windows over300000 UTF-8 bytes reject with
smaller-window guidance. detail=full remains available for an intentional complete read.
Widget metadata remains separate and contains source objects, but omits raw source and
renders only up to5 requested/changed page previews. Other previews load on request.

review_document_requirements paginates exact-copy/binding failures, conflicts and
pending semantic reviews. Chapter edits invalidate affected satisfaction; newly saved
source resets extraction and existing semantic reviews. Final export checks reported
extraction completeness and unresolved mandatory registered items. It cannot detect an
instruction never registered or independently certify meaning, facts, beauty or Canva
layers. Original text and the requirement ledger accompany exported notes.

Reproduce the synthetic stress evidence (not a user presentation or Canva check):

```sh
GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/integration/long-context.test.ts
```

The fixture exercises24 slides,1440 native objects,96 requirements and62250 original
characters through60 versions, actual native PPTX export and a narrow late-slide edit.
Its compact model response is7496 bytes versus303555 bytes for the full service result
(97.53% smaller). This measures model-result JSON, not total transport, tokens, runtime,
visual quality or host context-window capacity. Registered requirements still require
honest semantic review. Documents reject above1800000 serialized UTF-8 bytes.
