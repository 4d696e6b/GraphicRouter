import { getChatGPTUser } from "@/app/chatgpt-auth";
import { TOOL_NAMES } from "@/src/contracts";
import { service } from "@/src/server/runtime";
import { fail } from "@/src/server/errors";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { presentationData } from "@/src/preview/data";
import { readJsonBody } from "@/src/server/json-body";

export async function POST(request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const user = await getChatGPTUser();
    if (!user) fail("UNAUTHORIZED", "Sign in with ChatGPT to use presentations.");
    if (request.headers.get("origin") !== new URL(request.url).origin) fail("UNAUTHORIZED", "Use the presentation controls from this Site.");
    const { name } = await context.params;
    const tool = TOOL_NAMES.find(value => value === name);
    if (!tool) fail("NOT_FOUND", "Tool not found.");
    if (!request.headers.get("content-type")?.startsWith("application/json")) fail("VALIDATION_FAILED", "Send JSON tool arguments.");
    const { value: args } = await readJsonBody(request);
    const s = service(), result = await s.call(tool, args, user.userId);
    return Response.json(await presentationData(s, user.userId, result), { headers: privateHeaders });
  } catch (error) { return errorResponse(error); }
}
