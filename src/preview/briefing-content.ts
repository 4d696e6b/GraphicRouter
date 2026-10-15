import type { AnswerKey } from "../briefing/questions";
/** Presentation copy only; underlying answer keys, requirements and help stay intact. */
export const briefLabels: Partial<Record<AnswerKey, string>> = {
  complexity:"Your pace", template:"Starting point", topic:"Your story", audience:"Audience", outcome:"The goal", format:"Format & size", templateSource:"Canva source", editRequest:"Your changes", length:"Length & timing", evidence:"Facts & sources", setting:"Where it's seen", mood:"Look & feel", mustInclude:"Must-haves", language:"Language", accent:"Colour", brand:"Brand details", references:"Inspiration", visuals:"Visual direction", closing:"Takeaway",
};
export const briefHeadlines: Partial<Record<AnswerKey,string>> = {
  complexity:"How much direction would you like?", template:"Where should we begin?", topic:"What's the story?", audience:"Who are we designing for?", outcome:"What should they take away?", format:"Give your idea a format.", length:"How long should it be?", mood:"Set the mood.", evidence:"What facts can we build on?", mustInclude:"What must make the cut?", references:"What catches your eye?",
};
export const briefIntros: Partial<Record<AnswerKey,string>> = {
  complexity:"A quick start or a little more detail. Choose what suits this project.",
  template:"Start fresh, build from a source, or make a focused edit in Canva.",
  topic:"Give us the idea and the important details. Rough notes are a great start.",
  audience:"A little context helps us get the language, detail and visual style right.",
  outcome:"Choose one clear action, understanding or feeling to build the design around.",
  format:"Choose the space your message needs. You can also describe a custom size.",
  evidence:"Add the figures, source links and verified claims we should use.",
  mood:"Pick a direction or describe the feeling in your own words.",
};
export const briefPlaceholders: Partial<Record<AnswerKey,string>> = {
  topic:"My idea is…\nThe important points are…\nThe exact wording or facts to keep are…",
  audience:"For example: first-time users, hackathon judges, or our team…",
  outcome:"After seeing this, they should…",
  evidence:"Add verified facts, figures, dates and source links…",
  templateSource:"Paste your full Canva editor or share link…",
  editRequest:"On page 2, change…\nKeep everything else the same.\nUse my attached picture for…",
  length:"For example: 24 slides, a 12-minute talk, with an appendix…",
  mustInclude:"Required wording, sections, source credits or details…",
  references:"Share a link and tell us what you like about it…",
};
export const paceDetails: Record<string,{title:string;description:string;tag:string}> = {
  "Quick and simple":{title:"Quick start",description:"The essentials, then a strong first draft.",tag:"About 6 questions"},
  "Balanced":{title:"A little guidance",description:"Shape the content and visual direction together.",tag:"About 9 questions"},
  "Detailed":{title:"Go into detail",description:"More room for brand, references and requirements.",tag:"About 14 questions"},
};
export const routeDetails: Record<string,{title:string;description:string;icon:string}> = {
  "Start from a blank canvas":{title:"Build from a blank canvas",description:"Precise, separate text and simple graphic elements.",icon:"canvas"},
  "Use my Canva template/design":{title:"Adapt a Canva source",description:"Start with a copy of a design you can access.",icon:"copy"},
  "Let Canva create a design":{title:"Create with Canva",description:"Generate a draft, then inspect and refine its layers.",icon:"spark"},
  "Edit my existing Canva design":{title:"Edit the same Canva file",description:"Keep your link. Make only the changes you request.",icon:"edit"},
};
