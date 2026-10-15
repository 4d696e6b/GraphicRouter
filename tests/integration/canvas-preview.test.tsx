import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CanvasBlueprint } from "../../src/contracts";
import { Canvas, type CanvasData } from "../../src/preview/Canvas";

function fixture(): CanvasData {
  const blueprint: CanvasBlueprint = {
    schemaVersion: 2, kind: "canvas", deckId: "12345678-1234-4123-8123-123456789abc", version: 2,
    title: "TEST freeform poster <script>unsafe</script>",
    brief: { idea: "Verified test brief", audience: "Test readers", purpose: "Test the preview", facts: ["Fixture only"], unknowns: ["No real Canva import performed"] },
    canvas: { width: 1080, height: 1920 },
    theme: { background: "#FFFDF7", foreground: "#211C2E", muted: "#62596E", accent: "#7C3AED" },
    designIntent: "A tall reading path with deliberate open space.",
    elements: [{ id: "headline", type: "text", text: "TEST", fontFamily: "Arial", fontSize: 64, bold: true, align: "left", color: { token: "foreground" }, x: 80, y: 80, width: 800, height: 160, zIndex: 1 }],
    changes: [{ operation: "add_element", target: "headline", description: "Added the headline only." }],
    construction: [{ version: 1, phase: "blank", summary: "Started from a blank canvas.", elementCount: 0 }, { version: 2, phase: "content", summary: "Placed a test headline.", elementCount: 1 }],
    validationIssues: [],
  };
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#FFFDF7"/></svg>';
  return { result: { blueprint, previewUrl: "https://example.test/canvas", canva: { status: "not_started" } }, previews: { layout: svg, content: svg, finished: svg }, constructionPreviews: [svg, svg] };
}

describe("freeform canvas preview", () => {
  it("renders variable canvas dimensions, construction history, design decisions and native handoff", () => {
    const data = fixture();
    const html = renderToStaticMarkup(<Canvas data={data} invoke={async () => {}} />);
    expect(html).toContain("1080 × 1920 canvas");
    expect(html).toContain("aspect-ratio:1080/1920");
    expect(html).toContain("1 separate object");
    expect(html).toContain("A tall reading path with deliberate open space.");
    expect(html).toContain("Started from a blank canvas.");
    expect(html).toContain("Added the headline only.");
    expect(html).toContain("Create editable Canva design");
    expect(html).toContain("No real Canva import performed");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("slides");
  });
  it("preserves links and version evidence if rendering failed after a successful operation", () => {
    const data = fixture();
    data.previews = { layout: "", content: "", finished: "" };
    data.constructionPreviews = [];
    data.previewError = "TEST: operation succeeded; preview unavailable. Refresh the saved version.";
    data.result.files = { pptxUrl: "https://example.test/pptx", notesUrl: "https://example.test/notes" };
    const html = renderToStaticMarkup(<Canvas data={data} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain(data.previewError);
    expect(html).toContain("VERSION 2");
    expect(html).toContain("Download PowerPoint");
    expect(html).toContain("Download design notes");
    expect(html).not.toContain("<img");
  });
  it("shows real Canva success only after confirmed import and directs uncertain jobs to refresh", () => {
    const data = fixture();
    data.result.canva = { status: "connection_required", connectUrl: "https://example.test/connect" };
    const authHtml = renderToStaticMarkup(<Canvas data={data} invoke={async () => {}} />);
    expect(authHtml).toContain('href="https://example.test/connect"');
    expect(authHtml).toContain("A Canva design link has not been confirmed yet");
    expect(authHtml).not.toContain("Your editable Canva design is ready");
    data.result.canva = { status: "succeeded", jobId: "test-job", designId: "test-design", editUrl: "https://www.canva.com/design/test/edit" };
    const successHtml = renderToStaticMarkup(<Canvas data={data} invoke={async () => {}} />);
    expect(successHtml).toContain("Canva import complete. Check its text layers before delivery.");
    expect(successHtml).toContain('href="https://www.canva.com/design/test/edit"');
    expect(successHtml).not.toContain("Create editable Canva design");
    data.result.canva = { status: "failed", code: "CANVA_POLL_FAILED", jobId: "kept-job", message: "Refresh kept-job; it has not been restarted." };
    const pendingHtml = renderToStaticMarkup(<Canvas data={data} invoke={async () => {}} />);
    expect(pendingHtml).toContain("status unavailable · existing job preserved");
    expect(pendingHtml).toContain("Refresh import");
    expect(pendingHtml).not.toContain("Create editable Canva design");
  });
});
