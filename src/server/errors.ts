import type { ToolError } from "../contracts";

export class ServiceError extends Error {
  constructor(public readonly detail: ToolError) { super(detail.message); }
}
export function fail(code: ToolError["code"], message: string, currentVersion?: number): never {
  throw new ServiceError({ code, message, ...(currentVersion === undefined ? {} : { currentVersion }) });
}
export function safeError(error: unknown): ToolError {
  return error instanceof ServiceError ? error.detail : { code: "NOT_IMPLEMENTED", message: "Service unavailable. Check storage configuration and retry; existing versions are preserved." };
}
