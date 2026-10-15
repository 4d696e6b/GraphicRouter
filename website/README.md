# GraphicRouter product website

Upload `website/` as-is to a static host; no backend, remote font, analytics or
runtime model service is required. `basic.html` is the equivalent script-free
view. The app also serves a generated public copy under `/product/`; `/` redirects
there. Edit these authoring files, not `public/product/`.

## Current art direction

The owner requested an original design rather than a reproduction of RepoSetup.
The current page is an editorial design studio: asymmetrical paper-and-ink hero,
violet type accents, an original HTML/CSS composition study, selectable layer
highlights, a four-step human design process, format studies, prepared product
examples, customer setup and FAQ. No tablet/hand artwork, camera scene, intro
interstitial or pointer-following glow is loaded. There is no scroll interception
or required animation. Local system/Georgia typography needs no font download.

The composition study is explicitly a workflow illustration, not an editor.
Its layer buttons highlight authored native HTML elements. The engine sample
panels are labelled prepared output; the violet control compares two previously
exported SVGs and does not mutate a customer design. Actual editing is in the
ChatGPT plugin, not the marketing page.

Historical reference assets/modules remain in this directory for provenance,
with their MIT notice, but the current page neither imports nor displays them.
The app's explicit deployment allowlist also excludes those unused PNGs/modules.

## Install inside ChatGPT

All four **Use in ChatGPT** buttons point directly to the owner's Copy link:
https://chatgpt.com/plugins/plugin_asdk_app_sites_801c42220f4c8191bc43e3442008fd98

ChatGPT controls sign-in, account eligibility and Install/Connect/Try in chat.
Opening the website does not install anything automatically. No ZIP installer
is needed. `downloadUrl` remains null. The sample `.pptx` and notes are prepared
examples, never plugin installers. `/install` provides help and a copyable starter
prompt; source docs are in `docs/CLIENT-SETUP.md`. Public Site access and plugin
availability are distinct; a different customer installation must be checked.

## Author and verify

`site.config.js` owns the exact connection URL, setup URL, product copy and FAQs.
Do not put credentials in it. After changing it or the HTML template:

```sh
node scripts/generate-static-website.mjs
node scripts/generate-static-website.mjs --check
npm run check
```

To preview only the standalone site:

```sh
python3 -m http.server 5184 --bind 127.0.0.1 --directory website
```

The optional `scripts/serve-static-website.mjs` serves it under `/graphicrouter/`
for relative-path checks. All linked local paths work beneath a hosting prefix.
In the app, `scripts/prepare-product-website.mjs` runs at dev/build startup and
copies only the explicit public allowlist. No config, README, application source
or secret file is copied. Keep this source and both generated HTML views together.

Tabs support arrow keys/Home/End, layer highlights are native pressed-state
buttons, menus and FAQs use native details, copy failures leave selectable text,
and essential content/CTAs/sample links work without JavaScript. Browser-history
restoration remounts listeners. Reduced-motion preference disables transitions.

## Prepared samples

The existing five-slide pitch, SVGs, PowerPoint and speaker notes come from the
real engine's `localWorkflowPitch`. They illustrate that earlier five-slide
workflow rather than limit current native documents to five pages. Regenerate
with `node scripts/generate-static-website.mjs --examples`, then `--check`.
The asset manifest verifies sample bytes and a focused violet revision preserves
unrelated blueprint elements. Samples are not live account/Canva verification.
See `docs/RELEASE-QUALITY.md` for remaining release/provider limits.
