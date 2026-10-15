import { ServiceError } from "../../server/errors";

/** Raised only before import bytes are sent, or after an explicit 401 rejection.
 * The service may release its new-job claim for this error, never for a timeout
 * or an ambiguous upstream response after the import POST has started. */
export class CanvaConnectionRequired extends ServiceError {
  constructor(message = "Canva authorization is unavailable. Reconnect Canva to continue.") {
    super({ code: "CANVA_IMPORT_FAILED", message });
  }
}
