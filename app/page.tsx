const repository = "https://github.com/4d696e6b/GraphicRouter";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px", color: "#191724" }}>
      <p style={{ color: "#7C3AED", fontWeight: 700, letterSpacing: ".12em", fontSize: 12 }}>GRAPHICROUTER / PROJECT STARTER</p>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", lineHeight: 1.1, letterSpacing: "-.04em", maxWidth: 740, margin: "24px 0" }}>Plan the story.<br />Compose the slides.<br />Direct the changes.</h1>
      <p style={{ maxWidth: 620, color: "#62606B", lineHeight: 1.8 }}>The shared starting point is ready. Slide generation, the ChatGPT tools, and Canva integration are assigned work; they are not implemented in this starter.</p>
      <section aria-label="Builder assignments" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, margin: "40px 0" }}>
        {[
          { name: "Builder A", title: "Slide engine", branch: "feat/slide-engine", task: "builder-a-slide-engine.md", description: "Composition, validation, precise revisions, and native PowerPoint export." },
          { name: "Builder B", title: "ChatGPT + Canva", branch: "feat/chatgpt-canva", task: "builder-b-chatgpt-canva.md", description: "Tools, previews, storage, authorization, and Canva import." },
        ].map((builder) => (
          <article key={builder.name} style={{ border: "1px solid #E6E3ED", background: "#FFFFFF", borderRadius: 16, padding: 28 }}>
            <p style={{ fontSize: 12, color: "#7C3AED", fontWeight: 700 }}>{builder.name.toUpperCase()}</p>
            <h2 style={{ fontSize: 24, margin: "12px 0" }}>{builder.title}</h2>
            <p style={{ color: "#62606B", lineHeight: 1.7, minHeight: 58 }}>{builder.description}</p>
            <code style={{ display: "block", fontSize: 13, margin: "20px 0" }}>{builder.branch}</code>
            <a href={`${repository}/blob/main/docs/tasks/${builder.task}`} style={{ color: "#6D28D9", fontWeight: 700 }}>Open Codex task →</a>
          </article>
        ))}
      </section>
      <p style={{ fontSize: 14, color: "#62606B", lineHeight: 1.8 }}>Use separate clones and Codex chats. Start with the shared contracts and your assigned task.</p>
      <a href={repository} style={{ display: "inline-block", marginTop: 16, color: "#6D28D9", fontWeight: 700 }}>View repository →</a>
    </main>
  );
}
