"use client";
import { sitePath } from "../lib/navigation";
import { ArrowUpRight, Sparkles, Flame } from "lucide-react";
import { PERSONAS } from "@/lib/personas";
import { GAMES } from "@/lib/games";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

export function PersonaWindows() {
  const t = useSiteText();
  return <section className="windows-section" id="windows" aria-labelledby="windows-title">
    <header className="windows-head">
      <p className="section-eyebrow"><Sparkles size={16}/>{t(COPY.windowsLabel)}</p>
      <h2 id="windows-title">{t(COPY.windowsTitle)}</h2>
      <p>{t(COPY.windowsHint)}</p>
    </header>
    <div className="windows-grid">
      {PERSONAS.map(persona => {
        const game = GAMES[persona.id];
        return <a className="window-card" key={persona.id} href={`${sitePath("/chat")}?persona=${encodeURIComponent(persona.id)}`}>
          <span className="window-badge" style={{ background: persona.accent }}>{t(persona.badge)}</span>
          <h3>{t(persona.name)}</h3>
          <p>{t(persona.tagline)}</p>
          <span className="window-game"><Flame size={12}/>{game ? t(game.label) : t(COPY.windowSwitch)}<ArrowUpRight size={12}/></span>
        </a>;
      })}
    </div>
  </section>;
}
