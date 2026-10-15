import { getChatGPTUser } from "@/app/chatgpt-auth";
import { canvaClient } from "@/src/server/runtime";
import { fail } from "@/src/server/errors";
import { errorResponse, privateHeaders } from "@/src/server/http";

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) fail("UNAUTHORIZED", "Sign in with the account that started the Canva connection, then reconnect.");
    const url = new URL(request.url), client = canvaClient();
    if (!client) fail("NOT_IMPLEMENTED", "Canva OAuth is not configured.");
    const cookie = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith("canva_oauth_state="))?.slice("canva_oauth_state=".length);
    await client.complete(user.userId, url.searchParams.get("state") ?? "", cookie, url.searchParams.get("code") ?? "");
    return new Response("Canva connected. Return to ChatGPT and call send_to_canva for your saved deck version. Each version creates a separate design; Canva edits do not sync back.", { headers: { ...privateHeaders, "Content-Type": "text/plain;charset=utf-8", "Set-Cookie": "canva_oauth_state=; HttpOnly; SameSite=Lax; Path=/api/canva; Max-Age=0" } });
  } catch (error) { return errorResponse(error); }
}
