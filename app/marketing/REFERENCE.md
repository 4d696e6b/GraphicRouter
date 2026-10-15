# Reference attribution

The marketing page adapts layout values, tablet framing/camera math, and selected
CSS from [RepoSetup](https://github.com/4d696e6b/RepoSetup), commit
763b333ff8f7ab05ba5f0f70a61a91bcb2abd857 (MIT, copyright 2026 RepoSetup contributors).
The full notice is retained in public/marketing/references/RepoSetup-LICENSE.txt.

public/marketing/tablet-hand.png and tablet-gesture.png are copied unchanged from
apps/website/public/brand in that snapshot. Its artwork README records original
AI-generated, unbranded tablet illustrations; the root MIT licence applies. No
RepoSetup logos, developer stack artwork, product copy, or release data are reused.

The camera math is adapted in app/marketing/scene.ts and the scene CSS in
landing.module.css. React components and GraphicRouter content replace the
reference's vanilla DOM implementation. No fonts, analytics, or remote assets
are requested. The slide screenshots are server-rendered from the existing
GraphicRouter engine and localWorkflowPitch fixture, not copied reference screens.
