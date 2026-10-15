import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { planCanvaEditSchema, reviewCanvaEditSchema, planImageInputSchema } from "../contracts";
import { planCanvaEdit, reviewCanvaEdit } from "../engine/canva-edit";
import { planImageInput } from "../engine/image-input";
import { fail, safeError } from "../server/errors";
export function registerCanvaEditTools(server: McpServer, owner: string | null) {
  const specs = [
    { name: "plan_canva_edit", schema: planCanvaEditSchema, run: planCanvaEdit,
      description: "Plan reading/editing an EXISTING Canva design from its supplied full share/editor URL, canva.link shortlink or actual returned design ID. Call immediately for an existing-file request; skip new-design intake. Default edit_original preserves the SAME design ID/link; edit_copy requires user intent. Read-only orchestration: actual reads/drafts/saves use separately connected Canva tools, not this backend. Pass full share URLs with collaboration tokens directly to get-design; resolve shortlinks first. Inspect actual native elements, edit only requested properties, compare snapshots with review_canva_edit, inspect latest preview and obey explicit Canva save approval. Never auto-copy, generate, import or claim saved. For attached pictures also use plan_image_input to bind their role/target." },
    { name: "review_canva_edit", schema: reviewCanvaEditSchema, run: reviewCanvaEdit,
      description: "Compare actual normalized before/after selected-page snapshots from the SAME Canva design/transaction. Check exact requested property targets and flag unrelated property changes, additions/deletions, geometry/page drift, stale identity and partial snapshots. Capture every exposed selected-page element/property honestly; complex fields may use consistently serialized strings. Ready is only for user review, never save approval or proof of provider state. Max5 complete pages,200 elements/page,600000 UTF-8 bytes. Use review_canva_design separately for native-text/layer/copy checks. Preview and explicit approval are required before native commit; reread saved result afterward. No fetch, edit, commit or storage." },
    { name: "plan_image_input", schema: planImageInputSchema, run: planImageInput,
      description: "Bind pictures attached to the user's prompt to their specific role/instruction/target: place the actual image, style_reference, edit_instruction screenshot or extract_content. Reuse clear user intent; ask only an ambiguous role/target. Sources: chat_attachment, already public HTTPS URL or actual Canva asset ID. No pixel reading/upload/placement occurs here. Place via supported native Canva upload then update_fill/insert_fill; preserve aspect ratio, exact supplied picture and separate text. References are inspected in chat without automatic upload. Missing accessible bytes/upload tool is a visible blocker, never a fabricated asset ID. Optional dimensions+box returns contain geometry only. No automatic generation, image-to-design conversion or flattening." },
  ] as const;
  for (const spec of specs) server.registerTool(spec.name, {
    description: spec.description, inputSchema: spec.schema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args: unknown) => {
    try {
      if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to plan or review Canva work.");
      const parsed = spec.schema.safeParse(args);
      if (!parsed.success) fail("VALIDATION_FAILED", "Supply a supported Canva reference or bounded actual image/snapshot fields; no action was performed.");
      const result = spec.run(parsed.data);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: { ...result } };
    } catch (cause) {
      const error = safeError(cause);
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(error) }], structuredContent: { error } };
    }
  });
}
