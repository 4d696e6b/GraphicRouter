import type { DeckResult, PreviewStage } from "../contracts";
import type { DeckService } from "../server/service";
import type { PresentationData } from "./Presentation";
import type { CanvasResult } from "../contracts";
import type { CanvasService } from "../server/canvas-service";
import type { CanvasData } from "./Canvas";
export async function canvasData(service: CanvasService, owner: string, result: CanvasResult): Promise<CanvasData> {
  try { return { result, ...await service.preview(owner, result.blueprint.deckId, result.blueprint.version) }; }
  catch { return { result, previews: { layout: "", content: "", finished: "" }, constructionPreviews: [], previewError: "The canvas operation succeeded and this version is saved. The preview is temporarily unavailable; use Refresh to retry without repeating the edit." }; }
}
export async function presentationData(service: DeckService, owner: string, result: DeckResult): Promise<PresentationData> {
  const { deckId, version } = result.blueprint;
  const stages: PreviewStage[] = ["layout", "content", "finished"];
  try {
    const values = await Promise.all(stages.map(stage => service.preview(owner, deckId, version, stage)));
    return { result, previews: { layout: values[0].slides, content: values[1].slides, finished: values[2].slides } };
  } catch {
    // This result has already been authorized and the operation may be committed.
    // A rendering failure must not hide its version or encourage repeating a write.
    return { result, previews: null, previewError: "Slide preview unavailable. This operation succeeded; your saved version, notes, and any download links are preserved. Try Refresh import to reload the preview." };
  }
}
