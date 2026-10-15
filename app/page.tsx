import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";
import { engine, assets } from "../src/server/engine-provider";
import { localWorkflowPitch } from "../src/fixtures/local-workflow-pitch";
import { GuidedDemo, PromptLibrary } from "./marketing/GuidedDemo";
import styles from "./marketing/landing.module.css";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  const original = engine.createBlueprint(localWorkflowPitch, { deckId: "11111111-1111-4111-8111-111111111111", version: 1 });
  const revised = engine.reviseBlueprint(structuredClone(original), [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }]);
  const views = Object.fromEntries((["layout", "content", "finished"] as const).map(stage => [stage, original.slides.map(slide => engine.renderSlideSvg(slide, original.theme, stage, assets))]));
  const violet = { layout: engine.renderSlideSvg(revised.slides[2], revised.theme, "layout", assets), content: engine.renderSlideSvg(revised.slides[2], revised.theme, "content", assets), finished: engine.renderSlideSvg(revised.slides[2], revised.theme, "finished", assets) };
  return <div className={styles.site}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.header}>
      <a className={styles.brand} href="#" aria-label="GraphicRouter home"><span className={styles.brandMark} aria-hidden="true">g<span>↗</span></span>GraphicRouter<span className={styles.beta}>DEMO</span></a>
      <nav aria-label="Main navigation"><a href="#why">The idea</a><a href="#how-it-works">How it works</a><a href="#quick-start">Quick start</a></nav>
      <a className={styles.headerCta} href="#demo">Explore the demo <span aria-hidden="true">↗</span></a>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.dot} /> YOUR STORY. YOUR DIRECTION.</p>
          <h1 id="hero-title">Big ideas.<br />Clear slides.<br /><em>You’re in control.</em></h1>
          <p className={styles.intro}>Turn your rough brief into a five-slide story in ChatGPT. See the plan, direct the details, and take your presentation into Canva.</p>
          <div className={styles.heroActions}><a className={styles.primary} href="#demo">Try the guided demo <span aria-hidden="true">↗</span></a><a className={styles.textLink} href="#how-it-works">How it works <span aria-hidden="true">↓</span></a></div>
          <p className={styles.heroNote}>For pitches, product stories, and the next big idea.</p>
        </div>
        <GuidedDemo views={views as Record<"layout" | "content" | "finished", string[]>} violet={violet} />
        <div className={styles.heroFoot}><span>A little structure. A lot more clarity.</span><div><span>01 / Plan</span><span>02 / Compose</span><span>03 / Direct</span></div></div>
      </section>
      <section className={styles.why} id="why" aria-labelledby="why-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>MADE FOR THE MOMENT BEFORE YOU PRESENT</p><h2 id="why-title">Make your point.<br />Keep the rest intact.</h2><p>One headline change shouldn’t become a whole-deck redesign. GraphicRouter keeps a clear plan behind every slide.</p></div>
        <div className={styles.benefits}>
          <article><span className={styles.featureNumber}>01 <span aria-hidden="true">↗</span></span><h3>A story with a purpose.</h3><p>Shape your supplied facts into five roles: the problem, your answer, the workflow, the proof, and the next step.</p></article>
          <article><span className={styles.featureNumber}>02 <span aria-hidden="true">◎</span></span><h3>Small changes. Precisely.</h3><p>Direct a specific text, colour, note, or supported layout change. Keep previous versions available as your story evolves.</p></article>
          <article><span className={styles.featureNumber}>03 <span aria-hidden="true">↗</span></span><h3>A handoff you can work with.</h3><p>Export native PowerPoint objects and speaker notes. Import into Canva, then check the objects and fonts in your design.</p></article>
        </div>
      </section>
      <section className={styles.workflow} id="how-it-works" aria-labelledby="workflow-title">
        <div className={styles.workflowIntro}><p className={styles.eyebrow}>FROM “WHAT IF” TO “HERE’S HOW”</p><h2 id="workflow-title">Your next pitch,<br />in four moves.</h2><p>Bring the facts. Use ChatGPT to shape the story. Stay in charge of the final result.</p><span className={styles.workflowTag}>5 slides · 16:9 · 3 or 5 minute notes</span></div>
        <ol className={styles.steps}>
          <li><span>01</span><div><h3>Start with your brief</h3><p>Open the design brief for a guided conversation about your audience, story, evidence, and visual style. Optional details can be skipped; missing evidence stays an open question.</p></div></li>
          <li><span>02</span><div><h3>See the story take shape</h3><p>Review the layout, content, and finished composition. Read the speaker notes alongside each slide.</p></div></li>
          <li><span>03</span><div><h3>Tell it exactly what to change</h3><p>“Change only the headline on slide three to violet.” Review a new version while keeping the original.</p></div></li>
          <li><span>04</span><div><h3>Take it to your stage</h3><p>Download PowerPoint and notes. Once Canva is connected, import a separate design version. Keep presenting while it processes.</p></div></li>
        </ol>
      </section>
      <section className={styles.quickStart} id="quick-start" aria-labelledby="start-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>A GOOD BRIEF IS A GREAT BEGINNING</p><h2 id="start-title">Start with a conversation.</h2><p>Use these prompts as a starting point once GraphicRouter is available in your ChatGPT account. Replace the brackets with your own facts.</p></div>
        <p className={styles.briefLink}><a className={styles.primary} href="/briefing">Open the design brief <span aria-hidden="true">↗</span></a><span>Answer one question at a time. Skip optional details.</span></p>
        <PromptLibrary />
        <div className={styles.availability} id="availability"><span className={styles.statusDot} aria-hidden="true"/><div><h3>Where the demo stands</h3><p>The real engine, local previews, focused revisions, and PowerPoint exports are verified locally. Hosted ChatGPT tools/widget and application Canva OAuth/import are still awaiting account verification. This page’s guided preview uses prepared engine output, with no live tool calls.</p><p>When the private connection is available, enable GraphicRouter in ChatGPT, start a chat with it, and paste your brief. Connect Canva only when you’re ready to import.</p></div></div>
      </section>
      <section className={styles.faq} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>THE BASICS</p><h2 id="faq-title">A few things<br />worth knowing.</h2></div><div className={styles.questions}>
        <details><summary>What can I create?<span aria-hidden="true">+</span></summary><p>The first version focuses on five-slide, 16:9 presentations with a problem, answer, workflow, proof, and next step. It includes three-minute core notes and five-minute expanded notes. It does not import arbitrary existing decks.</p></details>
        <details><summary>Do I need Canva to use the presentation?<span aria-hidden="true">+</span></summary><p>You can download the PowerPoint and speaker notes. Manual PowerPoint upload to Canva is the fallback if automatic import is unavailable. Review conversion quality after any import.</p></details>
        <details><summary>Will Canva changes update my original deck?<span aria-hidden="true">+</span></summary><p>No. Each imported version is a separate Canva design. Edits made in Canva do not sync back to the stored GraphicRouter blueprint.</p></details>
        <details><summary>What has been checked in Canva?<span aria-hidden="true">+</span></summary><p>A separate manual fixture import confirmed individual text and image editing. Application OAuth/import, shape and line editing, and font fidelity still need verification. Native PowerPoint objects do not guarantee identical Canva conversion.</p></details>
        <details><summary>Can I install or buy it today?<span aria-hidden="true">+</span></summary><p>This is a hackathon product demo. There is no checkout or paid plan. The private ChatGPT connection is pending hosted account verification; this page does not install the plugin.</p></details>
      </div></section>
      <section className={styles.closing}><p className={styles.eyebrow}>LESS REBUILDING. MORE PRESENTING.</p><h2>A clearer story starts<br />with a little direction.</h2><a className={styles.primary} href="#demo">Explore GraphicRouter <span aria-hidden="true">↗</span></a></section>
    </main>
    <footer className={styles.footer}><a className={styles.brand} href="#">GraphicRouter<span className={styles.beta}>DEMO</span></a><p>Plan the story. Direct the changes.</p><a href={user ? chatGPTSignOutPath() : chatGPTSignInPath("/")} target="_top">{user ? "Sign out" : "Site sign in"} <span aria-hidden="true">↗</span></a></footer>
  </div>;
}
