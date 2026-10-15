import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@modelcontextprotocol/ext-apps";
import { Presentation, type PresentationData } from "./Presentation";
import { toolErrorMessage } from "./tool-error";

const app = new App({ name: "GraphicRouter presentation", version: "0.1.0" }, {});
const root = createRoot(document.getElementById("root")!);
let current: PresentationData | undefined;
function render(result: { _meta?: Record<string, unknown>; isError?: boolean; structuredContent?: Record<string, unknown> }) {
  if (result.isError) {
    if (!current) root.render(<main role="alert" style={{ fontFamily: "Arial, sans-serif", padding: 24 }}>{toolErrorMessage(result)}</main>);
    return;
  }
  const data = result._meta?.presentation as PresentationData | undefined;
  if (!data) return;
  current = data;
  root.render(<Presentation data={data} invoke={async name => {
    if (!current) return;
    const b = current.result.blueprint;
    const next = await app.callServerTool({ name, arguments: { deckId: b.deckId, version: b.version } });
    if (next.isError) throw new Error(toolErrorMessage(next));
    render(next);
  }} />);
}
app.ontoolresult = render;
app.connect().catch(() => { document.getElementById("root")!.textContent = "Preview bridge unavailable. Open the authenticated preview link in the tool result."; });
