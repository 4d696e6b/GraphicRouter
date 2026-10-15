"use client";
import { useState } from "react";
import type { DeckResult, PreviewStage, ToolName } from "../contracts";

export interface PresentationData { result: DeckResult; previews: Record<PreviewStage, string[]> | null; previewError?: string }
export function Presentation({ data, invoke }: { data: PresentationData; invoke?: (name: ToolName) => Promise<void> }) {
  const [selected, select] = useState(0), [stage, setStage] = useState<PreviewStage>("finished");
  const [duration, setDuration] = useState<"core" | "expanded">("core"), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const { result, previews } = data, b = result.blueprint;
  const slide = b.slides[selected] ?? b.slides[0];
  async function run(name: ToolName) {
    setBusy(true); setError("");
    try { await invoke?.(name); }
    catch (error) { setError(error instanceof Error ? error.message : "The request failed. Your saved deck is preserved. Try again or open the presentation."); }
    finally { setBusy(false); }
  }
  const image = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const btn = { padding: "9px 14px", borderRadius: 8, border: "1px solid #d8d3e4", background: "white", color: "#302744", cursor: "pointer" };
  return <main style={{ fontFamily: "Arial, sans-serif", color: "#211c2e", background: "#faf9f6", padding: 24, maxWidth: 1100, margin: "auto" }}>
    <p style={{ color: "#6d28d9", fontSize: 12, letterSpacing: ".1em" }}>GRAPHICROUTER · VERSION {b.version}</p>
    <h1 style={{ fontSize: "clamp(24px, 5vw, 40px)", margin: "12px 0" }}>{b.input.title}</h1>
    <p>{b.slides.length} slides · {b.input.durationSeconds / 60}-minute pitch</p>
    <section aria-label="Canva delivery" style={{ background: "#EDE9F5", borderRadius: 12, padding: "16px 20px", margin: "20px 0", lineHeight: 1.6 }}>
      <strong>{result.canva.status === "succeeded" ? "Canva import complete. Check its text layers before presenting." : result.canva.status === "pending" ? "Importing your native slides into Canva…" : result.canva.status === "connection_required" ? "Connect Canva to finish your presentation." : "Finish your presentation in Canva."}</strong>
      {result.canva.status === "succeeded" ? <p><a href={result.canva.editUrl} target="_blank" rel="noreferrer">Open and edit in Canva →</a></p>
        : <p style={{ marginBottom: 0 }}>{result.canva.status === "connection_required" ? "A Canva design link has not been confirmed yet. Your slides and PowerPoint fallback are saved." : "The preview is your editable slide plan. Canva is the final design destination; PowerPoint is also available as a portable fallback."}</p>}
    </section>
    <div role="group" aria-label="Preview stage" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0" }}>
      {(["layout", "content", "finished"] as const).map(s => <button key={s} style={btn} aria-pressed={s === stage} onClick={() => setStage(s)}>{s}</button>)}
    </div>
    {previews ? <img src={image(previews[stage][selected] ?? "")} alt={`${slide.id}: ${slide.takeaway} (${stage})`} style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12 }} />
      : <p role="alert">{data.previewError ?? "Slide preview unavailable. Your saved presentation and notes are preserved."}</p>}
    <nav aria-label="Slides" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 8, marginTop: 12 }}>
      {b.slides.map((s, i) => <button key={s.id} onClick={() => select(i)} aria-label={`Select slide ${i + 1}`} aria-pressed={i === selected} style={{ ...btn, padding: 4, outline: i === selected ? "2px solid #7c3aed" : undefined }}>
        {previews && <img src={image(previews[stage][i])} alt="" style={{ width: "100%", display: "block" }} />}<span>{i + 1}</span>
      </button>)}
    </nav>
    <section aria-label="Speaker notes" style={{ margin: "24px 0" }}>
      <h2>Speaker notes · slide {selected + 1}</h2>
      <label>Pitch duration <select value={duration} onChange={e => setDuration(e.target.value as "core" | "expanded")} style={btn}><option value="core">3 minutes</option><option value="expanded">5 minutes</option></select></label>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{slide.notes[duration] || "No notes supplied."}</p>
    </section>
    {b.changes.length > 0 && <section><h2>Changes in v{b.version}</h2><ul>{b.changes.map((c, i) => <li key={i}>{c.description}</li>)}</ul></section>}
    {b.validationIssues.length > 0 && <section><h2>Review before presenting</h2><ul>{b.validationIssues.map((issue, i) => <li key={i}>{issue.path}: {issue.message}</li>)}</ul></section>}
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      {invoke && <>{result.canva.status !== "succeeded" && <button disabled={busy} style={{ ...btn, background: "#7C3AED", color: "white", borderColor: "#7C3AED" }} onClick={() => run("send_to_canva")}>Create editable Canva deck</button>}<button disabled={busy} style={btn} onClick={() => run("export_deck")}>Prepare PowerPoint fallback</button><button disabled={busy} style={btn} onClick={() => run("get_deck")}>Refresh import</button></>}
      {result.files && <><a href={result.files.pptxUrl} target="_blank" rel="noreferrer">Download PowerPoint</a><a href={result.files.notesUrl} target="_blank" rel="noreferrer">Download notes</a></>}
      <a href={result.previewUrl} target="_blank" rel="noreferrer">Open presentation</a>
    </div>
    {busy && <p role="status">Working…</p>}{error && <p role="alert">{error}</p>}
    <p role="status">Canva import: {result.canva.status === "failed" && result.canva.code === "CANVA_POLL_FAILED" ? "status unavailable · existing job preserved" : result.canva.status.replace(/_/g, " ")}</p>
    {result.canva.status === "connection_required" && <a href={result.canva.connectUrl} target="_blank" rel="noreferrer">Connect Canva</a>}
    {result.canva.status === "succeeded" && <a href={result.canva.editUrl} target="_blank" rel="noreferrer">Edit this design in Canva</a>}
    {result.canva.status === "failed" && <p role="alert">{result.canva.message}</p>}
    <p style={{ fontSize: 13, color: "#62606b", lineHeight: 1.6 }}>Each imported version is a separate Canva design. Edits in Canva do not sync back. If automatic import is unavailable, download the PowerPoint and upload it in Canva. Editability must be checked after import.</p>
  </main>;
}
