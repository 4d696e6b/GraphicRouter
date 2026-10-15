// Optional local QA server only. Upload website/ to any static host; this server is not part of it.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../website/", import.meta.url));
const prefix = "/graphicrouter/", port = 5184;
const mime = { ".html": "text/html;charset=utf-8", ".css": "text/css;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".txt": "text/plain;charset=utf-8", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  function finish(status, body = "") { response.writeHead(status); response.end(request.method === "HEAD" ? undefined : body); console.log(`${request.method} ${request.url?.split("?")[0]} ${status}`); }
  if (!["GET", "HEAD"].includes(request.method)) return finish(405);
  let path;
  try { path = decodeURIComponent(new URL(request.url, "http://localhost").pathname); } catch { return finish(400); }
  if (!path.startsWith(prefix)) return finish(404);
  const file = resolve(root, path.slice(prefix.length) || "index.html");
  if (!file.startsWith(resolve(root) + sep)) return finish(404);
  try { const bytes = await readFile(file); response.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream"); finish(200, bytes); }
  catch { finish(404); }
}).listen(port, "127.0.0.1", () => console.log(`Static-only, no app server: http://127.0.0.1:${port}${prefix}`));
