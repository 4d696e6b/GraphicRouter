# Current product direction — freeform infographic design

User clarification supersedes the template-only presentation restriction below.
GraphicRouter uses ChatGPT to turn the brief into a deliberate, editable design:
blank canvas → structure → content → review/polish → native Canva handoff.
ChatGPT selects dimensions, palette, hierarchy, positions, sizes and individual
objects; no fixed layout recipe is used by the canvas engine. The deterministic
renderer validates and draws these object choices, without an extra model service.

The question dialog first asks complexity and a starting point, then collects
roughly6/9/14 relevant answers (plus an optional template source) one at a time.
Known answers are reused; topic-specific question wording can be supplied by ChatGPT. Rich briefs and quick drafts can skip optional intake.
Old five-slide presentation tools and stored decks remain available explicitly.
The canvas engine supports bounded portrait/square/landscape/custom dimensions,
Arial English text, rectangles, ellipses, lines and registered images. It does not
promise arbitrary fonts, unsupported language glyphs, custom asset ingestion,
complex vector illustration, or automatic visual taste. Layout is freeform within
these primitive and resource limits. Factual accuracy still depends on evidence.

Every edit pass saves an immutable version and returns exact element previews.
Canva receives native objects through PowerPoint import. Import success is
separate from visual fidelity/editability verification. Stored canvas versions
remain the source of truth; manual Canva edits do not sync back.


## Adaptive brief and visual review update

Quick/balanced/detailed work gets a shorter or richer brief. The second question
offers three explicit routes: Let Canva create a design, Use my Canva template/design,
or Start from a blank canvas. New Canva generation uses the completed brief directly,
without a Brand Template search or another routine approval. Its native Canva tools
must be connected; brand-aware requests follow the tool's brand-specific workflow.
Existing-source work alone adds a source question, with an optional early permission
to create a new Canva design if no source fits. A strict source requirement remains
strict. Old Use a Canva template and Help me choose briefs remain compatible.
Each starting point explains its visual capabilities. A generic approval after
multiple alternative routes does not authorize the simpler blank-canvas engine.
Content type alone must not change the selected creation path. Different tools
and briefs can produce different aesthetics; no identical-quality guarantee is made.

The existing-source choice uses accessible Brand Templates or user-provided/account
designs; it never claims to search the entire public catalogue. It copies
or instantiates the source, inspects supported fields, adapts the copy, shows the
preview, and follows Canva's required user approval before committing changes.
The native Canva copy is the source of truth in this mode. The backend's existing
OAuth/import adapter does not gain template editing by implication; the connected
Canva tools must be available to the chat, and missing access is a visible blocker.
Shared host/handoff instructions distinguish new generation from source adaptation,
reuse facts, respect generation polling/quotas, and inspect the actual Canva result.

Blank-canvas work now uses inspect_canvas to return an actual PNG to the model,
not only private widget previews. The PNG is generated offline from authorized
stored objects, supports bounded detail crops, and uses licensed Liberation Sans
as an Arial-compatible inspection substitute. The final editable objects keep
Arial. Advisory checks for phone-size text, dense copy, weak hierarchy and edge
safety guide a bounded critique/revision loop without claiming an aesthetic score.
Native Canva appearance needs its own connected preview inspection.

---

## Historical hackathon presentation scope

# Product brief

## Goal

Build a ChatGPT plugin that turns rough ideas and supplied facts into a clear
presentation story, a visual blueprint, and separately editable Canva slides.
Use the product to produce GraphicRouter's actual final-stage pitch.

Time box: 24 elapsed hours to submission, two builders working in parallel.
Default: English; three-minute core pitch, five-minute expanded notes, five slides.

## Fixed v1 scope

- Five slide roles in order: hook/problem, product answer, workflow, proof, next step.
- Five recipes: hero, cards, comparison, process, closing.
- 16:9, Arial, off-white/dark/violet theme with configurable accent.
- Native text, simple shapes, lines, and at least one bundled PNG/JPEG asset.
- Preview stages: layout boxes, content placement, finished composition.
- Speaker notes for 180- and 300-second versions of the same five-slide story.
- Revisions: text, notes, element colour, deck accent, allowed layout switches.
- Immutable blueprint versions; each Canva import creates a new design version.
- Keep a working PPTX/manual Canva upload fallback.

ChatGPT writes the narrative through structured tool arguments; do not add another
model service. The renderer is deterministic code, not arbitrary generated code.
Facts are supplied by the user; unknown evidence stays a question or placeholder.

Excluded: arbitrary deck import/editing, freeform placement, image generation,
animation, two-way Canva sync, and marketplace publication.

## Demo

Present a pre-generated, verified deck. Show that GraphicRouter created it. Request
“Change only the headline on slide three to violet.” Show the updated preview and
change summary, then demonstrate independent editing in the existing Canva deck.
Async import of the new version must not block the pitch. Record a clearly labelled
backup and keep local presentation files before submission.

## Acceptance

- Create five coherent slides and both sets of usable speaker notes from real facts.
- Preview and export are driven by the same blueprint.
- Text/shapes/image remain separate after a real Canva import test.
- The headline-colour revision changes no unrelated blueprint element.
- Prior versions remain unchanged after successful or failed revisions.
- Excess copy, stale writes, export failures, authorization failures, and import
  failures are actionable and preserve working files.
- Rehearse a complete three-minute pitch with one live edit.

Track actual verification in the task files. Initialization does not meet these
feature acceptance criteria, and the sample fixture is explicitly a draft.

## References

- [OpenAI MCP server/UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)
- [Canva editable design imports](https://www.canva.dev/docs/apps/rest-apis/reference/design-imports/)
- [PptxGenJS text API](https://gitbrent.github.io/PptxGenJS/docs/api-text/)

Check current official documentation while implementing API integrations.

## Native text is a delivery requirement — 2026-10-15

The user clarified that designs must not be a single-layer image: all headings,
values, labels, captions and source copy must be independent native text objects.
Backgrounds and illustrations must be text-free. A hybrid with baked lettering
and editable overlays fails, even if Canva marks the image itself editable.

The brief recommends native blank-canvas composition first and explains its
primitive/asset limits. Existing source and generation routes remain selectable,
but generated designs are drafts until real text/fill and visual checks pass.
This supersedes the earlier unconditional recommendation of Canva generation.
No selected route is silently switched and no failed draft is regenerated at
additional cost automatically.

Review the actual Canva richtexts and fills, exact required copy per target,
number/unit spelling, collision/clipping and verified source URLs. Inspect the
latest full-page preview and relevant close-ups after the last edit. Suspicious
image layers require a text-free/background-only diagnostic in an isolated audit
transaction; cancel that audit without touching another draft. Unknown image
lettering prevents readiness. Do not cover baked copy with replacement text.
Replace/rebuild the affected section using clean assets and native text.

review_canva_design is an advisory snapshot checkpoint, not OCR, a direct Canva
API verifier, independent fact checking or an external commit lock. Ready means
ready for the user's review; saving still follows Canva's tool approval rules.
Import success is explicitly labelled separately from editability verification.

## Specialist workflows and flexible pages — 2026-10-15

The eight workflows are infographic frameworks, presentation storytelling, long
presentations, tall infographics/carousels, art direction, illustration/assets,
data storytelling, and format/brand adaptation. All share quality-review. They
are loaded on demand through plan_design/get_design_skill, including illustrative
examples and optional native reference studies. Portable SKILL.md files and their
examples are generated from src/design-skills/library.json by
node scripts/sync-design-skills.mjs. This release does not claim an account plugin
archive was edited: the existing MCP app serves these skills to the host directly.

Native schema3 documents support 1–40 ordered same-sized pages, messages, sections,
notes, 200 objects per page/1000 total, and immutable atomic revisions. The adaptive
brief offers flexible presentations, square/portrait carousels and tall pages, with
one optional length/time question. Legacy five-slide and single-canvas APIs remain.
Every nonblank page exports as native PPTX objects with companion notes. The widget
and authenticated page show a storyboard, selected page, notes and source layers.

compose_component calculates bars from nonnegative values with a common zero
baseline, and explicitly stepped line charts including signed data and labelled
scales. Seven simple text-free geometric icons are available. All returned objects
fit one 40-operation batch and still require normal composition/inspection. They
are not detailed illustrations. Custom uploads, arbitrary fonts/glyphs and automatic
lossless format conversion remain outside the native toolkit. Adaptation is a new
composition based on inspected source material, preserving the original.
