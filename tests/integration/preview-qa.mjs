// Standalone local fixture server. Does not expose production routes or credentials.
import { build } from "esbuild";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const bundle = await build({ entryPoints: [fileURLToPath(new URL("./preview-fixture.tsx", import.meta.url))], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' } });
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GraphicRouter — TEST UI fixture</title><style>body{margin:0}*{box-sizing:border-box}button:focus-visible,a:focus-visible,select:focus-visible{outline:3px solid #7c3aed;outline-offset:3px}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
createServer((request, response) => {
  response.setHeader("Cache-Control", "no-store");
  if (request.url !== "/") { response.writeHead(404); response.end(); return; }
  response.setHeader("Content-Type", "text/html;charset=utf-8");
  response.end(html);
}).listen(5180, "127.0.0.1", () => console.log("Labelled UI test fixture: http://127.0.0.1:5180/ (no real integrations)"));
