import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { createDeckSchema, deckVersionSchema, reviseDeckSchema, TOOL_NAMES } from "../contracts";
import type { DeckService } from "../server/service";
import { fail, safeError } from "../server/errors";
import { presentationData } from "../preview/data";
import widgetJs from "graphicrouter:widget";

const uri = "ui://graphicrouter/presentation.html";
const descriptions = {
  create_deck: "Create exactly five presentation slides from the user's supplied facts. The primary deliverable is an editable Canva presentation; PowerPoint is an intermediate handoff/fallback unless specifically requested alone. Use artDirection starting with GraphicRouter Studio for the premium editorial visual system; use classic recipes only when requested. Alternate a dramatic opening, concise light slides, an illustrated process, and a closing statement. Use short headlines (about 4–8 words), concise takeaways (under 100 characters), block headings under 24 characters and body copy under 110 characters. Keep missing-evidence disclaimers in brief.unknowns/notes instead of repeating them on every slide. Use a proposed demonstration on the proof slide when results are unavailable; label it as a demonstration, never invented evidence. Aim for 280–330 core spoken words plus a 30-second demo. After creating and checking previews, call send_to_canva to complete a requested Canva delivery. If connection is required, say explicitly that a Canva design link has not been confirmed, offer the connection link, and label PPTX as a fallback. Never present a private preview URL as a Canva design link. Plan the narrative in ChatGPT: hook, answer, workflow, proof, next. Never invent evidence, customers, numbers, or completed features; put missing evidence in brief.unknowns and mark unknown content explicitly. Supply 180- and 300-second speaker notes. Confirm supplied content fits the shared budgets. Requires signed-in identity.",
  get_deck: "Read a saved deck version and refresh only its existing Canva import job. Never starts a new import. CANVA_POLL_FAILED means the status refresh failed, not that the import failed: its jobId is retained; call get_deck again to retry that same job. The saved deck and downloads remain available. Use the current version in conflict errors before revising.",
  revise_deck: "Apply only requested changes to an immutable deck version. For the demo use set_element_color on slide3.headline. baseVersion must be current. Preserve all unrelated content and do not retry a version conflict silently.",
  export_deck: "Export the exact stored blueprint to native PowerPoint and both note durations. Export alone does not complete a requested Canva presentation: call send_to_canva, then get_deck while its existing job is pending, and return the actual Canva editUrl on success. Return authenticated download links. If Canva is unavailable, download PPTX and manually upload to Canva; verify text, shapes, image remain independently editable.",
  send_to_canva: "Import this deck version's binary PowerPoint into Canva. Requires Canva authorization. Reuses an existing job for this version. Each version creates a new Canva design; edits made there never sync back. Pending import must not block presenting the saved deck.",
};
export function createMcpServer(owner: string | null, getService: () => DeckService) {
  const server = new McpServer({ name: "GraphicRouter", version: "0.1.0" });
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
  return server;
}
export async function handleMcp(request: Request, owner: string | null, getService: () => DeckService) {
  const server = createMcpServer(owner, getService);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try { return await transport.handleRequest(request); }
  finally { await server.close(); }
}
