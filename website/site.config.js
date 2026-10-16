// Public content only. Never put tokens, credentials, or private endpoints here.
// After editing: node scripts/generate-static-website.mjs, then --check.
export default {
  productName: "GraphicRouter",
  releaseVersion: null,
  downloadUrl: null,
  downloadFileName: null,
  fileSizeLabel: null,
  supportedHostLabel: "ChatGPT · hosted plugin",
  connectionUrl: null, // Enable only after public installation is verified.
  setupUrl: null,
  documentationUrl: "https://github.com/4d696e6b/GraphicRouter/blob/main/docs/CLIENT-SETUP.md",
  repositoryUrl: "https://github.com/4d696e6b/GraphicRouter",
  availabilityNote: "Coming soon to ChatGPT. GraphicRouter is a working prototype; public installation is not available yet. Explore the examples and download the sample presentation while we prepare the public release.",
  releaseStrip: "ChatGPT plugin · Public release in preparation. Prepared examples are demonstrations.",
  headline: ["Good ideas deserve", "good design."],
  description: "Create editable infographics and presentations with a designer’s workflow, right inside ChatGPT.",
  heroSummary: ["Clear stories", "Focused edits", "Made for Canva"],
  examplePrompt: "Use GraphicRouter to create an editable infographic or presentation about [topic] for [audience]. My goal is [goal]. Use these facts: [facts]. Reuse the details I supplied, ask only what is missing, plan the composition, and keep every heading and label separate from the background. Inspect the result before the Canva handoff.",
  revisionPrompt: "Change only the headline on slide three to violet. Keep everything else unchanged.",
  designWorkflow: [
    { title: "Choose a Design", text: "Pick a design or website style you like." },
    { title: "Generate AI Prompt", text: "Turn the selected style into a structured AI prompt." },
    { title: "Customize in Canva", text: "Open the result in Canva and make it your own." },
  ],
  installationSteps: [
    { title: "Explore the prototype", text: "See how GraphicRouter plans a story, composes editable elements and makes a focused revision in the examples above." },
    { title: "Try a sample", text: "Download the prepared PowerPoint and speaker notes. These example files are available now; they are not a plugin installer." },
    { title: "Public installation is next", text: "Once the public release is available, this page will link to the ChatGPT listing. No release date is confirmed yet." },
  ],
  capabilities: [
    { title: "Give your story direction.", text: "Turn your facts into a story worth presenting.", link: "Explore the story", href: "#demo", illustration: "story" },
    { title: "Change one thing.", text: "Refine a detail. Keep the rest intact.", link: "See a revision", href: "#revision", illustration: "revision" },
    { title: "Make it yours in Canva.", text: "Continue shaping your presentation in Canva.", link: "See the handoff", href: "#export-example", illustration: "export" },
  ],
  showcase: [
    { label: "Story", title: "Five roles. One story.", text: "Problem, answer, workflow, proof and next step — shown in our own prepared pitch.", chips: ["Five slide roles", "Three preview stages", "180 / 300-second notes"] },
    { label: "Revision", title: "Try the violet headline.", text: "Compare the prepared before and after. The original version and unrelated content are preserved.", chips: ["Focused changes", "Original preserved", "Prepared comparison"] },
    { label: "Export", title: "Take a sample with you.", text: "Download the prepared PowerPoint and notes. These are sample files, separate from the plugin.", chips: ["PowerPoint", "Speaker notes", "Manual Canva upload"] },
  ],
  faq: [
    { title: "Where can I use GraphicRouter?", text: "GraphicRouter currently works as a development plugin in authorized ChatGPT accounts. Public installation is coming soon. You can explore the examples and download sample files here today." },
    { title: "Do I need Canva?", text: "Connect Canva in ChatGPT to read or edit an accessible Canva design. Native GraphicRouter designs can also export to PowerPoint with separate text and shapes. Review the actual imported result; Canva edits do not sync back." },
    { title: "What can the current version create?", text: "Editable infographics, presentations of up to 40 pages, tall graphics and carousels. It can plan precise edits to an existing Canva link through the connected Canva tools. The five-slide samples above illustrate one workflow, not a page-count restriction. Images, Canva layers and final appearance still need review." },
  ],
};
