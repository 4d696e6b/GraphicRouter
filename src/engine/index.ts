import type { DeckBlueprint, SlideEngine } from "../contracts";
import { CANVAS, SCHEMA_VERSION, createDeckSchema, deckVersionSchema } from "../contracts";
import { composeSlide } from "./layouts";
import { checked, parseInput } from "./validation";
import { compilePowerPoint } from "./pptx";
import { reviseBlueprint } from "./revisions";
import { renderSlideSvg } from "./svg";
import { validateBlueprint } from "./validation";

export { EngineError } from "./errors";
export { assets, DEMO_ASSET_ID } from "./assets";

export const engine: SlideEngine = {
  createBlueprint(input, identity) {
    const parsed = parseInput(createDeckSchema, input);
    const { deckId, version } = parseInput(deckVersionSchema, identity, "identity");
    const blueprint: DeckBlueprint = {
      schemaVersion: SCHEMA_VERSION, deckId, version, input: parsed, canvas: { ...CANVAS },
      theme: { background: "#FAF9F6", foreground: "#191724", muted: "#62606B", accent: parsed.accent },
      slides: parsed.slides.map((slide, index) => composeSlide(slide, index, parsed.artDirection)), changes: [], validationIssues: [],
    };
    return checked(blueprint);
  },
  reviseBlueprint,
  validateBlueprint,
  compilePowerPoint,
  renderSlideSvg,
};
