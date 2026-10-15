# GraphicRouter design workspace

The MCP endpoint exposes a freeform infographic path plus the compatible legacy
presentation tools. ChatGPT supplies design decisions and typed element arguments;
there is no second model service or fixed canvas template.

- start_briefing: an adaptive dialog: complexity first, template choice second, then6/9/14 questions plus an optional source. It supports skips, context prefills,
  portrait/square/landscape/custom size, reading medium, density and visual direction.
- create_canvas: create a genuinely empty board with dimensions, theme and brief.
- edit_canvas: add/replace/remove objects in ordered structure/content/polish passes.
- inspect_canvas: real model-visible PNG overview/detail crop and advisory review.
- get_canvas: read an immutable version and refresh only its existing import job.
- export_canvas: native single-page PowerPoint and design notes.
- send_canvas_to_canva: owner-authorized binary import with stored job deduplication.

The original create/get/revise/export_deck and send_to_canva tools remain for
explicit five-slide presentation work. Canvas schemaVersion2 and deck schemaVersion1
are checked by their services; crossing the paths fails clearly. The JSON version
store, owner boundaries, stale-write triggers, files and Canva OAuth are reused.
No database migration or dependency was added.

The planner starts from the content and medium, selects size/palette/hierarchy/
reading path, places individual objects, inspects the returned blueprint and stage
previews, and revises before handoff. Native text, simple geometry and registered
images are supported; arbitrary code/SVG, unsupported fonts/glyphs and asset IDs
are rejected. English Arial is the measured toolkit. A successful import is not
proof of Canva visual fidelity or independent editing.

The briefing is a UI card/dialog, not a browser alert or an additional model.
It holds unsent answers only while open. The user's final click sends all answers
back to the same chat in one user message, directing the appropriate GraphicRouter
workflow. /briefing offers manual copy-back if the host bridge is unavailable.
Host rejection retains the brief with copy-back text and never retries silently.

## Live acceptance

In a fresh chat, select GraphicRouter and request a one-page infographic. Verify
that the dialog opens when context is missing; that submission calls create_canvas
then edit_canvas; that a real blank board precedes native objects; and that Canva
returns an editor link. Inspect editable text/shapes/lines/images and imported
portrait/square dimensions. Review composition quality at actual reading size.
Existing narrow edits must avoid restarting intake. Model compliance and live
host UI behavior cannot be established by transport tests alone.


## Native Canva template route

The template branch is an instruction-driven orchestration using the chat's
connected Canva tools, with separate source-of-truth semantics. It is not a new
backend template API, public-catalogue scraper or two-way blueprint sync. Search
accessible user Brand Templates, or inspect a provided design. Create from a Brand
Template or copy a design, inspect editable fields, apply supported draft changes,
show a preview and obtain the Canva tool's explicit approval before commit. Missing
tools/access/source content must be surfaced and cannot trigger a silent fallback.

The source PNG returned by inspect_canvas is visible to the model; SVGs in _meta
remain user-widget data. Instructions require actual image critique, targeted edits
and a bounded follow-up inspection before export. A source PNG is not a Canva
screenshot. The renderer bundles Liberation Sans regular/bold for inspection only;
Blueprint/PPTX remain Arial. Never imply a warning-free canvas is beautiful.
