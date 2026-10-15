# Static website verification — Builder B

Scope: separate website/ on feat/chatgpt-canva. This phase preserves existing
app/, src/, dependencies and .openai/hosting.json. It does not deploy or publish.

## Delivered

Ready static HTML/CSS/ES modules with local assets and single site.config.js.
index.html is authored in advance; basic.html contains zero script tags.
Both show the same truthful release availability and relative links. Prepared
SVGs, five-slide PowerPoint and notes come from the existing real engine and
localWorkflowPitch. --examples checks only the third headline paint changes.
MIT notice accompanies unchanged RepoSetup art and adapted layout/camera math.

## Distribution evidence

Official repository: https://github.com/4d696e6b/GraphicRouter
GitHub releases API returned []; root package is private; no checked-in official
plugin distribution or verified public connection URL was found. Version, file
size, host and download/connection URL remain null. The site says Download coming
soon. No real plugin download is claimed. Sample PPTX/notes are product examples.
A future release needs its actual official artifact URL/file, version, supported
host and installation instructions, verified before updating public config.

## Commands and results

- node scripts/generate-static-website.mjs --examples — passed, real samples.
- node scripts/generate-static-website.mjs --check — passed, config/HTML/hash sync.
- npm run check — TypeScript and 124 tests pass (17 files).
- npm run build — production application build passes.
- node scripts/serve-static-website.mjs — website-only QA under /graphicrouter/.
- HTTP probe without cookies: 16 resources returned 200 and matched checked-in
  bytes. Application localhost:5173 was refused. Fake tool URL returned 404 and
  POST returned 405. No service server or authenticated session was needed.

Focused tests cover unavailable and configured artifact CTAs, unsafe URL rejection,
HTML generation, local links, script-free essentials, absence of runtime engine/API
imports, real five-slide sample ZIP, copy failure recovery and tab/camera helpers.
Configured-download tests use a test-only URL, never a claimed public release.

## Browser evidence

Local IAB served only website/: 1440x900, 1280x720, 768x1024, 390x844 and 360x800.
At each viewport, scrollWidth equalled clientWidth (1425,1265,753,375,345).
Settled screenshot captures used explicit reduced motion to avoid capturing title
entrance halfway through. Normal motion was resumed for tablet chapter captures.
Plan, revision and handoff appeared at .18/.50/.86 normalized track progress.

Mobile native menu opens; Escape closes it and returns focus. Tab ArrowRight and
End select Revision/Export. Prepared violet toggle and reset work. Copy button
reports success and clipboard contains the configured prompt. Native FAQ expands
with useful Canva limits. Final browser warning/error log was empty.

basic.html contains zero scripts: all three panels and chapter explanations remain
visible, native mobile menu works and download availability is accessible. Its
server requests contained static HTML/CSS/image files only. No website runtime
fetch, WebSocket, authentication or application dependency exists.

Ignored local screenshots in outputs/static-website/:
static-1440x900.png, static-1280x720.png, static-768x1024.png,
static-390x844.png, static-360x800.png, tablet-plan.png, tablet-revision.png,
tablet-handoff.png, script-free-download.png, zoom-equivalent-script-free.png.
HTTP evidence: outputs/static-website-http.json.

## Limits and remaining work

Native Control+Equal did not change browser viewport/device scale. A 640x360 CSS
reflow probe passed, but this is not proof of native 200% browser zoom. System
reduced-motion uses the same tested rendering path, but system preference was not
changed. Failure-to-copy is tested with an injected rejecting clipboard helper;
actual browser clipboard permission failure was not forced. Offscreen suspension
and cleanup have source coverage, not a browser performance trace.

The exact RepoSetup source and previously captured live references were used.
New five-size GraphicRouter captures were inspected, but a fresh paired reference
capture run was not repeated in this phase. Reference snapshot:
763b333ff8f7ab05ba5f0f70a61a91bcb2abd857.

Official distribution is missing. Hosted ChatGPT/widget, app Canva OAuth/backend
import, shape/line/font fidelity, Site access and recorded live rehearsal remain
separate integration checks. This static page does not establish those checks.
No replacement Site was registered. No credentials were added. No merge or
production deployment was performed.

## Three-section refinement

Implemented the supplied refinement brief: hero / product in action / download
and get started, followed by a compact footer. The hero explicitly identifies a
presentation plugin, with download status and a short supporting line before the
animation. One animated product section contains the existing tablet, shorter
rail copy, hover illustrations and Story/Revision/Export tabs. Download includes
at most three real steps when available, one optional prompt, three FAQ disclosures
and an inline dark closing callout. Separate availability strip, basics/usage
sections, prompt library and repeated large introductions were removed.

The animation scene module, artwork, camera easing/timing, gesture and chapter
logic are unchanged. Public facts continue to come only from the repository.
No official artifact exists; primary unavailable actions lead to #download and
the download section reports Download coming soon, without a fabricated package.

Refinement verification: npm run check passes TypeScript and 124 tests; static
HTML/config consistency and asset hashes pass. Browser verified 1440x900 and
390x844 layouts, product/CTA before scrolling (CTA bottoms 560px / 509px), three
main sections, one prompt and three FAQs. No horizontal overflow. Mobile menu
Escape restores focus, ArrowRight switches tabs, prepared violet comparison
works, FAQ/prompt disclosure and copy-success status work. Actual clipboard
contents could not be reliably read back through the browser bridge, so only the
visible success status is reported for this pass.

Normal native scroll reached chapter 1 at progress .580, then reverse scroll
returned to chapter 0/.000. Explicit reduced motion exposes chapter summaries.
System preference was not changed. Script-free view remains generated with no
scripts and expanded fallbacks. No account integration checks were run.
Screenshots: outputs/static-website/refined-desktop.png, refined-mobile.png,
refined-animation.png and refined-download-mobile.png (local ignored outputs).

Final refinement checks: production build passes. HTTP probe again verifies 16
static resources byte-for-byte, API 404 and POST 405. A separate application was
responding on port 5173 during this later probe; it was not stopped or modified.
The site itself was served only from website/ on port 5184. The script-free page
was opened in the browser: zero script tags, three main sections and all prepared
panels visible. Browser warning/error log was empty.
