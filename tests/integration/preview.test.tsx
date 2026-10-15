import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Presentation } from "../../src/preview/Presentation";
import { toolErrorMessage } from "../../src/preview/tool-error";
import { testEngine } from "./engine-double";
import { sampleDeck } from "../../src/fixtures/sample-deck";

describe("presentation failure states using labelled fixtures", () => {
  it("makes Canva the primary destination without treating an exported plan as delivery", () => {
    const blueprint = testEngine.createBlueprint(sampleDeck, { deckId: crypto.randomUUID(), version: 1 });
    const html = renderToStaticMarkup(<Presentation invoke={async () => {}} data={{ result: { blueprint, previewUrl: "https://example.test/preview", canva: { status: "connection_required", connectUrl: "https://example.test/connect" } }, previews: null }} />);
    expect(html).toContain("Create editable Canva deck");
    expect(html).toContain("A Canva design link has not been confirmed yet");
    expect(html).not.toContain("Your editable Canva presentation is ready");
  });
  it("shows the actual Canva editor link as the finished deliverable", () => {
    const blueprint = testEngine.createBlueprint(sampleDeck, { deckId: crypto.randomUUID(), version: 1 });
    const html = renderToStaticMarkup(<Presentation invoke={async () => {}} data={{ result: { blueprint, previewUrl: "https://example.test/preview", canva: { status: "succeeded", jobId: "test-job", designId: "test-design", editUrl: "https://www.canva.com/design/test/edit" } }, previews: null }} />);
    expect(html).toContain("Your editable Canva presentation is ready");
    expect(html).toContain('href="https://www.canva.com/design/test/edit"');
    expect(html).not.toContain("Create editable Canva deck");
  });
  it("keeps notes, slide selection and downloads when previews are unavailable", () => {
    const blueprint = testEngine.createBlueprint(sampleDeck, { deckId: crypto.randomUUID(), version: 1 });
    const html = renderToStaticMarkup(<Presentation data={{ result: { blueprint, previewUrl: "https://example.test/preview", canva: { status: "not_started" }, files: { pptxUrl: "https://example.test/pptx", notesUrl: "https://example.test/notes" } }, previews: null, previewError: "TEST: rendering unavailable" }} />);
    expect(html).toContain("TEST: rendering unavailable");
    expect(html).toContain(blueprint.slides[0].notes.core);
    expect(html).toContain("Download PowerPoint");
    expect(html.match(/aria-label="Select slide /g)).toHaveLength(5);
    expect(html).not.toContain("<img");
  });
  it("shows actionable structured service errors without raw transport payloads", () => {
    expect(toolErrorMessage({ error: { code: "EXPORT_FAILED", message: "Export failed. Retry the saved version." } })).toBe("Export failed. Retry the saved version.");
    expect(toolErrorMessage({ structuredContent: { error: { code: "VERSION_CONFLICT", message: "Read the latest version.", currentVersion: 4 } } })).toContain("Current version: 4");
    expect(toolErrorMessage({ debug: "private transport detail", message: "raw transport detail" })).not.toContain("transport detail");
  });
  it("shows a failed status refresh as an actionable alert without claiming the import failed", () => {
    const blueprint = testEngine.createBlueprint(sampleDeck, { deckId: crypto.randomUUID(), version: 1 });
    const html = renderToStaticMarkup(<Presentation data={{ result: { blueprint, previewUrl: "https://example.test/preview", files: { pptxUrl: "https://example.test/pptx", notesUrl: "https://example.test/notes" }, canva: { status: "failed", jobId: "kept-job", code: "CANVA_POLL_FAILED", message: "Job kept-job is preserved. Select Refresh import to retry this job." } }, previews: null }} />);
    expect(html).toContain("status unavailable · existing job preserved");
    expect(html).toContain('role="alert">Job kept-job is preserved. Select Refresh import');
    expect(html).toContain("Download PowerPoint");
    expect(html).toContain(blueprint.slides[0].notes.core);
  });
});
