import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 24px", color: "#191724", fontFamily: "Arial, sans-serif" }}>
      <p style={{ color: "#7C3AED", fontWeight: 700, letterSpacing: ".12em", fontSize: 12 }}>GRAPHICROUTER / CANVAS WORKSPACE</p>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", lineHeight: 1.1, letterSpacing: "-.04em", margin: "24px 0" }}>Start with a canvas.<br />Build with intention.</h1>
      <p style={{ maxWidth: 620, color: "#62606B", lineHeight: 1.8 }}>Turn your brief into an infographic composed from individual editable objects. ChatGPT plans the canvas, adds structure and content, then refines the result for Canva.</p>
      <p style={{ background: "#EDE9F5", padding: 20, borderRadius: 12, lineHeight: 1.7 }}>Start with one question at a time: audience, story, evidence and visual style. The brief offers up to 20 questions; optional details can be skipped. In ChatGPT, select GraphicRouter and ask it to open the design brief.</p>
      <a href="/briefing" style={{ color: "#6D28D9", fontWeight: 700 }}>Open the design brief →</a>
      <section style={{ margin: "40px 0", lineHeight: 1.8 }} aria-label="How to use GraphicRouter">
        <h2 style={{ fontSize: 24 }}>Your facts. Your composition.</h2>
        <ol style={{ paddingLeft: 24 }}>
          <li>Select GraphicRouter in ChatGPT and describe the graphic you want.</li>
          <li>Answer the design brief: message, audience, evidence, reading medium and visual direction.</li>
          <li>Watch the blank canvas become shapes, text and visual groups; revise named elements.</li>
          <li>Open the editable Canva design, or keep the native PowerPoint fallback.</li>
        </ol>
        <p>Each Canva import creates a separate design. Canva edits do not sync back. Manual PowerPoint upload remains the fallback once export is available.</p>
      </section>
      <a href={user ? chatGPTSignOutPath() : chatGPTSignInPath("/")} target="_top" style={{ color: "#6D28D9", fontWeight: 700 }}>{user ? "Sign out" : "Sign in with ChatGPT"} →</a>
    </main>
  );
}
