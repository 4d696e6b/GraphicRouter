import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@modelcontextprotocol/ext-apps";
import { Presentation, type PresentationData } from "./Presentation";

const app = new App({ name: "GraphicRouter presentation", version: "0.1.0" }, {});
const root = createRoot(document.getElementById("root")!);
let current: PresentationData | undefined;
function render(result: { _meta?: Record<string, unknown>; isError?: boolean }) {
  const data = result._meta?.presentation as PresentationData | undefined;
  if (!data || result.isError) return;
  current = data;
  root.render(<Presentation data={data} invoke={async name => {
    if (!current) return;
    const b = current.result.blueprint;
    const next = await app.callServerTool({ name, arguments: { deckId: b.deckId, version: b.version } });
    if (next.isError) throw new Error("Tool failed");
    render(next);
  }} />);
}
app.ontoolresult = render;
app.connect().catch(() => { document.getElementById("root")!.textContent = "Preview bridge unavailable. Open the authenticated preview link in the tool result."; });
