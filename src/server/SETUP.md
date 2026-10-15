# Builder B integration setup

This branch implements the service and adapters. It does **not** yet generate real
slides: `engine-provider.ts` deliberately returns `NOT_IMPLEMENTED`. The only engine
double lives in `tests/integration/engine-double.ts`; its bytes are not a PowerPoint.

## Engine handoff

After Builder A's usable engine is merged into main, merge `origin/main` into this
branch, then replace the provider exports with:

```ts
export { engine } from "../engine";
export { assets } from "../engine/assets";
```

Keep `SlideEngine` and all five shared input schemas unchanged. The service allocates
deck IDs and versions. Test the real engine through create/export and the
`slide3.headline` revision; compare every unrelated element and the previous version.
Update the homepage's integration status only after those checks actually pass.

## Runtime and local checks

Use Node 22.13+ (Node 24 also works). `npm ci`, `npm run check`, `npm run build`.
`npm run dev` serves http://127.0.0.1:5173. The Sites starter's local sign-in is an
explicit local identity simulation, **not** a ChatGPT account connection.

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

Set key names from `.env.example` in ignored local configuration and Sites runtime
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
Canva's returned edit URL currently expires after 30 days; design ID is stored too.
Each version is a separate design, with no reverse sync. Automatic import fidelity
must be checked manually; successful JSON is not proof of editable slide elements.

## Account verification still required

1. Restore access to the **existing** private Site in the correct account/workspace;
   do not create a replacement or substitute a project ID.
2. Integrate A's engine/assets and pass the real create/revise/export tests.
3. Configure server runtime values. Use the Sites source helper to open/synchronize
   its source separately from GitHub; build/package and deploy privately only after
   the real end-to-end path works.
4. Get that Site with `include_mcp_connection: true`, install/connect its canonical
   plugin, and call a tool inside the actual ChatGPT account. Capture the tool name,
   deck ID/version, and result without identity headers or secrets.
5. Import A's native two-slide PPTX fixture. In Canva edit one text box, one shape,
   and the image independently; record the design link, font substitutions, callbacks,
   and conversion limitations. Restore the intended slide content after testing.
6. Generate the actual pitch, rehearse the three-minute live edit, save local files,
   and record a clearly labelled backup. Do not wait for pending import during the demo.

If automatic import remains blocked at hour 6, lock **Download PPTX → manual Canva
upload** as the demo fallback, after checking the actual exported file. No working
PowerPoint fallback is claimed before A's engine is integrated.

## Official references checked 2026-10-15

- [OpenAI MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)
- [Canva OAuth and PKCE](https://www.canva.dev/docs/apps/rest-apis/authentication/)
- [Binary import job](https://www.canva.dev/docs/apps/rest-apis/reference/design-imports/create-design-import-job/)
- [Poll import status and returned design URLs](https://www.canva.dev/docs/apps/rest-apis/reference/design-imports/get-design-import-job/)

Local MCP/HTTP tests and mocked Canva HTTP tests prove adapter behavior only. They
do not establish hosted ChatGPT authentication or Canva editability.
