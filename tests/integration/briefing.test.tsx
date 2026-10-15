import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { briefingIssues, briefingSchema, buildBriefingMessage, getQuestions, nextBriefingQuestion, infographicDimensions, questions, type Answers } from "../../src/briefing/questions";
import { Briefing } from "../../src/preview/Briefing";
import { sendBriefingToChat } from "../../src/preview/briefing-handoff";

const ready: Answers = { complexity: "Quick and simple", template: "Start from a blank canvas", topic: "Our real project and supplied facts", audience: "Hackathon judges", outcome: "Understand our prototype" };
const payload = (message: string) => JSON.parse(message.slice(message.indexOf("\n\n{") + 2));
describe("adaptive GraphicRouter briefing", () => {
  it("asks complexity then template first, without displaying the full question bank", () => {
    expect(getQuestions({}).map(q => q.id)).toEqual(["complexity", "template"]);
    expect(nextBriefingQuestion({})?.id).toBe("complexity");
    expect(nextBriefingQuestion({ complexity: "Balanced" })?.id).toBe("template");
    expect(briefingIssues({}).map(i => i.id)).toEqual(["complexity", "template", "topic", "audience", "outcome"]);
    const html = renderToStaticMarkup(<Briefing initial={{ context: "", answers: {} }} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain("How complex is this project?");
    expect(html).not.toContain("What is it about");
  });
  it("changes question budgets and adds a source question only for template work", () => {
    for (const [complexity, count] of [["Quick and simple", 6], ["Balanced", 9], ["Detailed", 14]] as const) {
      const blank = getQuestions({ complexity, template: "Start from a blank canvas" });
      expect(blank).toHaveLength(count);
      expect(blank.slice(0, 2).map(q => q.id)).toEqual(["complexity", "template"]);
      expect(getQuestions({ complexity, template: "Use a Canva template" })).toHaveLength(count + 1);
      expect(getQuestions({ complexity, template: "Help me choose" })).toHaveLength(count + 1);
      expect(blank.some(q => q.id === "templateSource")).toBe(false);
    }
  });
  it("preserves prefills and branch answers when changing complexity or starting point", () => {
    const detailed: Answers = { ...ready, complexity: "Detailed", brand: "Exact teal #007C78", references: "A supplied reference", templateSource: "https://www.canva.com/design/example/edit" };
    expect(nextBriefingQuestion(detailed, "template")?.id).toBe("format");
    const shorter = { ...detailed, complexity: "Quick and simple" };
    expect(getQuestions(shorter).some(q => q.id === "brand")).toBe(false);
    const data = payload(buildBriefingMessage({ context: "Saved notes", answers: shorter }));
    expect(data.workflowMode).toBe("graphicrouter_canvas");
    expect(data.answers).toContainEqual(expect.objectContaining({ id: "brand", answer: "Exact teal #007C78" }));
    expect(data.answers).toContainEqual(expect.objectContaining({ id: "references", answer: "A supplied reference" }));
    expect(nextBriefingQuestion({ ...shorter, template: "Use a Canva template", templateSource: "" }, "template")?.id).toBe("templateSource");
    expect(getQuestions({ ...shorter, template: "Start from a blank canvas" }).some(q => q.id === "templateSource")).toBe(false);
  });
  it("accepts essential facts without optional questions and uses a portrait default", () => {
    expect(briefingIssues(ready)).toEqual([]);
    const message = buildBriefingMessage({ context: "Supplied facts only", answers: ready });
    for (const tool of ["create_canvas", "edit_canvas", "inspect_canvas", "send_canvas_to_canva", "get_canvas"]) expect(message).toContain(tool);
    expect(message).toContain("blank 1080 × 1920 canvas");
    expect(message).toContain("not a request for another interview");
    expect(message).toContain("Not supplied — use design judgment; never invent facts.");
    expect(() => buildBriefingMessage({ context: "", answers: { ...ready, complexity: "maximum" } })).toThrow("Choose Quick");
  });
  it("routes native Canva work explicitly without claiming a synchronized blueprint or public catalogue", () => {
    const message = buildBriefingMessage({ context: "", answers: { ...ready, template: "Use a Canva template" } });
    expect(payload(message).workflowMode).toBe("canva_native");
    for (const text of ["connected Canva tools", "create-design-from-brand-template", "copy-design", "user approval", "source of truth", "do not silently substitute"]) expect(message).toContain(text);
    expect(message).not.toContain("Use GraphicRouter create_canvas");
    const choose = buildBriefingMessage({ context: "", answers: { ...ready, template: "Help me choose" } });
    expect(payload(choose).workflowMode).toBe("choose");
    expect(choose).toContain("one selection question");
  });
  it("supports custom canvas sizes and legacy slides with previously supplied durations", () => {
    for (const [format, size] of [["Infographic — square", "1080 × 1080"], ["Infographic — landscape", "1600 × 900"], ["Infographic — custom 1200 × 1800", "1200 × 1800"]]) {
      expect(buildBriefingMessage({ context: "", answers: { ...ready, format } })).toContain(`blank ${size} canvas`);
    }
    expect(infographicDimensions("Infographic — 320 x 4000")).toEqual({ width: 320, height: 4000 });
    for (const format of ["Arbitrary format", "Infographic — 319 × 1080", "Infographic — 1080 × 4001"]) expect(briefingIssues({ ...ready, format })[0].id).toBe("format");
    const message = buildBriefingMessage({ context: "", answers: { format: "Five-slide presentation", topic: "Old complete brief", audience: "Judges", outcome: "Understand", duration: "5 minutes" } });
    expect(message).toContain("exactly five native editable slides");
    expect(payload(message).answers).toContainEqual(expect.objectContaining({ id: "duration", answer: "5 minutes" }));
  });
  it("escapes supplied text, displays one question, and shows custom dimension fields", () => {
    const html = renderToStaticMarkup(<Briefing initial={{ context: "", answers: { complexity: "Balanced", template: "Start from a blank canvas", topic: "<script>alert(1)</script>" } }} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("Who will read or see it?");
    expect(html).toContain('aria-describedby="question-help"');
    const supplied = Object.fromEntries(questions.map(q => [q.id, "Supplied answer"])) as Answers;
    supplied.complexity = "Detailed"; supplied.template = "Start from a blank canvas"; supplied.format = "Infographic — custom 1200 × 1800";
    const reviewHtml = renderToStaticMarkup(<Briefing initial={{ context: "", answers: supplied }} />);
    expect(reviewHtml).toContain("Ready to compose your design?");
    expect(reviewHtml).toContain("1200 × 1800");
  });
  it("preserves all supplied hidden answers and rejects unknown fields", () => {
    const answers = Object.fromEntries(questions.map(q => [q.id, `Supplied ${q.id} — ภาษาไทย <script>example</script>`])) as Answers;
    Object.assign(answers, { ...ready, format: "Infographic — square" });
    const data = payload(buildBriefingMessage({ context: 'Original "quotes"\nand a newline', answers }));
    expect(data.answers).toHaveLength(questions.length);
    for (const item of data.answers) expect(item.answer).toBe(answers[item.id as keyof Answers]);
    expect(data.context).toBe('Original "quotes"\nand a newline');
    expect(briefingSchema.safeParse({ answers: { password: "x" } }).success).toBe(false);
  });
  it("tailors topic questions to the brief while protecting the first two choices", () => {
    const prompts = { topic: { title: "Which actions should this instructional graphic demonstrate?", help: "List the required steps and the source you trust." } };
    const html = renderToStaticMarkup(<Briefing initial={{ context: "Instructional graphic", answers: { complexity: "Quick and simple", template: "Start from a blank canvas" }, prompts }} />);
    expect(html).toContain(prompts.topic.title);
    expect(html).toContain(prompts.topic.help);
    expect(payload(buildBriefingMessage({ context: "", answers: ready, prompts })).answers).toContainEqual(expect.objectContaining({ id: "topic", question: prompts.topic.title }));
    expect(briefingSchema.safeParse({ prompts: { complexity: prompts.topic } }).success).toBe(false);
    expect(briefingSchema.safeParse({ prompts: { password: prompts.topic } }).success).toBe(false);
    expect(briefingSchema.safeParse({ prompts: { topic: { title: "x".repeat(141), help: "x" } } }).success).toBe(false);
  });
  it("sends one complete user handoff and never retries automatically", async () => {
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
