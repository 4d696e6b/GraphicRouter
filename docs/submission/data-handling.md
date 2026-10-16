# Data handling inventory — preparation, not a published privacy policy

This records inspected application behavior. User decisions, provider practices
and deletion/retention commitments must be resolved before publishing a policy.

## Application-managed data

The service stores an authenticated owner identifier, design IDs/timestamps,
immutable blueprint versions, supplied briefs/source chunks/requirements,
speaker notes and history in D1. R2 stores generated exports/previews as needed.
The app stores Canva import job/design state and encrypted per-user OAuth tokens.
OAuth state expires after ten minutes and is consumed atomically; expired state
is cleaned during authorization. Token encryption uses the server-side key.

The new source implements a30-day access cutoff from original design creation,
queued transactional database deletion and retryable native export-file cleanup.
Deployment and the authenticated unattended writer still require live verification.
Minimal cleanup IDs/scan timestamps remain for retries, without owner/content.
Canva connection tokens have separate retention and no general automatic purge.
There is no customer self-service deletion endpoint; email support is the current
request route. Existing normal version immutability remains enforced. See
[retention implementation](../RETENTION.md). Do not claim a verified physical purge
schedule until actual authenticated execution/readback succeeds.

## Flow and recipients

ChatGPT supplies structured tool inputs. The Sites/Cloudflare application handles
identity, storage, native rendering and downloads. A user-requested application
Canva import sends native PowerPoint bytes to Canva. Host-connected Canva editing
and attachment uploads use a separate Canva connection and its supported tools;
the planning helpers alone do not upload a file or save an edit.

The product website on Vercel is static and contains no custom visitor analytics
or direct design-service calls. Hosting/provider logs and provider privacy terms
remain separate; this inventory does not claim no hosting telemetry exists.
No extra model API or training pipeline is implemented in the app source.
OpenAI/Canva handling outside this repository must not be described as controlled
by GraphicRouter or covered by an invented no-training/zero-retention promise.

## Decisions still needed

- Public support/privacy contact confirmed: pacharapol.p5108@gmail.com.
- Retention decision confirmed:30 days. Actual hosted cleanup schedule verification remains.
- Who handles requests and which provider-controlled records remain separate.
- Terms for service availability, acceptable use, user content and termination.
- Applicable publisher declarations, target audience and legal attestations.

Evidence sources: db/schema.ts; src/server/store.ts; the canvas/document/deck
services; src/integrations/canva/client.ts; the authenticated file routes;
scripts/prepare-product-website.mjs and website/main.js.
