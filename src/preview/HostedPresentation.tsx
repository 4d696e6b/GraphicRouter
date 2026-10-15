"use client";
import { useState } from "react";
import { Presentation, type PresentationData } from "./Presentation";
import { toolErrorMessage } from "./tool-error";

export function HostedPresentation({ initial }: { initial: PresentationData }) {
  const [data, setData] = useState(initial);
  return <Presentation data={data} invoke={async name => {
    const b = data.result.blueprint;
    const response = await fetch(`/api/tools/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deckId: b.deckId, version: b.version }) });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(toolErrorMessage(error));
    }
    setData(await response.json() as PresentationData);
  }} />;
}
