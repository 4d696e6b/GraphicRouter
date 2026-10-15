import type { CreateDeckInput } from "../contracts/deck";

/** A draft integration fixture, not evidence that the planned features exist. */
export const sampleDeck: CreateDeckInput = {
  title: "GraphicRouter — prototype pitch draft",
  brief: {
    idea: "A presentation plugin that plans the story, composes the slides, and supports focused revisions.",
    audience: "Hackathon judges",
    purpose: "Explain the intended product and demonstrate only capabilities verified by the team.",
    facts: ["The project is called GraphicRouter.", "Two builders have 24 hours until submission."],
    unknowns: ["Final pitch duration", "Canva import fidelity", "Capabilities still to be implemented and verified"],
  },
  durationSeconds: 180,
  artDirection: "Off-white canvas, dark text, violet accents, large Arial headlines and generous spacing.",
  accent: "#7C3AED",
  slides: [
    { id: "slide1", role: "hook", layout: "hero", headline: "A small change. A lot of rework.", takeaway: "Introduce the presentation-editing problem as a hypothesis to validate.", blocks: [], notes: { core: "Draft: describe the problem without inventing research.", expanded: "Draft: add a verified example from the team's own workflow." } },
    { id: "slide2", role: "answer", layout: "cards", headline: "Plan. Compose. Direct.", takeaway: "Explain the intended GraphicRouter workflow.", blocks: [{ heading: "Plan", body: "Organize the story." }, { heading: "Compose", body: "Build editable slide elements." }, { heading: "Direct", body: "Revise specific parts." }], notes: { core: "Draft: label these as planned until verified.", expanded: "Draft: explain the intended workflow and its current implementation status." } },
    { id: "slide3", role: "workflow", layout: "process", headline: "From an idea to editable slides.", takeaway: "Make the blueprint and assembly process visible.", blocks: [{ heading: "Brief", body: "Supply the idea and facts." }, { heading: "Blueprint", body: "Choose the story and layout." }, { heading: "Slides", body: "Compile separate elements." }], notes: { core: "Draft: show the stages after they are implemented.", expanded: "Draft: explain how the same blueprint will drive preview and export." } },
    { id: "slide4", role: "proof", layout: "comparison", headline: "The pitch will be the proof.", takeaway: "Replace this draft with actual implementation evidence before presenting.", blocks: [{ heading: "Before", body: "A stored blueprint." }, { heading: "After", body: "One focused revision." }], notes: { core: "Draft: do not claim a successful demo before verification.", expanded: "Draft: prepare the live-edit demonstration and a clearly identified recording fallback." } },
    { id: "slide5", role: "next", layout: "closing", headline: "Presentations you can direct.", takeaway: "Close with what works today and the next development step.", blocks: [], notes: { core: "Draft: list verified capabilities and honest limitations.", expanded: "Draft: invite feedback on the implemented prototype." } },
  ],
};
