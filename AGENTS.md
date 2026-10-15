# GraphicRouter — shared Codex guidance

These instructions apply throughout this repository. Read `docs/PRODUCT.md`,
`docs/CONTRACTS.md`, `docs/COORDINATION.md`, and your assigned task before editing.

- Initialization is complete; implement only the work stream assigned by the user.
- Builder A uses `feat/slide-engine`; Builder B uses `feat/chatgpt-canva`.
- Use separate clones or user-requested worktrees; never share a working directory.
- Keep changes inside the ownership boundaries in `docs/COORDINATION.md`.
- Import shared schemas/types from `src/contracts`; do not invent parallel types.
- Preserve the five tool names and the `SlideEngine` handoff. Document and
  coordinate a necessary contract change before implementing it on both branches.
- Geometry is 1600×900 logical pixels. PPTX conversion is 120 logical px/in.
- Slide IDs are `slide1` through `slide5`; the headline ID is `<slideId>.headline`.
- Preserve stable internal IDs across revisions; Canva IDs need not survive imports.
- Keep deck versions immutable. The service rejects stale writes; the engine must
  preserve unrelated elements. Never mutate a prior blueprint in place.
- Preview and PowerPoint must use the same stored element blueprint.
- ChatGPT provides structured story/content. Do not add another model API for v1.
- Use supplied facts; never invent evidence or label unverified features complete.
- Keep credentials out of Git, fixtures, tool results, browser bundles, and logs.
- Hosted identity comes from Sites; authorize all deck/file operations server-side.
- Preserve `.openai/hosting.json` project identity and the Sites build integration.
- Only Builder B owns dependency/config changes after this common base.
- Add focused tests for revisions, validation, authorization, and failure handling.
- Run `npm run check`; run `npm run build` for changes affecting integration/build.
- Update your task checklist with evidence and disclose mock or manual fallbacks.
- Open a PR into `main`; do not force-push or rewrite the other builder's branch.
- Publishing is a final integration task, not part of routine feature edits.
