# Developer setup

Use Node.js 24 from the root `.nvmrc`. Customers use the hosted plugin and their
own connected accounts; these steps are for developers running the application.
The existing hosted product is public by link, while separate customer ChatGPT
installation and provider fidelity checks remain recorded in
[release quality](../../docs/RELEASE-QUALITY.md).

## Install and preview

```sh
npm ci
npm run check
npm run dev
```

Open http://127.0.0.1:5173. `/` redirects to the product website. `/install` is
customer setup help; `/briefing` is the standalone question interface. The
standalone brief copies a completed prompt back to chat; it does not call a model.

Local sign-in is an explicit identity simulation. It does not establish a hosted
ChatGPT account connection or prove the embedded host bridge works. For isolated
preview-control QA, `node tests/integration/preview-qa.mjs` serves clearly labelled
fixture data at http://127.0.0.1:5180; it performs no provider actions.

## Build and initialize local storage

```sh
npm run build
```

A build produces the Worker configuration at `dist/server/wrangler.json`; it does
not publish. Sites provisions hosted D1/R2 bindings during supported publication.
Local and hosted databases are separate.

For a fresh local database, apply all three existing migrations once, in order:

```sh
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_exotic_human_fly.sql
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_version-guards.sql
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_retention.sql
```

Do not reapply or edit an already applied migration. `0001_version-guards.sql`
protects immutable versions and atomic head advancement. New schema changes use
`npm run db:generate` and require coordination with the other builder.

For a production-style local Worker using that same storage path:

```sh
npm start
```

Use the origin printed by the server and configure matching local OAuth URLs if
needed. The normal developer preview is `npm run dev` on port 5173.

## Optional application Canva OAuth/import

Copy the placeholder configuration:

```sh
cp .env.example .dev.vars
```

Set values in ignored `.dev.vars` for local Workers, and in Sites server-side
runtime secret storage for production. No OpenAI API key is required.

- `SITE_ORIGIN`: the canonical application origin; local default
  `http://127.0.0.1:5173`.
- `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET`: credentials from your registered
  Canva developer integration. They are maintainer-owned application secrets.
- `CANVA_REDIRECT_URI`: exactly `<SITE_ORIGIN>/api/canva/callback`; register the
  same URL in Canva. This differs from Sites’ reserved `/callback` route.
- `CANVA_TOKEN_KEY`: base64 of 32 cryptographically random bytes used to encrypt
  stored user tokens. Keep it stable; changing it requires users to reconnect.

Use a local cryptographic generator and enter the key directly into secret
storage. Never paste secret values into a briefing, issue, commit or tool output.
Register `design:content:write` and `design:meta:read` in the Canva integration,
then visit `/api/canva/connect` while signed in to the application.

OAuth uses owner/cookie-bound expiring state, PKCE, encrypted token storage and
locked refresh-token rotation. The application’s OAuth connection is separate
from ChatGPT’s connected Canva tools. Those host tools perform native same-file
editing, supported attachment uploads and provider-approved saves.

## Native engine and service

`src/server/engine-provider.ts` imports the real `engine` and `assets` exports
from `src/engine/`. Test doubles stay in tests. The engine handles geometry,
validation, immutable edits, inspection and native exports. Services own identity,
storage, version allocation and provider job state.

`POST /mcp` serves initialization, discovery, tool calls and the embedded resource.
Sites supplies authenticated identity. Tool calls and private data/download routes
require the owner; caller-provided identity headers are not a supported shortcut.
A Site bypass token alone does not authorize a user’s records.

Exports are stored in R2 with owner-authorized, `private, no-store` download links.
Do not give these private URLs to Canva as if publicly readable. The importer
sends binary PowerPoint bytes and records its asynchronous job ID. Repeated
exports reuse saved files; polling reuses the same import job.

If a request times out after import begins, inspect the uncertain outcome rather
than blindly retrying and creating another design. Reconnection after polling
authorization loss retains the existing job. A failed export/import preserves
working blueprint versions and available downloads.

Each imported native version is a separate Canva design. Manual edits do not
synchronize back. Inspect the actual imported text, shapes, lines, images and
font fidelity; a PPTX/schema check alone does not establish Canva editability.

## Publish and verify

Preserve the selected checkout’s `.openai/hosting.json`, source repository and
current audience. Open/synchronize its source using the supported Sites workflow,
then build, package, save and deploy that exact pushed source. GitHub merges alone
do not publish Sites. Original and Test are distinct Sites; do not replace one
identity with the other to get around account access problems.

On macOS, prefix source packaging with `COPYFILE_DISABLE=1` to exclude AppleDouble
metadata. Runtime credentials stay in server-side secret storage.

For a new deployment, record the actual version/deployment result, then verify
ChatGPT tool discovery, a real brief/tool/widget interaction, intended-account
Canva operations and imported layers. Rehearse long-deck completion and the final
pitch edit separately from fixtures. Keep the downloadable native PowerPoint as
a recovery path when imports are unavailable.

The optional [Vercel deployment](../../docs/VERCEL.md) publishes only the product
website and leaves all application/OAuth routes on Sites.

## More detail

- [Architecture](../../docs/ARCHITECTURE.md)
- [Shared contracts](../../docs/CONTRACTS.md)
- [Canva same-file editing and pictures](../../docs/CANVA-EDITING.md)
- [Release evidence and remaining gates](../../docs/RELEASE-QUALITY.md)
- [Historical Builder B evidence](../../docs/tasks/builder-b-chatgpt-canva.md)
