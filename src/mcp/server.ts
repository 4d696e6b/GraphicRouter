import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { createDeckSchema, deckVersionSchema, reviseDeckSchema, TOOL_NAMES } from "../contracts";
import type { DeckService } from "../server/service";
import { fail, safeError } from "../server/errors";
import { presentationData } from "../preview/data";
import widgetJs from "graphicrouter:widget";
import { plannerInstructions } from "./planner";
import { briefingSchema, questions } from "../briefing/questions";

const uri = "ui://graphicrouter/presentation.html";
const descriptions = {
  create_deck: `${plannerInstructions}

Create exactly five slides from the completed brief using supplied facts only. Supply 180- and 300-second speaker notes and validate content budgets. Requires signed-in identity. After checking the blueprint/previews, call send_to_canva for Canva delivery; if authorization is required, return the connection link and identify PowerPoint as a fallback. Never invent evidence, customers, numbers or completed features.`,
  get_deck: "Read a saved deck version and refresh only its existing Canva import job. Never starts a new import. CANVA_POLL_FAILED means the status refresh failed, not that the import failed: its jobId is retained; call get_deck again to retry that same job. The saved deck and downloads remain available. Use the current version in conflict errors before revising.",
  revise_deck: "Apply only requested changes to an immutable deck version. For the demo use set_element_color on slide3.headline. baseVersion must be current. Preserve all unrelated content and do not retry a version conflict silently.",
  export_deck: "Export the exact stored blueprint to native PowerPoint and both note durations. Export alone does not complete a requested Canva presentation: call send_to_canva, then get_deck while its existing job is pending, and return the actual Canva editUrl on success. Return authenticated download links. If Canva is unavailable, download PPTX and manually upload to Canva; verify text, shapes, image remain independently editable.",
  send_to_canva: "Import this deck version's binary PowerPoint into Canva. Requires Canva authorization. Reuses an existing job for this version. Each version creates a new Canva design; edits made there never sync back. Pending import must not block presenting the saved deck.",
};
export function createMcpServer(owner: string | null, getService: () => DeckService, origin = "") {
  const server = new McpServer({ name: "GraphicRouter", version: "0.3.0" }, { instructions: plannerInstructions });
  registerAppResource(server, "Presentation", uri, {}, async () => ({ contents: [{ uri, mimeType: RESOURCE_MIME_TYPE,
    text: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root" role="status">Waiting for a saved presentation…</div><script>${widgetJs.replace(/<\/script/gi, "<\\/script")}</script></body></html>`,
    _meta: { ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } } },
  }] }));
  for (const name of TOOL_NAMES) {
    // Discovery needs the underlying object; the service validates the complete shared
    // effects schema (including fixed slide order) before any engine/storage call.
    server.registerTool(name, { description: descriptions[name],
      inputSchema: name === "create_deck" ? createDeckSchema.innerType() : name === "revise_deck" ? reviseDeckSchema : deckVersionSchema,
      annotations: { readOnlyHint: name === "get_deck", destructiveHint: false, idempotentHint: name !== "create_deck" && name !== "revise_deck", openWorldHint: name === "send_to_canva" || name === "get_deck" },
      _meta: { ui: { resourceUri: uri }, "openai/outputTemplate": uri },
    }, async (args: unknown) => {
      try {
        if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to use presentation tools.");
        const service = getService();
        const result = await service.call(name, args, owner);
        // A preview error must not disguise a successful committed version as a failed write.
        let meta: Record<string, unknown> = {};
        try { meta = { presentation: await presentationData(service, owner, result) }; }
        catch { meta = { previewError: "Embedded preview unavailable. Use previewUrl to open the saved presentation." }; }
        const delivery = result.canva.status === "succeeded" ? `Editable Canva presentation: ${result.canva.editUrl}`
          : result.canva.status === "connection_required" ? `Canva delivery is incomplete: no Canva design link is confirmed in this response. Connect at ${result.canva.connectUrl}. Present PowerPoint only as a saved fallback.`
          : result.canva.status === "pending" ? "Canva import is pending. Use get_deck to refresh this existing job; do not start another import. Do not claim a Canva link exists until success."
          : result.canva.status === "not_started" ? "The slide blueprint is ready. If the requested deliverable is Canva, continue with send_to_canva; create/export alone is not Canva delivery."
          : result.canva.message;
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }, { type: "text" as const, text: delivery }], structuredContent: { ...result }, _meta: meta };
      } catch (error) {
        const detail = safeError(error);
        return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(detail) }], structuredContent: { error: detail } };
      }
    });
  }
  server.registerTool("start_briefing", {
    title: "GraphicRouter design brief",
    description: "Start here for any new GraphicRouter presentation request with missing context, especially requests to ask questions first or show a question dialog. Call this tool immediately instead of asking a list of questions in prose. Opens an interactive one-question-at-a-time design dialog with up to 20 questions, optional skips, answer review and a user-triggered return to this chat. Pass known context and prefill only explicitly supplied answers; never invent them. The five-slide format must be explicitly accepted. Once the dialog opens, wait for the user to submit it; do not create slides or images in the meantime. On submission, continue using GraphicRouter create_deck and send_to_canva. Do not substitute an image tool for an unsupported infographic request; explain the boundary and offer the supported five-slide presentation. If the host cannot display the dialog, offer briefingUrl or ask one question at a time in chat while retaining GraphicRouter as the workflow. Existing deck edits do not need this dialog.",
    inputSchema: briefingSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { ui: { resourceUri: uri }, "openai/outputTemplate": uri },
  }, async (args: unknown) => {
    try {
      if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to open your design brief.");
      const parsed = briefingSchema.safeParse(args);
      if (!parsed.success) fail("VALIDATION_FAILED", "Use supported question keys and answers under 1500 characters.");
      const data = parsed.data;
      const briefingId = crypto.randomUUID();
      return {
        content: [{ type: "text" as const, text: "GraphicRouter's 20-question design dialog is open. Wait for the user's completed brief. Do not generate an infographic or switch tools. If no dialog is visible, open briefingUrl; it provides a copy-back fallback." }],
        structuredContent: { kind: "briefing", briefingId, status: "awaiting_answers", questionCount: questions.length, briefingUrl: `${origin}/briefing`, ...data },
        _meta: { briefing: data, briefingId },
      };
    } catch (error) {
      const detail = safeError(error);
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(detail) }], structuredContent: { error: detail } };
    }
  });
  return server;
}
export async function handleMcp(request: Request, owner: string | null, getService: () => DeckService) {
  const server = createMcpServer(owner, getService, new URL(request.url).origin);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try { return await transport.handleRequest(request); }
  finally { await server.close(); }
}
