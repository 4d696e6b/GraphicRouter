import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { briefingIssues, briefingSchema, buildBriefingMessage, infographicDimensions, questions, type Answers } from "../../src/briefing/questions";
import { Briefing } from "../../src/preview/Briefing";
import { sendBriefingToChat } from "../../src/preview/briefing-handoff";

const ready: Answers = { format: "Five-slide presentation", topic: "Our real project", audience: "Hackathon judges", outcome: "Understand our prototype" };
describe("GraphicRouter guided briefing", () => {
  it("requires the format and three essential story answers but allows optional skips", () => {
    expect(briefingIssues({}).map(x => x.id)).toEqual(["format", "topic", "audience", "outcome"]);
    expect(briefingIssues(ready)).toEqual([]);
    const message = buildBriefingMessage({ context: "Supplied facts only", answers: ready });
    expect(message).toContain("GraphicRouter create_deck");
    expect(message).toContain("send_to_canva");
    expect(message).toContain("Not supplied — use design judgment; never invent facts.");
  });
  it("routes infographics through a blank canvas and editable object passes, preserving the deck option", () => {
    for (const [format, size] of [["Infographic — portrait", "1080 × 1920"], ["Infographic — square", "1080 × 1080"], ["Infographic — landscape", "1600 × 900"], ["Infographic — custom 1200 × 1800", "1200 × 1800"]]) {
      const answers = { ...ready, format };
      expect(briefingIssues(answers)).toEqual([]);
      const message = buildBriefingMessage({ context: "", answers });
      expect(message).toContain(`blank ${size} canvas`);
      for (const tool of ["create_canvas", "edit_canvas", "export_canvas", "send_canvas_to_canva", "get_canvas"]) expect(message).toContain(tool);
      expect(message).toContain("structure, content, and polish");
      expect(message).not.toContain("Use GraphicRouter create_deck");
      expect(message).toContain("Do not replace GraphicRouter with image generation");
    }
    expect(buildBriefingMessage({ context: "", answers: ready })).toContain("exactly five native editable slides");
  });
  it("rejects unknown formats and invalid custom dimensions before handoff", () => {
    for (const format of ["Single-page infographic / another format", "Infographic — custom size", "Infographic — 319 × 1080", "Infographic — 1080 x 4001", "Infographic — -1080 × 1920", "Arbitrary external format"]) {
      expect(briefingIssues({ ...ready, format })[0]).toMatchObject({ id: "format" });
      expect(() => buildBriefingMessage({ context: "", answers: { ...ready, format } })).toThrow("Choose an infographic size");
    }
    expect(infographicDimensions("Infographic — 320 x 4000")).toEqual({ width: 320, height: 4000 });
  });
  it("preserves a previously supplied duration without adding a question", () => {
    const message = buildBriefingMessage({ context: "", answers: { ...ready, duration: "5 minutes" } });
    const payload = JSON.parse(message.slice(message.indexOf("\n\n{") + 2));
    expect(questions).toHaveLength(20);
    expect(payload.answers).toContainEqual({ id: "duration", question: "Previously supplied talk duration", answer: "5 minutes" });
  });
  it("carries all 20 answers and original context into a single user handoff without truncation", () => {
    const answers = Object.fromEntries(questions.map(q => [q.id, `Supplied ${q.id} — ภาษาไทย <script>example</script>`])) as Answers;
    answers.format = ready.format;
    const context = "Original notes with \"quotes\" and\na newline";
    const message = buildBriefingMessage({ context, answers });
    const payload = JSON.parse(message.slice(message.indexOf("\n\n{") + 2));
    expect(payload.context).toBe(context);
    expect(payload.answers).toHaveLength(20);
    for (const answer of payload.answers) expect(answer.answer).toBe(answers[answer.id as keyof Answers]);
    expect(briefingSchema.safeParse({ answers: { unknownKey: "x" } }).success).toBe(false);
  });
  it("renders one accessible question, preserves prefills and escapes user-supplied text", () => {
    const html = renderToStaticMarkup(<Briefing initial={{ context: "", answers: { format: "Five-slide presentation", topic: "" } }} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Question 2 of 20");
    expect(html).toContain("What is your graphic or presentation about?");
    expect(html).not.toContain("What should the audience understand or do?");
    expect(html).toContain('aria-describedby="question-help"');
    const unsafe = renderToStaticMarkup(<Briefing initial={{ context: "", answers: { format: "<script>alert(1)</script>" } }} />);
    expect(unsafe).not.toContain("<script>");
  });
  it("shows custom dimension fields in the canvas-size question", () => {
    const answers = Object.fromEntries(questions.map(q => [q.id, "Supplied answer"])) as Answers;
    answers.format = "Infographic — custom 1200 × 1800";
    const html = renderToStaticMarkup(<Briefing initial={{ context: "", answers }} />);
    expect(html).toContain("Infographic — portrait");
    expect(html).toContain("Infographic — custom size");
    expect(html).toContain("Custom canvas dimensions");
    expect(html).toContain('type="number" min="320" max="4000" step="1"');
    expect(html).toContain('value="1200"');
    expect(html).toContain('value="1800"');
    expect(html).not.toContain("single-page infographic is not supported");
  });
  it("hands the complete brief to the host as one user message and never retries automatically", async () => {
    const message = buildBriefingMessage({ context: "No results yet", answers: ready });
    const send = vi.fn().mockResolvedValue({});
    await sendBriefingToChat(send, message);
    expect(send).toHaveBeenCalledExactlyOnceWith({ role: "user", content: [{ type: "text", text: message }] });
    for (const failure of [vi.fn().mockResolvedValue({ isError: true }), vi.fn().mockRejectedValue(new Error("disconnected"))]) {
      await expect(sendBriefingToChat(failure, message)).rejects.toThrow();
      expect(failure).toHaveBeenCalledTimes(1);
    }
  });
});
