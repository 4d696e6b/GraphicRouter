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
  description: "GraphicRouter helps turn your ideas and supplied facts into a clear five-slide presentation, with focused revisions and a PowerPoint handoff.",
  examplePrompt: "Create a five-slide pitch using only my verified facts.",
  revisionPrompt: "Change only the headline on slide three to violet. Keep everything else unchanged.",
  installationSteps: [
    { title: "Official package pending", text: "A downloadable plugin package has not been released. There is nothing to install from this page yet." },
    { title: "Installation guidance to follow", text: "Verified host compatibility and installation steps will accompany the official distribution." },
    { title: "Explore a prepared example", text: "Explore the prepared story and revision examples on this page. They illustrate the plugin without connecting an account." },
  ],
  capabilities: [
    { title: "Shape the story", text: "Organize your supplied facts into a problem, answer, workflow, proof, and next step.", link: "Explore the story", href: "#demo", illustration: "story" },
    { title: "Change one detail", text: "Direct focused changes to text, colours, notes, or supported layouts. Preserve the previous version.", link: "See a revision", href: "#revision", illustration: "revision" },
    { title: "Prepare the handoff", text: "Take your presentation into PowerPoint with speaker notes. Manual Canva upload remains a fallback.", link: "See the handoff", href: "#export-example", illustration: "export" },
  ],
  showcase: [
    { label: "Story", title: "A clear story before you present.", text: "Give each slide one job. This prepared five-slide pitch uses the existing GraphicRouter sample and its supplied facts.", chips: ["Five slide roles", "One coherent story", "Speaker notes"] },
    { label: "Revision", title: "One detail. A focused change.", text: "“Change only the headline on slide three to violet.” Switch between prepared outputs; the original and other elements stay intact.", chips: ["Focused changes", "Original preserved", "Prepared comparison"] },
    { label: "Export", title: "Ready for your next stage.", text: "The plugin can export native PowerPoint and speaker notes. This example is already generated; no export runs on this website.", chips: ["PowerPoint", "Speaker notes", "Manual Canva upload"] },
  ],
  faq: [
    { title: "What does GraphicRouter do?", text: "It helps shape supplied facts into exactly five 16:9 slides, with speaker notes and focused revisions. The examples on this website are prepared assets, not a live plugin session." },
    { title: "Where can I install or use it?", text: "GraphicRouter is being developed for ChatGPT. No official downloadable package or verified public connection link is available yet. Hosted tools/widget and account access still need verification; installation instructions will follow the actual release." },
    { title: "Do I need Canva?", text: "PowerPoint and speaker notes provide a handoff without Canva. You can upload the PowerPoint manually. Application Canva OAuth/import remains unverified; a separate manual fixture import confirmed text and image editing only." },
    { title: "What are the current limitations?", text: "Version one focuses on five slides and supported revisions. Arbitrary deck import, freeform editing and infographic generation are not supported. Canva edits do not sync back. Shape, line and font conversion must be checked after import; perfect conversion is not promised." },
  ],
};
