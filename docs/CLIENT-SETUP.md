# GraphicRouter client setup

Open [GraphicRouter in ChatGPT](https://chatgpt.com/plugins/plugin_asdk_app_sites_801c42220f4c8191bc43e3442008fd98).
Sign in, then choose Install or Connect when offered. If already installed, choose
Try in chat. Start a new chat with GraphicRouter selected. ChatGPT controls the exact
labels, account eligibility and workspace policy. The website does not install
anything automatically and no ZIP download is needed.

Use [setup help](https://graphicrouter.blue-hare-8389.chatgpt.site/install) for a
starter prompt. Connect Canva separately in ChatGPT for Canva actions. Each
customer uses their own ChatGPT and Canva accounts; never share owner credentials.

## What the website does

The owner's supplied plugin Copy link is in `website/site.config.js`. Every main
CTA opens that exact ChatGPT page. Header/hero/get-started/closing links work
without JavaScript. Sample PowerPoint and notes downloads remain explicitly
labelled examples. The website does not access the visitor's private designs,
invoke the model, install plugins, or connect Canva in the background.

The standalone `website/` directory can still be uploaded as-is to the friend's
host. The existing application also serves it at `/product/index.html`; `/`
redirects there. `scripts/prepare-product-website.mjs` copies an explicit public
file allowlist at dev/build startup. Source config, README, application code and
credentials are not copied. Existing `/briefing`, `/mcp`, file and OAuth routes
remain available. Editing the standalone config requires regenerating both HTML
views with `node scripts/generate-static-website.mjs`.

## Access and verification

The owner selected **Everyone with the link** for the original hosted Site on
2026-10-15. Site visibility, ChatGPT plugin installation policy, marketplace
listing and account connection are distinct. Public Site access does not grant
access to another person's decks, files or Canva token. Backend tools still
require authenticated user identity and enforce per-user ownership. The website
must not claim that arbitrary third-party installation has been verified until
an eligible different account actually completes it.

No public marketplace submission, automatic installation, paid checkout or
plugin-package artifact was created. Existing live Canva fidelity/editability
and release advisory limitations in `docs/RELEASE-QUALITY.md` still apply.

The current ChatGPT settings page reports this app as **Development** (dev mode).
The owner's plugin page opens successfully with Try in chat. A signed-out check
returned “We couldn't load this plugin right now”; a separate eligible signed-in
customer installation is not yet verified. Do not equate the public Site access
setting with approval of a development app for every ChatGPT account.
