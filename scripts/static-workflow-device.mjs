// Static concept illustration. This does not analyze a design or connect to Canva.
import { escapeHtml as e } from "./static-site-release.mjs";
const shapes = [
  '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18M9 9v12"/>',
  '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 3v4M18 5h4"/>',
  '<path d="m15 5 4 4M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/>',
];
const icon = i => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[i]}</svg>`;
const design = `<div class="workflowMiniDesign"><div class="miniDesignNav"><i></i><span></span><span></span></div><div class="miniDesignHero"><div><b></b><b></b><span></span></div><i></i></div><div class="miniDesignTiles"><i></i><i></i><i></i></div></div>`;

export function renderWorkflowPanels(steps) {
  const previews = [
    `<div class="designChoices"><div class="designChoice selected">${design}<span>Editorial <i>✓</i></span></div><div class="designChoice">${design}<span>Studio</span></div></div>`,
    `<div class="workflowPrompt"><div><span>${icon(1)} Example prompt</span><span class="promptReady">STRUCTURED</span></div><p>Use a soft lavender palette, generous spacing and a clear visual hierarchy.</p><div class="promptTags"><span>Layout</span><span>Colour</span><span>Typography</span></div></div>`,
    `<div class="workflowEditor"><div class="editorBar"><span>Design preview</span><span>↗</span></div><div class="editorBody"><div class="editorTools"><i></i><i></i><i></i><i></i></div><div class="editorCanvas">${design}<span class="editorSelection"></span><span class="editorCursor">↖ <b>You</b></span></div><div class="editorPalette"><i></i><i></i><i></i></div></div></div>`,
  ];
  return steps.map((step, active) => `<div class="tabletStoryPanel workflowPanel"><div class="workflowDeviceHeader"><span>GraphicRouter ↗</span><span>CONCEPT PREVIEW</span></div><div class="workflowDeviceIntro"><p>HOW IT WORKS</p><h2>${e(step.title)}</h2></div><ol class="workflowSteps">${steps.map((item, i) => `<li class="${i === active ? "workflowStepActive" : ""}"><span class="workflowStepIcon">${icon(i)}</span><div><span class="workflowStepNumber">0${i + 1}</span><strong>${e(item.title)}</strong><p>${e(item.text)}</p></div>${i === active ? '<span class="workflowStepArrow">↗</span>' : ""}</li>`).join("")}</ol><div class="workflowDetail">${previews[active]}</div><p class="workflowDeviceFooter">Choose <span>→</span> Generate <span>→</span> Customize</p></div>`).join("");
}

export function renderWorkflowRails() {
  return `<div class="tabletSceneRail"><div class="tabletRailColumn tabletRailLeft"><div class="tabletRailCard tabletRailStack workflowRail">${icon(0)}<p class="tabletRailEyebrow">01 / CHOOSE</p><strong>A style you love.</strong>${design}</div><div class="tabletRailCard tabletRailRecipe workflowRail">${icon(1)}<strong>Design → prompt.</strong><p>Layout · Colour · Type</p></div></div><div class="tabletRailColumn tabletRailRight"><div class="tabletRailCard tabletRailPlan workflowRail">${icon(1)}<p class="tabletRailEyebrow">02 / GENERATE</p><strong>A clear AI prompt.</strong><span class="tabletRailFootnote">WORKFLOW CONCEPT</span></div><div class="tabletRailCard tabletRailGuide workflowRail">${icon(2)}<p class="tabletRailEyebrow">03 / CUSTOMIZE</p><strong>Make it yours.</strong><div class="railColourDots"><i></i><i></i><i></i></div></div></div></div>`;
}
