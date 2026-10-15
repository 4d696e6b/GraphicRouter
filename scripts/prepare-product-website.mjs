import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Only these public files are deployed. Never copy authoring config or secrets.
export const productFiles = ["index.html", "basic.html", "styles.css", "brand.css",
  "main.js", "interactions.js", "assets/mark.svg", "assets/example-data.json",
  "assets/sample-presentation.pptx", "assets/sample-speaker-notes.txt",
  ...Array.from({ length: 5 }, (_, i) => `assets/slide-${i + 1}.svg`),
  "assets/slide-3-violet.svg", "notices"];
export async function prepareProductWebsite() {
  const source = new URL("../website/", import.meta.url);
  const destination = new URL("../public/product/", import.meta.url);
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const name of productFiles) await cp(new URL(name, source), new URL(name, destination), { recursive: true, errorOnExist: true });
  return fileURLToPath(destination);
}
