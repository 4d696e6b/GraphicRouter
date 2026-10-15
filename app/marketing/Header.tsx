"use client";
import { useEffect, useRef, useState } from "react";
import { searchContent } from "./content";
import s from "./landing.module.css";

export function Wordmark() {
  return <span className={s.wordmark}><span className={s.brandMark} aria-hidden="true">g<span>↗</span></span>GraphicRouter</span>;
}

export function Header() {
  const [explore, setExplore] = useState(false), [mobile, setMobile] = useState(false), [query, setQuery] = useState("");
  const header = useRef<HTMLElement>(null), exploreButton = useRef<HTMLButtonElement>(null), menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), input = useRef<HTMLInputElement>(null), returnFocus = useRef<HTMLElement | null>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  function closeNavigation() { setExplore(false); setMobile(false); }
  function openSearch(trigger?: HTMLElement) {
    returnFocus.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    closeNavigation(); setQuery(""); dialog.current?.showModal(); input.current?.focus();
  }
  function restoreFocus() {
    const target = returnFocus.current;
    if (target?.getClientRects().length) target.focus();
    else (window.matchMedia("(max-width: 760px)").matches ? menuButton.current : searchButton.current)?.focus();
  }
  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); if (!dialog.current?.open) openSearch(); }
      if (event.key === "Escape" && !dialog.current?.open && (mobile || explore)) {
        event.preventDefault(); closeNavigation(); (mobile ? menuButton.current : exploreButton.current)?.focus();
      }
    }
    function outside(event: PointerEvent) { if (!dialog.current?.open && event.target instanceof Node && !header.current?.contains(event.target)) closeNavigation(); }
    const media = window.matchMedia("(max-width: 760px)");
    function resize() { const active = document.activeElement; closeNavigation(); if (media.matches && header.current?.querySelector("nav")?.contains(active)) menuButton.current?.focus(); else if (!media.matches && active === menuButton.current) searchButton.current?.focus(); }
    document.addEventListener("keydown", keys); document.addEventListener("pointerdown", outside); media.addEventListener("change", resize);
    return () => { document.removeEventListener("keydown", keys); document.removeEventListener("pointerdown", outside); media.removeEventListener("change", resize); };
  }, [mobile, explore]);
  const results = searchContent(query);
  return <>
    <header ref={header} className={s.header} onBlur={event => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeNavigation(); }}>
      <a href="#" aria-label="GraphicRouter home" className={s.brand}><Wordmark /></a>
      <nav id="marketing-navigation" aria-label="Main navigation" className={`${s.navigation} ${mobile ? s.navigationOpen : ""}`}>
        <a href="#workflow" onClick={closeNavigation}>How it works</a>
        <div className={s.explore}>
          <button ref={exploreButton} aria-expanded={explore} aria-controls="explore-links" onClick={() => setExplore(!explore)}>Explore <span aria-hidden="true">⌄</span></button>
          <div id="explore-links" className={s.explorePanel} hidden={!explore}>
            <div><p>Find your starting point</p><a href="#demo" onClick={closeNavigation}>Guided demo<small>Plan, preview, and refine</small></a><a href="#quick-start" onClick={closeNavigation}>Quick start<small>A brief with a clear direction</small></a></div>
            <div><p>Know the product</p><a href="#faq" onClick={closeNavigation}>The basics<small>Formats, versions, and handoff</small></a><a href="#availability" onClick={closeNavigation}>Availability<small>What’s verified, what’s pending</small></a></div>
          </div>
        </div>
        <button ref={searchButton} className={s.searchTrigger} aria-label="Search GraphicRouter" title="Search (Ctrl/Cmd+K)" onClick={event => openSearch(event.currentTarget)}><span className={s.searchIcon} aria-hidden="true"/><span className={s.searchLabel}>Search</span></button>
      </nav>
      <div className={s.headerActions}><a className={s.primary} href="/briefing">Start your brief <span aria-hidden="true">↗</span></a><button ref={menuButton} className={s.menuToggle} aria-label={mobile ? "Close navigation" : "Open navigation"} aria-expanded={mobile} aria-controls="marketing-navigation" onClick={() => setMobile(!mobile)}>Menu <span aria-hidden="true">☰</span></button></div>
    </header>
    <dialog ref={dialog} className={s.searchDialog} aria-labelledby="search-heading" onClose={restoreFocus} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className={s.searchHeader}><h2 id="search-heading">Find your direction.</h2><button aria-label="Close search" onClick={() => dialog.current?.close()}>Esc</button></div>
      <label htmlFor="marketing-search">Search sections, questions, and prompts</label><input ref={input} id="marketing-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try “Canva”, “violet”, or “brief”…" autoComplete="off"/>
      <p className={s.searchCount} role="status">{results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : "No results. Try a different word."}</p>
      <ul>{results.map(result => <li key={result.href}><a href={result.href} onClick={() => { dialog.current?.close(); if (result.href.startsWith("#faq-")) { const item = document.getElementById(result.href.slice(1)); if (item instanceof HTMLDetailsElement) item.open = true; } }}><strong>{result.title}</strong><span>{result.description}</span></a></li>)}</ul>
    </dialog>
  </>;
}
