import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const moduleId = "graphicrouter:raster-assets";
const resolvedId = `\0${moduleId}`;

/** Keep rendering completely offline. Workers receive a precompiled Wasm module. */
export function rasterBundle(options: { target?: "worker" | "node" } = {}): Plugin {
  const target = options.target ?? "worker";
  const require = createRequire(import.meta.url);
  const wasmPath = join(dirname(require.resolve("@resvg/resvg-wasm")), "index_bg.wasm");
  const assetPath = fileURLToPath(new URL("./raster-assets/", import.meta.url));
  return {
    name: "graphicrouter-raster-assets",
    enforce: "pre",
    resolveId(id) { if (id === moduleId) return resolvedId; },
    async load(id) {
      if (id !== resolvedId) return;
      const paths = ["LiberationSans-Regular.ttf", "LiberationSans-Bold.ttf"].map((name) => join(assetPath, name));
      for (const path of [wasmPath, ...paths]) this.addWatchFile(path);
      const fonts = await Promise.all(paths.map((path) => readFile(path)));
      const decode = "const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));";
      const wasm = target === "node"
        // Test-only Node entry. Worker builds must never compile bytes at runtime.
        ? `export const wasmModule = WebAssembly.compile(decode(${JSON.stringify((await readFile(wasmPath)).toString("base64"))}));`
        : `import compiledWasm from ${JSON.stringify(`${wasmPath}?module`)}; export const wasmModule = compiledWasm;`;
      return `${decode}\n${wasm}\nexport const fontBuffers = [${fonts.map((font) => `decode(${JSON.stringify(font.toString("base64"))})`).join(",")}];`;
    },
  };
}
