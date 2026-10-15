import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { canvaClient } from "@/src/server/runtime";
import { fail } from "@/src/server/errors";
import { errorResponse, privateHeaders } from "@/src/server/http";

export async function GET(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.redirect(new URL(chatGPTSignInPath("/api/canva/connect"), request.url));
    const client = canvaClient();
    if (!client) fail("NOT_IMPLEMENTED", "Canva OAuth is not configured. Download the PPTX and upload it manually in Canva.");
    const { url, state } = await client.begin(user.userId);
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return new Response(null, { status: 302, headers: { ...privateHeaders, Location: url,
      "Set-Cookie": `canva_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/canva; Max-Age=600${secure}` } });
  } catch (error) { return errorResponse(error); }
}
