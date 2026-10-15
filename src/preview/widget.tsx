import { Document } from "./Document";
import type { DocumentData } from "./document-data";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@modelcontextprotocol/ext-apps";
import { Presentation, type PresentationData } from "./Presentation";
import { toolErrorMessage } from "./tool-error";
import { Briefing } from "./Briefing";
import { briefingSchema } from "../briefing/questions";
import { sendBriefingToChat } from "./briefing-handoff";
import { Canvas, type CanvasData } from "./Canvas";

const app = new App({ name: "GraphicRouter canvas", version: "0.10.1" }, {});
const root = createRoot(document.getElementById("root")!);
let current: PresentationData | undefined;
let currentDocument: DocumentData | undefined;
let currentCanvas: CanvasData | undefined;
function render(result: { _meta?: Record<string, unknown>; isError?: boolean; structuredContent?: Record<string, unknown> }) {
  if (result.isError) {
    if (!current && !currentCanvas && !currentDocument) root.render(<main role="alert" style={{ fontFamily: "Arial, sans-serif", padding: 24 }}>{toolErrorMessage(result)}</main>);
    return;
  }
  const brief = result._meta?.briefing ?? (result.structuredContent?.kind === "briefing" ? { context: result.structuredContent.context, answers: result.structuredContent.answers, prompts: result.structuredContent.prompts } : undefined);
  if (brief) {
    const parsed = briefingSchema.safeParse(brief);
    if (!parsed.success) return;
    current = undefined;
    currentCanvas = undefined; currentDocument = undefined;
    root.render(<Briefing key={String(result._meta?.briefingId ?? result.structuredContent?.briefingId ?? "briefing")} initial={parsed.data} submit={async message => {
      // User clicks the submit button; the complete answer set travels in one
      // user message, so the next model turn does not depend on ephemeral UI state.
      await sendBriefingToChat(params => app.sendMessage(params), message);
    }} />);
    return;
  }
  const document = result._meta?.document as DocumentData | undefined;
  if (document) {
    current = undefined; currentCanvas = undefined; currentDocument = document;
    root.render(<Document data={document} invoke={async (name,pageIds) => {
      if (!currentDocument) return;
      const b = currentDocument.result.blueprint;
      const next = await app.callServerTool({ name, arguments: { deckId: b.deckId, version: b.version,...(name==="get_document"?{pageIds}: {}) } });
      if (next.isError) throw new Error(toolErrorMessage(next));
      render(next);
    }} />); return;
  }
  const canvas = result._meta?.canvas as CanvasData | undefined;
  if (canvas) {
    current = undefined; currentDocument = undefined; currentCanvas = canvas;
    root.render(<Canvas data={canvas} invoke={async name => {
      if (!currentCanvas) return;
      const b = currentCanvas.result.blueprint;
      const next = await app.callServerTool({ name, arguments: { deckId: b.deckId, version: b.version } });
      if (next.isError) throw new Error(toolErrorMessage(next));
      render(next);
    }} />);
    return;
  }
  const data = result._meta?.presentation as PresentationData | undefined;
  if (!data) return;
  current = data; currentDocument = undefined;
  currentCanvas = undefined;
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
