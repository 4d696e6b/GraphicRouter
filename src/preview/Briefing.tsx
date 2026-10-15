"use client";
import { useEffect, useRef, useState } from "react";
import { buildBriefingMessage, briefingIssues, getQuestions, infographicDimensions, documentFormat, nextBriefingQuestion, questions, startingPointHelp, workflowMode, type Answers, type BriefingData, type BriefingQuestion } from "../briefing/questions";
import { canvaSourceFallbackOption } from "../briefing/canva-workflow";
import { briefingStyles } from "./briefing-styles";
import { briefLabels, briefHeadlines, briefIntros, briefPlaceholders, paceDetails, routeDetails } from "./briefing-content";
function BriefIcon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    arrow: "M5 12h14m-6-6 6 6-6 6", back: "M19 12H5m6-6-6 6 6 6", check: "m5 12 4 4L19 6",
    canvas: "M4 4h16v16H4zM4 9h16M9 9v11", copy: "M8 8h12v12H8zM4 15V4h11",
    edit: "m5 15 10-10 4 4L9 19H5zM13 7l4 4", spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
    idea: "M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0l-1 2H9z", review: "M5 4h14v16H5zM8 9h8m-8 4h8m-8 4h5",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.spark}/></svg>;
}

export function Briefing({ initial, submit }: { initial: BriefingData; submit?: (message: string) => Promise<void> }) {
  const [answers, setAnswers] = useState<Answers>({ ...initial.answers });
  const [questionId, setQuestionId] = useState<BriefingQuestion["id"]>(() => nextBriefingQuestion(initial.answers)?.id ?? "complexity");
  const [review, setReview] = useState(() => !nextBriefingQuestion(initial.answers)), [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState("");
  const [handoff, setHandoff] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const sending = useRef(false);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.ownerDocument.defaultView?.scrollTo({ top: 0, behavior: "auto" });
  }, [questionId, review]);
  const activeQuestions = getQuestions(answers);
  const baseQuestion = (editing ? questions.find(item => item.id === questionId) : activeQuestions.find(item => item.id === questionId)) ?? activeQuestions[0];
  const editSourceQuestion = baseQuestion.id === "templateSource" && workflowMode(answers.template) === "canva_edit";
  const q = { ...baseQuestion, ...initial.prompts?.[baseQuestion.id], ...(editSourceQuestion ? { title: "Which Canva file should we edit?", help: "Paste the full Canva editor/share link or canva.link shortlink. We keep the same file; your connected Canva account needs edit permission." } : {}) };
  const index = Math.max(0, activeQuestions.findIndex(item => item.id === q.id)), value = answers[q.id] ?? "";
  const issues = briefingIssues(answers);
  const required = ("required" in q && q.required) || editSourceQuestion || q.id === "editRequest";
  const options: readonly string[] = editSourceQuestion ? [] : "options" in q ? q.options : [];
  const questionIssue = issues.find(issue => issue.id === q.id);
  const isRoutingChoice = q.id === "complexity" || q.id === "template";
  const isCustomSize = q.id === "format" && value.startsWith("Infographic — custom");
  const customSize = value.match(/(\d+)\s*[x×]\s*(\d+)/);
  const dimensions = infographicDimensions(answers.format?.trim() || "Infographic — portrait");
  const multi = documentFormat(answers.format ?? "");
  const isDeck = answers.format?.trim() === "Five-slide presentation";
  const route = workflowMode(answers.template);
  const editExisting = route === "canva_edit";
  const useTemplate = route === "canva_native", createInCanva = route === "canva_create", chooseTemplate = route === "choose";
  const savedExtras = questions.filter(item => !activeQuestions.some(active => active.id === item.id) && answers[item.id]?.trim());
  const reviewQuestions = [...activeQuestions, ...savedExtras];
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
    if (sending.current || sent) return;
    if (issues.length) {
      const target = questions.find(item => item.id === issues[0].id);
      if (target) move(target.id);
      setError(issues[0].message); return;
    }
    let message: string;
    try { message = buildBriefingMessage({ context: initial.context, answers, prompts: initial.prompts }); }
    catch { setError("We couldn't prepare this brief. Review your answers; they are still here."); return; }
    setHandoff(message); setError("");
    if (!submit) return;
    sending.current = true; setBusy(true);
    try { await submit(message); setSent(true); }
    catch { setError("The chat handoff was not confirmed. Your answers are still here. Check the chat before retrying, or copy the brief below into the same chat with GraphicRouter selected."); }
    finally { sending.current = false; setBusy(false); }
  }
  const reviewDescription = editExisting
    ? "Read and edit the same Canva file. Preserve unrelated elements, preview the draft changes, then approve saving them. No replacement design or automatic copy is created."
    : createInCanva
    ? "Create a new draft directly in Canva from your completed brief. No Brand Template is required. It must pass native text-layer, background and visual checks before delivery. Text baked into an image is not accepted as editable. The Canva design is the source of truth."
    : useTemplate
    ? `Inspect your accessible Canva template/design and adapt a copy. ${answers.templateSource?.trim() === canvaSourceFallbackOption ? "If no source fits, you have allowed a new Canva design using the same brief." : "If a required source is unavailable, we will ask before changing that requirement."} The Canva copy is the source of truth.`
    : chooseTemplate ? "First compare inspected, accessible Canva options with a blank-canvas direction. Choose once in the chat before we start the final design."
      : multi ? `Native ${multi.format.replace(/_/g," ")} · ${multi.width} × ${multi.height} · ordered pages, separate objects and companion notes.` : isDeck ? "Five editable slides · Arial · 16:9 · Canva." : dimensions ? `One blank ${dimensions.width} × ${dimensions.height} canvas → structure → content → visual review → Canva. This route uses GraphicRouter’s simpler text-and-shape toolkit; it does not use Canva’s full illustration or font library.` : "Choose a supported canvas size or the five-slide presentation.";
  const answeredCount = activeQuestions.filter(item => answers[item.id]?.trim()).length;
  const title = sent ? "Your brief is back in the chat." : review ? editExisting ? "Ready to edit your Canva file?" : "Ready to compose your design?" : initial.prompts?.[q.id]?.title ?? (editSourceQuestion ? q.title : briefHeadlines[q.id] ?? q.title);
  const intro = initial.prompts?.[q.id]?.help ?? (editSourceQuestion ? q.help : briefIntros[q.id] ?? q.help);
  const submitLabel = busy ? "Sending your brief…" : !submit ? "Prepare brief for GraphicRouter" : editExisting ? "Continue editing this Canva file" : createInCanva ? "Create a new design in Canva" : chooseTemplate ? "Compare design directions in chat" : useTemplate ? "Adapt a Canva copy in chat" : "Create in Canva with GraphicRouter";
  const visibleError = error || (value.trim() ? questionIssue?.message : "");
  return <main className="gr-brief">
    <style>{briefingStyles}</style>
    <section className="gr-shell" role="dialog" aria-labelledby="briefing-title" aria-busy={busy}>
      <header className="gr-header">
        <div className="gr-brand"><span className="gr-brand-mark"><BriefIcon name="canvas" size={18}/></span><span>GraphicRouter<small>DESIGN BRIEF</small></span></div>
        {!review && !sent && <button className="gr-text-button" type="button" onClick={() => {setReview(true);setError("");}}><BriefIcon name="review" size={14}/>Review brief</button>}
        {review && !sent && <span className="gr-small-label">Your direction, together</span>}
      </header>
      <div className="gr-body">
        <aside className="gr-sidebar" aria-label="Your brief outline">
          <p className="gr-small-label">Your brief</p>
          <nav aria-label="Brief questions"><ol>{activeQuestions.map((item, i) => <li key={item.id}><button className="gr-step" type="button" disabled={busy || sent} aria-current={!review && item.id === q.id ? "step" : undefined} onClick={() => move(item.id, review)}><span className={`gr-step-number${answers[item.id]?.trim() ? " is-done" : ""}`}>{answers[item.id]?.trim() ? <BriefIcon name="check" size={11}/> : i + 1}</span><span>{briefLabels[item.id] ?? item.group}</span></button></li>)}</ol></nav>
          <div className="gr-sidebar-note"><strong>A little direction. A better design.</strong>One question at a time. We reuse the details you already shared.</div>
        </aside>
        <div className="gr-content">
          <div className="gr-progress-row"><span>{sent ? "Brief shared" : review ? "Review your direction" : editing ? "Edit your saved answer" : `${q.group} · Question ${index + 1} of ${activeQuestions.length}`}</span><strong>{answeredCount} of {activeQuestions.length} answered</strong></div>
          <progress className="gr-progress" aria-label="Briefing progress" value={answeredCount} max={activeQuestions.length}/>
          {sent ? <div className="gr-success-icon"><BriefIcon name="check" size={27}/></div> : !review && <span className="gr-question-type"><BriefIcon name={isRoutingChoice ? "canvas" : "edit"} size={11}/>{required ? "Essential detail" : "Optional detail"}</span>}
          <h1 id="briefing-title" ref={heading} tabIndex={-1}>{title}</h1>
          {sent ? <><p className="gr-intro" role="status">Your answers are back in the chat for the chosen design workflow and Canva delivery. Continue there to follow the result.</p><div className="gr-sent-note">The brief has been shared. The form itself has not created or edited a design.</div></>
          : review ? <>
            <p className="gr-intro">A quick look before we start. You can change any detail below.</p>
            <div className="gr-review-summary">{reviewDescription} Optional gaps use design judgment; factual gaps stay explicit.</div>
            {initial.context && <details className="gr-review-original"><summary>Original context</summary><p>{initial.context}</p></details>}
            <dl className="gr-review-list">{reviewQuestions.map(item => <div key={item.id} className="gr-review-row"><div className="gr-review-heading"><dt>{briefLabels[item.id] ?? item.group}</dt><button className="gr-text-button" type="button" disabled={busy} onClick={() => move(item.id,true)} aria-label={`Edit ${item.group.toLowerCase()} answer`}>Edit<BriefIcon name="edit" size={12}/></button></div><dd>{answers[item.id]?.trim() ? answers[item.id] : item.id === "format" ? "Portrait infographic (default)" : "Choose for me / not supplied"}</dd></div>)}</dl>
            {answers.duration && <p className="gr-intro">Previously supplied talk duration: {answers.duration}</p>}
            {issues.length > 0 && !error && <p className="gr-error" role="alert">{issues[0].message}</p>}
            <div className="gr-actions"><span className="gr-text-button">{editExisting ? "Same Canva file" : "Separate editable elements"}</span><button className="gr-primary" type="button" disabled={busy} onClick={finish}>{submitLabel}{!busy && <BriefIcon name="arrow" size={15}/>}</button></div>
          </> : <form onSubmit={e => {e.preventDefault();next();}} noValidate>
            <p id="question-help" className="gr-intro">{intro}</p>
            {intro !== q.help && <details className="gr-help"><summary>A little more guidance</summary><p>{q.help}</p></details>}
            {options.length > 0 && <div className={isRoutingChoice ? "gr-choice-grid" : "gr-options"} role="group" aria-label="Suggested answers">{options.map((option,i) => {
              const chosen = value === option || (option === "Infographic — custom size" && isCustomSize);
              const pace = q.id === "complexity" ? paceDetails[option] : undefined, routeChoice = q.id === "template" ? routeDetails[option] : undefined;
              return <button className={isRoutingChoice ? "gr-choice" : "gr-option"} type="button" key={option} aria-pressed={chosen} aria-label={option} onClick={() => changeAnswer(q.id,option === "Infographic — custom size" ? "Infographic — custom 1080 × 1920" : option)}>
                {isRoutingChoice ? <><span className="gr-choice-icon"><BriefIcon name={routeChoice?.icon ?? (i === 0 ? "spark" : i === 1 ? "canvas" : "edit")}/></span><span className="gr-choice-copy"><span className="gr-choice-title">{pace?.title ?? routeChoice?.title ?? option}</span><span className="gr-choice-description">{pace?.description ?? routeChoice?.description}</span>{pace && <span className="gr-choice-tag">{pace.tag}</span>}</span><span className="gr-radio-dot"/></> : option}
              </button>;
            })}</div>}
            {q.id === "template" && value && startingPointHelp[value as keyof typeof startingPointHelp] && <details className="gr-route-details"><summary>About this starting point</summary><p>{startingPointHelp[value as keyof typeof startingPointHelp]}</p></details>}
            {isCustomSize && <fieldset className="gr-size-fieldset"><legend>Custom canvas dimensions</legend><div className="gr-size-fields">{(["Width","Height"] as const).map((label, dimensionIndex) => <label key={label}>{label} (pixels)<input className="gr-size-input" type="number" min={320} max={4000} step={1} value={customSize?.[dimensionIndex+1] ?? ""} onChange={e => {const size=[customSize?.[1] ?? "1080",customSize?.[2] ?? "1920"];size[dimensionIndex]=e.target.value || "0";changeAnswer("format",`Infographic — custom ${size[0]} × ${size[1]}`);}}/></label>)}</div><p className="gr-size-note">320–4000 pixels per side. The composition is planned for this size.</p></fieldset>}
            {!isRoutingChoice && <>
              <div className="gr-answer-header"><label htmlFor="brief-answer">Your answer <span className="gr-required">{required ? "Required" : "Optional"}</span></label></div>
              <textarea className="gr-answer" id="brief-answer" aria-describedby={`question-help answer-meta${visibleError ? " brief-error" : ""}`} aria-required={required} aria-invalid={!!visibleError} value={value} maxLength={16000} onChange={e => changeAnswer(q.id,e.target.value)} rows={5} placeholder={briefPlaceholders[q.id] ?? (required ? "Share your idea in your own words…" : "Share a detail, or let us choose…")}/>
              <div id="answer-meta" className="gr-answer-meta"><span className="gr-hint"><BriefIcon name="idea" size={12}/>{q.id === "topic" ? "Bullet points are fine. Keep exact facts and wording." : "Known details are reused. Pictures can be attached in the chat."}</span><span className="gr-count">{value.length.toLocaleString("en-US")} / 16,000</span></div>
            </>}
            {visibleError && <p id="brief-error" className="gr-error" role="alert">{visibleError}</p>}
            <div className="gr-actions"><button className="gr-back" type="button" disabled={!editing && index === 0} onClick={() => editing ? setReview(true) : move(activeQuestions[index-1].id)}><BriefIcon name="back" size={14}/>{editing ? "Back to review" : "Back"}</button><div className="gr-actions-right">{!required && <button className="gr-text-button" type="button" onClick={() => {changeAnswer(q.id,"");advance({...answers,[q.id]:""});}}>Skip for now</button>}<button className="gr-primary" type="submit">{editing ? "Save answer" : index === activeQuestions.length-1 ? "Review answers" : "Next question"}<BriefIcon name="arrow" size={15}/></button></div></div>
          </form>}
          {review && error && <p id="brief-error" className="gr-error" role="alert">{error}</p>}
          {handoff && !sent && <section className="gr-handoff"><label htmlFor="brief-handoff">Copy this complete brief into your GraphicRouter chat if automatic handoff is unavailable.</label><textarea className="gr-answer" id="brief-handoff" readOnly value={handoff} rows={7} onFocus={e => e.currentTarget.select()}/></section>}
          {!sent && <details className="gr-footer"><summary>Your answers stay in this open brief.</summary><p>Prefilled answers are reused, and changing direction preserves your details. Optional questions can be skipped. Attach pictures in the chat with their target and purpose. Closing or reloading this view can lose unsent answers.</p></details>}
        </div>
      </div>
    </section>
  </main>;
}
