import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { deckVersionSchema } from "@/src/contracts";
import { HostedDocument } from "@/src/preview/HostedDocument";
import { documentData } from "@/src/preview/document-data";
import { documentService } from "@/src/server/runtime";
import { safeError } from "@/src/server/errors";

export const dynamic = "force-dynamic";
export default async function DocumentPage({ params }: { params: Promise<{ deckId: string; version: string }> }) {
  const { deckId, version } = await params;
  const user = await requireChatGPTUser(`/documents/${deckId}/${version}`);
  const parsed = deckVersionSchema.safeParse({ deckId, version: Number(version) });
  if (!parsed.success) return <main>Document version not found.</main>;
  try {
    const service = documentService(), result = await service.call("get_document", parsed.data, user.userId);
    return <HostedDocument initial={await documentData(service, user.userId, result)} />;
  } catch (error) { return <main role="alert">{safeError(error).message}</main>; }
}
