# Builder B — ChatGPT, preview, persistence, and Canva

Branch: `feat/chatgpt-canva`. Start from the common initialization commit.
Tracking: https://github.com/4d696e6b/GraphicRouter/issues/2

Status: **local integration implemented and tested; draft handoff, blocked on the real engine and account access**.

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

- [x] Read current OpenAI MCP and Canva import/authentication documentation.
- [ ] Prove a small callable tool from the actual ChatGPT account.
- [ ] Register/configure creator-account Canva OAuth (Authorization Code + PKCE).
- [ ] Import A's fixture and manually edit each selected text/shape/image object.
- [ ] Record exact access, callback, font, and conversion limitations.

### B2 — service and tools (target hour 8)

- [x] Inject `SlideEngine`; develop tests with a clearly labelled double first.
- [x] Register exactly create_deck, get_deck, revise_deck, export_deck, send_to_canva.
- [x] Use shared input schemas and `DeckResult`/`ToolError` outputs.
- [x] Plan the narrative in ChatGPT tool instructions from provided facts only.
- [x] Store immutable owner-scoped decks/versions in D1; allocate IDs server-side.
- [x] Reject stale baseVersion atomically and preserve the prior working version.
- [x] Implement R2 PPTX/notes storage and authorize download/preview routes (adapter tested; actual PPTX awaits A).
- [x] Add DB/BUCKET bindings, generated migrations, and environment declarations.
- [x] Keep tokens server-side; protect OAuth state and encrypt persisted token data.
- [ ] Merge A's usable engine, then land the thin end-to-end integration.

### B3 — preview and Canva (hours 8–16)

- [x] Implement five thumbnails and layout/content/finished stages from the stored plan (actual engine preview pending).
- [x] Add speaker notes, selected-slide preview, version label, and change summary.
- [x] Implement the MCP Apps resource/bridge (local transport verified; ChatGPT rendering pending).
- [ ] Inject A's `assets: Asset[]` from `src/engine/assets.ts` into render/export calls.
- [x] Implement binary PPTX import, persisted pending jobs, and status refresh through
  get_deck. Never create duplicate imports while polling an existing job.
- [x] Expose connection/import errors and authenticated download fallback routes (real files await A).
- [x] Label each new Canva design version and explain the lack of reverse sync.
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

### Verified locally — 2026-10-15

- Installed dependencies with `npm install`. The first check attempt ran while
  installation was incomplete and failed to find `tsc`; after installation all seven
  original contract tests passed. Added esbuild only for bundling the local Apps UI.
- `npm run check`: **35 tests pass**, including all original contract tests. Tests
  use real production SQL against SQLite and a clearly labelled test engine; its
  bytes explicitly say they are not a PowerPoint. No double is wired into routes.
- Tests cover owner isolation for decks/files/previews; HTTP 401/404 and no-store
  downloads; shared validation; concurrent stale revisions; immutable SQL versions;
  failed validation/export; notes; stored blueprint passed to preview/export; missing
  Canva authorization; one import claim per version; pending/success/failure mapping;
  polling without reimport; state expiry/replay/owner/cookie checks; PKCE; AES-GCM
  owner binding/tampering; refresh concurrency; backend binary bytes and secret redaction.
- Local MCP tests initialize, discover exactly five shared schemas, read the bundled
  UI resource, and create a labelled test deck through HTTP with stored blueprint and
  all three preview stages. An actual local dev `/mcp` tools/list also returned all
  five tools. **These are not actual ChatGPT account calls.**
- The MCP test caught the SDK exposing a refined Zod schema as `{}`. Discovery now
  uses the shared schema's underlying object; the service still applies the complete
  shared refinement before calling the engine. No shared contract files changed.
- `npm run build`: passes the production Vinext build, including MCP, OAuth, files,
  preview, browser tool route, and locally bundled Apps bridge. Original Sites build
  integration and project identity retained. D1/R2/MCP are declared in source config;
  hosted provisioning has not occurred.
- Both SQL migrations executed successfully against Wrangler local D1 (5 table
  commands and 4 trigger commands). No hosted database changes were attempted.
- Local homepage returns HTTP 200 and was inspected in the in-app browser. It
  explicitly labels the engine/account verification as pending. Actual slide/widget
  visual QA awaits the engine and ChatGPT connection.

### Concrete blockers

1. `origin/feat/slide-engine` still points to initialization commit `d0f5cdb` at the
   latest fetch. No `src/engine/index.ts`, assets module, or native PPTX fixture is
   available. Production provider returns `NOT_IMPLEMENTED`; no real deck, PPTX,
   manual upload fallback, or final pitch is claimed.
2. Existing Site ID `appgprj_6ad04f78c2188191b6c0be6c93b79ac2` is unchanged. First
   `get_site(include_mcp_connection: true)` failed at transport; retry returned
   `SitesConnectorError: Sites project not found`, code 404 / `project_not_found`,
   in this connected account/workspace. Cannot obtain its source credential, canonical
   plugin, or verify an actual ChatGPT call. Restore access to this same Site; do not
   register a replacement. No publication attempted.
3. No Canva developer credentials/configuration have been supplied. OAuth HTTP tests
   are mocked and labelled. A real editability test cannot start without A's PPTX
   fixture and creator authorization. No Canva import-tested design link exists.

### Handoff

See `src/server/SETUP.md` for runtime key names, local migrations, the two-line engine
handoff, official documentation, OAuth callback/scopes, honest manual fallback, and
account verification steps. Merge A's usable engine through main; never merge an
unfinished branch wholesale. Replace only `src/server/engine-provider.ts` with A's
engine/assets exports. Keep the UI's pending status accurate. Re-run checks and the
real create/revise/export path, then privately publish through the existing Sites
source workflow and test the canonical plugin inside ChatGPT. Check imported text,
shape, and image independently in Canva, record the actual design link and font
substitutions, then complete the pitch/rehearsal/backup items above.
