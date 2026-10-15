# GraphicRouter static download website

**Upload this entire `website/` directory as-is.** Its checked-in `index.html`, CSS,
JavaScript modules, artwork, SVG examples and sample files are ready to serve.
There is no mandatory build step and no Node/Next/backend/database/authentication
requirement for hosting. The existing GraphicRouter application is separate.

`basic.html` is an equivalent script-free view, generated from the same source with
no script tags and the no-JavaScript fallbacks expanded. It is linked in the footer
and keeps release/download information in sync with `index.html`.

## Preview without the application

From the repository root, use a plain static server:

```sh
python3 -m http.server 5184 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:5184/`. For a local check under a hosting subdirectory, the
optional `node scripts/serve-static-website.mjs` serves only this directory at
`http://127.0.0.1:5184/graphicrouter/`. Neither command starts the application.
Do not run both on the same port. On Windows, use `python` if `python3` is absent.

## Official plugin availability

No official downloadable plugin artifact or verified public connection URL was
found. GitHub's official releases API returned an empty release list, and the root
package is a private application package. Its development package version is **not**
presented as a published plugin version. The current page therefore says
**Download coming soon**. It does not provide a working plugin download.

The `.pptx` and `.txt` links in the Export example are explicitly labelled sample
presentation/notes. They are prepared product illustrations, never installers.

## Update release metadata and copy

`site.config.js` is the single source for public release metadata, installation
steps, main copy, capabilities and FAQs. Unknown download, version, size, supported
host, connection and documentation values remain null. No credentials belong here.

When a real official distribution is available:

1. Independently verify the official artifact URL, actual package/file, version,
   compatibility and host's real installation instructions. Do not create a plugin
   package/release or expose a private endpoint to fill these fields.
2. Set `downloadUrl`, relevant optional metadata, one to three real `installationSteps`,
   and truthful availability/release copy. For a bundled official artifact, place
   it in `assets/` and use an `assets/...` URL with a real filename. For a hosted
   official release, use the direct HTTPS artifact URL. The generator adds a
   `download` attribute only for bundled relative files.
3. From the repository root run:

   ```sh
   node scripts/generate-static-website.mjs
   node scripts/generate-static-website.mjs --check
   ```

4. Verify all four plugin CTAs in the delivered HTML and test the actual download.
   They must resolve to the same official artifact, including without JavaScript.
   Upload the updated directory. No on-visitor initialization renders the release
   link: it is authored directly into HTML.

For a genuine connection-only release, set a verified public `connectionUrl` and
describe that separately as **Connect GraphicRouter**. A hosted connection is not
a downloadable package. Never use a source archive, sample PPTX, empty file or
fabricated installer as the plugin CTA.

The generator requires the repository's existing development dependencies only
when authoring. Config/HTML drift or changed example assets cause `--check` to fail.

## Prepared examples

The SVGs, sample PowerPoint and speaker notes were generated once from the existing
`localWorkflowPitch` and real engine. Public runtime code imports neither the
engine nor application services. Clicking/scrolling cannot create decks, save
revisions, export on demand, connect accounts, start imports or poll jobs.

To regenerate examples during development (not on the host):

```sh
node scripts/generate-static-website.mjs --examples
node scripts/generate-static-website.mjs --check
```

This updates `assets/example-data.json`, static samples, their SHA-256 manifest and
`index.html`. The revised example checks unrelated slide elements are preserved.
All slide artwork retains 16:9 and Arial. Canva conversion, shapes/lines/fonts and
application OAuth must be independently verified; sample export is not that proof.

## Paths, accessibility, and provenance

All local URLs are relative. Serve the directory under `/` or a subdirectory with
a trailing slash, retaining its structure. There are no remote fonts, analytics,
API calls or runtime dependencies. No-JavaScript visitors retain content, native
mobile navigation/FAQ, availability and any configured download links. Static
chapter explanations and prepared panels remain available without animations.

Tabs support arrows, Home and End. Copy failures provide selectable text. System
reduced-motion and the footer control disable the camera/loops, collapse the long
track and expose all chapters. Native scrolling is never intercepted.

Artwork/framing and selected styles/camera math adapt the MIT-licensed RepoSetup
reference at `763b333ff8f7ab05ba5f0f70a61a91bcb2abd857`. Tablet PNGs are unchanged.
The full notice is in `notices/RepoSetup-LICENSE.txt`; no reference logos or product
claims are reused. GraphicRouter's application, contracts and private Site identity
remain untouched. Deployment and release publication are outside this work.

## Repository content sources

The product copy uses only material contained in this project:

- `docs/PRODUCT.md`: product goal, five roles/recipes, preview stages, 16:9/Arial
  theme, 180/300-second notes, supported revisions and v1 exclusions.
- `docs/CONTRACTS.md`: slide content limits, shared preview/export blueprint,
  immutable versions, fit-safe layout changes and one-way Canva handoff.
- `src/briefing/questions.ts`: topic, audience and outcome as briefing inputs.
- `src/fixtures/local-workflow-pitch.ts` and the generated sample assets: actual
  project story, controlled violet revision and local/account verification split.
- `docs/tasks/builder-b-static-website-verification.md`: distribution availability
  and checked local behavior. Historical initialization wording in the root README
  is not treated as current implementation evidence.

The three-section page explains the product first, shows prepared examples in one animated product section, and groups download availability, an optional prompt and three FAQs together.
No external marketing facts, testimonials, pricing, usage numbers or unsupported
integration promises were added.

## Visual theme

The current skin in `brand.css` derives from the existing `assets/mark.svg`:
logo violet #7C3AED, darker violet hover #6023C8, plum text #241B32, lavender-white
#FAF8FF, soft lavender #F1EBFC, and deep plum preview panels #21152F. The base
stylesheet's inherited olive values were shifted to the same violet family.

`styles.css` retains the established scene geometry, animation timing and card
motion. `brand.css` controls typography, surfaces, spacing, component states and
responsive polish. Header/footer use the original SVG logo. Typography is a local
system stack; no font CDN, external assets or runtime dependency was introduced.
Forced-colour mode restores solid heading text, and both system reduced-motion
and the existing page control disable decorative feedback.

The tablet's Choose → Generate → Customize illustration is a workflow concept
requested in the latest design brief, not functionality supplied by the current
presentation engine. It is explicitly labelled CONCEPT PREVIEW. All thumbnails,
example prompt and generic editing UI are authored HTML/CSS/SVG in
scripts/static-workflow-device.mjs and styled in brand.css; no design is analyzed,
AI prompt generated, result transferred or Canva session opened on this website.
Existing prepared presentation examples below the tablet are unchanged.
