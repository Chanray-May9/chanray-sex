"use client";
import { sitePath } from "../lib/navigation";
import { Heart, Play, Shuffle, Sparkles, ArrowUpRight } from "lucide-react";
import { SCENES, TONIGHT } from "@/lib/erotic";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

function levelText(level: number) {
  return TONIGHT.levelNames[Math.max(0, Math.min(TONIGHT.levelNames.length - 1, level - 1))];
}

export function Scenes() {
  const t = useSiteText();
  function open(slug: string) {
    window.location.assign(`${sitePath("/chat")}?scene=${encodeURIComponent(slug)}`);
  }
  function random() {
    const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
    if (scene) open(scene.slug);
  }
  return <section className="tonight-section" id="scenes" aria-labelledby="scenes-title">
    <header className="tonight-head">
      <p className="section-eyebrow"><Sparkles size={16}/>{t(COPY.scenesEyebrow)}</p>
      <div className="tonight-head-row">
        <div>
          <h2 id="scenes-title">{t(TONIGHT.title)}</h2>
          <p>{t(TONIGHT.description)}</p>
        </div>
        <button className="outline-button tonight-random" onClick={random}><Shuffle size={15}/>{t(TONIGHT.randomLabel)}</button>
      </div>
    </header>
    <div className="scene-grid">
      {SCENES.map(scene => <article className={`scene-card scene-level-${scene.level}`} key={scene.slug}>
        <div className="scene-card-top">
          <span className="scene-tag">{t(scene.tag)}</span>
          <span className="scene-hearts" aria-label={levelText(scene.level)}>{Array.from({ length: 4 }, (_, index) => <Heart key={index} size={12} fill={index < scene.level ? "currentColor" : "none"} strokeWidth={1.4}/>)}</span>
        </div>
        <h3>{t(scene.title)}</h3>
        <p className="scene-teaser">{t(scene.teaser)}</p>
        <div className="scene-card-foot">
          <span className="scene-level">{levelText(scene.level)}</span>
          <button className="scene-open" onClick={() => open(scene.slug)}>{t(TONIGHT.enterLabel)}<Play size={13} fill="currentColor"/></button>
        </div>
      </article>)}
    </div>
    <p className="tonight-note"><Heart size={13}/>{t(TONIGHT.note)}<a href="#rules">{t(COPY.navRules)}<ArrowUpRight size={12}/></a></p>
  </section>;
}
