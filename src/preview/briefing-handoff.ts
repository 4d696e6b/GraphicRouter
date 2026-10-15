/** Minimal host bridge, kept separate so rejection/transport behavior is testable. */
export async function sendBriefingToChat(
  send: (params: { role: "user"; content: { type: "text"; text: string }[] }) => Promise<{ isError?: boolean }>,
  message: string,
) {
  const result = await send({ role: "user", content: [{ type: "text", text: message }] });
  if (result.isError) throw new Error("The host did not accept the briefing.");
}
