import type { PreviewStage } from "../../src/contracts";
export interface DemoData {
  views: Record<PreviewStage, string[]>;
  violet: string;
  title: string;
  idea: string;
  audience: string;
  slides: { role: string; headline: string }[];
}
export interface TabletData {
  title: string;
  idea: string;
  audience: string;
  cover: string;
  layout: string;
  content: string;
  finished: string;
  violet: string;
}
