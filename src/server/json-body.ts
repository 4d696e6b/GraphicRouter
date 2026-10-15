import { fail, ServiceError } from "./errors";

/** Enforce bytes while streaming, including when Content-Length is absent/false. */
export async function readJsonBody(request: Request, limit = 128_000): Promise<{ text: string; value: unknown }> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) fail("VALIDATION_FAILED", "JSON arguments exceed the request limit. Use smaller batches.");
  const reader = request.body?.getReader();
  if (!reader) fail("VALIDATION_FAILED", "Send a JSON request body.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { void reader.cancel().catch(() => {}); fail("VALIDATION_FAILED", "JSON arguments exceed the request limit. Use smaller batches."); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let at = 0;
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { text, value: JSON.parse(text) };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    fail("VALIDATION_FAILED", "The request body must contain valid UTF-8 JSON.");
  } finally { reader.releaseLock(); }
}
