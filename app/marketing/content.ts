export const prompts = {
  hero: "Create five slides using only my verified facts.",
  create: "Create a five-slide, three-minute pitch for [audience] about [idea]. Our goal is [goal]. Use only these verified facts: [facts]. Mark missing evidence as an open question. Include core and expanded speaker notes.",
  revise: "Change only the headline on slide three to violet (#7C3AED). Keep all other elements and notes unchanged, and preserve the previous version.",
  export: "Export the current saved version as PowerPoint with speaker notes. If Canva is connected, start a separate import and show its status. Keep the downloads available while the import processes.",
};
export const faqs = [
  ["What can I create?", "Create editable infographics, tall graphics, carousels and presentations of up to 40 pages. The prepared five-slide demo is one example. Use the connected Canva tools for supported edits to an existing Canva link."],
  ["Do I need Canva to use the presentation?", "PowerPoint and speaker notes remain available. Manual PowerPoint upload to Canva is the fallback if automatic import is unavailable. Review the converted design before presenting."],
  ["Will Canva changes update my original deck?", "No. Each Canva import creates a separate design version. Edits made in Canva do not sync back to the stored GraphicRouter blueprint."],
  ["Will my objects and fonts look the same in Canva?", "Native PowerPoint objects do not guarantee identical Canva layout, fonts, or shape conversion. A separate manual fixture import confirmed text and image editing. Application OAuth/import, shape and line editing, and font fidelity still need verification."],
  ["Can I install or buy it today?", "Open the Get the plugin link to install or connect GraphicRouter inside ChatGPT. There is no ZIP installer or checkout. ChatGPT account and workspace access rules apply."],
];
export const searchEntries = [
  { title: "How it works", description: "Shape the story, see the plan, direct the details.", href: "#workflow" },
  { title: "Guided demo", description: "Prepared Plan, Preview and Refine examples. Slides and preview stages.", href: "#demo" },
  { title: "Quick start", description: "Adaptive quick, balanced or detailed design brief, with known answers reused.", href: "#quick-start" },
  { title: "Start your brief", description: "Answer questions about format, topic, audience and outcome.", href: "/briefing" },
  { title: "Availability", description: "Local verification and pending hosted ChatGPT and Canva checks.", href: "#availability" },
  { title: "Create a story prompt", description: prompts.create, href: "#prompt-create" },
  { title: "Violet headline revision prompt", description: prompts.revise, href: "#prompt-revise" },
  { title: "PowerPoint export and Canva handoff prompt", description: prompts.export, href: "#prompt-export" },
  ...faqs.map(([title, description], i) => ({ title, description, href: `#faq-${i}` })),
];
export function searchContent(query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return searchEntries.filter(entry => words.every(word => `${entry.title} ${entry.description}`.toLowerCase().includes(word)));
}
export function nextTab(key: string, current: number, count: number): number | null {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current + count - 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
