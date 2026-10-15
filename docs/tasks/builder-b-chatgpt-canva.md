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
- [x] Implement R2 PPTX/notes storage and authorize download/preview routes (real local Worker/R2 PPTX and notes verified).
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
- [x] Create A's local-workflow pitch through the actual local service/MCP path; hosted account checks remain pending.
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
- `npm run check`: **86 tests pass**, including A's 32 engine tests and all seven
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

### Authorization recovery and export reliability — 2026-10-15

- New-import token/refresh failures before upload and explicit HTTP 401 rejections
  now return connection_required and release only the unstarted claim. Reconnecting
  can retry that version. Transport failures after import POST starts remain unknown
  and never auto-retry. This distinction is covered by mocked HTTP regression tests.
- Authorization loss while polling preserves the existing pending job in D1 while
  returning a reconnect link. The next authorized refresh polls the same job. Pending
  and completed job records cannot be deleted by unstarted-claim recovery.
- HTTP 404 for an existing import job becomes an actionable terminal failure instead
  of leaving the UI pending forever. No replacement import starts automatically.
- PowerPoint bytes are read before claiming an import. An R2 read failure therefore
  returns EXPORT_FAILED without consuming the version's import claim.
- R2FileStore uses conditional write-once puts for versioned exports. Metadata-only
  existence checks avoid loading the entire PowerPoint during get_deck/refresh or
  repeated export; cached PPTX and notes are not regenerated or rewritten.
- `npm run check`: 79 passing tests; `npm run build`: passed. Re-ran the real local
  Worker/D1/R2 HTTP flow with two concurrent exports: deck
  `f79b4c62-274e-4492-9b7a-24158440c572` passed create/three stages/revise/export,
  unchanged v1/unrelated elements, authenticated downloads, anonymous 401, invalid
  target 400, and real local MCP get_deck 200. Backups are under ignored
  `outputs/real-service/f79b4c62-274e-4492-9b7a-24158440c572/`.
- Local identity remains simulated. Canva auth-recovery tests use mocked HTTP;
  hosted ChatGPT and application OAuth are still unverified.

### PR #5 review and service recheck — 2026-10-15

- Fetched origin and merged origin/main: already current at the reviewed PR #4
  engine merge. Production provider still re-exports the real engine/assets; no
  NOT_IMPLEMENTED engine implementation or test double is wired into routes.
- Reviewed PR #5 at `229dc1762ce131836802d72249f311d9be339f45` in a temporary,
  uncommitted merge. Combined checks passed: **84 tests** and production build.
  Repeated the actual local Worker/D1/R2 HTTP create/three-stage-preview/revise/export
  flow with concurrent exports. Deck `94c2b81f-4be5-4905-ab27-e6617ccc7267` preserved
  unrelated elements and v1, rejected anonymous downloads with 401, returned useful
  EngineError invalid-target details with HTTP 400, and served real local MCP data.
- **Review finding [P2], tests/engine/rehearsal.ts:17–24:** the proof excludes all
  slide data from validHeader, and only compares element changes plus four unchanged
  slides. It therefore accepts an unrelated change to slide3.notes.core alongside
  the colour edit, even when the supplied PPTX still contains the original notes.
  Reproduced by appending a note to revised.slides[2].notes.core after exporting the
  valid revised deck: rehearsalProof succeeds and reports only slide3.headline.
  Compare all metadata on the changed slide (or normalize the expected blueprint's
  single paint change and compare the complete slides), and add that negative case.
- PR #5 was left unmerged at that review for A to fix (resolved in the follow-up below). Temporary merge aborted after verification;
  this branch's unchanged baseline still has **79 passing tests**. No A-owned files
  or shared contracts were edited. Offline rehearsal is a labelled fallback, never
  account-level/live integration proof.
- Fresh get_site for the preserved project again returned project_not_found.
  See SETUP.md's access/configuration requirements; GitHub permissions do not grant
  access to the Site or configure a Canva developer app.

### Corrected PR #5 and actual local-workflow pitch — 2026-10-15

- A fixed the target-slide metadata comparison at `3af69b0` and added the exact
  negative test for changed slide-three notes. Rebuilt B's original reproduction;
  the proof now rejects it. Reviewed changes are scoped to A's owned source/tests,
  fixture, and task notes, with no shared contract/dependency changes.
- Temporary combined check passed 85 tests/build. Merged PR #5 through main at
  `f1fe81a`, then merged main into this branch. Added a real-service test for the
  exact new localWorkflowPitch; final suite: **86 passing tests**, production build
  passed. The service stores A's exact input, preserving its qualified evidence.
- Created A's localWorkflowPitch through actual local Worker/D1/R2 routes, not direct
  engine-only generation. Deck `c3242528-9309-40b4-9a59-a2ca04ab708d`, v1/v2, passed
  three-stage preview, concurrent exports, targeted violet headline revision,
  unchanged unrelated elements/prior version, native PPTX/notes downloads, anonymous
  401, actionable invalid-target 400, and a real local get_deck MCP call (200).
- Actual-service backups: `outputs/real-service/c3242528-9309-40b4-9a59-a2ca04ab708d/`
  contains exact create-deck.json, v1/v2 PPTX and notes, both blueprints, all 15 SVG
  stages, presentation-v2.json, and a labelled verification.json. Local identity is
  simulated; these records do not prove an installed ChatGPT account connection.
- Separately checked the generated local-workflow offline replay in the browser:
  stage switching, selected slide, ArrowRight navigation, expanded notes, prepared
  v2 replay, and timer start/pause/reset-on-duration-change work. Timer counted down
  from 03:00 to 02:54; duration change reset it to 05:00. Browser warnings/errors were
  empty. The page prominently says precomputed/no live ChatGPT or Canva calls.
  Screenshot: ignored `outputs/offline-fallback-qa.png`. No speaking pace or live
  account verification is inferred from these control checks.
- A fresh lookup of the preserved Site still returns project_not_found. Application
  Canva credentials and Canva editor font/shape/line checks remain separate blockers.

### Current account requirements

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

### Canva polling recovery regression

- A transient non-auth polling error now returns a visible CANVA_POLL_FAILED status
  with the retained job ID and a Refresh import action. The persisted import remains
  pending; retry polls the same job and never starts a second import. Saved previews,
  notes and downloads stay available. Provider exception details remain server-side.
- Regression checks cover the visible alert, retained job, successful same-job retry,
  and one import start. Typecheck and all 87 current tests pass locally.
- Existing Site lookup retried: project_not_found (404) for the preserved ID. No
  replacement was registered; app OAuth/hosted ChatGPT verification remain blocked.

### PR #6 integration and refreshed local evidence

- Reviewed PR #6 at c8f238d and its subsequent 89abac7 hardening commit. The latter
  adds exact native PPTX-part preservation and a timed stage runbook. No shared
  contract or B-owned implementation changes were required. Merged through main
  as da51aa2, then consumed main on this branch as 3a5f401.
- Final check: TypeScript and 89 tests pass. Production build passes. Poll recovery
  coverage includes plain transport and typed Canva errors, retained pending job,
  explicit Refresh guidance, repeated Send without duplicate start, and same-job retry.
- Repeated real local Worker/D1/R2 HTTP workflow using localWorkflowPitch:
  deck 9a88b844-7e5e-4971-be7e-690109d7f35c; all 15 SVGs, concurrent exports,
  precise violet revision, immutable previous blueprint/PPTX, protected downloads,
  anonymous 401, invalid-target 400 with useful issue path, and local MCP get_deck
  200 pass. Identity uses the documented local simulation, not a hosted account.
- Applied A's new rehearsalProof to the actual Worker-downloaded files: only
  slide3.headline changed; slides 1/2/4/5 and all 49 other native ppt/ parts remain
  byte-identical, including notes and media. Proof and inputs/outputs are saved in
  ignored outputs/real-service/9a88b844-7e5e-4971-be7e-690109d7f35c/.
- Browser checked actual v2 slide 3 and Send to Canva: shows connection required,
  saved preview/notes/downloads remain usable, and console warnings/errors are empty.
  Screenshot: outputs/local-pitch-violet.png. Async imports do not gate presenting.
- Generated service-pitch recovery package. Default Python lacked fitz; installed
  Pillow/reportlab/PyMuPDF only in ignored outputs/backup-python, without changing
  A's utilities or project dependencies. Packager verifies five PDF pages, four
  explicitly precomputed GIF frames, ZIP integrity and nine file hashes.
  Package: artifacts/builder-a/service-pitch/graphicrouter-stage-backup.zip.
- Coordination for A: no engine changes requested. Stage runbook timing is a plan;
  actual speaking pace, full live demonstration and recording remain pending.
- Account verification remains incomplete: existing Site lookup still returns
  project_not_found / 404. Restore this exact project's owning account/workspace
  access. Then configure CANVA_CLIENT_ID, CANVA_CLIENT_SECRET and CANVA_TOKEN_KEY
  using server-side secret storage, with the exact hosted callback and required
  scopes in src/server/SETUP.md. Do not paste credentials into chat or Git.
- PR #3 remains draft per its checklist until hosted checks: actual installed
  ChatGPT tools/widget, application OAuth/backend import, Canva editor shape/line/
  font fidelity, timed live rehearsal and recording. Earlier separate manual Canva
  text/image verification does not satisfy these application-account checks.

### Mentor-requested product webpage demo

- Replaced the integration-only homepage with a responsive GraphicRouter product
  landing page: value proposition, four-step workflow, getting-started prompts,
  product basics/FAQ, availability, and honest Canva handoff limits.
- Interactive preview consumes A's existing engine and localWorkflowPitch unchanged.
  Five slide selectors, three preview stages, a prepared violet revision and reset
  work without live tool calls, storage writes or imports. Prepared status is visible.
- Copy prompt buttons and keyboard activation work; FAQ expands/collapses. Desktop
  and narrow mobile browser checks pass; no horizontal overflow or console errors.
  Screenshots: ignored outputs/landing-desktop.png and outputs/landing-mobile.png.
- TypeScript and all 89 existing tests pass; production build passes. No dependencies,
  shared contracts, engine, fixture, recovery, auth or service routes changed.
- Forwardable Worker A prompt: docs/tasks/builder-b-landing-handoff.md. A is asked
  only to review wording/evidence and retain engine/presentation ownership.
- Existing Site again returns project_not_found (404), so this is a local demo,
  not a new publication or a claim of installed ChatGPT/app Canva verification.
  No replacement Site or payment plan was created.

- Concurrent integration: PR #3 landed while the webpage was in progress. Opened
  follow-up PR #10 and merged current main (including A's guided design brief) as
  721d4dc. Resolved the homepage conflict by preserving the new /briefing entry and
  linking it from quick start. No independent A-owned/shared edits were made.
- Combined current-main check: 100 tests pass; production build passes. Browser
  followed Open the design brief and confirmed question 1 of 20 renders. Desktop
  screenshot refreshed after the merge. Hosted-access blockers are unchanged.

### RepoSetup visual-reference implementation

- Implemented the supplied RepoSetup-reference plan using the exact reference
  source snapshot and live site, retaining React/TypeScript/Sites and existing
  project identity. Centred hero, scroll-driven tablet chapters/rails/camera,
  capability strip, feature cards, dark tabbed showcase, guide, prompts, FAQ,
  availability, dark closing and footer now use factual GraphicRouter content.
- Header includes working local search, Ctrl/Cmd+K, Escape/focus recovery and mobile
  navigation. Showcase supports keyboard tabs and real prepared engine views.
  Reduced/no-JavaScript paths expose all chapters without long scroll/animation.
- Final check: 112 tests and TypeScript pass; production build passes. Built local
  Worker browser QA covers all five requested sizes, menu/search/tab/copy/FAQ,
  precise prepared revision/reset, reverse scrolling, and /briefing navigation.
- MIT notices retained for unchanged tablet art and adapted scene/CSS. No engine,
  fixture, shared contract, identity, dependency, auth or service changes. No merge
  or publication. Hosted integration verification remains separate and pending.
- Detailed evidence, screenshots, source mapping, EPERM recovery and native zoom/
  system-media emulation limits: docs/tasks/builder-b-reposetup-verification.md.

### Revised work plan — static distribution website

The latest supplied prompt now supersedes the React-homepage plan for future
website work. Implementation completed locally under the revised static scope. Build a separate website/ static download/installation surface,
preserve all existing application/plugin code and hosting identity, and verify
real distribution metadata before enabling any Download GraphicRouter link.
If no official artifact exists, keep an honest Download coming soon state.

Full work order and acceptance checklist:
docs/tasks/builder-b-static-website-plan.md. Production deployment, release
publication and merges remain outside scope. Previous homepage evidence does
not count as verification of the new standalone static delivery.

### Standalone static website implementation

- Added isolated website/ ready for ordinary static hosting, including paper/violet
  hero, tablet chapters, feature cards, prepared Story/Revision/Export, download
  availability guide, prompts, FAQ, native mobile menu and script-free basic.html.
- Official GitHub releases API returned no releases. Root package is private.
  No verified plugin download or public connection URL exists; availability stays
  Download coming soon. Sample PPTX/notes are separate, explicitly labelled files.
- Public config generates checked-in HTML. Optional authoring scripts check drift,
  artifact URL safety and asset hashes; visitors need no build, Node, app or login.
- 124 tests and TypeScript pass; production build passes. Static-only server tested
  with app stopped: 16 resources match local bytes; API route 404; POST 405.
- Browser checked all five specified sizes without horizontal overflow; mobile
  menu/Escape, tabs, prepared revision/reset, copy success, FAQ, tablet chapters,
  explicit reduced motion and zero-script basic view. Native zoom control did not
  respond; equivalent narrow reflow was checked and is recorded as a limitation.
- No application, engine, fixture, shared contract, dependency or hosting identity
  changes in this phase. No merge, release publication or production deployment.
- Evidence and exact remaining checks: builder-b-static-website-verification.md.
  Website configuration/upload instructions: ../../website/README.md.


### Repository-only content pass

- Expanded the static website using docs/PRODUCT.md, docs/CONTRACTS.md, briefing
  questions and existing localWorkflowPitch only. Added a five-step How to use
  section, v1 presentation basics, detailed project prompt, preview stages and
  timed notes. FAQ exclusions now match the product brief.
- Kept prepared examples, unavailable distribution and pending account checks
  explicit; no external claims or application/engine changes.
- Regenerated both static HTML views. TypeScript and all 124 tests pass; static
  consistency/hash check passes. Desktop 1440x900 and mobile 390x844 browser
  inspection shows the new section with no horizontal overflow.
- Source mapping: website/README.md. Local screenshots:
  outputs/static-website/project-content-desktop.png and project-content-mobile.png.

### Three-section refinement brief

- Implemented the attached refinement brief on website/ only: product-first hero,
  cohesive animated product section, download/get-started with one prompt, three
  FAQ disclosures and inline dark callout, plus compact footer.
- Preserved artwork, scene code, timing/easing, chapter/reverse scroll, hover and
  tab interactions, native navigation and reduced-motion/script-free alternatives.
- TypeScript + 124 tests and static HTML/config/hash check pass. Browser desktop
  and mobile show product explanation/download above animation without overflow;
  menu/Escape, tab keys, prepared revision, FAQ, copy status, reduced motion and
  native scroll forward/back passed. See static website verification addendum.
- Official artifact remains unavailable. No package fabricated, backend changed,
  production deployment, merge or live ChatGPT/Canva success claimed.

### Logo-led visual redesign

- Analysed assets/mark.svg: violet #7C3AED and white. Replaced inherited olive
  theme styling with violet, lavender-white, plum text and deep plum panels.
- Added website/brand.css for consistent tokens, typography, floating sticky
  navigation, constrained reading width, card surfaces, primary/hover/active/
  disabled/focus states, FAQ/prompt styling and responsive spacing. Header/footer
  use the existing SVG logo. No public content, feature or JS behavior removed.
- Preserved original artwork, prepared slide assets, scene geometry, timing and
  keyboard/tab/menu/copy logic. No backend, application or hosting changes.
- TypeScript + 124 tests, build and static consistency/hash checks pass. Five
  viewport sizes pass without horizontal overflow; hero CTA remains visible.
- Browser checks: mobile menu/Escape focus, arrow/End tab keys, violet change/reset,
  export links, FAQ, copy success status, reduced-motion summaries, forward/reverse
  tablet chapters, and zero-script view. Actual clipboard content and system
  preference toggling were not verified. Normal motion reached chapter 1/.592 and
  reversed to chapter 0/.000. Browser warning/error log empty.
- Core solid colour contrast ratios checked: primary white/violet 5.70:1,
  hover 8.17:1, body/plain background 6.02:1, panel body 9.68:1,
  unavailable 5.71:1. Dark-area focus uses pale violet; forced-colour heading
  fallback is provided. These are scoped pair checks, not a full accessibility
  audit or a claim that image/gradient content was exhaustively measured.
- Evidence: outputs/static-website/brand-desktop.png, brand-mobile.png,
  brand-1280x720.png, brand-768x1024.png, brand-360x800.png, brand-showcase.png,
  brand-download.png and brand-animation.png. Preview remains port 5184.

### Headline comparison readability

- Replaced the tablet's two tiny full-slide thumbnails with enlarged headline
  details from the same prepared SVG files. Clear Before/After labels, original/
  violet markers and a compact preservation note explain the single change.
- CSS crops only the visible presentation detail; original assets and blueprint
  data are untouched. Full-slide previews and sample files remain elsewhere.
- TypeScript + all 124 tests pass; HTML/config/hash check passes. Browser inspected
  desktop 1440x900 and mobile 390x844 in chapter 1, with positive card/crop heights
  and no horizontal overflow. Tablet camera/gesture code unchanged.
- Screenshots: outputs/static-website/headline-detail-desktop.png and
  headline-detail-mobile.png. Preview on port 5184 refreshed.

### Three-step design workflow concept

- Replaced only the central tablet chapters and surrounding floating-card content
  with the user-requested Choose a Design → Generate AI Prompt → Customize in Canva
  workflow. All three steps remain visible, connected and numbered; scrolling
  highlights each step and changes the supporting illustration.
- Added code-native template thumbnails, structured prompt example and generic
  customization/editor illustration. These are labelled CONCEPT PREVIEW, not a
  real design-analysis tool or verified Canva transfer. This user-supplied workflow
  is not implemented by the existing presentation service; no integration claim.
- Kept the page's presentation content, prepared preview tabs, revision controls,
  downloadable sample files and availability unchanged. Camera easing, gesture,
  native scroll and chapter progression preserved. Stage now clears sticky nav.
- TypeScript + 124 tests, production build and static HTML/config/hash checks pass.
  Updated the script-free test to check current configured headline and all concept
  steps rather than a removed old tablet slogan. Five viewport checks pass with
  no page overflow and all three device panels within their available height.
- Reduced-motion summary exposes all three steps. Existing keyboard tab/revision
  control still works; browser warning/error log empty. No backend/account test
  performed, no deployment or merge. Existing preview on port 5184 refreshed.
- Screenshots: outputs/static-website/workflow-choose-desktop.png,
  workflow-generate-desktop.png, workflow-customize-desktop.png,
  workflow-1280x720.png, workflow-768x1024.png, workflow-390x844.png,
  workflow-360x800.png.

### Responsive card fix and Canva-first copy

- Implemented the supplied screenshot brief. Each capability card has a dedicated
  size-contained illustration viewport; portrait sheet size derives from both
  available width and height. Decorations/hover travel fit within that area,
  headings stay in normal flow with a 24px gap, and grids step down to two/one
  columns. Only the art viewport clips decorative bounds; cards do not clip copy.
- Updated hero to Your ideas. / Ready for Canva. with the concise requested
  description and Plugin download coming soon. Summary is separate nonbreaking
  items: Clear stories / Focused edits / Made for Canva; mobile removes separator
  glyphs at wrap points. No slide-count, internal ID, contract or fixture changes.
- Updated all three card titles/descriptions as requested. Third visual now has a
  Canva badge and Prepared handoff label. Existing manual upload / pending app
  integration explanation remains in FAQ; no fabricated connected/success state.
- TypeScript + 124 tests, build, static config/HTML/hash checks pass. Checked 360,
  390, 640, 768, 1024 and 1440 widths plus breakpoint probes near 601, 900 and 1023.
  All cards' artwork bounding boxes fit their illustration viewport; title gap
  remains 24px; no horizontal overflow. At 640, settled first-card hover plus all
  descendants remained within bounds. Hero has no clamping/truncation; measured
  scrollHeight equals clientHeight. Summary contains no 5; download stays disabled.
- Theme, scene, chapter/gesture timing, hover rules and JS controls unchanged.
  Browser warning/error log empty. Static preview updated on port 5184.
- Screenshots: outputs/static-website/corrected-cards-desktop.png,
  corrected-cards-640.png, corrected-cards-mobile.png,
  canva-hero-desktop.png and canva-hero-mobile.png.

### Balanced hero composition and actions

- Set one hero spacing rhythm: badge/headline 32px, headline/description 24px,
  description/actions 32px and actions/summary 24px, with compact mobile values.
  Description now uses the supplied complete sentence and a balanced 480px max.
- Desktop actions share a 560px two-column group with 16px gap; both measure
  272x56px. Secondary action is a pale violet outlined button. At <=600px, both
  stack at equal full width, 56px tall, with 16px/600 labels and matching radii.
- Unavailable hero download is now a native disabled button with no arrow or fake
  link. Existing section availability text provides its accessible description.
  Removed the duplicate hero availability sentence. Compact capability line kept.
- Preserved gradient, background, headline copy and existing entrance/tablet code.
  Character proximity remains removed by the user's immediately preceding undo;
  this refinement does not reintroduce the reverted effect.
- TypeScript + 124 tests, build and static HTML/hash checks pass. Updated existing
  unavailable-CTA test for the hero's true disabled state. Browser measured matching
  action widths/heights and no page overflow at desktop/tablet/mobile widths plus
  a stepped resize sweep of 28 viewport sizes from 360 to 1440. Button labels fit
  completely; mobile stacking verified at 360/390/600; desktop columns at 640+.
- Keyboard focus is visible on the secondary action; Enter navigates to #workflow.
  Corrected target scroll offset so its heading clears the sticky header (112px
  target top, header bottom 88px). Browser warning/error log empty.
- Screenshots: outputs/static-website/balanced-hero-1440.png and
  balanced-hero-390.png. Static preview refreshed. No application/backend,
  dependency, contract or fixture changes; no merge or deployment.

### Hero descender clipping fix

- The supplied screenshot showed clipped lower letter strokes, not missing glyphs.
  Added .22em bottom paint space to both the gradient text span and entrance mask,
  with compensating negative margins. No font, copy, gradient or animation change.
- Browser screenshot confirms the complete y descender on desktop. Checked 390,
  640, 828 and 1440 widths without horizontal overflow. Reduced-motion static
  rendering checked; normal motion restored after capture.
- TypeScript + 124 tests and static HTML/config/hash checks pass. Evidence:
  outputs/static-website/headline-glyph-fix-desktop.png and
  headline-glyph-fix-mobile.png. No application/backend changes.

### Homepage entrance and ambient motion

- Read all six requested files in the supplied pachpim reference ZIP. Adapted its
  easing, brief typing, slide connections, radial exit and stagger principles in
  native JS/CSS using GraphicRouter's own mark; no reference app code/dependencies.
- Added a decorative 1.4-second intro, once per tab session, with Escape and first
  interaction skip. Real content is immediately usable; no scroll lock or loading
  state. Reload, history and anchor guards work even if storage is unavailable.
  Short mobile viewports hide the intro window to keep the action area clear.
- Added three diffuse side-biased violet fields behind content in an isolated
  stacking context. Cached hero bounds, passive pointer tracking, separate spring
  and drift wrappers, one settling RAF loop, no per-event gradient repaint.
  Reduced motion hides the effects; coarse/touch pointers remain static. Offscreen
  and hidden-tab guards pause decoration, with listener/observer cleanup on exit.
- Character proximity remains reverted per the user's earlier undo. No headline
  splitting or font/layout changes were introduced. Existing descender paint
  space, tablet scroll/chapter code, hover effects and disabled download preserved.
- Verification: TypeScript + 128 tests (18 files), production build, generator
  consistency/hash check pass. HTTP check: 18 static files served byte-for-byte,
  API 404 and POST 405. Separate application still responds 200 on port 5173.
- Browser: Escape removed intro immediately; reload skipped replay; resize sweep
  at 360/390/480/600/640/768/900/1024/1280/1440 had no horizontal overflow and equal
  56px buttons. Pointer movement produced distinct gradual transforms; CTA hit
  testing reached the actual controls. Tab focus visible. Anchor navigation works.
  Explicit reduced-motion control hides fields; offscreen drift state is paused.
  Native OS reduced-motion/coarse-device and hidden-tab transitions are guarded in
  source but were not emulated as physical device/account verification.
- Evidence: outputs/static-website/homepage-motion-1440.jpg and
  homepage-motion-390.jpg; graphicrouter-motion-demo.mp4 records 85 actual browser
  frames over nine seconds, with original capture timing (not a fabricated replay).
  Reference-frame screenshots were visually inspected. Preview remains port 5184.
- Local static UI only: no hosted ChatGPT/Canva verification, release artifact,
  deployment, engine, fixture, shared-contract or application dependency changes.

### Ambient response visibility correction

- User reported that the background appeared stationary. Tracking produced live
  transforms, but the two main fields were centred at 2%/98%, leaving much of
  their colour beyond the viewport. Moved desktop centres to 14%/86%, increased
  accents to 9%, and tuned displacement strengths to 64/-70/46px. Text exclusion,
  behind-content stacking, touch/reduced-motion guards and spring timing retained.
- The local preview server had stopped between turns. Restarted it as a hidden
  background Node process with output logs, independent of the command session.
- TypeScript and all 128 tests pass; static HTTP files match repository bytes.
  Browser confirmed three live independent transforms at pointer extremes.
  Evidence: outputs/static-website/ambient-fixed-left.jpg and
  ambient-fixed-right.jpg. No hosted integration verification implied.

### Reference-matched pointer glow

- Re-read AmbientMotion in the supplied ZIP. It follows clientX/clientY across the
  viewport; the previous implementation instead displaced three resting fields.
  Replaced those fields with one viewport-following 520px radial glow, 9% violet,
  fading to transparent at 72%, spring stiffness 170/damping 24 as in the reference.
- Preserved GraphicRouter's behind-content isolation (z-index -1), no click/focus
  interception, intro, typography, surfaces, scene and existing content. No Framer
  dependency. Transform one pre-rendered gradient; settling RAF stops at rest.
  Pointer exit/blur fades it away. Reduced motion/coarse pointers hide the effect;
  hidden document cancels tracking. Full-page glow now remains available while
  scrolling, superseding the earlier hero-only/offscreen-field behaviour.
- TypeScript + 129 tests pass, including viewport targets and reference spring
  settling. Static HTML/hash check and 18 served resource byte checks pass.
  Browser verified live positions across the viewport, fixed positioning after
  native anchor navigation, reduced-motion toggle and no horizontal overflow.
- Evidence: outputs/static-website/pointer-follow-glow.jpg and
  graphicrouter-pointer-glow.mp4 (5.5 seconds of actual browser captures).
  OS reduced-motion/coarse pointer transitions were not physically emulated.

### Pointer glow intensity adjustment

- Increased gradient alpha by 15% relative, from 23/255 (about 9.02%) to 10.37%.
  Radius, fade stop, tracking and spring response unchanged.
- TypeScript and 129 tests pass; refreshed browser confirms updated gradient.
  Screenshot: outputs/static-website/pointer-glow-intensity.jpg.

- Increased pointer glow intensity another 5% relative: 10.37% to 10.89% alpha.
  Radius and spring motion unchanged. Static consistency check passes.
