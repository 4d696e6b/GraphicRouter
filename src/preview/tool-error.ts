/** Only surface the service's structured error; never echo transport/debug payloads. */
export function toolErrorMessage(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const structured = record.structuredContent;
    const source = typeof structured === "object" && structured !== null ? structured as Record<string, unknown> : record;
    const error = source.error;
    if (typeof error === "object" && error !== null) {
      const detail = error as Record<string, unknown>;
      if (typeof detail.message === "string" && typeof detail.code === "string") {
        const message = detail.message.slice(0, 2000);
        return detail.code === "VERSION_CONFLICT" && typeof detail.currentVersion === "number"
          ? `${message} Current version: ${detail.currentVersion}.` : message;
      }
    }
  }
  return "The request failed. Your saved deck is preserved. Try again or open the presentation.";
}
