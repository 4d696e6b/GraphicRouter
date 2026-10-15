# Builder B — ChatGPT, preview, persistence, and Canva

Branch: `feat/chatgpt-canva`. Start from the common initialization commit.
Tracking: https://github.com/4d696e6b/GraphicRouter/issues/2

Status: **real engine integrated and locally verified; manual Canva text/image editing verified; hosted account/OAuth checks pending**.

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
- [x] Merge A's usable engine through main and integrate the real engine/assets.
- [ ] Land B's thin integration PR after the remaining hosted checks.

### B3 — preview and Canva (hours 8–16)

- [x] Implement five thumbnails and layout/content/finished stages from the stored plan; real-engine browser preview verified locally.
- [x] Add speaker notes, selected-slide preview, version label, and change summary.
- [x] Implement the MCP Apps resource/bridge (local transport verified; ChatGPT rendering pending).
- [x] Inject A's `assets: Asset[]` from `src/engine/assets.ts` into render/export calls.
- [x] Implement binary PPTX import, persisted pending jobs, and status refresh through
  get_deck. Never create duplicate imports while polling an existing job.
- [x] Expose connection/import errors and authenticated download fallback routes; real PPTX/notes downloads verified locally.
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
- `npm run check`: **70 tests pass**, including A's 26 engine tests and all seven
  original contract tests. Adapter tests retain a clearly labelled engine double;
  separate real-engine service tests and production routes use A's implementation.
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
  explicitly labels local verification and the pending hosted account checks.

### Additional reliability checks — 2026-10-15

- Fixed out-of-order Canva polling: completed import states cannot regress to an
  older pending response. Concurrent success/pending and failure/pending regression
  tests execute the real SQL; each caller receives the stored terminal state.
- Preview rendering failure now preserves successful browser tool results, committed
  versions, speaker notes, and existing download links. The UI explicitly says the
  operation succeeded and offers refresh. It no longer suggests repeating a write.
- Optional R2 file-discovery failures no longer hide the D1 blueprint/preview.
  Explicit export/download failures remain errors.
- The preview shows structured service error messages, including current version
  on conflicts. An initial widget error renders an alert instead of waiting forever.
- Browser QA used `node tests/integration/preview-qa.mjs`, a standalone, explicitly
  labelled test-only UI fixture. Verified slide 3 selection, layout-stage switching,
  expanded speaker notes, and a simulated actionable error while preserving selection.
  At a 390×844 viewport, content width was 375px (no horizontal overflow); browser
  warnings/errors were empty. This fixture does not test A's renderer, real export,
  the Apps host bridge inside ChatGPT, or Canva. Screenshot saved locally under
  ignored `outputs/preview-ui-mobile-test.png`; fixture server stopped after QA.
- PR #3 is open, draft, and mergeable. The GitHub check-runs API returned no remote
  check results for the prior head; local test/build evidence is recorded separately.
- A fresh fetch still showed A's branch at initialization, and a fresh lookup of the
  existing Site again returned `project_not_found`. Original identity preserved.

### Real engine and manual Canva verification — 2026-10-15

- Reviewed PR #4 and ran the combined 67-test suite/build before merging. Merged
  through main at `b8336d0`, then merged main into this branch. No A-owned source,
  dependencies, or shared contracts were changed by B.
- `engine-provider.ts` now re-exports the real `engine` and `assets` exactly as A
  specified. EngineError messages and structured issue paths remain actionable in
  the shared ToolError.message shape; no generic catch hides overflow/target errors.
- Real-engine service tests verify create → all preview stages → native PPTX export
  → violet `slide3.headline` revision → export v2. Every unrelated element, v1
  blueprint/file, and the other four slide XML files remain unchanged. Invalid target
  and overflow failures retain useful diagnostics and create no new version.
- Also ran the full HTTP flow against the real local Cloudflare Worker, D1, and R2
  using the starter's **simulated local identity**. Deck
  `b8f03b41-f1c1-4425-8b2f-5e13a2da2c2d` has v1/v2; all 15 real SVG stages and
  PPTX/notes downloads worked. Anonymous download returned 401. Invalid-target write
  returned 400 with the exact target explanation. A local real `get_deck` MCP call
  returned v2 and its real finished preview. This is not a ChatGPT account call.
- Real UI inspected in the browser: selected slide 3 shows a violet headline and
  the exact change summary. Send-to-Canva shows connection_required and preserves
  downloads when app credentials are absent. Local screenshot:
  `outputs/real-service/preview-v2.png`. Real exported v1/v2 PPTX, notes, and blueprint
  backups are under `outputs/real-service/b8f03b41-f1c1-4425-8b2f-5e13a2da2c2d/`.
- Regenerated A's handoff artifacts with GRAPHICROUTER_ARTIFACTS=1; test passed.
- B's actual Canva fixture import succeeded via the connected Canva plugin's
  design_file import. Design: https://www.canva.com/design/DAHYDOWfV8s/edit .
  The generic raw upload route rejected the fixture as Unsupported file format ZIP;
  the dedicated design import succeeded. This is a manual connector path, not the
  application's OAuth/binary-import client.
- Canva readback confirmed two editable 1920×1080 pages, four separate text objects,
  and two editable image instances. In draft transaction `30918320756505288`, B
  changed page 1's headline and moved its image from left=1152 to left=1180 while
  other objects stayed unchanged. Both operations returned success; the transaction
  was cancelled to preserve the fixture. Shape/line editability and font matching
  are still pending. Browser editor access redirected to the Canva login page.

### Concrete blockers still open

1. Existing Site ID `appgprj_6ad04f78c2188191b6c0be6c93b79ac2` is unchanged. First
   `get_site(include_mcp_connection: true)` failed at transport; retry returned
   `SitesConnectorError: Sites project not found`, code 404 / `project_not_found`,
   in this connected account/workspace. Cannot obtain its source credential, canonical
   plugin, or verify an actual ChatGPT call. Restore access to this same Site; do not
   register a replacement. No publication attempted.
2. No application Canva developer credentials/configuration have been supplied.
   OAuth HTTP tests are mocked and labelled. The separate manual connector import
   above does not establish app OAuth or backend import success.
3. Shape/line editing and font matching need a Canva editor login; installed ChatGPT
   tool/widget checks, final integrated pitch content, rehearsal, and recording remain.

### Handoff

See `src/server/SETUP.md` for runtime key names, local migrations, the two-line engine
handoff, official documentation, OAuth callback/scopes, honest manual fallback, and
account verification steps. A's engine is integrated through main and the real local
create/revise/export path is verified. Keep the UI's status accurate and privately
publish through the existing Sites
source workflow and test the canonical plugin inside ChatGPT. Check imported text,
shape, and image independently in Canva, record the actual design link and font
substitutions, then complete the pitch/rehearsal/backup items above.
