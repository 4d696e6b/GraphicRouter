"use client";
import { useState } from "react";
import { Canvas, type CanvasData } from "./Canvas";
import { toolErrorMessage } from "./tool-error";

export function HostedCanvas({ initial }: { initial: CanvasData }) {
  const [data, setData] = useState(initial);
  return <Canvas data={data} invoke={async name => {
    const { deckId, version } = data.result.blueprint;
    const response = await fetch(`/api/canvas-tools/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deckId, version }) });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(toolErrorMessage(error));
    }
    setData(await response.json() as CanvasData);
  }} />;
}
