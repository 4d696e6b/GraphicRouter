import type { Asset, SlideEngine } from "../contracts";
import { fail } from "./errors";

/** Integration seam: replace this provider with imports of engine/assets from Builder A.
 * Never install the test double in a production route. */
const unavailable = (): never => fail("NOT_IMPLEMENTED", "Builder A's slide engine is not integrated yet. No deck or PowerPoint has been generated.");
export const engine: SlideEngine = {
  createBlueprint: unavailable, reviseBlueprint: unavailable, validateBlueprint: unavailable,
  compilePowerPoint: async () => unavailable(), renderSlideSvg: unavailable,
};
export const assets: Asset[] = [];
