# GraphicRouter

ChatGPT plans a graphic from its brief, composes individual objects, and prepares
an editable Canva handoff. The adaptive brief asks complexity and starting point
first, then approximately 6/9/14 relevant questions. Known answers are reused.
Existing Canva links can also take a focused same-file edit route, with separate
attachment roles for pictures and screenshots. Supported native Canva tools perform
the reads, draft edits, uploads and approved saves; the planning/review helpers do
not perform those provider actions. See [editing and pictures](docs/CANVA-EDITING.md).
Legacy five-slide presentations and speaker notes remain supported.

Every heading, number, label and source must be its own native editable text
object, separate from backgrounds and illustrations. A movable full-page image
with text overlays does not meet this requirement. Native GraphicRouter objects
are recommended for reliable structure. Existing Canva sources and generated
Canva drafts require actual layer and visual inspection before final delivery.

The native engine supports English Arial text, shapes, straight lines and bundled
PNG/JPEG assets. It does not provide arbitrary fonts, custom uploads or Canva's
full illustration library. ChatGPT supplies content and design choices; there is
no additional model service. Facts come from supplied or verified evidence.

Eight specialist workflows now cover infographic frameworks, presentation stories,
long decks, tall graphics/carousels, art direction, illustration/assets, data
storytelling and format/brand adaptation. They share a quality-review workflow.
ChatGPT selects and loads guidance through plan_design/get_design_skill rather
than embedding the entire library in every call. Native flexible documents support
up to 40 pages with storyboards and notes. See [design skills](docs/DESIGN-SKILLS.md)
for tools, reference studies, bounds and packaging details. Detailed briefs can be
preserved in ordered source chunks with a requirement checklist, chapter-sized
context reads and compact resume checkpoints, instead of resending a whole deck.
Final export blocks unresolved registered mandatory checks; model/human review
still determines extraction completeness, meaning and factual accuracy.

## Run locally

Use Node.js 24 (minimum 22.13), then:

```sh
npm ci
npm run check
npm run dev
```

`npm run build` builds the Sites Worker without publishing. See
[server setup](src/server/SETUP.md) for local D1/R2 initialization and Canva OAuth.
Keep credentials in ignored local environment files or Sites runtime secrets.
Never paste them into code, a briefing, or Git.

## Working features and verification limits

- Versioned owner-scoped canvases and decks, immutable revisions, safe stale-write
  errors, SVG construction previews, PNG inspection, native PPTX and notes export.
- Canva OAuth and asynchronous binary import adapters with saved-job polling,
  duplicate-import protection, uncertain-outcome handling and manual PPTX fallback.
- Optional host orchestration through connected Canva tools for accessible existing
  designs or new drafts. This requires that chat's Canva connection; it is separate
  from the application's OAuth import connection. No public template catalogue
  search or two-way synchronization is implemented.
- `review_canva_design` checks a bounded supplied page snapshot for native copy,
  duplicate/colliding text, clipping, exact source links and caller-reported image
  inspection. It does not fetch Canva, run OCR or enforce another tool's save lock.
  Unchecked images and visual problems prevent readiness. A pass still needs the
  latest preview and Canva's required user approval before saving edits.

Successful export/import or a schema check does not prove visual quality, factual
accuracy or Canva editability. Every imported Canva result needs its own review.
See [current acceptance evidence](docs/tasks/builder-a-slide-engine.md) for actual
checks and remaining account-dependent limitations; historical counts are dated.

## Collaboration and deployment

Use separate clones and chats for the two builders. A works on
`feat/slide-engine`; B works on `feat/chatgpt-canva`. See
[coordination](docs/COORDINATION.md), [product](docs/PRODUCT.md),
[contracts](docs/CONTRACTS.md) and the [A](docs/tasks/builder-a-slide-engine.md) /
[B](docs/tasks/builder-b-chatgpt-canva.md) task files.

`.openai/hosting.json` is the checkout's deployment identity. GitHub pushes alone
do not publish Sites. Preserve that identity, audience and server-side credentials.
The private GraphicRouter Test Site is a separate owner-authorized test copy;
its identity and secrets must never replace the original Site's configuration.
