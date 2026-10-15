import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { briefingIssues, briefingSchema, buildBriefingMessage, questions, type Answers } from "../../src/briefing/questions";
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
  it("blocks one-page infographics rather than handing them to an image generator", () => {
    const answers = { ...ready, format: "Single-page infographic / another format" };
    expect(briefingIssues(answers)[0]).toMatchObject({ id: "format" });
    expect(() => buildBriefingMessage({ context: "", answers })).toThrow("not supported");
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
    expect(html).toContain("What is your presentation about?");
    expect(html).not.toContain("What should the audience understand or decide?");
    expect(html).toContain('aria-describedby="question-help"');
    const unsafe = renderToStaticMarkup(<Briefing initial={{ context: "", answers: { format: "<script>alert(1)</script>" } }} />);
    expect(unsafe).not.toContain("<script>");
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
