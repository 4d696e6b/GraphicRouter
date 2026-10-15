# Builder B — standalone static plugin download website plan

Status: implemented and locally verified; official plugin distribution remains unavailable.
Branch: feat/chatgpt-canva.
Specification: C:/Users/ronnachai/Documents/ChatGPT/TestWeb/GraphicRouter-RepoSetup-Prompt-EN.md
Current heading: GraphicRouter Static Plugin Download Website.

This plan supersedes the earlier React-homepage implementation plan for future
work. The completed app/page.tsx and app/marketing work remains intact. The standalone website is implemented. See builder-b-static-website-verification.md for evidence and limits.

## Objective and boundaries

Build a separate, ready-to-upload website/ using HTML, CSS, small JavaScript
modules and local assets. Ordinary static hosting must suffice: no Node runtime,
Next server, application API, authentication, OAuth, database or plugin service.
Use RepoSetup's centred editorial design and scrolling tablet experience, with
GraphicRouter content and download/install availability as the primary purpose.

Preserve the application, /briefing, engine, tools, auth, services, dependencies,
shared contracts and .openai/hosting.json. No new distribution architecture,
plugin packaging, release publication, private endpoint exposure, production
website deployment or PR merge is authorized by this plan.

## Work sequence

### 1. Confirm facts and distribution

- [x] Recheck AGENTS, product/contracts/coordination, current task evidence and
      release/setup documentation before implementation.
- [x] Inspect official release assets, bundled distributions and installation
      instructions. Verify any documentation/repository/connection URLs.
- [x] Record verified metadata in website/site.config.js. Keep unknown optional
      values absent and unverified public download/connection URLs null.
- [x] If no official package exists, use Download coming soon with a concise
      explanation. Never substitute a source ZIP, PPTX, empty file or fake installer.
- [x] Treat an official hosted connection separately as Connect GraphicRouter;
      do not describe a connection as an installer or invent installation steps.

### 2. Prepare the static surface and approved examples

- [x] Create isolated website/ with index.html, scoped styles, small JS modules,
      site.config.js, README and local assets/licence notices.
- [ ] Reuse the inspected RepoSetup reference snapshot
      763b333ff8f7ab05ba5f0f70a61a91bcb2abd857 and recheck live appearance.
- [x] Generate approved example SVGs/data once from the existing engine during
      development. Publish only static results; runtime must never import the
      engine-provider or execute preview/export/tool services.
- [x] Keep all assets and internal links relative for hosting under a subdirectory.
- [x] Render release metadata and any configured official artifact link into HTML
      at authoring/build time. A configured download must work without JavaScript.
      If a small optional generation/check script is used, delivery still has no
      mandatory build step or server runtime.

### 3. Implement the download-first page

- [x] Compact wordmark/header: Capabilities, How it works, FAQ, mobile navigation,
      primary download/availability action. Omit the previous search system.
- [x] Thin truthful release/host strip and centred hero, with the download action
      visible before animation and a labelled copyable example prompt.
- [x] Match paper/graphite/olive tokens, restrained violet, source typography,
      gutters, spacing, tablet artwork/framing, rails and native-scroll camera.
- [x] Three tablet chapters: Plan your story; Refine a detail; Take it with you.
      Use prepared slides, before/after headline paint and notes/handoff examples.
- [x] Capability strip and three cards: Shape the story; Change one detail;
      Prepare the handoff. Keep public copy concise and nontechnical.
- [x] Dark showcase: Story / Revision / Export, static examples and local v1/v2
      toggle, accessible tabs and expected arrow/Home/End keyboard behavior.
- [x] Two-column #download section with verified metadata and three real install
      steps, or an honest unavailable/connection-only state as evidence requires.
- [x] Short FAQ, limited copyable prompts, repeated truthful download action in
      the dark closing, and a static footer with no sign-in/sign-out UI.
- [x] All enabled plugin-download CTAs use the same verified artifact. Bundled
      files use an appropriate relative download link; cross-origin assets use
      the direct official URL without relying on the download attribute.

### 4. Verify static independence, behavior and visual fidelity

- [x] Serve website/ alone using a simple static file server while the application
      server is stopped and no logged-in session is required.
- [x] Check network traffic for static-only dependencies: no application APIs,
      auth, live ChatGPT/Canva calls, runtime engine execution or secret values.
- [x] If configured, verify actual artifact response, file/package, version and
      metadata. Otherwise verify unavailable CTAs and name the precise release
      artifact/URL dependency; do not report a successful plugin download.
- [ ] Compare the reference at matched desktop 1440x900 / 1280x720, tablet
      768x1024, mobile 390x844 / 360x800 and aligned tablet chapters.
- [x] Check no overflow/clipping, stationary click targets, native reverse scroll,
      short-window framing, offscreen/hidden suspension and listener cleanup.
- [ ] Verify keyboard/mobile navigation, tabs, FAQ, copy success/failure fallback,
      system reduced-motion/static chapters, 200% zoom and no-JavaScript essentials.
      Disclose any native-browser control limits instead of inferring results.
- [x] Verify subdirectory paths and consistency between site.config.js and the
      delivered HTML, including every download CTA and installation instruction.
- [x] Run npm run check and npm run build under AGENTS plus focused static-site
      checks. Report only checks run for this revised implementation.

### 5. Handoff

- [x] Deliver website/ ready for upload, configuration/README instructions,
      screenshots and verification evidence. Keep local verification separate
      from release availability and hosted plugin acceptance.
- [x] Update B's checklist, commit in small increments, push and follow the
      existing PR workflow. Leave merging, production deployment and release
      publication outside this task.
- [x] Report missing official distribution information precisely, without asking
      for credentials or inventing release metadata.

## Completion criteria

A standalone, reference-aligned static website introduces GraphicRouter briefly,
prioritizes a truthful download/install path, and operates independently of the
application server. Prepared examples remain labelled; no website interaction
creates decks, saves revisions, runs briefing, authenticates users, connects Canva,
starts/polls imports or exports on demand. The existing plugin app is unchanged.

## Qualified checks

Unchecked comparison items are partial: the exact reference source and prior live
reference captures were reused; all five new static viewport screenshots were
inspected, but a fresh paired live-reference run was not repeated. Keyboard,
menu, tabs, copy success, FAQ, explicit reduced motion and script-free behavior
passed. Copy failure and system-media paths have focused tests/source coverage;
native browser zoom did not respond, so 640x360 reflow was checked as an equivalent
layout probe. These limits are not claimed as full native browser acceptance.

No configured official artifact exists, so artifact download checks take the
unavailable branch. Local prepared samples are not live plugin verification.


