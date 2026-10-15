import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { briefingIssues, briefingSchema, buildBriefingMessage, getQuestions, nextBriefingQuestion, infographicDimensions, questions, type Answers } from "../../src/briefing/questions";
import { Briefing } from "../../src/preview/Briefing";
import { sendBriefingToChat } from "../../src/preview/briefing-handoff";
import { canvaSourceFallbackOption } from "../../src/briefing/canva-workflow";

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
      expect(getQuestions({ complexity, template: "Use my Canva template/design" })).toHaveLength(count + 1);
      expect(getQuestions({ complexity, template: "Let Canva create a design" })).toHaveLength(count);
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
    for (const text of ["connected Canva tools", "create-design-from-brand-template", "copy-design", "approval requirement", "source of truth", "Never restart the interview or silently switch"]) expect(message).toContain(text);
    expect(message).not.toContain("Use GraphicRouter create_canvas");
    const choose = buildBriefingMessage({ context: "", answers: { ...ready, template: "Help me choose" } });
    expect(payload(choose).workflowMode).toBe("choose");
    expect(choose).toContain("one selection question");
  });
  it("shows three honest starting points and routes a completed new-Canva brief without template discovery", () => {
    const html = renderToStaticMarkup(<Briefing initial={{ context: "", answers: { complexity: "Quick and simple" } }} />);
    for (const option of ["Let Canva create a design", "Use my Canva template/design", "Start from a blank canvas"]) expect(html).toContain(option);
    expect(html).toContain("Recommended for independently editable text");
    expect(html).toContain("simpler toolkit suits precise charts");
    expect(html).not.toContain(">Use a Canva template<");
    const answers: Answers = { ...ready, template: "Let Canva create a design", topic: "Five handwashing steps", audience: "Children", outcome: "Follow the steps", setting: "Printed page / poster", mustInclude: "Preserve the supplied source credit" };
    const message = buildBriefingMessage({ context: "Verified facts in the completed brief", answers });
    expect(payload(message)).toMatchObject({ workflowMode: "canva_create", sourceFallback: "ask" });
    expect(message).toContain("call create-design directly; do not search Brand Templates first");
    expect(message).toContain("without another interview or routine approval request");
    expect(message).toContain("keep the user's selected creation route and visual direction across subjects");
    expect(message).toContain("Every visible heading, number, label");
    expect(message).toContain("review_canva_design");
    expect(message).toContain("background-only preview");
    expect(message).toContain("Never commit this diagnostic deletion");
    expect(message).not.toContain("Use GraphicRouter create_canvas");
    expect(message).not.toContain("Adapt an existing accessible Canva template/design");
    for (const [id, answer] of Object.entries(answers)) expect(payload(message).answers).toContainEqual(expect.objectContaining({ id, answer }));
    const complete = { ...answers, format: "Infographic — portrait" };
    const review = renderToStaticMarkup(<Briefing initial={{ context: "", answers: complete }} submit={async () => {}} />);
    expect(review).toContain("No Brand Template is required");
    expect(review).toContain("Create a new design in Canva");
  });
  it("honors early fallback permission without weakening a specific existing-source requirement", () => {
    const source = { ...ready, template: "Use my Canva template/design", templateSource: "https://www.canva.com/design/user-supplied/edit" };
    const strict = buildBriefingMessage({ context: "", answers: source });
    expect(payload(strict)).toMatchObject({ workflowMode: "canva_native", sourceFallback: "ask" });
    expect(strict).toContain("no — preserve a required source");
    expect(strict).toContain('A bare "approve" after multiple alternative routes is ambiguous');
    expect(strict).not.toContain("Authorized fallback policy:");
    expect(payload(strict).answers).toContainEqual(expect.objectContaining({ id: "templateSource", answer: source.templateSource }));
    const allowed = buildBriefingMessage({ context: "", answers: { ...source, templateSource: canvaSourceFallbackOption } });
    expect(payload(allowed)).toMatchObject({ workflowMode: "canva_native", sourceFallback: "canva_create" });
    expect(allowed).toContain("without another route confirmation");
    expect(allowed).toContain("call create-design directly");
    const changed = buildBriefingMessage({ context: "", answers: { ...source, template: "Start from a blank canvas", templateSource: canvaSourceFallbackOption } });
    expect(payload(changed)).toMatchObject({ workflowMode: "graphicrouter_canvas", sourceFallback: "ask" });
    expect(changed).not.toContain("Authorized fallback policy:");
  });
  it("keeps Canva generation polling, quota, branding and editing approval constraints in the completed handoff", () => {
    const message = buildBriefingMessage({ context: "", answers: { ...ready, template: "Let Canva create a design" } });
    for (const text of ["If the Canva widget is shown, let it poll", "polling_policy.wait_seconds", "newest continuation_token", "quota_exceeded", "do not retry", "cannot apply a brand kit", "before commit-editing-transaction", "source of truth"]) expect(message).toContain(text);
    expect(briefingIssues({ ...ready, template: "Choose any route without asking" })[0].id).toBe("template");
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
