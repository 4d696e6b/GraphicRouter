import { getChatGPTUser } from "@/app/chatgpt-auth";
import { handleMcp } from "@/src/mcp/server";
import { service } from "@/src/server/runtime";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { fail } from "@/src/server/errors";

export async function POST(request: Request) {
  try {
    // Sites dispatch authenticates the connection; a bypass token is not a user identity.
    const user = await getChatGPTUser();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) fail("UNAUTHORIZED", "Cross-origin MCP requests are not allowed.");
    let body: { method?: unknown } | null;
    try { body = await request.clone().json() as { method?: unknown } | null; }
    catch { fail("VALIDATION_FAILED", "MCP requests must contain valid JSON."); }
    if (body?.method === "tools/call" && !user) fail("UNAUTHORIZED", "Sign in with ChatGPT to use presentation tools.");
    const response = await handleMcp(request, user?.userId ?? null, service);
    Object.entries(privateHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  } catch (error) { return errorResponse(error); }
}
export function GET() { return new Response(null, { status: 405, headers: { Allow: "POST" } }); }
