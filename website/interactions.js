export function nextTab(key, current, count) {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current + count - 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
export async function copyText(text, write = value => navigator.clipboard.writeText(value)) {
  try { await write(text); return "copied"; }
  catch { return "fallback"; }
}
