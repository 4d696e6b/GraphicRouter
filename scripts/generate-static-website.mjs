// Development/authoring only. The output website never imports this file.
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { build } from "esbuild";
import config from "../website/site.config.js";
import { validateConfig } from "./static-site-release.mjs";
import { renderWebsite } from "./static-site-template.mjs";

const root = fileURLToPath(new URL("../", import.meta.url)), directory = join(root, "website");
const args = new Set(process.argv.slice(2));
if ([...args].some(arg => !["--examples", "--check"].includes(arg))) throw new Error("Use --examples, --check, or no arguments.");
validateConfig(config);
if (args.has("--examples")) {
  if (args.has("--check")) throw new Error("Refresh and check are separate steps.");
  const outfile = join(root, "outputs", "static-website-examples.mjs");
  await mkdir(join(root, "outputs"), { recursive: true });
  await build({ stdin: { contents: String.raw`
    import { engine, assets } from './src/server/engine-provider';
    import { localWorkflowPitch as input } from './src/fixtures/local-workflow-pitch';
    const original = engine.createBlueprint(input, {deckId:'11111111-1111-4111-8111-111111111111',version:1});
    const revised = engine.reviseBlueprint(structuredClone(original), [{type:'set_element_color',elementId:'slide3.headline',color:'#7C3AED'}]);
    const expected = structuredClone(original.slides);
    expected[2].elements.find(e=>e.id==='slide3.headline').color={hex:'#7C3AED'};
    if(JSON.stringify(expected)!==JSON.stringify(revised.slides))throw new Error('Prepared revision changed unrelated elements');
    export const images = original.slides.map(slide=>engine.renderSlideSvg(slide,original.theme,'finished',assets));
    export const violet = engine.renderSlideSvg(revised.slides[2],revised.theme,'finished',assets);
    export const pptx = await engine.compilePowerPoint(original,assets);
    export const notes = original.slides.map((slide,i)=>'Slide '+(i+1)+'\n'+slide.notes.core+'\n\nExpanded notes\n'+slide.notes.expanded).join('\n\n---\n\n');
    export const data = {title:input.title,audience:input.brief.audience,idea:input.brief.idea,
      slides:input.slides.map((s,i)=>({role:['Problem','Answer','Workflow','Proof','Next step'][i],headline:s.headline,notes:s.notes.core})),
      preservation:'Only the slide-three headline colour changes. The original and unrelated content are preserved.'};
  `, resolveDir: root, loader: "ts" }, outfile, bundle: true, platform: "node", format: "esm", packages: "external", logLevel: "silent" });
  const sample = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
  const files = [];
  for (const [index, svg] of sample.images.entries()) { const name = `slide-${index + 1}.svg`; await writeFile(join(directory, "assets", name), svg); files.push(name); }
  for (const [name, contents] of [["slide-3-violet.svg", sample.violet], ["sample-presentation.pptx", sample.pptx], ["sample-speaker-notes.txt", sample.notes]]) { await writeFile(join(directory, "assets", name), contents); files.push(name); }
  await writeFile(join(directory, "assets", "example-data.json"), `${JSON.stringify(sample.data, null, 2)}\n`); files.push("example-data.json");
  const manifest = {};
  for (const name of [...files, "tablet-hand.png", "tablet-gesture.png"]) manifest[name] = createHash("sha256").update(await readFile(join(directory, "assets", name))).digest("hex");
  await writeFile(join(directory, "assets", "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}
const data = JSON.parse(await readFile(join(directory, "assets", "example-data.json"), "utf8"));
const html = renderWebsite(config, data);
const basic = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<noscript>([\s\S]*?)<\/noscript>/g, "$1");
if (config.downloadUrl?.startsWith("assets/")) await access(resolve(directory, config.downloadUrl));
if (args.has("--check")) {
  if (await readFile(join(directory, "index.html"), "utf8") !== html) throw new Error("Static HTML is stale. Run node scripts/generate-static-website.mjs.");
  if (await readFile(join(directory, "basic.html"), "utf8") !== basic) throw new Error("Script-free HTML is stale; regenerate it.");
  const manifest = JSON.parse(await readFile(join(directory, "assets", "manifest.json"), "utf8"));
  for (const [name, expected] of Object.entries(manifest)) if (createHash("sha256").update(await readFile(join(directory, "assets", name))).digest("hex") !== expected) throw new Error(`Prepared asset changed: ${name}`);
  console.log("Static HTML/config consistency and prepared asset hashes pass.");
} else { await writeFile(join(directory, "index.html"), html); await writeFile(join(directory, "basic.html"), basic); console.log("Wrote website/index.html. Upload website/ as-is; no runtime build or backend."); }
