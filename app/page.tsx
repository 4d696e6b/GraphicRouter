import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 24px", color: "#191724", fontFamily: "Arial, sans-serif" }}>
      <p style={{ color: "#7C3AED", fontWeight: 700, letterSpacing: ".12em", fontSize: 12 }}>GRAPHICROUTER / INTEGRATION PREVIEW</p>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", lineHeight: 1.1, letterSpacing: "-.04em", margin: "24px 0" }}>Plan the story.<br />Direct the changes.</h1>
      <p style={{ maxWidth: 620, color: "#62606B", lineHeight: 1.8 }}>Turn your supplied facts into a five-slide story in ChatGPT. Preview the composition, revise one element, and hand off a PowerPoint to Canva.</p>
      <p role="status" style={{ background: "#EDE9F5", padding: 20, borderRadius: 12, lineHeight: 1.7 }}>The integration is under review. Slide generation awaits the slide engine. The hosted ChatGPT connection and Canva editability have not been verified.</p>
      <section style={{ margin: "40px 0", lineHeight: 1.8 }} aria-label="How to use GraphicRouter">
        <h2 style={{ fontSize: 24 }}>Your facts. One clear presentation.</h2>
        <ol style={{ paddingLeft: 24 }}>
          <li>Connect GraphicRouter in ChatGPT once the private plugin is available.</li>
          <li>Share your idea, audience, goal, and verified facts. Leave missing evidence as an open question.</li>
          <li>Review five slides and both sets of speaker notes. Ask for precise changes.</li>
          <li>Download the PowerPoint or connect Canva to import a new design version.</li>
        </ol>
        <p>Each Canva import creates a separate design. Canva edits do not sync back. Manual PowerPoint upload remains the fallback once export is available.</p>
      </section>
      <a href={user ? chatGPTSignOutPath() : chatGPTSignInPath("/")} target="_top" style={{ color: "#6D28D9", fontWeight: 700 }}>{user ? "Sign out" : "Sign in with ChatGPT"} →</a>
    </main>
  );
}
