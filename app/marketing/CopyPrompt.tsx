"use client";
import { useState } from "react";
import s from "./landing.module.css";

export async function copyPromptText(text: string, write = (value: string) => navigator.clipboard.writeText(value)): Promise<"copied" | "fallback"> {
  try { await write(text); return "copied"; }
  catch { return "fallback"; }
}

export function CopyPrompt({ text, label = "prompt", compact = false }: { text: string; label?: string; compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "fallback">("idle");
  return <div className={`${s.codeBlock} ${compact ? s.compactPrompt : ""}`}>
    <pre tabIndex={0}><code>{text}</code></pre>
    <button type="button" aria-label={`Copy ${label}`} onClick={async () => {
      setStatus(await copyPromptText(text));
    }}>{status === "copied" ? "Copied ✓" : "Copy"}</button>
    <p role="status" className={s.copyStatus}>{status === "copied" ? "Copied. Review your facts before using it." : status === "fallback" ? "Clipboard unavailable. Select and copy the prompt text above." : ""}</p>
  </div>;
}
