import type { CreateDeckInput, DeckVersionInput, ReviseDeckInput } from "./deck";
import type { DeckBlueprint } from "./engine";

export const TOOL_NAMES = ["create_deck", "get_deck", "revise_deck", "export_deck", "send_to_canva"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export interface ToolInputs {
  create_deck: CreateDeckInput;
  get_deck: DeckVersionInput;
  revise_deck: ReviseDeckInput;
  export_deck: DeckVersionInput;
  send_to_canva: DeckVersionInput;
}

export type CanvaImport =
  | { status: "not_started" }
  | { status: "connection_required"; connectUrl: string }
  | { status: "pending"; jobId: string }
  | { status: "succeeded"; jobId: string; designId: string; editUrl: string }
  | { status: "failed"; jobId?: string; code: string; message: string };

export interface ExportFiles {
  pptxUrl: string;
  notesUrl: string;
}

export interface DeckResult {
  blueprint: DeckBlueprint;
  previewUrl: string;
  files?: ExportFiles;
  canva: CanvaImport;
}

export interface ToolOutputs {
  create_deck: DeckResult;
  get_deck: DeckResult;
  revise_deck: DeckResult;
  export_deck: DeckResult & { files: ExportFiles };
  send_to_canva: DeckResult;
}

export interface ToolError {
  code: "VALIDATION_FAILED" | "NOT_FOUND" | "VERSION_CONFLICT" | "UNAUTHORIZED" | "NOT_IMPLEMENTED" | "EXPORT_FAILED" | "CANVA_IMPORT_FAILED";
  message: string;
  /** Include currentVersion for stale writes; never silently retry a revision. */
  currentVersion?: number;
}
