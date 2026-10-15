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
  headline: ["Your ideas.", "Presentation-ready."],
  description: "GraphicRouter is a presentation plugin that turns your ideas and supplied facts into a clear five-slide story, with focused edits and a PowerPoint handoff.",
  examplePrompt: "Create a five-slide pitch using only my verified facts. Include three-minute core notes and five-minute expanded notes. Keep missing evidence explicit.",
  revisionPrompt: "Change only the headline on slide three to violet. Keep everything else unchanged.",
  installationSteps: [
    { title: "Official release pending", text: "There is no plugin package to install yet." },
    { title: "Installation details to follow", text: "Supported hosts and setup steps will accompany the release." },
  ],
  capabilities: [
    { title: "Plan your story", text: "Organize supplied facts into five clear slides.", link: "Explore the story", href: "#demo", illustration: "story" },
    { title: "Refine a detail", text: "Change one headline colour while preserving the rest.", link: "See a revision", href: "#revision", illustration: "revision" },
    { title: "Prepare your handoff", text: "Export PowerPoint and speaker notes; manual Canva upload is a fallback.", link: "See the handoff", href: "#export-example", illustration: "export" },
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
