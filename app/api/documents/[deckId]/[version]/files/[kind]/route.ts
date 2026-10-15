import { getChatGPTUser } from "@/app/chatgpt-auth";
import { deckVersionSchema } from "@/src/contracts";
import { documentService } from "@/src/server/runtime";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { fail } from "@/src/server/errors";

export async function GET(_request: Request, context: { params: Promise<{ deckId: string; version: string; kind: string }> }) {
  try {
    const user = await getChatGPTUser();
    if (!user) fail("UNAUTHORIZED", "Sign in with ChatGPT to download your document.");
    const params = await context.params, parsed = deckVersionSchema.safeParse({ deckId: params.deckId, version: Number(params.version) });
    if (!parsed.success) fail("NOT_FOUND", "Document version not found.");
    const bytes = await documentService().download(user.userId, parsed.data.deckId, parsed.data.version, params.kind), pptx = params.kind === "pptx";
    return new Response(new Uint8Array(bytes).buffer, { headers: { ...privateHeaders,
      "Content-Type": pptx ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "text/plain;charset=utf-8",
      "Content-Disposition": `attachment; filename="graphicrouter-document-v${parsed.data.version}.${pptx ? "pptx" : "txt"}"`,
    } });
  } catch (error) { return errorResponse(error); }
}
