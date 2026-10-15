// Public content only. Never put tokens, credentials, or private endpoints here.
// After editing: node scripts/generate-static-website.mjs, then --check.
export default {
  productName: "GraphicRouter",
  releaseVersion: null,
  downloadUrl: null,
  downloadFileName: null,
  fileSizeLabel: null,
  supportedHostLabel: null,
  connectionUrl: null,
  documentationUrl: null,
  repositoryUrl: "https://github.com/4d696e6b/GraphicRouter",
  availabilityNote: "The official plugin package and public installation instructions are not available yet.",
  releaseStrip: "Product preview · Official download coming soon. Explore prepared examples below.",
  headline: ["Your story.", "Ready to present."],
  description: "Plan the story. Compose the slides. Direct the changes. GraphicRouter turns rough ideas and supplied facts into a five-slide presentation, a visual blueprint, and a PowerPoint handoff.",
  examplePrompt: "Create a five-slide pitch using only my verified facts: problem, product answer, workflow, proof, and next step. Include three-minute core notes and five-minute expanded notes. Keep missing evidence explicit.",
  revisionPrompt: "Change only the headline on slide three to violet. Keep everything else unchanged.",
  installationSteps: [
    { title: "Official package pending", text: "A downloadable plugin package has not been released. There is nothing to install from this page yet." },
    { title: "Installation guidance to follow", text: "Verified host compatibility and installation steps will accompany the official distribution." },
    { title: "Explore a prepared example", text: "Explore the prepared story and revision examples on this page. They illustrate the plugin without connecting an account." },
  ],
  usageSteps: [
    { title: "Supply your facts", text: "Describe your topic, audience and intended outcome. Provide the evidence you have; missing evidence stays a question or placeholder." },
    { title: "Plan five slide roles", text: "Build a hook/problem, product answer, workflow, proof and next step. Each slide has a headline, one takeaway and up to three content blocks." },
    { title: "Inspect the construction", text: "Review layout boxes, content placement and the finished composition. Preview and PowerPoint export use the same visual blueprint." },
    { title: "Direct a precise change", text: "Revise text, speaker notes, an element colour, the deck accent or an allowed layout. Previous versions remain unchanged; layout changes must fit the existing content." },
    { title: "Prepare your presentation", text: "Export PowerPoint with three-minute core and five-minute expanded speaker notes. Keep the PowerPoint for manual Canva upload if needed; review imported objects and fonts." },
  ],
  basics: [
    { title: "Five slides, one story", text: "Exactly five 16:9 slides, using hero, cards, comparison, process and closing recipes." },
    { title: "A consistent visual system", text: "Arial, an off-white/dark/violet theme and a configurable accent. Slides use native text, simple shapes, lines and bundled images." },
    { title: "Facts stay in your hands", text: "ChatGPT supplies structured story content. A deterministic renderer composes the elements; no additional model service writes the presentation." },
  ],
  capabilities: [
    { title: "Shape the story", text: "Organize your supplied facts into a problem, answer, workflow, proof, and next step.", link: "Explore the story", href: "#demo", illustration: "story" },
    { title: "Change one detail", text: "Direct focused changes to text, colours, notes, or supported layouts. Preserve the previous version.", link: "See a revision", href: "#revision", illustration: "revision" },
    { title: "Prepare the handoff", text: "Take your presentation into PowerPoint with speaker notes. Manual Canva upload remains a fallback.", link: "See the handoff", href: "#export-example", illustration: "export" },
  ],
  showcase: [
    { label: "Story", title: "A clear story before you present.", text: "Give each slide one job: problem, answer, workflow, proof and next step. This prepared GraphicRouter pitch uses the project's supplied facts.", chips: ["Five slide roles", "Three preview stages", "180 / 300-second notes"] },
    { label: "Revision", title: "One detail. A focused change.", text: "“Change only the headline on slide three to violet.” Switch between prepared outputs; the original and other elements stay intact.", chips: ["Focused changes", "Original preserved", "Prepared comparison"] },
    { label: "Export", title: "Ready for your next stage.", text: "The plugin can export native PowerPoint and speaker notes. This example is already generated; no export runs on this website.", chips: ["PowerPoint", "Speaker notes", "Manual Canva upload"] },
  ],
  faq: [
    { title: "What does GraphicRouter do?", text: "It helps shape supplied facts into exactly five 16:9 slides, with speaker notes and focused revisions. The examples on this website are prepared assets, not a live plugin session." },
    { title: "Where can I install or use it?", text: "GraphicRouter is being developed for ChatGPT. No official downloadable package or verified public connection link is available yet. Hosted tools/widget and account access still need verification; installation instructions will follow the actual release." },
    { title: "Do I need Canva?", text: "PowerPoint and speaker notes provide a handoff without Canva. You can upload the PowerPoint manually. Application Canva OAuth/import remains unverified; a separate manual fixture import confirmed text and image editing only." },
    { title: "What are the current limitations?", text: "Version one focuses on five slides and supported revisions. Arbitrary deck import/editing, freeform placement, image generation, animation, two-way Canva sync and marketplace publication are outside scope. Each Canva import creates a new design version. Shape, line and font conversion still need editor checks." },
  ],
};
