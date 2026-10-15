import { getChatGPTUser } from "@/app/chatgpt-auth";
import { handleMcp } from "@/src/mcp/server";
import { service, canvasService } from "@/src/server/runtime";
import { errorResponse, privateHeaders } from "@/src/server/http";
import { fail } from "@/src/server/errors";
import { readJsonBody } from "@/src/server/json-body";

export async function POST(request: Request) {
  try {
    // Sites dispatch authenticates the connection; a bypass token is not a user identity.
    const user = await getChatGPTUser();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) fail("UNAUTHORIZED", "Cross-origin MCP requests are not allowed.");
    const { text, value } = await readJsonBody(request, 1_000_000);
    const body = value as { method?: unknown } | null;
    if (body?.method === "tools/call" && !user) fail("UNAUTHORIZED", "Sign in with ChatGPT to use presentation tools.");
    const boundedRequest = new Request(request.url, { method: request.method, headers: request.headers, body: text, signal: request.signal });
    const response = await handleMcp(boundedRequest, user?.userId ?? null, service, canvasService);
    Object.entries(privateHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  } catch (error) { return errorResponse(error); }
}
export function GET() { return new Response(null, { status: 405, headers: { Allow: "POST" } }); }
