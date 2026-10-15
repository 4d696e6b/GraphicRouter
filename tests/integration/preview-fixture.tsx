// Browser QA fixture only. Never imported by application/server production code.
import React from "react";
import { createRoot } from "react-dom/client";
import { Presentation } from "../../src/preview/Presentation";
import { testEngine } from "./engine-double";
import { sampleDeck } from "../../src/fixtures/sample-deck";

const input = structuredClone(sampleDeck);
input.title = "TEST UI FIXTURE — no real slide export";
input.slides.forEach((slide, i) => { slide.notes = { core: `TEST core notes for slide ${i + 1}`, expanded: `TEST expanded notes for slide ${i + 1}` }; });
const blueprint = testEngine.createBlueprint(input, { deckId: "12345678-1234-4123-8123-123456789abc", version: 2 });
const previews = (stage: string) => input.slides.map((_, i) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#ede9f5"/><text x="100" y="350" font-family="Arial" font-size="64">TEST DOUBLE · slide ${i + 1} · ${stage}</text><text x="100" y="460" font-family="Arial" font-size="38">UI verification only. No real composition or export.</text></svg>`);
createRoot(document.getElementById("root")!).render(<>
  <aside role="note" style={{ font: "bold 16px Arial", padding: 16, background: "#fff0ba" }}>LOCAL TEST FIXTURE — simulated slides and actions. No ChatGPT/Canva connection.</aside>
  <Presentation data={{ result: { blueprint, canva: { status: "not_started" }, previewUrl: "#test-fixture" }, previews: { layout: previews("layout"), content: previews("content"), finished: previews("finished") } }} invoke={async () => { throw new Error("TEST: operation unavailable. Your saved presentation is preserved."); }} />
</>);
