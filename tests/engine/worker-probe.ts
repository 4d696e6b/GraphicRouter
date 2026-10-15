import { engine, assets } from "../../src/engine";
import { finalPitch } from "../../src/fixtures/final-pitch";

/** Local Worker compatibility probe only; not an application or MCP endpoint. */
export default {
  async fetch() {
    const blueprint = engine.createBlueprint(finalPitch, { deckId: "6bac9301-3cf3-4b3f-8a72-549765f465f9", version: 1 });
    const bytes = await engine.compilePowerPoint(blueprint, assets);
    return Response.json({ slides: blueprint.slides.length, bytes: bytes.length, zipSignature: Array.from(bytes.subarray(0, 4)), errors: blueprint.validationIssues.filter((issue) => issue.severity === "error") });
  },
};
