# Current product direction — freeform infographic design

User clarification supersedes the template-only presentation restriction below.
GraphicRouter uses ChatGPT to turn the brief into a deliberate, editable design:
blank canvas → structure → content → review/polish → native Canva handoff.
ChatGPT selects dimensions, palette, hierarchy, positions, sizes and individual
objects; no fixed layout recipe is used by the canvas engine. The deterministic
renderer validates and draws these object choices, without an extra model service.

The question dialog first asks complexity and template preference, then collects
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

Quick/balanced/detailed work gets a shorter or richer brief. The template choice
routes ChatGPT to connected Canva tools for accessible Brand Templates or user
provided designs; it never claims to search the entire public catalogue. It copies
or instantiates the source, inspects supported fields, adapts the copy, shows the
preview, and follows Canva's required user approval before committing changes.
The native Canva copy is the source of truth in this mode. The backend's existing
OAuth/import adapter does not gain template editing by implication; the connected
Canva tools must be available to the chat, and missing access is a visible blocker.

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
