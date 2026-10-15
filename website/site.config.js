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
  availabilityNote: "The official plugin download is not available yet. Release and installation details will follow.",
  releaseStrip: "Product preview · Official download coming soon. Explore prepared examples below.",
  headline: ["Your ideas.", "Ready for Canva."],
  description: "GraphicRouter is a presentation plugin that turns your brief into a clear story for Canva.",
  heroSummary: ["Clear stories", "Focused edits", "Made for Canva"],
  heroAvailability: "Plugin download coming soon.",
  examplePrompt: "Create a five-slide pitch using only my verified facts. Include three-minute core notes and five-minute expanded notes. Keep missing evidence explicit.",
  revisionPrompt: "Change only the headline on slide three to violet. Keep everything else unchanged.",
  designWorkflow: [
    { title: "Choose a Design", text: "Pick a design or website style you like." },
    { title: "Generate AI Prompt", text: "Turn the selected style into a structured AI prompt." },
    { title: "Customize in Canva", text: "Open the result in Canva and make it your own." },
  ],
  installationSteps: [
    { title: "Official release pending", text: "There is no plugin package to install yet." },
    { title: "Installation details to follow", text: "Supported hosts and setup steps will accompany the release." },
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
    { title: "Where can I use GraphicRouter?", text: "GraphicRouter is being developed for ChatGPT. No official download or verified public connection link is available yet; hosted tools and account access still need verification." },
    { title: "Do I need Canva?", text: "No. PowerPoint and speaker notes provide the handoff. Manual Canva upload is a fallback. A separate manual import confirmed text and image editing; application OAuth/import and shape, line and font checks remain pending. Canva edits do not sync back." },
    { title: "What can the current version create?", text: "The locally verified workflow creates five 16:9 slides with speaker notes and supports focused text, colour, notes and allowed layout changes. Arbitrary deck import, freeform placement, image generation and animation are outside v1 scope." },
  ],
};
