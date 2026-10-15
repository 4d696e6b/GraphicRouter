import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { deckVersionSchema } from "@/src/contracts";
import { HostedPresentation } from "@/src/preview/HostedPresentation";
import { presentationData } from "@/src/preview/data";
import { service } from "@/src/server/runtime";
import { safeError } from "@/src/server/errors";

export const dynamic = "force-dynamic";
export default async function DeckPage({ params }: { params: Promise<{ deckId: string; version: string }> }) {
  const { deckId, version } = await params;
  const user = await requireChatGPTUser(`/decks/${deckId}/${version}`);
  const parsed = deckVersionSchema.safeParse({ deckId, version: Number(version) });
  if (!parsed.success) return <main>Deck version not found.</main>;
  try {
    const s = service();
    const result = await s.call("get_deck", parsed.data, user.userId);
    return <HostedPresentation initial={await presentationData(s, user.userId, result)} />;
  } catch (error) { return <main role="alert">{safeError(error).message}</main>; }
}
