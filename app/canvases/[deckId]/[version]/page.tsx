import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { canvasVersionSchema } from "@/src/contracts";
import { HostedCanvas } from "@/src/preview/HostedCanvas";
import { canvasData } from "@/src/preview/data";
import { canvasService } from "@/src/server/runtime";
import { safeError } from "@/src/server/errors";

export const dynamic = "force-dynamic";
export default async function CanvasPage({ params }: { params: Promise<{ deckId: string; version: string }> }) {
  const { deckId, version } = await params;
  const user = await requireChatGPTUser(`/canvases/${deckId}/${version}`);
  const parsed = canvasVersionSchema.safeParse({ deckId, version: Number(version) });
  if (!parsed.success) return <main>Canvas version not found.</main>;
  try {
    const service = canvasService(), result = await service.call("get_canvas", parsed.data, user.userId);
    return <HostedCanvas initial={await canvasData(service, user.userId, result)} />;
  } catch (error) { return <main role="alert">{safeError(error).message}</main>; }
}
