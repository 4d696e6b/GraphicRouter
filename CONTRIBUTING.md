# Contributing to GraphicRouter

Start with [README](README.md), [AGENTS.md](AGENTS.md),
[product direction](docs/PRODUCT.md), [contracts](docs/CONTRACTS.md) and
[coordination](docs/COORDINATION.md). The product document labels historical
hackathon scope separately from the current canvas/document workflows.

## Branches and pull requests

- `main` is the integrated source, not an automatic Sites deployment branch.
- Builder A works on `feat/slide-engine`; Builder B works on `feat/chatgpt-canva`.
  Use separate clones and checkouts so simultaneous edits do not collide.
- Other contributors can use a focused `feat/…`, `fix/…` or `docs/…` branch from
  current `main`. Keep one clear change in each pull request.
- Preserve published history. Do not force-push, delete another builder’s branch,
  or merge unfinished work wholesale.

For an existing builder branch, with a clean working tree:

```sh
git fetch origin
git switch feat/slide-engine # Builder B substitutes feat/chatgpt-canva
git merge origin/main
```

Resolve any conflicts with the other builder’s contract and ownership boundaries
in mind. Do not discard local changes to get a clean merge. Open a PR into `main`
and explain the behavior, checks, limitations and handoff. After integration,
merge current `origin/main` back into your builder branch. Delete a completed
short-lived branch only after its owner confirms no work remains.

## Set up and check

Use Node.js 24 and `npm ci`. See [server setup](src/server/SETUP.md) for local
storage and optional Canva configuration.

Before a code PR:

```sh
npm run check
```

For runtime, integration, dependency, website or build changes, also run:

```sh
npm run build
```

For website changes, validate generated HTML and prepared assets:

```sh
node scripts/generate-static-website.mjs --check
```

After editing `website/site.config.js` or its HTML template, regenerate first with
`node scripts/generate-static-website.mjs`. Edit `website/`, not generated
`public/product/`. Font files are binary; retain their licenses and Git attributes.

Author design instructions in `src/design-skills/library.json`; regenerate
portable copies with `node scripts/sync-design-skills.mjs` rather than editing
`skills/` alone. Guidance/examples and their generated copies must agree.

Documentation-only PRs should check relative links, referenced commands and
`git diff --check`; repository guidance still requires the standard `npm run check`.
Do not claim a build or provider check you did not perform.

## Engineering expectations

Use the shared schemas in `src/contracts/`. Coordinate additive contracts before
both builders implement them. Preserve stable tool names and element IDs, old
stored versions, atomic revisions and owner-scoped reads/downloads. Tests should
exercise meaningful behavior: precise edits, failed/stale writes, native export,
authorization and provider failures.

The renderer composes structured objects; it does not add another model service.
Use supplied or verified facts and label unknown evidence. Preserve native text
separately from images. A screenshot, schema pass or successful import does not
prove Canva layer editability, factual accuracy or visual quality.

## Credentials and hosted environments

Never include credentials, tokens, private design contents or account identifiers
in commits, screenshots, issue reports or logs. Use ignored `.dev.vars` locally
and server-side secret storage in production. `.env.example` contains names and
empty placeholders only. Each customer uses their own connected accounts.

Preserve the selected checkout’s `.openai/hosting.json` identity. Original and
Test Sites have different ownership, credentials and deployment histories. GitHub
access does not grant Sites or Canva access. Publish only through the supported
Sites workflow, preserving the current audience; no GitHub action here deploys.
On macOS, use `COPYFILE_DISABLE=1` when packaging to avoid AppleDouble files.

## Report an issue

Use the bug or feature template. Include the route/workflow, minimal reproduction,
expected versus actual behavior, and whether the result is local, hosted or a
provider action. Remove credentials and private content before attaching files.
For a suspected security problem, follow [the security policy](SECURITY.md)
instead of posting sensitive details in a public issue.
