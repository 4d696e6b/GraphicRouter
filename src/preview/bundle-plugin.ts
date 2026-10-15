import { build } from "esbuild";
import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";

/** Bundle the Apps bridge locally; no runtime CDN or browser credentials. */
export function previewBundle(): Plugin {
  return {
    name: "graphicrouter-preview",
    resolveId(id) { if (id === "graphicrouter:widget") return "\0graphicrouter:widget"; },
    async load(id) {
      if (id !== "\0graphicrouter:widget") return;
      const result = await build({ entryPoints: [fileURLToPath(new URL("./widget.tsx", import.meta.url))], bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", minify: true, define: { "process.env.NODE_ENV": '"production"' } });
      return `export default ${JSON.stringify(result.outputFiles[0].text)};`;
    },
  };
}
