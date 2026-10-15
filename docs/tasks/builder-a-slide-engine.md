# Builder A — slide engine and presentation quality

Branch: `feat/slide-engine`. Start from the common initialization commit.
Tracking: https://github.com/4d696e6b/GraphicRouter/issues/1

Status: **ready to start; no engine features implemented**.

## Paste this into your Codex chat

```text
You are Builder A for GraphicRouter. Implement the slide engine on
feat/slide-engine. Read AGENTS.md, docs/PRODUCT.md, docs/CONTRACTS.md,
docs/COORDINATION.md, and this task before editing. Check your branch first.

Own src/engine/**, src/fixtures/**, and tests/engine/**. Export engine: SlideEngine
from src/engine/index.ts using the existing shared port. Implement deterministic
five-slide composition, immutable targeted revisions, geometry/text-fit validation,
native PPTX export, and SVG construction-stage previews from the same blueprint.
Use the existing dependencies and keep platform/storage/Canva code out of the engine.

First prove a native text/shape/image PPTX fixture and hand it to Builder B for a
real Canva import check. Then finish all five recipes and the exact headline-colour
revision acceptance test. Do not wait for the service to start pure engine work.
Create the actual pitch fixture only from verified project capabilities; the existing
sample input is draft material, not evidence of implementation.

Add focused tests, run npm run check, update this task with evidence, commit in
small increments, push your branch, and open a PR into main when the engine handoff
is usable. Do not implement Builder B's work or publish the Site. Report requests
for shared-contract/dependency changes explicitly before making incompatible edits.
```

## Work order

### A1 — import-fidelity spike (first two hours)

- [ ] Generate a small native PPTX fixture with two slides, text, a rectangle,
  circle, line, and bundled PNG/JPEG. This raw compiler spike can be independent
  of the fixed-five-slide model-input schema.
- [ ] Give B the file and the exact objects to test in Canva.
- [ ] Verify 16:9 sizing and initial Arial wrapping; record actual import results.

### A2 — usable engine handoff (target hour 8)

- [ ] Implement `engine: SlideEngine` with all five port methods.
- [ ] Add hero/cards/comparison/process/closing recipes and layout fit rules.
- [ ] Generate stable semantic element IDs, including `slide3.headline`.
- [ ] Use one blueprint for SVG stages and PPTX; resolve theme and hex paints alike.
- [ ] Bundle at least one PNG/JPEG in an engine-owned asset module and expose it
  through `src/engine/assets.ts` as `assets: Asset[]` for B to pass to the port.
- [ ] Export native text, shape, line, and image objects; never flatten whole slides.
- [ ] Reject overflow, invalid bounds, unsupported assets/layouts, and invalid targets
  with clear errors. Preserve the previous blueprint on every failure.
- [ ] Send B the engine PR and a working five-slide fixture.

### A3 — precise revisions and real pitch (hours 8–16)

- [ ] Implement all five typed operations with version + 1 and a readable diff.
- [ ] Test that a headline-colour revision changes only the requested paint plus
  version/change metadata; input and every unrelated element remain unchanged.
- [ ] Preserve colour overrides when a later layout switch rebuilds that slide,
  or explicitly reject combinations the implementation cannot preserve.
- [ ] Generate a real GraphicRouter pitch fixture with core and expanded notes;
  remove draft claims only when they have actual implementation evidence.
- [ ] Visually inspect all slides and help B verify actual imported editability.

### A4 — freeze and submission support

- [ ] Freeze deck/live-edit path at hour 16 with B.
- [ ] Save a local PPTX; make a PDF backup using a verified available exporter.
- [ ] Rehearse the core script and the live colour edit; help record an honest backup.

## Tests and handoff

Test repeatable geometry; exact revision preservation; all supported operations;
failed revisions leaving input unchanged; invalid target/overflow errors; SVG
escaping; and PPTX object/content presence. A generated ZIP/PPTX is not sufficient
evidence of Canva fidelity: that final check is manual in the actual account.

Handoff includes the exported engine/assets, one valid five-slide input, test
results, known limitations, and an import-tested PPTX. Check `npm run check` before
every PR; B handles platform/build integration.

## Evidence and blockers

Initialization only. Add tested results and requested dependency/contract changes here.
