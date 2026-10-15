import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 24px", color: "#191724", fontFamily: "Arial, sans-serif" }}>
      <p style={{ color: "#7C3AED", fontWeight: 700, letterSpacing: ".12em", fontSize: 12 }}>GRAPHICROUTER / CANVAS WORKSPACE</p>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", lineHeight: 1.1, letterSpacing: "-.04em", margin: "24px 0" }}>Plan with purpose.<br />Create in Canva.</h1>
      <p style={{ maxWidth: 620, color: "#62606B", lineHeight: 1.8 }}>Turn your brief into an infographic composed from individual editable objects. ChatGPT plans the canvas, adds structure and content, then refines the result for Canva.</p>
      <p style={{ background: "#EDE9F5", padding: 20, borderRadius: 12, lineHeight: 1.7 }}>Choose your project complexity, then compose native objects or adapt an editable Canva source. Every heading, number and label must be separate from the background. Canva-generated designs stay drafts until their text layers and images have been checked. Known answers are reused.</p>
      <a href="/briefing" style={{ color: "#6D28D9", fontWeight: 700 }}>Open the design brief →</a>
      <section style={{ margin: "40px 0", lineHeight: 1.8 }} aria-label="How to use GraphicRouter">
        <h2 style={{ fontSize: 24 }}>Your facts. Your composition.</h2>
        <ol style={{ paddingLeft: 24 }}>
          <li>Select GraphicRouter in ChatGPT and describe the graphic you want.</li>
          <li>Choose a quick, balanced or detailed brief, then pick your starting point.</li>
          <li>Compose editable objects or adapt an accessible Canva copy; inspect the result before delivery.</li>
          <li>Review the checked Canva preview before saving, or keep the native PowerPoint fallback.</li>
        </ol>
        <p>Each Canva import creates a separate design. Canva edits do not sync back. Manual PowerPoint upload remains the fallback once export is available.</p>
      </section>
      <a href={user ? chatGPTSignOutPath() : chatGPTSignInPath("/")} target="_top" style={{ color: "#6D28D9", fontWeight: 700 }}>{user ? "Sign out" : "Sign in with ChatGPT"} →</a>
    </main>
  );
}
