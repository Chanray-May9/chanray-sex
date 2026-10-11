import { sitePath } from "../lib/navigation";
"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, Flower2, ArrowRight, Pause, Play } from "lucide-react";
import { ModeSettings } from "./ModeSettings";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";
const whispers = [COPY.whisper1, COPY.whisper2, COPY.whisper3, COPY.whisper4];
export function Ruirui() {
  const t = useSiteText();
  const [whisper, setWhisper] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [mood, setMood] = useState("peach");
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState("chat");
  useEffect(() => {
    try { const saved = localStorage.getItem("ruirui:mood"); if (saved && ["peach", "rose", "cream"].includes(saved)) setMood(saved); } catch {}
  }, []);
  function changeMood(value: string) { setMood(value); try { localStorage.setItem("ruirui:mood", value); } catch {} }
  function go(section: string) { if (section === "chat") { window.location.assign(sitePath("/chat")); return; } setActive(section); document.getElementById(section)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }
  return <div className={`ruirui-site mood-${mood} ${paused ? "motion-paused" : ""}`}>
    <header className="rui-header">
      <a className="wordmark" href={sitePath("/")} aria-label={t(COPY.footerNote)}><span className="brand-flower"><Flower2 size={26} strokeWidth={1.4}/></span><span>{t(COPY.brand)}<small>{t(COPY.subtitle)}</small></span></a>
      <nav className="rui-nav" aria-label={t(COPY.sessionTitle)}>
        <button className={active === "chat" ? "active" : ""} onClick={() => go("chat")}>{t(COPY.navChat)}</button>
        <button className={active === "whispers" ? "active" : ""} onClick={() => go("whispers")}>{t(COPY.navWhispers)}</button>
        <button className={active === "together" ? "active" : ""} onClick={() => go("together")}>{t(COPY.navTogether)}</button>
      </nav>
      <ModeSettings/>
      <div className="header-note"><span className="tiny-heart">♡</span>{t(COPY.heroNote)}</div>
    </header>
    <main>
      <section className="rui-hero" aria-labelledby="hero-title">
        <div className="hero-story">
          <p className="hero-eyebrow"><span/>{t(COPY.heroEyebrow)}</p>
          <h1 id="hero-title">{t(COPY.heroLine1)}<br/>{t(COPY.heroLine2)}<br/><em>{t(COPY.heroLine3)}</em></h1>
          <p className="hero-description">{t(COPY.heroDescription)}</p>
          <button className="primary-button hero-button" onClick={() => { go("chat"); }}>{t(COPY.heroAction)}<ArrowUpRight size={18}/></button>
          <button className="text-link" onClick={() => go("whispers")}>{t(COPY.heroSecondary)}<ArrowRight size={15}/></button>
          <div className="hero-art" aria-label={t(COPY.artAlt)} onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--touch-x", `${((event.clientX - rect.left) / rect.width - .5) * 12}px`); }}>
            <span className="orbit-ring ring-one"/><span className="orbit-ring ring-two"/><span className="art-star star-one">✧</span><span className="art-star star-two">✦</span>
            <svg className="heart-svg" viewBox="0 0 280 270" fill="none" aria-hidden="true"><defs><linearGradient id="heart-glass" x1="86" y1="78" x2="216" y2="230" gradientUnits="userSpaceOnUse"><stop stopColor="#fff4fa"/><stop offset=".35" stopColor="var(--rui-middle)" stopOpacity=".72"/><stop offset="1" stopColor="var(--rui-accent)" stopOpacity=".85"/></linearGradient><linearGradient id="heart-reflection" x1="90" y1="95" x2="183" y2="215" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity=".8"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient><filter id="heart-shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="3" dy="14" stdDeviation="9" floodColor="#a54375" floodOpacity=".14"/></filter></defs><g transform="translate(14 3) scale(.6) rotate(-17 140 150)" opacity=".58"><path d="M143 225C116 205 64 168 64 121C64 79 112 65 143 101C174 65 224 79 224 121C224 168 172 205 143 225Z" fill="url(#heart-glass)"/></g><g transform="rotate(15 143 165)" filter="url(#heart-shadow)"><path d="M143 225C116 205 64 168 64 121C64 79 112 65 143 101C174 65 224 79 224 121C224 168 172 205 143 225Z" fill="url(#heart-glass)" stroke="#fce0ee" strokeWidth="1.2"/><path d="M143 218C111 193 72 161 72 123C72 96 101 82 126 96C136 103 141 118 143 137C136 111 156 90 177 86C201 81 218 95 217 119" stroke="url(#heart-reflection)" strokeWidth="5" strokeLinecap="round"/></g></svg>
            <button className="art-heart-button" aria-label={t(COPY.littleTouch)} onClick={() => setHearts(value => value + 1)}><Heart size={16} fill="currentColor"/>{t(hearts ? COPY.littleReceived : COPY.orbitLabel)}</button>
            <span className="art-caption">{t(COPY.orbitNote)}</span>
          </div>
        </div>
        <section className="home-chat-invitation" aria-labelledby="invite-title"><div className="invite-heart"><Heart size={64} strokeWidth={1}/></div><p className="hero-eyebrow">{t(COPY.chatInvitationLabel)}</p><h2 id="invite-title">{t(COPY.chatInvitationTitle)}</h2><p>{t(COPY.chatInvitationDescription)}</p><a className="primary-button" href={sitePath("/chat")}>{t(COPY.navChat)}<ArrowUpRight size={18}/></a><span className="invite-detail">{t(COPY.chatInvitationDetail)}</span></section>
      </section>
      <section className="small-moments" aria-label={t(COPY.heroSecondary)}>
        <article className="whisper-card" id="whispers"><div className="section-eyebrow"><Flower2 size={18}/>{t(COPY.whisperLabel)}</div><h2>{t(COPY.whisperTitle)}</h2><p className="whisper-intro">{t(COPY.whisperIntro)}</p><div className="handwritten-message" key={whisper}><span className="quotation">“</span><p>{t(whispers[whisper])}</p><span className="letter-signature">— {t(COPY.whisperSignature)} ♡</span></div><button className="outline-button" onClick={() => setWhisper(value => (value + 1) % whispers.length)}>{t(COPY.nextWhisper)}<ArrowRight size={16}/></button><span className="letter-scribble" aria-hidden>♡</span></article>
        <article className="together-card" id="together"><div className="section-eyebrow"><Heart size={16}/>{t(COPY.littleTitle)}</div><h2>{t(COPY.littleQuiet)}</h2><p>{t(COPY.littleDescription)}</p><button className={`pulse-heart ${hearts ? "heart-touched" : ""}`} onClick={() => setHearts(value => value + 1)} aria-label={t(COPY.littleTouch)}><Heart key={hearts} size={47} strokeWidth={1.1} fill={hearts ? "currentColor" : "none"}/><span className="heart-orbit"/></button><div className="heart-feedback" aria-live="polite">{t(hearts ? COPY.littleReceived : COPY.littleTouch)}</div><span className="tiny-flower" aria-hidden>✧</span></article>
      </section>
      <div className="mood-controls"><div><span>{t(COPY.moodLabel)}</span><div className="mood-options">{[["peach", COPY.moodPeach], ["rose", COPY.moodRose], ["cream", COPY.moodCream]].map(([value, label]) => <button className={`mood-choice mood-dot-${value}`} key={value} aria-label={t(label)} aria-pressed={mood === value} onClick={() => changeMood(value)}><i/>{t(label)}</button>)}</div></div><button className="motion-control" onClick={() => setPaused(value => !value)}>{paused ? <Play size={12}/> : <Pause size={12}/>}<span>{t(paused ? COPY.motionOff : COPY.motionOn)}</span></button></div>
    </main>
    <footer className="rui-footer"><p><Flower2 size={15}/>{t(COPY.footer)}</p><span>{t(COPY.copyright)}</span><a href={sitePath("/admin/")}>{t(COPY.admin)}<ArrowUpRight size={12}/></a></footer>
  </div>;
}
