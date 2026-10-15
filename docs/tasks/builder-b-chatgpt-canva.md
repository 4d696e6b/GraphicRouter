# Builder B — ChatGPT, preview, persistence, and Canva

Branch: `feat/chatgpt-canva`. Start from the common initialization commit.
Tracking: https://github.com/4d696e6b/GraphicRouter/issues/2

Status: **ready to start; no integration features implemented**.

## Paste this into your Codex chat

```text
You are Builder B for GraphicRouter. Implement the ChatGPT/Canva integration on
feat/chatgpt-canva. Read AGENTS.md, docs/PRODUCT.md, docs/CONTRACTS.md,
docs/COORDINATION.md, and this task before editing. Check your branch first.

Own app/**, src/server/**, src/mcp/**, src/preview/**, src/integrations/**,
tests/integration/**, db/**, drizzle/**, dependency/config files and hosting.
Implement the five shared tools, authenticated versioned storage and file routes,
an embedded ChatGPT preview, and Canva authorization/binary PPTX import.

Use an injected SlideEngine port so service work can proceed before Builder A's
engine arrives. Keep test doubles clearly labelled and out of real success paths.
Use ChatGPT for story/content; no second model API is needed. Keep supplied facts
and unknowns explicit in the planner/tool instructions.

First prove one callable tool in the actual ChatGPT account and import A's native
PPTX fixture to Canva. Verify editability rather than assuming conversion fidelity.
Preserve the registered private Sites identity. If automatic import is still blocked
at hour 6, deliver Download PPTX -> manual Canva upload as the honest fallback.

Add focused tests, run npm run check and npm run build, update this task with
evidence, commit in small increments, push your branch, and open PRs into main.
Integrate A's engine without changing its shared interface independently. Publish
and verify the completed private plugin only after the real end-to-end path works.
Do not implement A's engine or claim account-level verification from mocks.
```

## Work order

### B1 — integration spike (first two hours)

- [ ] Read current OpenAI MCP and Canva import/authentication documentation.
- [ ] Prove a small callable tool from the actual ChatGPT account.
- [ ] Register/configure creator-account Canva OAuth (Authorization Code + PKCE).
- [ ] Import A's fixture and manually edit each selected text/shape/image object.
- [ ] Record exact access, callback, font, and conversion limitations.

### B2 — service and tools (target hour 8)

- [ ] Inject `SlideEngine`; develop tests with a clearly labelled double first.
- [ ] Register exactly create_deck, get_deck, revise_deck, export_deck, send_to_canva.
- [ ] Use shared input schemas and `DeckResult`/`ToolError` outputs.
- [ ] Plan the narrative in ChatGPT tool instructions from provided facts only.
- [ ] Store immutable owner-scoped decks/versions in D1; allocate IDs server-side.
- [ ] Reject stale baseVersion atomically and preserve the prior working version.
- [ ] Store generated PPTX/notes in R2; authorize every download and preview route.
- [ ] Add DB/BUCKET bindings, generated migrations, and environment declarations.
- [ ] Keep tokens server-side; protect OAuth state and encrypt persisted token data.
- [ ] Merge A's usable engine, then land the thin end-to-end integration.

### B3 — preview and Canva (hours 8–16)

- [ ] Show five thumbnails and layout/content/finished stages from the stored plan.
- [ ] Add speaker notes, selected-slide preview, version label, and change summary.
- [ ] Use the MCP Apps resource/bridge so the preview works inside ChatGPT.
- [ ] Inject A's `assets: Asset[]` from `src/engine/assets.ts` into render/export calls.
- [ ] Implement binary PPTX import, persisted pending jobs, and status refresh through
  get_deck. Never create duplicate imports while polling an existing job.
- [ ] Expose actionable connection/import errors and a working download fallback.
- [ ] Label each new Canva design version and explain the lack of reverse sync.
- [ ] Generate the real pitch through the integrated tools with A by hour 12.
- [ ] Freeze a verified complete flow and final deck by hour 16.

### B4 — hosting and submission support

- [ ] Preserve `.openai/hosting.json` project identity; use the Sites workflow to
  synchronize source and deploy privately. GitHub is the collaboration remote;
  keep Sites source credentials and remote configuration separate from it.
- [ ] Reuse the Site's canonical plugin and verify an actual tool call in ChatGPT.
- [ ] Test the live edit without waiting for async Canva import completion.
- [ ] Record a backup, save files, document setup, and coordinate submission.

## Tests and handoff

Test user isolation on deck/file endpoints; input validation; stale concurrent writes;
version immutability; export errors; unavailable Canva authorization; OAuth state
validation; pending/success/failure status; and reuse of the existing import job.

An HTTP-deployed website is not proof of a working ChatGPT connection. A mocked
Canva response is not proof of editable imports. Track these separately.

Run `npm run check` and `npm run build` before integration PRs. Supply actual tool
call evidence, the import-tested design link, configuration key names without
secret values, and clear remaining limitations.

## Evidence and blockers

Initialization only. The private Site is registered but unpublished; D1/R2 are
disabled. Canva developer credentials have not been supplied or configured.
