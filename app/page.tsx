import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";
import { engine, assets } from "../src/server/engine-provider";
import { localWorkflowPitch } from "../src/fixtures/local-workflow-pitch";
import { Header, Wordmark } from "./marketing/Header";
import { TabletStory } from "./marketing/TabletStory";
import { GuidedDemo, PromptLibrary } from "./marketing/GuidedDemo";
import { CopyPrompt } from "./marketing/CopyPrompt";
import { PageMotion, MotionPreferenceButton } from "./marketing/PageMotion";
import { faqs, prompts } from "./marketing/content";
import type { DemoData } from "./marketing/types";
import s from "./marketing/landing.module.css";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  // Prepared examples only: no database, exports, tool calls, or import side effects.
  const original = engine.createBlueprint(localWorkflowPitch, { deckId: "11111111-1111-4111-8111-111111111111", version: 1 });
  const revised = engine.reviseBlueprint(structuredClone(original), [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }]);
  const uri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const stages = ["layout", "content", "finished"] as const;
  const data: DemoData = {
    views: Object.fromEntries(stages.map(stage => [stage, original.slides.map(slide => uri(engine.renderSlideSvg(slide, original.theme, stage, assets)))])) as DemoData["views"],
    violet: uri(engine.renderSlideSvg(revised.slides[2], revised.theme, "finished", assets)),
    title: localWorkflowPitch.title, idea: localWorkflowPitch.brief.idea, audience: localWorkflowPitch.brief.audience,
    slides: localWorkflowPitch.slides.map(({ role, headline }) => ({ role, headline })),
  };
  return <div className={s.site} id="marketing-site">
    <PageMotion/><a className={s.skip} href="#main">Skip to content</a><Header/>
    <aside className={s.availabilityStrip} aria-label="Product demo status">Prepared product demo. Local engine and export verified; hosted ChatGPT and application Canva checks pending. <a href="#availability">View availability ↗</a></aside>
    <main className={s.main} id="main" tabIndex={-1}>
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroCopy}>
          <a className={s.pill} href="#availability"><span/> GraphicRouter · Product demo ↗</a>
          <h1 id="hero-title"><span className={s.titleLine}><span data-title>Your story.</span></span>{" "}<span className={`${s.titleLine} ${s.mutedTitle}`}><span data-title>Ready to present.</span></span></h1>
          <p className={s.heroDescription}>Turn your rough brief into a five-slide story in ChatGPT. Preview the plan, direct the details, and prepare your presentation for Canva.</p>
          <div className={s.actions}><a className={s.primary} href="/briefing">Start your brief ↗</a><a className={s.textButton} href="#demo">Explore the demo →</a></div>
          <CopyPrompt text={prompts.hero} label="five-slide pitch prompt" compact/>
          <p className={s.hint}>5 slides · 16:9 · 3 or 5 minute speaker notes</p>
        </div>
        <div className={s.heroVisual}><TabletStory data={{ title: data.title, idea: data.idea, audience: data.audience, cover: data.views.finished[0], layout: data.views.layout[2], content: data.views.content[2], finished: data.views.finished[2], violet: data.violet }}/></div>
      </section>
      <div className={s.scrollCue}><a href="#workflow">Explore the workflow</a></div>
      <div className={s.capabilityStrip} data-reveal><p>A considered story.<br/>One coherent workflow.</p>{["Brief", "Story", "Preview", "Revise", "Export"].map(label => <span key={label}>{label}</span>)}</div>
      <section className={s.section} id="workflow" aria-labelledby="workflow-heading">
        <div className={s.sectionHeading} data-reveal><p className={s.eyebrow}>THE WORKFLOW</p><h2 id="workflow-heading">From idea to a<br/>story worth sharing.</h2><p>Bring the facts together. See what happens next. Keep the important decisions in your hands.</p></div>
        <div className={s.featureGrid}>
          <article className={s.featureCard}><span className={s.indexLabel}>01</span><div className={`${s.featureIllustration} ${s.storyIllustration}`} data-reveal><div className={s.storySheet}><span>THE STORY / 01—05</span>{["Problem", "Answer", "Workflow", "Proof", "Next step"].map((role, i) => <div key={role}><small>0{i + 1}</small><strong>{role}</strong><i/></div>)}</div><span className={s.illustrationSeal}>g↗</span></div><h3>Shape the story</h3><p>Supplied facts become a problem, an answer, a workflow, the proof, and a clear next step.</p><a href="/briefing">Start your brief ↗</a></article>
          <article className={s.featureCard}><span className={s.indexLabel}>02</span><div className={s.featureIllustration} data-reveal><div className={s.slideStack}><img src={data.views.layout[2]} alt="Prepared layout preview of slide three"/><img src={data.views.finished[2]} alt="The same slide's finished engine composition"/></div></div><h3>See the plan first</h3><p>Layout, content, and finished views. One element blueprint behind the preview and PowerPoint.</p><a href="#demo">Explore the preview ↗</a></article>
          <article className={s.featureCard}><span className={s.indexLabel}>03</span><div className={s.featureIllustration} data-reveal><div className={s.revisionIllustration}><img src={data.violet} alt="Prepared violet-headline revision of slide three"/><span><i/> slide3.headline <strong>#7C3AED</strong></span><small>✓ Other elements preserved</small></div></div><h3>Direct the details</h3><p>Change text, notes, colour, accent, or a supported layout. Keep earlier versions available.</p><a href="#revision">Try a focused revision ↗</a></article>
        </div>
      </section>
      <GuidedDemo data={data}/>
      <section className={`${s.section} ${s.docsPromo}`} id="quick-start" aria-labelledby="start-heading">
        <div data-reveal><p className={s.eyebrow}>MADE TO BE UNDERSTOOD</p><h2 id="start-heading">A good brief.<br/>Less guesswork.</h2><p>A clear path from your first idea to a composed story, a precise revision, and a presentation you can take with you.</p><a className={s.primary} href="/briefing">Start your brief ↗</a><p className={s.briefFootnote}>The 20-question brief requires format, topic, audience, and outcome. Optional questions can be skipped. On the standalone page, copy the completed brief back into ChatGPT with GraphicRouter selected; submitting the form alone does not create a deck or deliver a Canva design.</p></div>
        <div className={s.guideLinks}>
          {[
            ["Start with your brief", "Audience, story, evidence and visual style — one question at a time.", "/briefing"],
            ["Review the composition", "See the same plan in layout, content, and finished stages.", "#demo"],
            ["Change one detail", "Copy the violet headline prompt. Preserve the rest.", "#prompt-revise"],
            ["Prepare your handoff", "PowerPoint and notes first. Canva import when connected.", "#prompt-export"],
          ].map(([title, subtitle, href], i) => <a href={href} className={s.guideRow} key={title}><span>0{i + 1}</span><div data-reveal><h3>{title}</h3><p>{subtitle}</p></div><span aria-hidden="true">↗</span></a>)}
        </div>
      </section>
      <PromptLibrary/>
      <section className={`${s.section} ${s.faq}`} id="faq" aria-labelledby="faq-heading"><div data-reveal><p className={s.eyebrow}>THE BASICS</p><h2 id="faq-heading">A few things<br/>worth knowing.</h2></div><div>{faqs.map(([question, answer], i) => <details key={question} id={`faq-${i}`}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className={s.availability} id="availability" aria-labelledby="availability-heading"><p className={s.eyebrow}>CURRENT AVAILABILITY</p><h3 id="availability-heading">A working local flow. Account checks still ahead.</h3><p>The real engine, local previews, focused revisions, and PowerPoint exports have local verification. Hosted ChatGPT tools/widget and application Canva OAuth/import remain pending. A separate manual Canva fixture import confirmed text and image editing; it does not establish application end-to-end success. Shape and line editing, font fidelity, speaking pace, and a recorded live demo still need verification.</p><p>The guided examples on this page are prepared engine output. Clicking or scrolling makes no live ChatGPT or Canva calls, creates no deck, saves no version, and starts no import. There is no checkout or public-installation promise.</p></section>
      <section className={`${s.section} ${s.closing}`} aria-labelledby="closing-heading"><div data-reveal><p className={s.tag}>YOUR STORY. YOUR DIRECTION.</p><h2 id="closing-heading">Make your next<br/>story clear.</h2><p>Bring your facts. Read the plan. Present with purpose.</p></div><div><CopyPrompt text={prompts.hero} label="closing pitch prompt"/><a href="/briefing">Start your brief ↗</a><a href="#demo">Explore the demo →</a></div></section>
    </main>
    <footer className={s.footer}><div className={s.footerTop}><div><a href="#" aria-label="GraphicRouter home"><Wordmark/></a><p>Plan the story. Direct the changes.</p></div><nav aria-label="Footer navigation"><a href="#workflow">How it works</a><a href="#quick-start">Quick start</a><a href="#availability">Availability</a><a href={user ? chatGPTSignOutPath() : chatGPTSignInPath("/")} target="_top">{user ? "Sign out" : "Site sign in"} ↗</a></nav></div><div className={s.footerBottom}><span>GraphicRouter · Product demo · Prepared examples, clearly labelled.</span><MotionPreferenceButton/><a href="/marketing/references/RepoSetup-LICENSE.txt">Reference artwork &amp; motion attribution</a></div></footer>
  </div>;
}
