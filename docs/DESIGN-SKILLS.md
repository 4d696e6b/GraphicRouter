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

Limits: 40 pages, 200 native elements/page, 1000/document, 40 total changes per
revision, 100 versions, 320–4000px per side and one page size per export. All native
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
