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

## Verified production deployment — 2026-10-16

- Public website: https://graphicrouter.vercel.app/
- Project: `graphicrouter`, team `mink2551s-projects`.
- Dashboard: https://vercel.com/mink2551s-projects/graphicrouter
- Initial deployment: `Gbj3RJ3yM9Y8urAbPvTxd2k8Mxv1`.
- Initial deployment URL: https://graphicrouter-8cvywgvks-mink2551s-projects.vercel.app/
- Source: `main`, commit `a4fe7d0b7370ab38485f9ff502b5e04be2b34147`.
- Dashboard status: **Production / Ready**. Subsequent pushes to `main` deploy
  through the GitHub connection; inspect the dashboard for the current commit.

The Vercel integration confirmed the intended username but returned no teams and
403 for this scope, including after reconnection. The user-selected Chrome tab
had authorized access, so the existing browser session completed the GitHub import
and deployment. No integration permissions, credentials or team access policies
were changed. The successful browser route does not prove MCP team access works.

Live anonymous HTTP checks returned200 and exact source bytes for both HTML views,
active CSS/JS, logo, both fonts, sample PowerPoint and notes. Authoring config,
backend source and unused reference artwork returned404. Desktop1512px and
phone375px browser checks showed no horizontal overflow; all four ChatGPT buttons
retained the exact existing plugin link. Fonts match Manrope and Instrument Serif.
Temporary phone viewport was reset. This checks the website, not a new Canva or
ChatGPT installation flow.

Configuration fields were checked against Vercel’s
[vercel.json reference](https://vercel.com/docs/project-configuration/vercel-json)
and [build configuration](https://vercel.com/docs/builds/configure-a-build).
