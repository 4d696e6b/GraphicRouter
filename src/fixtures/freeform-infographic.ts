import type { CanvasElement, CreateCanvasInput } from "../contracts";

// Authored examples of tool arguments, not renderer templates. The canvas engine
// has no knowledge of either composition or these coordinates.
const brief = { idea: "Explain GraphicRouter's object-based design workflow.", audience: "People trying the prototype", purpose: "Show how a brief becomes an editable graphic.", facts: ["ChatGPT supplies structured design choices.", "The canvas engine renders native text, shapes, lines and registered images.", "Blueprint versions are immutable.", "Canva import is the final handoff."], unknowns: ["This new canvas format still needs live Canva fidelity inspection."] };
const text = (id: string, value: string, x: number, y: number, width: number, height: number, size: number, zIndex: number, color: string, bold = false): CanvasElement => ({ id, type: "text", text: value, x, y, width, height, fontSize: size, zIndex, color: { hex: color }, bold, align: "left", fontFamily: "Arial" });
const rect = (id: string, x: number, y: number, width: number, height: number, zIndex: number, color: string): CanvasElement => ({ id, type: "shape", shape: "rectangle", x, y, width, height, zIndex, fill: { hex: color } });
const dot = (id: string, x: number, y: number, size: number, zIndex: number, color: string): CanvasElement => ({ id, type: "shape", shape: "ellipse", x, y, width: size, height: size, zIndex, fill: { hex: color } });

export const portraitCanvas: CreateCanvasInput = {
  title: "From brief to better design", brief, canvas: { width: 1080, height: 1600 },
  theme: { background: "#F2F0E9", foreground: "#173B35", muted: "#526A61", accent: "#B54129" },
  designIntent: "A warm portrait editorial guide: 64px margin, oversized green headline, coral step markers on a vertical reading spine, and alternating quiet panels. Native objects retain editability.",
};
export const portraitStructure: CanvasElement[] = [
  { id: "reading.spine", type: "line", x: 120, y: 446, width: 0, height: 820, zIndex: 0, color: { hex: "#D4B7A3" }, thickness: 3 },
  ...[400, 650, 900, 1150].flatMap((y, i) => [rect(`step${i + 1}.panel`, 208, y - 24, 808, 212, 1 + i, i % 2 ? "#E5EADF" : "#FFFDF7"), dot(`step${i + 1}.marker`, 80, y, 80, 10 + i, i === 3 ? "#173B35" : "#B54129")]),
  rect("header.rule", 64, 328, 952, 3, 15, "#173B35"),
];
export const portraitContent: CanvasElement[] = [
  text("brand", "GRAPHICROUTER / OBJECT BY OBJECT", 64, 52, 950, 30, 20, 20, "#526A61", true),
  text("headline", "From brief to\nbetter design.", 64, 112, 940, 184, 76, 21, "#173B35", true),
  ...[
    ["Start with the space", "Choose the canvas, palette and reading path."],
    ["Build the structure", "Place shapes and connectors with a purpose."],
    ["Add the meaning", "Set clear headlines, labels and supplied facts."],
    ["Refine every object", "Review the composition. Hand off to Canva."],
  ].flatMap(([heading, body], i) => [
    text(`step${i + 1}.number`, `0${i + 1}`, 97, 419 + i * 250, 58, 44, 30, 30 + i, "#FFFFFF", true),
    text(`step${i + 1}.heading`, heading, 244, 406 + i * 250, 720, 56, 38, 40 + i, "#173B35", true),
    text(`step${i + 1}.body`, body, 244, 480 + i * 250, 698, 90, 28, 50 + i, "#526A61"),
  ]),
  text("footer", "Native text. Named objects. Versioned changes.", 64, 1444, 950, 42, 25, 60, "#173B35", true),
  text("verification", "Prototype example / new Canva format inspection pending", 64, 1504, 950, 32, 18, 61, "#526A61"),
];

export const landscapeCanvas: CreateCanvasInput = {
  title: "You direct the canvas", brief, canvas: { width: 1600, height: 900 },
  theme: { background: "#142035", foreground: "#F5F3E8", muted: "#C2CBDA", accent: "#BDF18D" },
  designIntent: "An asymmetric landscape map: large type on the left and a lime-connected three-stage object diagram on the right. Dark navy ground, restrained geometric accents and wide negative space.",
};
export const landscapeStructure: CanvasElement[] = [
  rect("diagram.top", 770, 152, 700, 150, 0, "#24344D"),
  rect("diagram.middle", 910, 374, 560, 150, 1, "#BDF18D"),
  rect("diagram.bottom", 770, 596, 700, 150, 2, "#24344D"),
  { id: "path.one", type: "line", x: 840, y: 304, width: 0, height: 144, zIndex: 3, color: { hex: "#BDF18D" }, thickness: 4 },
  { id: "path.two", type: "line", x: 840, y: 448, width: 65, height: 0, zIndex: 4, color: { hex: "#BDF18D" }, thickness: 4 },
  { id: "path.three", type: "line", x: 840, y: 450, width: 0, height: 146, zIndex: 5, color: { hex: "#BDF18D" }, thickness: 4 },
  dot("path.junction", 826, 434, 28, 6, "#BDF18D"), rect("intro.rule", 80, 158, 72, 6, 7, "#BDF18D"),
];
export const landscapeContent: CanvasElement[] = [
  text("brand", "GRAPHICROUTER", 80, 68, 600, 34, 22, 10, "#BDF18D", true),
  text("headline", "You direct\nthe canvas.", 80, 220, 660, 212, 80, 11, "#F5F3E8", true),
  text("intro", "A design built from\nindividual decisions.", 80, 486, 620, 110, 32, 12, "#C2CBDA"),
  text("diagram.plan", "01 / PLAN THE SPACE", 812, 194, 610, 58, 34, 13, "#F5F3E8", true),
  text("diagram.compose", "02 / PLACE THE OBJECTS", 952, 420, 480, 58, 30, 14, "#142035", true),
  text("diagram.refine", "03 / REVIEW + REFINE", 812, 642, 610, 58, 34, 15, "#F5F3E8", true),
  text("footer", "EDITABLE OBJECTS → CANVA", 80, 768, 660, 36, 22, 16, "#BDF18D", true),
  text("verification", "Prototype example / Canva format inspection pending", 80, 832, 1400, 28, 18, 17, "#C2CBDA"),
];
