import type { DeckResult, PreviewStage } from "../contracts";
import type { DeckService } from "../server/service";
import type { PresentationData } from "./Presentation";
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
