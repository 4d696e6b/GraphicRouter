# Two-builder coordination

## Branches and ownership

`main` is the common integration branch. Both feature branches begin at the same
initialization commit. Each person opens a separate clone as a Codex project.

**A — `feat/slide-engine`**

- Own `src/engine/**`, `src/fixtures/**`, `tests/engine/**`.
- Own engine/export tests, bundled demo asset, and final pitch content.
- Export the `SlideEngine` implementation; keep it independent of platform APIs.

**B — `feat/chatgpt-canva`**

- Own `app/**`, `src/server/**`, `src/mcp/**`, `src/preview/**`,
  `src/integrations/**`, `tests/integration/**`, `db/**`, `drizzle/**`.
- Own `.openai/hosting.json`, framework config, package files, and dependency changes.
- Own tool registration, authenticated storage/file routes, Canva OAuth/import, and
  the hosted ChatGPT connection. Preserve the registered private Site identity.

**Shared**

`src/contracts/**`, `tests/contracts/**`, README, and these coordination documents.
Coordinate contract changes first. Each builder may update their own task checklist.
Record requested dependencies in the task file; B updates package/lock files.

## Checkpoints, measured from the start of implementation

- Hour 2: A has a two-slide PPTX fixture; B has a callable tool and performs a real
  Canva editability/import spike. Work together on this proof before broadening.
- Hour 6: if automatic import remains blocked, lock manual PPTX upload as fallback.
- Hour 8: merge A's first working engine PR, then B's thin end-to-end integration PR.
- Hour 12: generate the real pitch through the integrated workflow.
- Hour 16: freeze complete presentation/live-edit path; fix blockers only.
- Hour 20: local backups, demo recording, README, rehearsal complete.
- Hours 20–24: submission buffer. Do not add features.

## Keep commits small

```sh
git fetch origin
git merge origin/main
npm run check
git add <your-owned-files>
git commit -m "feat: describe one completed behavior"
git push origin HEAD
```

Open a PR into `main`. Run `npm run build` for build/integration changes. Include
test evidence, limitations, and the next person's handoff. Do not merge the other
builder's unfinished branch wholesale. After each integration merge, both builders
merge `origin/main` into their branches without rewriting published history.

Builder B coordinates integration and publishing; Builder A verifies exported
objects and the final pitch. GitHub repository permissions and private Sites/Canva
account permissions are separate. Never exchange credentials through the repo.

## Parallel development before the engine arrives

B can inject a test implementation of `SlideEngine` into service tests. Label all
fixture/mock outputs and return a clear not-implemented status from unfinished
production paths. Replace the test double with A's engine at the hour-8 integration.

## Definition of ready to merge

Owned work is scoped, `npm run check` passes, shared interfaces remain compatible,
and the task checklist distinguishes tested behavior from pending account checks.
No production deployment or Canva success is claimed based only on a mock.


## User-directed freeform scope correction

The user's current request supersedes the earlier fixed-layout/exclude-freeform
restrictions. This chat coordinates an additive canvas contract and implementation
across engine, interface and service tests. The schema was written first; scoped
agents consumed it without editing shared contracts. Legacy deck APIs/storage stay
compatible. Source/hosting identity and credentials are preserved. No message was
sent to the other user-owned builder chat; deployment remains in this owning chat.
