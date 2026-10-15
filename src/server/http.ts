import { safeError } from "./errors";
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
export function errorResponse(error: unknown) {
  const detail = safeError(error);
  const status = { UNAUTHORIZED: 401, NOT_FOUND: 404, VERSION_CONFLICT: 409, VALIDATION_FAILED: 400, NOT_IMPLEMENTED: 503, EXPORT_FAILED: 502, CANVA_IMPORT_FAILED: 502 }[detail.code];
  return Response.json({ error: detail }, { status, headers: privateHeaders });
}
