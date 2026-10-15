import { registerCanvaEditTools } from "./canva-edit-tools";
import { canvaEditRouting } from "../briefing/canva-edit-workflow";
import { imageInputRouting } from "../briefing/image-workflow";
import { skillsRoutingInstructions } from "../design-skills/routing";
import { registerDesignTools } from "./design-tools";
import type { DocumentService } from "../server/document-service";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { createDeckSchema, deckVersionSchema, reviseDeckSchema, TOOL_NAMES } from "../contracts";
import type { DeckService } from "../server/service";
import { fail, safeError } from "../server/errors";
import { presentationData } from "../preview/data";
import widgetJs from "graphicrouter:widget";
import { plannerInstructions } from "./planner";
import { briefingSchema, getQuestions } from "../briefing/questions";
import { CANVAS_TOOL_NAMES, createCanvasSchema, editCanvasSchema, canvasVersionSchema, inspectCanvasSchema } from "../contracts";
import type { CanvasService } from "../server/canvas-service";
import { canvasData } from "../preview/data";
import { reviewCanvaDesignSchema } from "../contracts/design-review";
import { reviewCanvaDesign } from "../engine/editability-review";
import { editabilityPolicy } from "../briefing/editability-policy";

const uri = "ui://graphicrouter/presentation.html";
const descriptions = {
  create_deck: `${plannerInstructions}

Create exactly five slides from the completed brief using supplied facts only. Supply 180- and 300-second speaker notes and validate content budgets. Requires signed-in identity. After checking the blueprint/previews, call send_to_canva for Canva delivery; if authorization is required, return the connection link and identify PowerPoint as a fallback. Never invent evidence, customers, numbers or completed features.`,
  get_deck: "Read a saved deck version and refresh only its existing Canva import job. Never starts a new import. CANVA_POLL_FAILED means the status refresh failed, not that the import failed: its jobId is retained; call get_deck again to retry that same job. The saved deck and downloads remain available. Use the current version in conflict errors before revising.",
  revise_deck: "Apply only requested changes to an immutable deck version. For the demo use set_element_color on slide3.headline. baseVersion must be current. Preserve all unrelated content and do not retry a version conflict silently.",
  export_deck: "Export the exact stored blueprint to native PowerPoint and both note durations. Export alone does not complete a requested Canva presentation: call send_to_canva, then get_deck while its existing job is pending, and return the actual Canva editUrl on success. Return authenticated download links. If Canva is unavailable, download PPTX and manually upload to Canva; verify text, shapes, image remain independently editable.",
  send_to_canva: "Import this deck version's binary PowerPoint into Canva. Requires Canva authorization. Reuses an existing job for this version. Each version creates a new Canva design; edits made there never sync back. Pending import must not block presenting the saved deck.",
};
export function createMcpServer(owner: string | null, getService: () => DeckService, origin = "", getCanvasService?: () => CanvasService, getDocumentService?: () => DocumentService) {
  const server = new McpServer({ name: "GraphicRouter", version: "0.10.0" }, { instructions: plannerInstructions });
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
  const canvasDescriptions = {
    create_canvas: `${plannerInstructions}\nCreate a genuinely BLANK editable infographic canvas from the supplied brief, custom dimensions (320–4000 per side), palette and a short public design direction. There is no template, fixed slide count or layout recipe. Return the blank canvas, then continue with edit_canvas in deliberate structure/content/polish passes. Do not stop at the blank canvas or substitute image generation. Use the five-slide deck APIs only for an explicitly requested legacy presentation.`,
    edit_canvas: "Compose a freeform canvas by adding, replacing or removing named editable text, shape, line and registered image objects. ChatGPT chooses positions, sizes, hierarchy and reading order from the brief. Operations apply in order; max40 per pass, max200 objects, max100 versions. Use separate structure/content/polish passes. Each pass returns staged previews and validation. Call inspect_canvas to actually see the rendered PNG after content placement and meaningful polish; correct visible weaknesses and text fit/bounds/contrast before export. Preserve stable IDs when replacing; specify the full replacement object and current baseVersion. No arbitrary SVG, code, external assets or flattened full-canvas image. Rectangles/ellipses, positive line deltas and measured English/Arial text are currently supported. Use get_canvas on a stale conflict; never silently discard unrelated objects.",
    get_canvas: "Retrieve this immutable freeform canvas version and refresh its existing Canva import job without starting another. Returns its exact editable objects, construction history, validations, and preview. CANVA_POLL_FAILED preserves the same job; retry this read. Use this tool for schemaVersion2 canvases, not get_deck.",
    export_canvas: "Export the exact freeform objects as a single-page native editable PowerPoint at the chosen canvas dimensions, plus design notes. This is a fallback, not completed Canva delivery. Use send_canvas_to_canva and get_canvas to deliver an actual Canva editUrl. Blank canvases must be composed before export.",
    send_canvas_to_canva: "Import this exact freeform infographic version's native PowerPoint into Canva. Requires authorization; reuses any existing import job and never starts a duplicate. Return connectUrl when required, poll via get_canvas when pending, and report only the real editUrl on success. Each version creates a separate Canva design. Canva fidelity/editability need actual inspection; manual Canva edits do not sync back.",
  };
  for (const name of CANVAS_TOOL_NAMES) server.registerTool(name, {
    description: canvasDescriptions[name],
    inputSchema: name === "create_canvas" ? createCanvasSchema : name === "edit_canvas" ? editCanvasSchema : canvasVersionSchema,
    annotations: { readOnlyHint: name === "get_canvas", destructiveHint: false, idempotentHint: name !== "create_canvas" && name !== "edit_canvas", openWorldHint: name === "send_canvas_to_canva" || name === "get_canvas" },
    _meta: { ui: { resourceUri: uri }, "openai/outputTemplate": uri },
  }, async (args: unknown) => {
    try {
      if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to use canvas tools.");
      if (!getCanvasService) fail("NOT_IMPLEMENTED", "The canvas engine is unavailable in this host.");
      const service = getCanvasService(), result = await service.call(name, args, owner);
      let meta: Record<string, unknown> = {};
      try { meta = { canvas: await canvasData(service, owner, result) }; }
      catch { meta = { previewError: "Canvas view unavailable. This version is saved; use previewUrl or get_canvas. Do not repeat a committed edit." }; }
      const next = !result.blueprint.elements.length ? "Blank canvas created. Continue with edit_canvas to add the structure, then content and polish; do not report the design finished."
        : result.canva.status === "succeeded" ? `Editable Canva design: ${result.canva.editUrl}`
        : result.canva.status === "pending" ? "Canva import pending. Refresh this job with get_canvas."
        : result.canva.status === "connection_required" ? `Connect Canva at ${result.canva.connectUrl}. No Canva design link is confirmed yet.`
        : "Review the composed objects and preview. Correct validation issues, then send_canvas_to_canva for the final editable Canva result.";
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }, { type: "text" as const, text: next }], structuredContent: { ...result }, _meta: meta };
    } catch (error) { const detail = safeError(error); return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(detail) }], structuredContent: { error: detail } }; }
  });
  server.registerTool("inspect_canvas", {
    description: "Render a saved GraphicRouter canvas as a real PNG image visible to ChatGPT, plus actionable design diagnostics. Call after content placement and after meaningful refinements before final Canva delivery. Actually look at the image: critique hierarchy, meaningful illustrations, spacing, contrast, balance and phone-size readability, then use edit_canvas for specific improvements. Optional region crops inspect small details without changing the source. This is a preview of stored GraphicRouter objects, not the imported Canva design or a template. No writes, new imports or model service are used; a rendering error must not be described as a successful visual review.",
    inputSchema: inspectCanvasSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args: unknown) => {
    try {
      if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to inspect a canvas.");
      if (!getCanvasService) fail("NOT_IMPLEMENTED", "Canvas inspection is unavailable in this host.");
      const { image, report } = await getCanvasService().inspect(owner, args);
      const chunks: string[] = [];
      for (let i = 0; i < image.bytes.length; i += 16384) chunks.push(String.fromCharCode(...image.bytes.subarray(i, i + 16384)));
      return { content: [{ type: "image" as const, mimeType: "image/png", data: btoa(chunks.join("")) }, { type: "text" as const, text: JSON.stringify(report) }], structuredContent: report };
    } catch (error) { const detail = safeError(error); return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(detail) }], structuredContent: { error: detail } }; }
  });
  server.registerTool("review_canva_design", {
    description: "Review a CURRENT supplied Canva page snapshot before calling it complete or fully editable. Obtain native richtexts/boxes and image fills through Canva tools; do not invent IDs or geometry. Supply exact required copy and verified links. Inspect image-only backgrounds separately: editable=true on an image does not make lettering editable. Text baked into images blocks delivery; not_checked images or missing close-up review require further inspection. Detect duplicate/colliding text, bounds, missing whole-word copy and mismatched URLs. This read-only tool does not fetch Canva, perform OCR, verify facts independently, or enforce an external commit lock. Repeat per page and after edits. Show the checked preview and obey Canva's explicit approval before saving. Never commit a diagnostic text-removal transaction.",
    inputSchema: reviewCanvaDesignSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args: unknown) => {
    try {
      if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to review a design.");
      const parsed = reviewCanvaDesignSchema.safeParse(args);
      if (!parsed.success) fail("VALIDATION_FAILED", "Supply bounded actual page objects, exact required copy, verified HTTPS links and honest image/visual inspection status.");
      const report = reviewCanvaDesign(parsed.data);
      return { content: [{ type: "text" as const, text: JSON.stringify(report) }], structuredContent: report };
    } catch (error) { const detail = safeError(error); return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(detail) }], structuredContent: { error: detail } }; }
  });
  registerCanvaEditTools(server, owner);
  server.registerTool("start_briefing", {
    title: "GraphicRouter design brief",
    description: "Start an adaptive design brief with complexity first, then native blank-canvas objects (recommended for editable text), an existing Canva source, or a new Canva-generated draft. Every heading/number/label must be a native text object separate from images; generated drafts need review_canva_design and background-only inspection, not a promise of editability. Call immediately instead of prose questions. Ask roughly6/9/14 relevant questions; existing-source work alone adds a source/fallback question. Reuse known answers. Optional prompts use supported keys such as topic/audience/outcome/evidence/mustInclude/visuals, never content. Wait for submission; do not restart intake. New Canva creation needs no Brand Template search. Respect strict sources/explicit fallback and legacy choices. Native Canva is its mode's source of truth; no public-catalogue backend search or two-way sync exists. Blank-canvas work uses create_canvas→edit_canvas→inspect_canvas→Canva. For a supplied Canva link or previously returned Canva file plus requested changes, call plan_canva_edit instead of new-design intake; edit the same file by default. Attached pictures use plan_image_input for role/target binding. Rich briefs/narrow edits can skip intake. If the app cannot show, offer briefingUrl or one question per message.",
    inputSchema: briefingSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { ui: { resourceUri: uri }, "openai/outputTemplate": uri },
  }, async (args: unknown) => {
    try {
      if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to open your design brief.");
      const parsed = briefingSchema.safeParse(args);
      if (!parsed.success) fail("VALIDATION_FAILED", "Use supported question keys and answers under 16000 characters.");
      const data = parsed.data;
      const briefingId = crypto.randomUUID();
      return {
        content: [{ type: "text" as const, text: `GraphicRouter's adaptive design dialog is open. Ask complexity first, then choose native blank-canvas objects, a copy-based Canva source, a Canva-generated draft, or Edit my existing Canva design for the same file. Native composition is recommended for separate editable text. Wait for submission and continue the selected route without another interview. New Canva generation needs no Brand Template search. Respect strict sources and explicit fallback permission. If no dialog is visible, offer briefingUrl.\n\n${editabilityPolicy}\n\n${canvaEditRouting}\n\n${imageInputRouting}\n\n${skillsRoutingInstructions}` }],
        structuredContent: { kind: "briefing", briefingId, status: "awaiting_answers", questionCount: getQuestions(data.answers).length, briefingUrl: `${origin}/briefing`, ...data },
        _meta: { briefing: data, briefingId },
      };
    } catch (error) {
      const detail = safeError(error);
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(detail) }], structuredContent: { error: detail } };
    }
  });
  registerDesignTools(server, owner, uri, getDocumentService);
  return server;
}
export async function handleMcp(request: Request, owner: string | null, getService: () => DeckService, getCanvasService?: () => CanvasService, getDocumentService?: () => DocumentService) {
  const server = createMcpServer(owner, getService, new URL(request.url).origin, getCanvasService, getDocumentService);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try { return await transport.handleRequest(request); }
  finally { await server.close(); }
}
