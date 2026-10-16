# GraphicRouter — hackathon pitch requirements

Reviewed 16 October 2026 against integrated main `7ab3bda`.
This is a presentation brief and readiness checklist, not a claim that the complete
live workflow has passed. No slide fixture, shared contract or product scope is changed.

## 1. What the event actually requires

The official source is the [U-Hackathon opening deck](https://u-hackathon-2026.vercel.app/#/17).
The following are event rules; the slide sequence below is our recommendation.

| Judging category | Weight | Evidence to prepare |
| --- | ---: | --- |
| App execution | 40% | A functioning, stable product and credible implementation |
| Practicality | 40% | A specific user, real need, repeat use and deployment potential |
| Usability and design | 10% | Understandable interaction, readable output and helpful recovery |
| Innovation and ecosystem | 5% | Original value and meaningful Tokenomist, ElevenLabs or Avalanche use |
| U-Bot integration | 5% | Useful, working U-Bot participation in the user experience |

Sources: [weights](https://u-hackathon-2026.vercel.app/#/17),
[execution/practicality](https://u-hackathon-2026.vercel.app/#/18),
[remaining criteria](https://u-hackathon-2026.vercel.app/#/19).

Submission rules: use a public GitHub repository, a real product demo URL and an
accessible pitch-deck link. A landing page alone does not satisfy the demo requirement.
Submit the Prototype round through the event hub by **16 October 2026, 14:00 Bangkok
(UTC+7)**. The deck can be a Drive or deck-website link with public-by-link viewing.
The event judges the submitted version. Teams need organizer approval; judged work
must originate during the event and respect third-party licenses.
Sources: [submission](https://u-hackathon-2026.vercel.app/#/30),
[links/access](https://u-hackathon-2026.vercel.app/#/31),
[build rule](https://u-hackathon-2026.vercel.app/#/12),
[registration](https://u-hackathon-2026.vercel.app/#/13).

No fixed slide count or speaking duration was found in the reviewed opening deck.
The five-slide/three-minute format below comes from GraphicRouter's own stage
runbook. Confirm the organizer's current pitch limit before final export.

## 2. The story the current product can support

Suggested positioning, grounded in current README and PRODUCT:

> GraphicRouter turns a rough brief into editable visual stories inside ChatGPT,
> then helps you inspect, refine and hand them off to Canva.

The core benefit is control over individual elements and a deliberate workflow.
Avoid presenting the project as only a website, a prompt-copy generator, or a
five-slide template engine. Those descriptions miss current capabilities.

Current implementation includes adaptive briefs; freeform native canvases;
1–40-page documents; source/requirement tracking; SVG and model-visible PNG
inspection; native PPTX and notes; immutable revisions; and owner-authorized
storage. Legacy five-slide decks remain available.

There are distinct routes: native GraphicRouter composition, new design through
connected Canva tools, existing-source adaptation, and same-file Canva edit planning.
Choose one proven route for the stage. Explain which connection performs the
actual provider action; a planning helper does not itself edit Canva.

## 3. Required core slides — recommended three-minute version

### Slide 1 — A small change should not mean starting over (30 seconds)

Include:

- GraphicRouter name and a one-sentence explanation.
- One primary user. Suggested segment: people preparing repeated pitches or
  explaining projects; validate this with the team's own experience before claiming demand.
- One concrete problem: a visual needs one correction while its remaining content
  and layout should stay intact.
- One relatable example, such as a headline colour change before presenting.

Visual: show the real original and revised output. Mark only the changed headline.
Do not invent hours saved, adoption, revenue or interview results.

### Slide 2 — Brief → compose → inspect → refine (30 seconds)

Include:

- The user's input: topic, audience, goal, supplied facts and desired format.
- A short depiction of the actual adaptive brief and selected creation route.
- Individual text/shape/image objects, inspection and focused revision.
- Output: an editable native presentation and notes, with a distinct Canva handoff.

Visual: four short workflow steps and one real product preview. Mention larger
formats or up to 40 pages only as supported scope, not the stage demo's length.
Do not imply automatic website analysis or public Canva-template catalogue search.

### Slide 3 — Show the product doing the work (55 seconds)

Include a working demonstration, with the operating path identified:

1. Open the actual product/ChatGPT briefing and an authorized saved design.
2. Show the brief becoming a composed output and its real inspection preview.
3. Request a focused change: "Change only the headline on slide three to violet."
4. Show the new version and change summary beside the original version.
5. Show the exported file or verified Canva result, identifying that exact version.

Use the existing legacy deck for this exact slide-three edit, or translate the
operation to the real selected document page/element. Do not mix workflow IDs or
pretend a prerecorded result is a fresh provider action. Preserve version 1.
Prepare the original and revised files before the pitch. Async import must not
block presenting; an existing Canva design is not automatic live synchronization.

### Slide 4 — Why this result is reliable (35 seconds)

Include:

- A compact architecture: ChatGPT → typed MCP tools → authorized service → stored
  blueprint → previews/native PPTX → Canva import.
- Stable element IDs, immutable versions and stale-write rejection.
- The same saved objects drive preview and export; credentials stay server-side.
- One concrete proof: only the selected headline changed, with unrelated elements
  and the previous version preserved.
- A small evidence label distinguishing local tests, hosted checks and Canva checks.

Use actual proof files or a fresh test run. Current README records 288 passing
checks across 46 files and a build; that is recorded evidence, not a fresh run by
this review. Do not put an unqualified "fully tested" badge on the slide.

### Slide 5 — Who uses it next, and what remains (30 seconds)

Include:

- One repeated user task and why the user would return.
- A clear comparison grounded in product behaviour: individual editable objects,
  controlled revisions and review, rather than a flattened picture.
- The real project/demo/deck links or a readable QR code.
- Actual human team names and roles; do not list coding agents as registered teammates.
- A bounded next milestone and honest current access limitations.

If pricing or business-model ideas are shown, label them proposed. Do not manufacture
market size, competitor benchmarks, payment availability or customer validation.

## 4. Backup slides and Q&A evidence

Keep these outside the timed core:

- Architecture and privacy: ownership checks, encrypted tokens, version history,
  failure recovery, and the distinction between Sites application and Vercel website.
- Format/quality examples: native text, registered images, readable inspection,
  source requirements, supported dimensions and long-document limits.
- Integration matrix: what GraphicRouter implements, what connected Canva performs,
  actual account checks, pending checks, and event partner/U-Bot status.
- Build provenance: event-window commits, original work versus dependencies/assets,
  licenses and the exact submitted commit. Do not infer compliance from a screenshot.

## 5. Evidence and gaps to resolve before presenting

| Area | Repository evidence | Requirement for the pitch |
| --- | --- | --- |
| Native engine/service | Implemented; revision/export/authorization tests and local workflow evidence | Demonstrate a real current result; label local identity when used |
| Current hosted presence | Original Sites publication and Vercel website recorded in A's latest checklist | Test the submitted links; Vercel marketing page is not the working tool |
| ChatGPT availability | Owner launch works; Development mode and separate-customer installation remain documented limits | Verify access from the intended judge/presenter account; supply accurate setup |
| Canva handoff | Separate manual import evidence exists; application import and native editing are distinct paths | Show the actual design/version and provider result used in the demo |
| Imported editability | Native PPTX object proof is available; current Canva layer/font fidelity remains a separate gate | Inspect real text, shapes, lines and image independently; disclose substitutions |
| U-Bot | No implementation/reference found in reviewed src/app/tests/docs | Treat its 5% category as a gap; do not rename ChatGPT as U-Bot |
| Event partners | No Tokenomist/ElevenLabs/Avalanche integration found in the same review | Treat partner evidence as a gap; Canva/OpenAI alone do not demonstrate this criterion |
| Real-user value | Product rationale exists; no validated time-saving or traction evidence established by this review | Use an actual observation or an explicitly labelled hypothesis |
| Full rehearsal | Current release gates still require complete intended-account rehearsal | Time the real talk, transitions and edit; record a labelled backup |

This is a source review, not new account verification or a fresh test/build run.
Current README, PRODUCT and later dated deployment records supersede the old
local-workflow fixture's claims that Site access is still universally blocked.
The old fixture must be reviewed before reuse; do not rewrite A-owned fixtures
silently as part of this checklist.

## 6. Final handoff checklist

- [ ] Five core slides tell one coherent user story; no feature-list wall.
- [ ] Roughly 80% of the persuasive content demonstrates execution and practical use.
- [ ] Real output is visible at presentation size; exact required wording is readable.
- [ ] Original and revised versions prove the controlled edit.
- [ ] Every integration claim identifies the real path and latest verified status.
- [ ] U-Bot and event-partner participation are either demonstrated or marked absent.
- [ ] Public repository, actual demo and viewable deck are separate tested links.
- [ ] A signed-out/non-owner link test exposes any installation restriction honestly.
- [ ] Registered human team/track approval and submitted version are confirmed.
- [ ] Actual pitch duration is confirmed with organizers, then rehearsed aloud.
- [ ] PPTX/PDF/notes and a labelled recording are available on the stage computer.

Project references: [README](../README.md), [current product](PRODUCT.md),
[architecture](ARCHITECTURE.md), [Canva editing](CANVA-EDITING.md),
[release evidence](RELEASE-QUALITY.md), [client setup](CLIENT-SETUP.md),
[presenter runbook](../src/fixtures/stage-runbook.md),
[latest A evidence](tasks/builder-a-slide-engine.md).

## 7. Build-window clarification to obtain from organizers

The opening deck gives a 15 October 11:30 Bangkok build start and excludes
pre-built projects. Git history records initialization `d0f5cdb` at 11:08:53 and
service/storage commit `018bfd5` at 11:28:45 on that date (+07:00). These commit
timestamps precede the stated start; timestamps alone do not establish what the
organizers permit or whether clocks were aligned. Confirm whether this setup and
early work are eligible, and describe the build history accurately. Do not claim
that every committed feature was written after 11:30 without resolving this.
