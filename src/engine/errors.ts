import type { ValidationIssue } from "../contracts";

export class EngineError extends Error {
  readonly code: "VALIDATION_FAILED" | "EXPORT_FAILED";
  constructor(message: string, readonly issues: ValidationIssue[] = [], code: "VALIDATION_FAILED" | "EXPORT_FAILED" = "VALIDATION_FAILED") {
    super(message);
    this.name = "EngineError";
    this.code = code;
  }
}

export function fail(code: string, path: string, message: string): never {
  throw new EngineError(message, [{ severity: "error", code, path, message }]);
}

export function assertNoErrors(issues: ValidationIssue[]): void {
  const errors = issues.filter((issue) => issue.severity === "error");
  if (errors.length) throw new EngineError(errors[0].message, errors);
}
