# GraphicRouter

Plan the story. Compose the slides. Direct the changes.

A ChatGPT presentation plugin planned for a two-person, 24-hour hackathon. ChatGPT organizes supplied facts into a five-slide story; a deterministic engine builds separate editable elements and exports a PowerPoint for Canva.

**Status: initialized, not implemented.** This repository contains a runnable framework shell, shared TypeScript/Zod contracts, a draft input fixture, contract checks, and two independent work streams. The slide engine, MCP handlers, persistence, previews, and Canva connection are tasks, not working features yet. A private Sites project is registered; no deployment has been made.

## Start locally

Use Node.js 24 and npm. Run from this repository root:

```sh
npm ci
npm run check
npm run dev
```

Open the local URL printed by the server. The page identifies itself as a project starter. `npm run build` validates the deployable framework shell without publishing it.

For optional future Canva credentials, copy `.env.example` to `.env.local`; initialization requires no credentials. Never commit real values. If an existing npm cache has permissions problems, use `npm ci --cache .sites-runtime/npm-cache`.

## Two builders, two branches

Each person should use a **separate clone** and a separate Codex chat. Open the clone as the Codex project; do not run both agents in one shared working directory.

**Builder A: slide engine — [GitHub task #1](https://github.com/4d696e6b/GraphicRouter/issues/1)**

```sh
git clone https://github.com/4d696e6b/GraphicRouter.git graphicrouter-engine
cd graphicrouter-engine
git switch feat/slide-engine
npm ci
```

Paste the prompt from [Builder A's task](docs/tasks/builder-a-slide-engine.md) into Codex. Owns composition, validation, revisions, native PowerPoint export, and the final pitch fixture.

**Builder B: ChatGPT and Canva — [GitHub task #2](https://github.com/4d696e6b/GraphicRouter/issues/2)**

```sh
git clone https://github.com/4d696e6b/GraphicRouter.git graphicrouter-integrations
cd graphicrouter-integrations
git switch feat/chatgpt-canva
npm ci
```

Paste the prompt from [Builder B's task](docs/tasks/builder-b-chatgpt-canva.md) into Codex. Owns tools, service, preview UI, storage, Canva integration, and deployment.

## Agree once, then work independently

- [Product and acceptance criteria](docs/PRODUCT.md)
- [Shared interface specification](docs/CONTRACTS.md)
- [Branch workflow, ownership, and checkpoints](docs/COORDINATION.md)
- [Codex project guidance](AGENTS.md)

The common handoff is `SlideEngine` in `src/contracts/engine.ts`. Builder A will export `engine: SlideEngine` from `src/engine/index.ts`. Builder B develops against an injected implementation and may use an explicitly labelled test double until the engine is merged. The service must never report a mock as a real export or Canva success.

## Commands

- `npm run dev`: local framework development.
- `npm run typecheck`: strict TypeScript checks.
- `npm test`: contract checks now; implementation tests are added by their owners.
- `npm run check`: typecheck and tests.
- `npm run build`: build the Sites Worker locally.
- `npm run db:generate`: generate migrations after Builder B defines storage.

## Hosting

`.openai/hosting.json` retains the existing private Sites identity. Database/file bindings remain disabled until Builder B implements their use. GitHub is the collaboration remote. Do not create a second Site for this project. Builder B handles Sites source synchronization and publishing after integration; GitHub pushes alone do not deploy this scaffold.

The site owner's production access is separate from access to this GitHub repository. A second builder may need the owner's help with Sites configuration and Canva authorization. No hosting or Canva credentials are included.
