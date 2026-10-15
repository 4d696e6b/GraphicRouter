"use client";
import { useState } from "react";
import type { CanvasResult, CanvasToolName, PreviewStage } from "../contracts";

export interface CanvasData {
  result: CanvasResult;
  previews: Record<PreviewStage, string>;
  constructionPreviews: string[];
  previewError?: string;
}

export function Canvas({ data, invoke }: { data: CanvasData; invoke?: (name: CanvasToolName) => Promise<void> }) {
  const [mode, setMode] = useState<PreviewStage | "construction">("finished");
  const [reveal, setReveal] = useState(data.constructionPreviews.length - 1);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const { result, previews, constructionPreviews } = data, b = result.blueprint;
  const step = Math.min(Math.max(0, reveal), Math.max(0, constructionPreviews.length - 1));
  const svg = mode === "construction" ? constructionPreviews[step] : previews[mode];
  const canva = result.canva;
  const uncertainImport = canva.status === "failed" && canva.code === "CANVA_POLL_FAILED";
  const button = { padding: "11px 16px", borderRadius: 10, border: "1px solid #d8d3e4", background: "white", color: "#302744", cursor: "pointer", font: "inherit", fontSize: 14 };
  const primary = { ...button, background: "#6D28D9", color: "white", borderColor: "#6D28D9" };
  async function run(name: CanvasToolName) {
    if (!invoke || busy) return;
    setBusy(true); setError("");
    try { await invoke(name); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The request failed. Your saved canvas is preserved. Refresh its status before retrying a write."); }
    finally { setBusy(false); }
  }
  return <main style={{ fontFamily: "Arial, sans-serif", color: "#211c2e", background: "#faf9f6", padding: "clamp(16px,3vw,32px)", maxWidth: 1100, margin: "auto" }}>
    <p style={{ color: "#6d28d9", fontSize: 12, letterSpacing: ".12em", fontWeight: 700 }}>GRAPHICROUTER · CANVAS · VERSION {b.version}</p>
    <h1 style={{ fontSize: "clamp(26px,5vw,42px)", letterSpacing: "-.03em", lineHeight: 1.1, margin: "12px 0" }}>{b.title}</h1>
    <p style={{ color: "#62596e" }}>{b.canvas.width} × {b.canvas.height} canvas · {b.elements.length} separate {b.elements.length === 1 ? "object" : "objects"}</p>

    <section aria-label="Canva delivery" style={{ background: "#EDE9F5", borderRadius: 16, padding: "18px 22px", margin: "24px 0", lineHeight: 1.6 }}>
      <strong>{canva.status === "succeeded" ? "Your editable Canva design is ready." : canva.status === "pending" ? "Creating your editable Canva design…" : canva.status === "connection_required" ? "Connect Canva to finish your design." : uncertainImport ? "The import status is unavailable. Your existing job is preserved." : "Take this composition into Canva."}</strong>
      {canva.status === "succeeded" ? <p><a href={canva.editUrl} target="_blank" rel="noreferrer" style={{ color: "#5B21B6", fontWeight: 700 }}>Open and edit in Canva →</a></p>
        : <p style={{ marginBottom: 0 }}>{canva.status === "connection_required" ? "A Canva design link has not been confirmed yet. Your saved canvas and any download links remain available." : canva.status === "pending" || uncertainImport ? "Refresh to check the existing import. You can keep reviewing the saved canvas while it runs." : "Review the native object composition below, then create an editable Canva design. PowerPoint is available as a fallback."}</p>}
    </section>

    <div role="group" aria-label="Canvas preview" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0 14px" }}>
      {(["finished", "layout", "content", "construction"] as const).map(item => <button type="button" key={item} aria-pressed={mode === item} style={{ ...button, background: mode === item ? "#211C2E" : "white", color: mode === item ? "white" : "#302744", borderColor: mode === item ? "#211C2E" : "#d8d3e4" }} onClick={() => setMode(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
    </div>
    {data.previewError && <p role="alert" style={{ padding: 16, background: "#fff0dc", borderRadius: 12, lineHeight: 1.6 }}>{data.previewError}</p>}
    <div style={{ background: "#eeeaf1", border: "1px solid #e0dbe5", borderRadius: 16, padding: "clamp(8px,2vw,20px)", textAlign: "center" }}>
      {svg ? <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`${b.title}: ${mode === "construction" ? `construction step ${step + 1}` : `${mode} composition`}`} style={{ display: "block", width: "100%", maxHeight: 760, aspectRatio: `${b.canvas.width}/${b.canvas.height}`, objectFit: "contain" }} />
        : <p role={data.previewError ? undefined : "alert"} style={{ lineHeight: 1.6 }}>Canvas preview unavailable. The saved version and any download links are preserved. Refresh to reload its preview.</p>}
    </div>
    {mode === "construction" && <section aria-label="Object construction preview" style={{ margin: "16px 0 24px", lineHeight: 1.6 }}>
      {constructionPreviews.length > 0 && <><label htmlFor="canvas-construction" style={{ display: "block", fontWeight: 700 }}>Construction step {step + 1} of {constructionPreviews.length}{step === 0 ? " · blank canvas" : step === constructionPreviews.length - 1 ? " · all objects" : ""}</label><input id="canvas-construction" type="range" min={0} max={Math.max(0, constructionPreviews.length - 1)} value={step} onChange={e => setReveal(Number(e.target.value))} style={{ width: "100%", accentColor: "#6D28D9" }} /></>}
      <p style={{ color: "#62596e", fontSize: 13 }}>Reveal objects from this version in paint order. These are construction previews, not a recording of the design session.</p>
    </section>}

    <section aria-label="Design direction" style={{ margin: "28px 0", lineHeight: 1.7 }}><h2 style={{ fontSize: 20 }}>Design direction</h2><p style={{ whiteSpace: "pre-wrap" }}>{b.designIntent}</p></section>
    <section aria-label="Construction history" style={{ margin: "28px 0" }}><h2 style={{ fontSize: 20 }}>How the canvas was built</h2><ol style={{ paddingLeft: 22, lineHeight: 1.7 }}>{b.construction.map(item => <li key={item.version} style={{ paddingBottom: 8 }}><strong>v{item.version} · {item.phase}</strong> — {item.summary} <span style={{ color: "#62596e" }}>({item.elementCount} objects)</span></li>)}</ol></section>
    {b.changes.length > 0 && <section aria-label="Version changes" style={{ margin: "28px 0", lineHeight: 1.7 }}><h2 style={{ fontSize: 20 }}>Changes in v{b.version}</h2><ul>{b.changes.map((change, index) => <li key={index}><strong>{change.target}</strong>: {change.description}</li>)}</ul></section>}
    <section aria-label="Design validation" style={{ margin: "28px 0", lineHeight: 1.7 }}><h2 style={{ fontSize: 20 }}>Composition checks</h2>{b.validationIssues.length ? <ul>{b.validationIssues.map((issue, index) => <li key={index}>{issue.severity === "error" ? "Needs correction" : "Review"} · {issue.path}: {issue.message}</li>)}</ul> : <p>No automated validation issues reported. Review the visual result before delivery.</p>}</section>
    {b.brief.unknowns.length > 0 && <details style={{ margin: "24px 0", lineHeight: 1.7 }}><summary>Unverified or missing information</summary><ul>{b.brief.unknowns.map((unknown, index) => <li key={index}>{unknown}</li>)}</ul></details>}

    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 28 }}>
      {canva.status === "connection_required" && <a href={canva.connectUrl} target="_blank" rel="noreferrer" style={primary}>Connect Canva</a>}
      {invoke && <>{canva.status !== "succeeded" && canva.status !== "pending" && canva.status !== "connection_required" && !uncertainImport && <button type="button" disabled={busy || b.elements.length === 0} style={primary} onClick={() => run("send_canvas_to_canva")}>Create editable Canva design</button>}<button type="button" disabled={busy || b.elements.length === 0} style={button} onClick={() => run("export_canvas")}>Prepare PowerPoint fallback</button><button type="button" disabled={busy} style={canva.status === "pending" || uncertainImport ? primary : button} onClick={() => run("get_canvas")}>Refresh import</button></>}
      {result.files && <><a href={result.files.pptxUrl} target="_blank" rel="noreferrer">Download PowerPoint</a><a href={result.files.notesUrl} target="_blank" rel="noreferrer">Download design notes</a></>}
      <a href={result.previewUrl} target="_blank" rel="noreferrer">Open canvas</a>
    </div>
    {busy && <p role="status">Working…</p>}{error && <p role="alert">{error}</p>}
    <p role="status" style={{ fontSize: 14, color: "#62596e" }}>Canva import: {uncertainImport ? "status unavailable · existing job preserved" : canva.status.replace(/_/g, " ")}</p>
    {canva.status === "failed" && <p role="alert">{canva.message}</p>}
    <p style={{ fontSize: 13, color: "#62596e", lineHeight: 1.7, marginTop: 28 }}>Each import creates a separate Canva design. Canva edits do not sync back to this blueprint. Text, simple shapes, lines and registered images are exported as native objects; their appearance and editability need a real check after import.</p>
  </main>;
}
