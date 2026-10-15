import { getChatGPTUser } from "@/app/chatgpt-auth";
import { canvasVersionSchema } from "@/src/contracts";
import { canvasService } from "@/src/server/runtime";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { fail } from "@/src/server/errors";

export async function GET(_request: Request, context: { params: Promise<{ deckId: string; version: string; kind: string }> }) {
  try {
    const user = await getChatGPTUser();
    if (!user) fail("UNAUTHORIZED", "Sign in with ChatGPT to download your canvas.");
    const params = await context.params, parsed = canvasVersionSchema.safeParse({ deckId: params.deckId, version: Number(params.version) });
    if (!parsed.success) fail("NOT_FOUND", "Canvas version not found.");
    const bytes = await canvasService().download(user.userId, parsed.data.deckId, parsed.data.version, params.kind), pptx = params.kind === "pptx";
    return new Response(new Uint8Array(bytes).buffer, { headers: { ...privateHeaders,
      "Content-Type": pptx ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "text/plain;charset=utf-8",
      "Content-Disposition": `attachment; filename="graphicrouter-canvas-v${parsed.data.version}.${pptx ? "pptx" : "txt"}"`,
    } });
  } catch (error) { return errorResponse(error); }
}
