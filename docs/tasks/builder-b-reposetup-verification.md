# RepoSetup-reference homepage verification

Implemented on feat/chatgpt-canva. Reference snapshot:
763b333ff8f7ab05ba5f0f70a61a91bcb2abd857. Inspected the live
https://reposetupcli.com/ and all source files listed in the requested plan,
including the final experience/navigation cascade, scene math and motion cleanup.
Reference clone is separate at ../TestWeb/RepoSetup-reference; remotes are unchanged.

## Section mapping

| Reference | GraphicRouter adaptation |
| --- | --- |
| Compact header and version strip | Existing wordmark, Explore/mobile menu, local search, brief CTA and honest demo availability |
| Centred hero and command | Two-phrase story heading, brief/demo actions and copyable facts-only prompt |
| Sticky tablet with hand/gesture, rails and camera | Brief, real engine preview stages, prepared violet revision; same framing math and easing |
| Ecosystem strip | Brief / Story / Preview / Revise / Export, without partnership implications |
| Three editorial feature cards | Story sequence, native slide-stage thumbnails and focused revision |
| Dark workflow showcase | Accessible Plan / Preview / Refine tabs and actual prepared output |
| Docs promo | Four guide rows, required/optional brief fields, accurate copy-back explanation |
| Product basics | Prompt library, FAQ and explicit local versus hosted verification |
| Dark closing and footer | Copyable prompt, brief/demo links, existing sign-in/out and reference attribution |

Warm paper/graphite/olive values, container/gutters, title scale, section spacing,
card proportions and scroll track follow the source. Violet replaces the branding
accent. GraphicRouter's longer mobile title uses a narrow-screen size adjustment
so both phrases fit without clipping. Feature illustrations intentionally use
GraphicRouter HTML and actual slide output instead of the reference's stack art.
This is a close source-informed reproduction, not an assertion of pixel identity.

## Current checks

- npm run check: TypeScript + 112 passing tests (16 files). Twelve new cases cover
  local search, tab keys, clipboard denial recovery, six viewport camera fits,
  continuous/reversible camera transitions and accessible no-JavaScript content.
- npm run build: passes on final source. A rebuild while the production Worker
  held dist open first returned Windows EPERM; stopping that owned server and
  rerunning the same build succeeded. No source workaround or dependency change.
- Built Worker served locally with npm run start -- --port 5173. Homepage and
  /briefing return 200; browser navigation opens question 1 of 20. No publication.
- Client build scan found no pptxgenjs, compilePowerPoint, CANVA_CLIENT_SECRET or
  CanvaTokenStore references. Rendering stays on the server. The tablet receives
  only its five image views and brief fields; the showcase gets its usable views.
- Reference tablet PNGs copied unchanged; SHA-256 equality checked against source.
  MIT licence and attribution are preserved in public/marketing/references and
  app/marketing/REFERENCE.md. No reference product logos/copy/stack art reused.

## Browser evidence

Compared reference and implementation at matching measured viewport dimensions:
1440x900, 1280x720, 768x1024, 390x844 and 360x800. document scrollWidth equals
clientWidth at every size. Desktop header is 88px and mobile header 76px. Desktop
H1 font size matches the reference; measured top position differs by about 2px.

Saved paired screenshots in ignored outputs/reposetup-comparison/:

- reference-{width}x{height}.png and graphicrouter-{width}x{height}.png
- reference-brief/preview/refine/workflow/showcase/guide/closing.png
- graphicrouter-brief/preview/refine/workflow/showcase-plan/showcase-refine/guide/closing.png
- graphicrouter-mobile-tablet.png
- graphicrouter-200-percent-equivalent.png

Verified chapter transitions in both directions; camera fits in mobile and short
1280x720 viewports. Compared corresponding tablet chapters, workflow cards, dark
showcase, guide and closing. Corrected the guide's initial excess top gap to match
the source's zero gap after the showcase.

Interactions checked: desktop Explore/Escape; mobile menu/Escape; Ctrl+K search;
search results for fonts/violet; search close restores the desktop trigger or
mobile Menu; search result opens the requested prompt; guide links open prompt
panels; prompt copy reports success; FAQ expands; tabs support arrows/Home/End and
roving focus; stages/slides select; prepared v2 and reset work. Actual browser
warning/error log for the final local Worker is empty.

Reduced motion: the footer control exercises the same static branch as the system
preference, collapses the scroll runway, stops camera/swipe/loops and exposes all
three chapter explanations/images. SSR tests check the no-JavaScript summary.
System media-query wiring exists in both CSS and lifecycle hooks; the browser API
cannot toggle the OS preference itself.

Native 200% browser zoom is not controllable through this browser API (Ctrl+Equal
left innerWidth/devicePixelRatio unchanged). Checked the equivalent 640x360 CSS
viewport for a 1280x720 window: readable reflow and no horizontal overflow. This is
explicitly equivalent-viewport evidence, not a native-zoom claim.

## Boundaries

No changes to engine, fixtures, shared contracts, auth, service/storage/export
routes, dependencies, or .openai/hosting.json. No tool calls, saved versions or
Canva imports occur through marketing interactions. Hosted ChatGPT/widget,
application Canva OAuth/import and final editor/rehearsal checks remain pending;
this website does not establish them. No merge or publication is performed.
