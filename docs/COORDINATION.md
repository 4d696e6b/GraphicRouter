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

## User-directed editability and stability hardening — 2026-10-15

The user authorized a project-wide stability review and clarified that all design
copy must be separate native text. This extends the current owning chat's scope
across engine, shared additive contracts, intake, preview, HTTP routes, import
adapter and dependency patches. The review_canva_design contract is documented
before applying this release to the shared GitHub checkout. Existing tool names,
SlideEngine, storage formats, Site identities and secrets remain unchanged.
Publish only the owner-private GraphicRouter Test Site in the current account.
Do not merge the unrelated Builder B homepage draft or overwrite the original
Site's manifest. No message to the other builder is implied by this work.

## User-directed skills expansion — 2026-10-15

The user authorized all eight design skills, shared quality workflow, and needed
multi-page support. This owning chat coordinates the additive shared schema and
engine/service/UI/briefing integration. Preserve legacy tools and stored versions.
Current connected account owns the original private Site; Test Site access now
returns project_not_found. Work from the original Site's opened current source and
preserve both identities/secrets. No replacement Site or audience change is allowed.

## User-directed long-context optimization — 2026-10-15

This owning chat implements additive requirement storage, chapter-scoped retrieval,
compact document MCP responses and stress tests across service/engine/UI contracts.
Current account exposes owner-private GraphicRouter Test; original Site lookup now
returns project_not_found. Publish only the accessible Test Site after opening its
current source; preserve original identity/secrets and do not imply original release.

## User-directed same-file Canva editing — 2026-10-15

User authorized editing existing/imported Canva infographics from a supplied link.
This owning chat coordinates additive edit planning/snapshot review contracts,
intake, MCP orchestration and focused tests. Preserve all existing native/import
versions and tools. Existing-source adaptation still creates a copy; the new
explicit edit-existing route uses the same Canva design ID by default. Actual
reads/transactions/writes use the separately connected Canva tools and their
approvals, not an invented Connect API editing endpoint. No model/API dependency,
Site audience change, reverse sync or arbitrary server-side URL fetching is added.
Publish the accessible owner-private Test Site; original Site remains unavailable.

User additionally authorized pictures attached to the prompt for specific tasks.
Coordinate role/target input planning and connected Canva attachment upload/asset
placement guidance in the same release. Native blueprint asset ingestion remains
registered-only; do not claim an attachment was uploaded or placed from metadata.

User also requested richer, less text-only long-prompt designs. Add a read-only
native slide-composition helper and story/visual-density guidance; do not redesign
unrelated elements in the existing-file edit route. No dependency changes needed.

## User-directed brief interface redesign — 2026-10-15

User authorized redesign of the question dialog from a supplied screenshot. This
owning chat updates the shared hosted/widget Briefing component, scoped visual
styles and presentation copy. Preserve existing adaptive question/validation/tool
contracts, same-file routing, supplied answers, accessible focus/error handling and
one complete chat handoff. No new model, dependency, storage or account permission
is needed. Publish only the existing owner-private Test Site after source opening.

The user's subsequent project-wide release stability check found current package
advisories. This authorizes necessary compatible security patch pins/overrides in
this owning chat after registry/advisory verification, including build dependencies
that ship runtime RSC code. Preserve the Sites/Vinext integration, use one installer,
retest builds and record remaining upstream advisories rather than claiming a clean
security release from npm's production-only classification.
