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
