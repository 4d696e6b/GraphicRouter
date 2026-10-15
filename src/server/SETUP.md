# Builder B integration setup

This branch integrates Builder A's real engine with the service and adapters. The
real create/preview/revise/export path passes service tests and a local Cloudflare
D1/R2 HTTP run. Test doubles remain in integration tests only. Hosted ChatGPT and
the application's Canva OAuth/import path are not yet verified.

## Engine handoff

PR #4 was reviewed, tested, and merged into main at `b8336d0`. This branch consumed
that main commit and `engine-provider.ts` now exports:

```ts
export { engine } from "../engine";
export { assets } from "../engine/assets";
```

`SlideEngine` and all five shared input schemas are unchanged. The service allocates
deck IDs and versions. Real-engine service tests cover all three preview stages,
native PPTX export, the `slide3.headline` revision, unchanged unrelated elements and
prior versions, and unchanged XML for the other four slides. EngineError messages
and issue paths are preserved in the existing ToolError.message field, without
changing shared contracts. The homepage accurately labels local verification and
the outstanding hosted/app-authorization checks.

## Runtime and local checks

Use Node 22.13+ (Node 24 also works). `npm ci`, `npm run check`, `npm run build`.
`npm run dev` serves http://127.0.0.1:5173. The Sites starter's local sign-in is an
explicit local identity simulation, **not** a ChatGPT account connection.

For isolated preview-control QA while the engine/account are unavailable, run
`node tests/integration/preview-qa.mjs` and open http://127.0.0.1:5180. The banner
identifies simulated slides/actions. It uses the production presentation component
with test-only data; it proves no export, engine composition, ChatGPT host bridge,
or Canva integration. Stop the fixture server after testing.

`.openai/hosting.json` retains the original project ID and declares DB, BUCKET, and
the MCP capability. The Sites build integration remains intact. Sites provisions
D1/R2 and applies Drizzle migrations during supported publication. Local and hosted
databases are separate. For a fresh local database after a build:

```sh
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_exotic_human_fly.sql
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_version-guards.sql
```

Run these initial SQL files once per fresh local database. Do not reapply or edit an
applied migration. `npm run db:generate` generates subsequent schema migrations.
`0001_version-guards.sql` is a custom migration: its triggers prevent version updates,
deletes, skipped versions, and simultaneous stale appends. Version insertion advances
the deck head in the same SQLite transaction.

## Server configuration

Set key names from `.env.example` in ignored `.dev.vars` for local Workers and Sites runtime
secret storage. Never put values in hosting.json, tool output, source, or logs.

- `SITE_ORIGIN`: canonical private Site origin; local value http://127.0.0.1:5173.
- `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`: creator app's registered credentials.
- `CANVA_REDIRECT_URI`: exactly `<SITE_ORIGIN>/api/canva/callback`, also registered
  in the Canva developer portal. This is separate from Sites' reserved `/callback`.
- `CANVA_TOKEN_KEY`: base64 of 32 cryptographically random bytes. Keep stable;
  replacing it requires reconnecting existing users. AES-GCM binds each encrypted
  token/verifier to the owning Sites user ID. No values are sent to the browser.

Register `design:content:write design:meta:read` on the Canva creator app. Visit
`/api/canva/connect` while signed in. OAuth state is owner-bound, cookie-bound,
hashed, expires in ten minutes, and is consumed atomically. The PKCE verifier is
encrypted at rest. Refresh tokens rotate under a DB lock; an interrupted/ambiguous
refresh requires reconnecting rather than reusing a single-use refresh token.

## Tool and file flow

`POST /mcp` supports stateless MCP initialization, discovery, calls, and the embedded
Apps resource. Discovery has no private data. Sites dispatch supplies authenticated
identity; tool calls and all owner data routes reject missing identity. Do not expose
the Worker directly behind a proxy that accepts caller-supplied Sites identity
headers. A Sites bypass token alone never authorizes a user's records.

The widget bundles the MCP Apps bridge locally, receives the stored blueprint and
three SVG stages in private tool metadata, and uses `callServerTool` for refresh,
export, and import. SVGs display as images rather than executable markup. The same
presentation component serves the authenticated preview URL. All downloads are
owner-authorized and `private, no-store`; never give their URLs to Canva as if public.

`send_to_canva` exports first, then sends bytes from R2 using `POST /rest/v1/imports`.
A unique deck/version row claims the external side effect before starting it. Existing
jobs are reused; `get_deck` only polls. If the start request times out or the process
fails before saving the job ID, the outcome stays uncertain and will not auto-retry.
Check Canva before creating another version/import. Existing downloads remain usable.
When authorization fails before import bytes are sent, or Canva explicitly rejects
the request with HTTP 401, the service releases only the unstarted claim and returns
a reconnect link. A timeout after the import POST begins remains ambiguous and is
never automatically retried. Authorization loss while polling keeps the existing job
in D1; reconnecting then refreshing polls that same job. A missing/expired job (404)
returns an actionable failure without creating a replacement design.
Canva's returned edit URL currently expires after 30 days; design ID is stored too.
Each version is a separate design, with no reverse sync. Automatic import fidelity
must be checked manually; successful JSON is not proof of editable slide elements.
Completed import states cannot regress when concurrent polling returns out of order.
If SVG rendering fails after a successful tool call, its saved version and download
links remain visible with an explicit preview-unavailable message. The UI surfaces
structured service errors and preserves the previous presentation during failures.
R2 export objects use conditional write-once puts. File-existence checks use object
metadata instead of downloading PowerPoint bodies, and repeated exports reuse both
PPTX and notes. An R2 read failure before import leaves the import claim available.

## Account verification still required

### What is needed to unblock it

- **Sites:** connect the account/workspace that owns
  `appgprj_6ad04f78c2188191b6c0be6c93b79ac2`, or grant the currently connected
  account editor/owner access to that exact project. A successful get_site response
  must expose its expected/live origin and source access. The current lookup returns
  project_not_found. GitHub repo access cannot resolve this; do not create another Site.
- **Canva app:** configure the creator developer app's CANVA_CLIENT_ID and
  CANVA_CLIENT_SECRET in server-side secret storage, not in chat or Git. Register
  design:content:write and design:meta:read, and the exact callback
  `<SITE_ORIGIN>/api/canva/callback`. Once the Site's real origin is available, set
  SITE_ORIGIN/CANVA_REDIRECT_URI to match. CANVA_TOKEN_KEY can be generated server-side
  as 32 random bytes encoded in base64; no existing personal token is needed.
- **Manual fidelity checks:** a signed-in browser session for the Canva account
  owning the imported probe is needed for shape/line and font inspection. The Canva
  connector's working manual import does not provide this app's OAuth credentials.
- **ChatGPT:** after private deployment, install/connect the same Site's canonical
  plugin and perform an actual account tool call and widget check. Local HTTP/MCP
  tests and the offline rehearsal cannot substitute for that check.

1. Restore access to the **existing** private Site in the correct account/workspace;
   do not create a replacement or substitute a project ID.
2. Re-run the integrated engine/assets create/revise/export tests after any changes.
3. Configure server runtime values. Use the Sites source helper to open/synchronize
   its source separately from GitHub; build/package and deploy privately only after
   the real end-to-end path works.
4. Get that Site with `include_mcp_connection: true`, install/connect its canonical
   plugin, and call a tool inside the actual ChatGPT account. Capture the tool name,
   deck ID/version, and result without identity headers or secrets.
5. Complete the Canva shape/line editing and font-fidelity checks. B imported A's
   native two-slide fixture into design `DAHYDOWfV8s`, independently changed its
   headline and moved its logo in a draft, then cancelled the draft. This manual
   connector check is separate from application OAuth. The browser editor currently
   requires a separate login. Record the remaining font/conversion limitations.
6. Generate the actual pitch, rehearse the three-minute live edit, save local files,
   and record a clearly labelled backup. Do not wait for pending import during the demo.

If automatic import remains blocked at hour 6, lock **Download PPTX → manual Canva
upload** as the demo fallback. Native PPTX generation and authenticated downloads
are now verified locally; the two-slide manual Canva import is also verified.

## Official references checked 2026-10-15

- [OpenAI MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)
- [Canva OAuth and PKCE](https://www.canva.dev/docs/apps/rest-apis/authentication/)
- [Binary import job](https://www.canva.dev/docs/apps/rest-apis/reference/design-imports/create-design-import-job/)
- [Poll import status and returned design URLs](https://www.canva.dev/docs/apps/rest-apis/reference/design-imports/get-design-import-job/)
- [Cloudflare R2 conditional operations](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#conditional-operations)

Local MCP/HTTP tests and mocked Canva HTTP tests prove adapter behavior only. They
do not establish hosted ChatGPT authentication or Canva editability.
