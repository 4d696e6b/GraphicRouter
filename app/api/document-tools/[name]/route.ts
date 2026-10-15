import { getChatGPTUser } from "@/app/chatgpt-auth";
import { DOCUMENT_TOOL_NAMES,documentReadSchema } from "@/src/contracts";
import { documentService } from "@/src/server/runtime";
import { fail } from "@/src/server/errors";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { documentData } from "@/src/preview/document-data";
import { readJsonBody } from "@/src/server/json-body";

export async function POST(request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const user = await getChatGPTUser();
    if (!user) fail("UNAUTHORIZED", "Sign in with ChatGPT to use documents.");
    if (request.headers.get("origin") !== new URL(request.url).origin) fail("UNAUTHORIZED", "Use document controls from this Site.");
    const { name } = await context.params, tool = DOCUMENT_TOOL_NAMES.find(n => n === name);
    if (!tool) fail("NOT_FOUND", "Document tool not found.");
    if (!request.headers.get("content-type")?.startsWith("application/json")) fail("VALIDATION_FAILED", "Send JSON arguments.");
    const { value: args } = await readJsonBody(request);
    const read=tool==="get_document"?documentReadSchema.safeParse(args):null;
    if(read&&!read.success)fail("VALIDATION_FAILED","Use a saved document ID/version and up to5 preview page IDs.");
    const input=read?.success?{deckId:read.data.deckId,version:read.data.version}:args;
    const service = documentService(), result = await service.call(tool, input, user.userId);
    return Response.json(await documentData(service, user.userId, result,read?.success?read.data.pageIds:undefined), { headers: privateHeaders });
  } catch (error) { return errorResponse(error); }
}
