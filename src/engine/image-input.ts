import { planImageInputSchema } from "../contracts/image-input";
import { imageInputWorkflow } from "../briefing/image-workflow";
/** No upload or fetching: bind supplied pictures to roles and actual provider steps. */
export function planImageInput(raw: unknown) {
  const input = planImageInputSchema.parse(raw);
  return {
    kind: "image_input_plan", status: "not_uploaded_or_placed",
    images: input.images.map(image => {
      const source = image.source;
      const action = image.role !== "place" ? "Inspect in chat only; do not upload this reference automatically."
        : source.kind === "canva_asset" ? "Use get-assets to inspect the actual asset, then update_fill or insert_fill in the destination Canva transaction."
        : source.kind === "public_url" ? "Use upload-asset-from-url with the exact original supplied public URL, then place its returned actual media/asset ID."
        : source.bytesAccessible ? "Use create-upload-url and an authorized raw-byte HTTP POST, then place the returned actual asset ID. If byte upload is unavailable, report that blocker."
        : "Attachment bytes are not confirmed accessible. Inspect the visible image, retain its target/instruction and ask only for an accessible upload/Canva asset; do not fabricate an asset ID or claim placement.";
      const contain = image.role === "place" && image.dimensions && image.box ? (() => {
        const scale = Math.min(image.box.width / image.dimensions.width, image.box.height / image.dimensions.height);
        const width = image.dimensions.width * scale, height = image.dimensions.height * scale;
        return { left: image.box.x + (image.box.width - width) / 2, top: image.box.y + (image.box.height - height) / 2, width, height };
      })() : undefined;
      return { id: image.id, role: image.role, instruction: image.instruction, target: image.target, sourceKind: source.kind,
        ...(source.kind === "canva_asset" ? { assetId: source.assetId } : source.kind === "chat_attachment" ? { attachmentName: source.name, bytesAccessible: source.bytesAccessible } : {}),
        action, ...(contain ? { containSuggestion: contain } : {}),
      };
    }),
    instructions: imageInputWorkflow,
    scope: "This read-only plan does not read image pixels, upload bytes, create assets, place pictures, verify provider access or save any design. Use only actual visible images and confirmed tool responses.",
  };
}
