import { getChatGPTUser } from "@/app/chatgpt-auth";
import { CANVAS_TOOL_NAMES } from "@/src/contracts";
import { canvasService } from "@/src/server/runtime";
import { fail } from "@/src/server/errors";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { canvasData } from "@/src/preview/data";

export async function POST(request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const user = await getChatGPTUser();
    if (!user) fail("UNAUTHORIZED", "Sign in with ChatGPT to use canvases.");
    if (request.headers.get("origin") !== new URL(request.url).origin) fail("UNAUTHORIZED", "Use canvas controls from this Site.");
    const { name } = await context.params, tool = CANVAS_TOOL_NAMES.find(n => n === name);
    if (!tool) fail("NOT_FOUND", "Canvas tool not found.");
    if (!request.headers.get("content-type")?.startsWith("application/json")) fail("VALIDATION_FAILED", "Send JSON arguments.");
    const text = await request.text();
    if (text.length > 128000) fail("VALIDATION_FAILED", "Canvas arguments are too large. Use smaller construction passes.");
    let args: unknown;
    try { args = JSON.parse(text); } catch { fail("VALIDATION_FAILED", "Arguments must be valid JSON."); }
    const service = canvasService(), result = await service.call(tool, args, user.userId);
    return Response.json(await canvasData(service, user.userId, result), { headers: privateHeaders });
  } catch (error) { return errorResponse(error); }
}
