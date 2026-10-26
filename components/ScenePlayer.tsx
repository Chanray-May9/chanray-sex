"use client";
import { useMemo, useRef, useState } from "react";
import { X, Heart, Flame, RotateCcw, ArrowRight, SkipForward } from "lucide-react";
import type { Scene } from "@/lib/erotic";
import { TONIGHT } from "@/lib/erotic";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

export function ScenePlayer({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const t = useSiteText();
  const byId = useMemo(() => new Map(scene.beats.map(beat => [beat.id, beat])), [scene]);
  const [beatId, setBeatId] = useState(scene.entry);
  const [obedience, setObedience] = useState(0);
  const [lust, setLust] = useState(0);
  const [steps, setSteps] = useState(0);
  const sheet = useRef<HTMLElement>(null);
  const beat = byId.get(beatId) ?? scene.beats[0];
  const ending = beat.choices.length === 0;
  function advance(next: string, gain: { obedience: number; lust: number }) {
    setObedience(value => Math.min(100, value + gain.obedience));
    setLust(value => Math.min(100, value + gain.lust));
    setSteps(value => value + 1);
    setBeatId(next);
    sheet.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
  function restart() {
    setBeatId(scene.entry);
    setObedience(0);
    setLust(0);
    setSteps(0);
  }
  return <div className="scene-overlay" role="dialog" aria-modal="true" aria-label={scene.title}>
    <button className="scene-backdrop" aria-label={t(COPY.sceneExit)} onClick={onClose}/>
    <section className="scene-sheet" ref={sheet}>
      <button className="scene-close icon-button" aria-label={t(COPY.sceneExit)} onClick={onClose}><X size={22}/></button>
      <header className="scene-head">
        <span className="scene-tag">{t(scene.tag)}</span>
        <h2>{t(scene.title)}</h2>
        <p className="scene-level">{TONIGHT.levelNames[Math.max(0, Math.min(TONIGHT.levelNames.length - 1, scene.level - 1))]}</p>
      </header>
      <div className="scene-meters" aria-label={t(COPY.obedienceLabel)}>
        <div className="scene-meter">
          <span><Heart size={12}/>{t(COPY.obedienceLabel)}<b>{obedience}</b></span>
          <i><span style={{ width: `${obedience}%` }}/></i>
        </div>
        <div className="scene-meter lust">
          <span><Flame size={12}/>{t(COPY.lustLabel)}<b>{lust}</b></span>
          <i><span style={{ width: `${lust}%` }}/></i>
        </div>
      </div>
      <article className="scene-text" key={beat.id}>
        <p>{t(beat.text)}</p>
      </article>
      {!ending ? <div className="scene-choices">
        {beat.choices.map(choice => <button key={choice.label} onClick={() => advance(choice.next, choice)} className="scene-choice">
          <span>{t(choice.label)}</span>
          <small>+{choice.obedience} 顺从 · +{choice.lust} 淫乱</small>
        </button>)}
      </div> : <div className="scene-ending">
        <p className="scene-ending-title">{t(COPY.sceneEnding)}</p>
        <div className="scene-ending-actions">
          <button className="outline-button" onClick={restart}><RotateCcw size={15}/>{t(TONIGHT.restartLabel)}</button>
          <button className="primary-button" onClick={onClose}>{t(COPY.sceneToChat)}<ArrowRight size={15}/></button>
        </div>
      </div>}
      <footer className="scene-foot">
        <span><SkipForward size={13}/>{t(COPY.navTonight)} · {Math.min(steps + 1, scene.beats.length)} / {scene.beats.length}</span>
        <button className="text-link" onClick={onClose}>{t(COPY.sceneExit)}<X size={13}/></button>
      </footer>
    </section>
  </div>;
}
