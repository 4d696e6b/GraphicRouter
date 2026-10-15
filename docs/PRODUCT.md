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
