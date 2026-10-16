# Product website on Vercel

Vercel hosts a second copy of the public product website. The authenticated
GraphicRouter application, MCP endpoint, stored files and Canva OAuth callback
remain on their existing Sites host. No server secrets are needed for this
static Vercel deployment.

## Repository configuration

Import `4d696e6b/GraphicRouter` with the repository root as the project root and
`main` as the production branch. Root `vercel.json` configures:

- Framework: Other (`null`), overriding framework auto-detection.
- Install: skipped; this static build uses only Node.js built-ins.
- Build: `node scripts/build-product-website.mjs`.
- Output: `public/product`.

Keep the project root at the repository root so Vercel reads the configuration
and build helper. This intentionally avoids building the Worker backend as a
Vercel Next.js app. Do not add Canva credentials or change the registered OAuth
callback for this website deployment.

The builder reuses the existing explicit public-file allowlist. It publishes
only the active HTML, CSS, JavaScript, licensed fonts, logo, prepared slides,
PowerPoint/notes and required notices. Authoring config, repository docs, secrets,
legacy artwork and backend source are excluded.

All plugin buttons retain the existing exact ChatGPT link. Setup help points
to the existing hosted `/install`; sample downloads use local relative paths.
Public website availability does not change ChatGPT account eligibility.

## Check before deploying

```sh
node scripts/build-product-website.mjs
node scripts/generate-static-website.mjs --check
npm run check
```

The first command needs no installed npm dependencies. The other checks use the
normal developer installation. `public/product/` is generated and ignored; commit
its source/configuration instead of the output.

Deploy through the connected Vercel integration, select the intended team, and
retain the real returned project/deployment IDs. Report an actual deployment URL
only after Vercel returns it, then watch for a terminal Ready or Failed state.
Do not infer deployment from a successful local build or a GitHub push unless an
existing Vercel Git project is confirmed linked.

After deployment, check the home and script-free pages, logo/fonts, all primary
ChatGPT links, sample PowerPoint and notes, and phone layout. A protected deployment
requires an authorized read before treating 401/403 as a website failure.

## Current deployment status

Prepared locally. The connected Vercel integration returns no accessible teams
and 403 for the user-selected `mink2551s-projects` scope. Publication awaits
authorized team access and an actual linked project/deployment result. A fresh
check after the user confirmed reconnection returned the same 403. No Vercel
URL has been verified yet.

Configuration fields were checked against Vercel’s
[vercel.json reference](https://vercel.com/docs/project-configuration/vercel-json)
and [build configuration](https://vercel.com/docs/builds/configure-a-build).
