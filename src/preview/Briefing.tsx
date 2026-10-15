"use client";
import { useEffect, useRef, useState } from "react";
import { buildBriefingMessage, briefingIssues, questions, type Answers, type BriefingData } from "../briefing/questions";

export function Briefing({ initial, submit }: { initial: BriefingData; submit?: (message: string) => Promise<void> }) {
  const [answers, setAnswers] = useState<Answers>({ ...initial.answers });
  const [index, setIndex] = useState(() => Math.max(0, questions.findIndex(q => !initial.answers[q.id]?.trim()))), [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState("");
  const [handoff, setHandoff] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [index, review]);
  const q = questions[index], value = answers[q.id] ?? "";
  const issues = briefingIssues(answers);
  const required = "required" in q && q.required;
  const options: readonly string[] = "options" in q ? q.options : [];
  const unsupported = q.id === "format" && value && value !== "Five-slide presentation";
  const button = { padding: "12px 18px", borderRadius: 12, border: "1px solid #d5cfe2", background: "white", color: "#282235", cursor: "pointer", font: "inherit" };
  function move(next: number) { setIndex(next); setReview(false); setError(""); }
  function next() {
    if (required && !value.trim()) { setError("Please answer this question before continuing."); return; }
    if (unsupported) { setError("Choose five slides to continue. Single-page graphics are not available in GraphicRouter yet."); return; }
    setError("");
    const unanswered = questions.findIndex((item, i) => i > index && !answers[item.id]?.trim());
    if (unanswered < 0) setReview(true); else setIndex(unanswered);
  }
  async function finish() {
    if (issues.length) { move(questions.findIndex(q => q.id === issues[0].id)); setError(issues[0].message); return; }
    const message = buildBriefingMessage({ context: initial.context, answers });
    setHandoff(message); setError("");
    if (!submit) return;
    setBusy(true);
    try { await submit(message); setSent(true); }
    catch { setError("The chat handoff was not confirmed. Your answers are still here. Check the chat before retrying, or copy the brief below into the same chat with GraphicRouter selected."); }
    finally { setBusy(false); }
  }
  return <main style={{ fontFamily: "Arial, sans-serif", color: "#211c2e", background: "#f5f2fb", padding: "clamp(12px,3vw,28px)", maxWidth: 820, margin: "auto" }}>
    <section role="dialog" aria-labelledby="briefing-title" style={{ background: "#fffefa", border: "1px solid #e2dcec", borderRadius: 24, padding: "clamp(20px,4vw,36px)", boxShadow: "0 12px 40px #33204c0d" }}>
      <p style={{ color: "#6d28d9", fontSize: 12, letterSpacing: ".12em", fontWeight: 700 }}>GRAPHICROUTER · DESIGN BRIEF</p>
      <p style={{ color: "#686173", fontSize: 14 }}>{review ? "Review your direction" : `${q.group} · Question ${index + 1} of ${questions.length}`}</p>
      <progress aria-label="Briefing progress" value={review ? 20 : index + 1} max={20} style={{ width: "100%", accentColor: "#7C3AED", height: 6 }} />
      <h1 id="briefing-title" ref={heading} tabIndex={-1} style={{ fontSize: "clamp(24px,4vw,34px)", lineHeight: 1.2, letterSpacing: "-.025em", outline: "none" }}>{sent ? "Your brief is back in the chat." : review ? "Ready to compose your presentation?" : q.title}</h1>
      {sent ? <p role="status" style={{ lineHeight: 1.7 }}>GraphicRouter has handed your answers to the assistant for slide planning and Canva delivery. A deck has not been created by this form alone. Continue in the chat to follow the result.</p>
      : review ? <>
        <p style={{ lineHeight: 1.7 }}>Five editable slides · Arial · 16:9 · Canva. Optional gaps use design judgment; factual gaps stay explicit. Review or edit any answer before continuing.</p>
        {initial.context && <details><summary>Original context</summary><p style={{ whiteSpace: "pre-wrap" }}>{initial.context}</p></details>}
        <dl style={{ margin: "20px 0" }}>{questions.map((item, i) => <div key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid #e8e3ed" }}><dt style={{ fontWeight: 700 }}>{item.title}</dt><dd style={{ margin: "8px 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#62596e" }}>{answers[item.id]?.trim() || "Choose for me / not supplied"}</dd><button type="button" disabled={busy} onClick={() => move(i)} style={button}>Edit answer {i + 1}</button></div>)}</dl>
        {issues.length > 0 && <p role="alert">{issues[0].message}</p>}
        <button type="button" disabled={busy} onClick={finish} style={{ ...button, background: "#7C3AED", color: "white" }}>{busy ? "Sending your brief…" : submit ? "Create in Canva with GraphicRouter" : "Prepare brief for GraphicRouter"}</button>
      </> : <form onSubmit={e => { e.preventDefault(); next(); }}>
        <p id="question-help" style={{ color: "#62596e", lineHeight: 1.7 }}>{q.help}</p>
        {options.length > 0 && <div role="group" aria-label="Suggested answers" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{options.map(option => <button type="button" key={option} aria-pressed={value === option} onClick={() => { setAnswers(a => ({ ...a, [q.id]: option })); setError(""); }} style={{ ...button, borderColor: value === option ? "#7C3AED" : "#d5cfe2", background: value === option ? "#ede9fe" : "white" }}>{option}</button>)}</div>}
        <label htmlFor="brief-answer" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Your answer {required ? "(required)" : "(optional)"}</label>
        <textarea id="brief-answer" aria-describedby="question-help" value={value} maxLength={1500} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} rows={4} placeholder={required ? "Tell us a little more…" : "Share details, or skip and let us choose."} style={{ width: "100%", boxSizing: "border-box", padding: 14, font: "inherit", lineHeight: 1.6, borderRadius: 12, border: "1px solid #c9c0d8", resize: "vertical" }} />
        {unsupported && <p role="alert" style={{ color: "#9d2945" }}>This format is outside the current prototype. Select “Five-slide presentation” to stay with GraphicRouter. No image generator will be substituted.</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="button" style={button} disabled={index === 0} onClick={() => move(index - 1)}>Back</button>
          <button type="submit" style={{ ...button, background: "#7C3AED", color: "white" }}>{index === 19 ? "Review answers" : "Next question →"}</button>
          {!required && <button type="button" style={button} onClick={() => { setAnswers(a => ({ ...a, [q.id]: "" })); if (index === 19) setReview(true); else move(index + 1); }}>Skip / choose for me</button>}
          <button type="button" style={button} onClick={() => { setReview(true); setError(""); }}>Review now</button>
        </div>
      </form>}
      {error && <p role="alert" style={{ color: "#9d2945", lineHeight: 1.7 }}>{error}</p>}
      {handoff && !sent && <section style={{ marginTop: 20 }}><label htmlFor="brief-handoff">Copy this complete brief into your GraphicRouter chat if automatic handoff is unavailable.</label><textarea id="brief-handoff" readOnly value={handoff} rows={8} onFocus={e => e.currentTarget.select()} style={{ width: "100%", boxSizing: "border-box", marginTop: 10, font: "inherit" }} /></section>}
      <p style={{ fontSize: 12, color: "#766c80", lineHeight: 1.6, marginTop: 24 }}>One question at a time, up to 20. Optional questions can be skipped. Answers stay in this open view until you submit; closing or reloading can lose unsent changes. Do not enter passwords or API keys.</p>
    </section>
  </main>;
}
