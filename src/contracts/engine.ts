import type { CreateDeckInput, Layout, PreviewStage, RevisionOperation, SlideInput } from "./deck";

/** All geometry is in logical 1600×900 pixels. PPTX export uses 120 px/in. */
interface ElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export type Paint = { token: "background" | "foreground" | "muted" | "accent" } | { hex: string };
export type SlideElement =
  | (ElementBase & { type: "text"; text: string; fontFamily: "Arial"; fontSize: number; bold: boolean; color: Paint; align: "left" | "center" | "right" })
  | (ElementBase & { type: "shape"; shape: "rectangle" | "ellipse"; fill: Paint })
  | (ElementBase & { type: "line"; color: Paint; thickness: number })
  | (ElementBase & { type: "image"; assetId: string; alt: string });

export interface Theme {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

export interface SlideBlueprint {
  id: string;
  role: SlideInput["role"];
  layout: Layout;
  takeaway: string;
  notes: SlideInput["notes"];
  elements: SlideElement[];
}

export interface ChangeSummary {
  operation: RevisionOperation["type"];
  target: string;
  description: string;
}

export interface DeckBlueprint {
  schemaVersion: 1;
  deckId: string;
  version: number;
  input: CreateDeckInput;
  canvas: { width: 1600; height: 900 };
  theme: Theme;
  slides: SlideBlueprint[];
  changes: ChangeSummary[];
  validationIssues: ValidationIssue[];
}

export interface Asset {
  id: string;
  mimeType: "image/png" | "image/jpeg";
  data: Uint8Array;
}

/** Builder A implements this pure port; Builder B injects it into the service. */
export interface SlideEngine {
  createBlueprint(input: CreateDeckInput, identity: { deckId: string; version: number }): DeckBlueprint;
  reviseBlueprint(current: DeckBlueprint, operations: RevisionOperation[]): DeckBlueprint;
  validateBlueprint(blueprint: DeckBlueprint): ValidationIssue[];
  compilePowerPoint(blueprint: DeckBlueprint, assets: Asset[]): Promise<Uint8Array>;
  renderSlideSvg(slide: SlideBlueprint, theme: Theme, stage: PreviewStage, assets: Asset[]): string;
}
