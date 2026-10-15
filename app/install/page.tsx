import type { Metadata } from "next";
import config from "../../website/site.config.js";
import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { CopyPrompt } from "../marketing/CopyPrompt";
import s from "./setup.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Get GraphicRouter — ChatGPT setup" };

export default async function Install() {
  const user = await getChatGPTUser();
  return <main className={s.page}>
    <nav className={s.navigation} aria-label="Setup navigation"><a href="/">← GraphicRouter</a><a href={user ? chatGPTSignOutPath("/install") : chatGPTSignInPath("/install")} target="_top">{user ? "Sign out of this site" : "Sign in to this site"}</a></nav>
    <section className={s.hero} aria-labelledby="setup-heading">
      <p className={s.eyebrow}>GRAPHICROUTER / CHATGPT PLUGIN</p>
      <h1 id="setup-heading">Your next idea.<br /><span>Start it in ChatGPT.</span></h1>
      <p className={s.lead}>Install or connect GraphicRouter in ChatGPT, then select it in your chat. No installer file is needed.</p>
      <a className={s.primary} href={config.connectionUrl ?? "https://chatgpt.com/plugins"} target="_blank" rel="noopener noreferrer">Open GraphicRouter in ChatGPT ↗</a>
      <p className={s.note}>This opens the existing plugin page. ChatGPT handles account access, installation and connection. Opening this website does not install anything.</p>
    </section>
    <section className={s.steps} aria-label="Get started">
      {[
        ["01", "Add the plugin", "Sign in to ChatGPT with the account you want to use. On the GraphicRouter page, choose Install or Connect when offered. If it is already installed, choose Try in chat."],
        ["02", "Start with your brief", "Open a new chat and select GraphicRouter. Describe your audience, purpose and facts; add references or pictures. The plugin reuses your details and asks for missing information."],
        ["03", "Continue in Canva", "Connect Canva in ChatGPT when you need a Canva design or an edit to your existing file. Review the actual preview and editable text before saving. PowerPoint export remains a fallback for native GraphicRouter designs."],
      ].map(([number, title, text]) => <article className={s.step} key={number}><span>{number}</span><div><h2>{title}</h2><p>{text}</p></div></article>)}
    </section>
    <section className={s.prompt} aria-labelledby="prompt-heading"><p className={s.eyebrow}>YOUR FIRST CHAT</p><h2 id="prompt-heading">Bring the facts. Direct the design.</h2><CopyPrompt text={config.examplePrompt} label="GraphicRouter starter prompt" /><p>Replace the bracketed details with your own. Keep GraphicRouter selected when you reply to its questions.</p></section>
    <section className={s.help} aria-label="Access and setup help"><h2>Can’t open the plugin?</h2><p>Use the shared link and sign in to ChatGPT. If your workspace blocks custom plugins, ask its administrator about access. The owner controls plugin sharing separately from this website. Installing the plugin and signing in to this website are separate steps.</p><p>If the tools are missing after installation, start a new chat and select GraphicRouter again. Canva must be connected separately for Canva actions.</p><a href="/briefing">Prepare a design brief →</a><p className={s.note}>The standalone brief helps you prepare your request; it does not connect a plugin or save a design.</p></section>
  </main>;
}
