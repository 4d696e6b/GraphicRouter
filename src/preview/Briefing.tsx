"use client";
import { useEffect, useRef, useState } from "react";
import { buildBriefingMessage, briefingIssues, getQuestions, infographicDimensions, nextBriefingQuestion, questions, startingPointHelp, workflowMode, type Answers, type BriefingData, type BriefingQuestion } from "../briefing/questions";
import { canvaSourceFallbackOption } from "../briefing/canva-workflow";

export function Briefing({ initial, submit }: { initial: BriefingData; submit?: (message: string) => Promise<void> }) {
  const [answers, setAnswers] = useState<Answers>({ ...initial.answers });
  const [questionId, setQuestionId] = useState<BriefingQuestion["id"]>(() => nextBriefingQuestion(initial.answers)?.id ?? "complexity");
  const [review, setReview] = useState(() => !nextBriefingQuestion(initial.answers)), [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState("");
  const [handoff, setHandoff] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [questionId, review]);
  const activeQuestions = getQuestions(answers);
  const baseQuestion = (editing ? questions.find(item => item.id === questionId) : activeQuestions.find(item => item.id === questionId)) ?? activeQuestions[0];
  const q = { ...baseQuestion, ...initial.prompts?.[baseQuestion.id] };
  const index = Math.max(0, activeQuestions.findIndex(item => item.id === q.id)), value = answers[q.id] ?? "";
  const issues = briefingIssues(answers);
  const required = "required" in q && q.required;
  const options: readonly string[] = "options" in q ? q.options : [];
  const questionIssue = issues.find(issue => issue.id === q.id);
  const isRoutingChoice = q.id === "complexity" || q.id === "template";
  const isCustomSize = q.id === "format" && value.startsWith("Infographic — custom");
  const customSize = value.match(/(\d+)\s*[x×]\s*(\d+)/);
  const dimensions = infographicDimensions(answers.format?.trim() || "Infographic — portrait");
  const isDeck = answers.format?.trim() === "Five-slide presentation";
  const route = workflowMode(answers.template);
  const useTemplate = route === "canva_native", createInCanva = route === "canva_create", chooseTemplate = route === "choose";
  const savedExtras = questions.filter(item => !activeQuestions.some(active => active.id === item.id) && answers[item.id]?.trim());
  const reviewQuestions = [...activeQuestions, ...savedExtras];
  const button = { padding: "12px 18px", borderRadius: 12, border: "1px solid #d5cfe2", background: "white", color: "#282235", cursor: "pointer", font: "inherit" };
  function move(id: BriefingQuestion["id"], fromReview = false) { setQuestionId(id); setReview(false); setEditing(fromReview); setError(""); }
  function changeAnswer(id: BriefingQuestion["id"], answer: string) { setAnswers(a => ({ ...a, [id]: answer })); setHandoff(""); setError(""); }
  function advance(nextAnswers: Answers) {
    setError("");
    if (editing) { setReview(true); setEditing(false); return; }
    const next = nextBriefingQuestion(nextAnswers, q.id);
    if (!next) setReview(true); else setQuestionId(next.id);
  }
  function next() {
    if (required && !value.trim()) { setError("Please answer this question before continuing."); return; }
    if (questionIssue) { setError(questionIssue.message); return; }
    advance(answers);
  }
  async function finish() {
    if (issues.length) {
      const target = questions.find(item => item.id === issues[0].id);
      if (target) move(target.id);
      setError(issues[0].message); return;
    }
    const message = buildBriefingMessage({ context: initial.context, answers, prompts: initial.prompts });
    setHandoff(message); setError("");
    if (!submit) return;
    setBusy(true);
    try { await submit(message); setSent(true); }
    catch { setError("The chat handoff was not confirmed. Your answers are still here. Check the chat before retrying, or copy the brief below into the same chat with GraphicRouter selected."); }
    finally { setBusy(false); }
  }
  const reviewDescription = createInCanva
    ? "Create a new draft directly in Canva from your completed brief. No Brand Template is required. It must pass native text-layer, background and visual checks before delivery. Text baked into an image is not accepted as editable. The Canva design is the source of truth."
    : useTemplate
    ? `Inspect your accessible Canva template/design and adapt a copy. ${answers.templateSource?.trim() === canvaSourceFallbackOption ? "If no source fits, you have allowed a new Canva design using the same brief." : "If a required source is unavailable, we will ask before changing that requirement."} The Canva copy is the source of truth.`
    : chooseTemplate ? "First compare inspected, accessible Canva options with a blank-canvas direction. Choose once in the chat before we start the final design."
      : isDeck ? "Five editable slides · Arial · 16:9 · Canva." : dimensions ? `One blank ${dimensions.width} × ${dimensions.height} canvas → structure → content → visual review → Canva. This route uses GraphicRouter’s simpler text-and-shape toolkit; it does not use Canva’s full illustration or font library.` : "Choose a supported canvas size or the five-slide presentation.";
  return <main style={{ fontFamily: "Arial, sans-serif", color: "#211c2e", background: "#f5f2fb", padding: "clamp(12px,3vw,28px)", maxWidth: 820, margin: "auto" }}>
    <section role="dialog" aria-labelledby="briefing-title" style={{ background: "#fffefa", border: "1px solid #e2dcec", borderRadius: 24, padding: "clamp(20px,4vw,36px)", boxShadow: "0 12px 40px #33204c0d" }}>
      <p style={{ color: "#6d28d9", fontSize: 12, letterSpacing: ".12em", fontWeight: 700 }}>GRAPHICROUTER · DESIGN BRIEF</p>
      <p style={{ color: "#686173", fontSize: 14 }}>{review ? "Review your direction" : editing ? "Edit your saved answer" : `${q.group} · Question ${index + 1} of ${activeQuestions.length}`}</p>
      <progress aria-label="Briefing progress" value={review ? activeQuestions.length : index + 1} max={activeQuestions.length} style={{ width: "100%", accentColor: "#7C3AED", height: 6 }} />
      <h1 id="briefing-title" ref={heading} tabIndex={-1} style={{ fontSize: "clamp(24px,4vw,34px)", lineHeight: 1.2, letterSpacing: "-.025em", outline: "none" }}>{sent ? "Your brief is back in the chat." : review ? "Ready to compose your design?" : q.title}</h1>
      {sent ? <p role="status" style={{ lineHeight: 1.7 }}>Your answers are back in the chat for the chosen design workflow and Canva delivery. The form alone has not created a design. Continue in the chat to follow the result.</p>
      : review ? <>
        <p style={{ lineHeight: 1.7 }}>{reviewDescription} Optional gaps use design judgment; factual gaps stay explicit. Review or edit any answer before continuing.</p>
        {initial.context && <details><summary>Original context</summary><p style={{ whiteSpace: "pre-wrap" }}>{initial.context}</p></details>}
        <dl style={{ margin: "20px 0" }}>{reviewQuestions.map(item => <div key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid #e8e3ed" }}><dt style={{ fontWeight: 700 }}>{initial.prompts?.[item.id]?.title ?? item.title}</dt><dd style={{ margin: "8px 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#62596e" }}>{answers[item.id]?.trim() || (item.id === "format" ? "Portrait infographic (default)" : "Choose for me / not supplied")}</dd><button type="button" disabled={busy} onClick={() => move(item.id, true)} style={button}>Edit {item.group.toLowerCase()} answer</button></div>)}</dl>
        {answers.duration && <p style={{ whiteSpace: "pre-wrap" }}>Previously supplied talk duration: {answers.duration}</p>}
        {issues.length > 0 && <p role="alert">{issues[0].message}</p>}
        <button type="button" disabled={busy} onClick={finish} style={{ ...button, background: "#7C3AED", color: "white" }}>{busy ? "Sending your brief…" : submit ? createInCanva ? "Create a new design in Canva" : chooseTemplate ? "Compare design directions in chat" : useTemplate ? "Adapt a Canva copy in chat" : "Create in Canva with GraphicRouter" : "Prepare brief for GraphicRouter"}</button>
      </> : <form onSubmit={e => { e.preventDefault(); next(); }}>
        <p id="question-help" style={{ color: "#62596e", lineHeight: 1.7 }}>{q.help}</p>
        {options.length > 0 && <div role="group" aria-label="Suggested answers" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{options.map(option => {
          const chosen = value === option || (option === "Infographic — custom size" && isCustomSize);
          const routeHelp = q.id === "template" ? startingPointHelp[option as keyof typeof startingPointHelp] : undefined;
          return <button type="button" key={option} aria-pressed={chosen} onClick={() => changeAnswer(q.id, option === "Infographic — custom size" ? "Infographic — custom 1080 × 1920" : option)} style={{ ...button, borderColor: chosen ? "#7C3AED" : "#d5cfe2", background: chosen ? "#ede9fe" : "white", ...(routeHelp ? { width: "100%", textAlign: "left" as const } : {}) }}>{option}{routeHelp && <span style={{ display: "block", fontSize: 13, lineHeight: 1.5, color: "#62596e", marginTop: 6 }}>{routeHelp}</span>}</button>;
        })}</div>}
        {isCustomSize && <fieldset style={{ border: "1px solid #d5cfe2", borderRadius: 12, margin: "16px 0", padding: 16 }}><legend>Custom canvas dimensions</legend><div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>{(["Width", "Height"] as const).map((label, dimensionIndex) => <label key={label} style={{ display: "grid", gap: 6 }}>{label} (pixels)<input type="number" min={320} max={4000} step={1} value={customSize?.[dimensionIndex + 1] ?? ""} onChange={e => {
          const nextSize = [customSize?.[1] ?? "1080", customSize?.[2] ?? "1920"];
          nextSize[dimensionIndex] = e.target.value || "0";
          changeAnswer("format", `Infographic — custom ${nextSize[0]} × ${nextSize[1]}`);
        }} style={{ ...button, width: 140 }} /></label>)}</div><p style={{ marginBottom: 0, color: "#62596e", fontSize: 13 }}>320–4000 pixels per side. The composition will be planned for this size.</p></fieldset>}
        {!isRoutingChoice && <><label htmlFor="brief-answer" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Your answer {required ? "(required)" : "(optional)"}</label>
        <textarea id="brief-answer" aria-describedby="question-help" value={value} maxLength={1500} onChange={e => changeAnswer(q.id, e.target.value)} rows={4} placeholder={required ? "Tell us a little more…" : "Share details, or skip and let us choose."} style={{ width: "100%", boxSizing: "border-box", padding: 14, font: "inherit", lineHeight: 1.6, borderRadius: 12, border: "1px solid #c9c0d8", resize: "vertical" }} /></>}
        {value.trim() && questionIssue && <p role="alert" style={{ color: "#9d2945" }}>{questionIssue.message}</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="button" style={button} disabled={!editing && index === 0} onClick={() => editing ? setReview(true) : move(activeQuestions[index - 1].id)}>{editing ? "Back to review" : "Back"}</button>
          <button type="submit" style={{ ...button, background: "#7C3AED", color: "white" }}>{editing ? "Save answer" : index === activeQuestions.length - 1 ? "Review answers" : "Next question →"}</button>
          {!required && <button type="button" style={button} onClick={() => { changeAnswer(q.id, ""); advance({ ...answers, [q.id]: "" }); }}>Skip / choose for me</button>}
          <button type="button" style={button} onClick={() => { setReview(true); setError(""); }}>Review now</button>
        </div>
      </form>}
      {error && <p role="alert" style={{ color: "#9d2945", lineHeight: 1.7 }}>{error}</p>}
      {handoff && !sent && <section style={{ marginTop: 20 }}><label htmlFor="brief-handoff">Copy this complete brief into your GraphicRouter chat if automatic handoff is unavailable.</label><textarea id="brief-handoff" readOnly value={handoff} rows={8} onFocus={e => e.currentTarget.select()} style={{ width: "100%", boxSizing: "border-box", marginTop: 10, font: "inherit" }} /></section>}
      <p style={{ fontSize: 12, color: "#766c80", lineHeight: 1.6, marginTop: 24 }}>One question at a time. Quick: up to 7 · Balanced: up to 10 · Detailed: up to 15. Prefilled answers are reused, optional questions can be skipped, and changing direction preserves your answers. Answers stay in this open view until you submit; closing or reloading can lose unsent details.</p>
    </section>
  </main>;
}
