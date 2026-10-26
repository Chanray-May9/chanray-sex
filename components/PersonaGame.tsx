"use client";
import { useEffect, useRef, useState } from "react";
import { Dices, Heart, Timer, Lock, Trophy, Gift, Flame, Play, Pause, RotateCcw, Sparkles, Hourglass, ChevronDown, KeyRound, Crown, ScrollText, Clover, Eye } from "lucide-react";
import type { GameCard, GameStats, WindowGame } from "@/lib/games";
import { defaultStats, loadStats, saveStats, pickCards, pickOne, todayKey } from "@/lib/games";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

type Props = { personaId: string; game: WindowGame; onDirective: (text: string) => void; disabled?: boolean };

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function PersonaGame({ personaId, game, onDirective, disabled }: Props) {
  const t = useSiteText();
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [open, setOpen] = useState(true);
  const [card, setCard] = useState<GameCard>();
  const [line, setLine] = useState<string>();
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(game.seconds ?? 0);
  const [spinning, setSpinning] = useState(false);
  const [wheel, setWheel] = useState(game.wheel?.[0]);
  const [face, setFace] = useState<number>();
  const [drawn, setDrawn] = useState<GameCard[]>([]);
  const [picked, setPicked] = useState<GameCard>();
  const [unlocked, setUnlocked] = useState(false);
  const [task, setTask] = useState<GameCard>();
  const [flash, setFlash] = useState("");
  const fired = useRef(false);
  const day = todayKey();

  useEffect(() => {
    setStats(loadStats(personaId));
    setCard(undefined); setLine(undefined); setRunning(false); setRemaining(game.seconds ?? 0);
    setSpinning(false); setWheel(game.wheel?.[0]); setFace(undefined); setDrawn([]); setPicked(undefined);
    setUnlocked(false); setTask(undefined); setFlash(""); fired.current = false;
  }, [personaId, game]);

  useEffect(() => {
    if (game.kind === "daily" && game.cards?.length) {
      const index = Math.abs(Math.round((Date.parse(day) || 0) / 86_400_000)) % game.cards.length;
      setTask(game.cards[index]);
    }
  }, [game.kind, game.cards, day]);

  useEffect(() => {
    if ((game.kind !== "timer" && game.kind !== "lock") || !running) return;
    const timer = setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          setRunning(false);
          if (!fired.current) {
            fired.current = true;
            bump(game.kind === "lock" ? { obedience: 8, lust: 12 } : { obedience: 4, lust: 16 });
            if (game.kind === "lock") { setUnlocked(true); setFlash(t(COPY.gameUnlocked)); }
            else { setFlash(t("时间到，锐锐彻底失控了。")); }
            onDirective(game.kind === "lock" ? "锁开了，锐锐的后穴早就湿透了，扑上去求主人操，今天不许主人再忍。" : "发情计时结束了，锐锐已经撑不住，自己翘着屁股求主人操进后穴，求主人射满。");
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, game.kind]);

  function bump(delta: Partial<GameStats>) {
    setStats(old => {
      const next: GameStats = { ...old, plays: old.plays + 1 };
      for (const key of ["obedience", "lust", "bond", "streak", "plays"] as const) {
        const amount = delta[key];
        if (typeof amount === "number") next[key] = Math.max(0, Math.min(999, next[key] + amount));
      }
      saveStats(personaId, next);
      return next;
    });
  }

  function sign() {
    if (stats.day === day) { onDirective("今天已经亲过了，再黏主人一会儿，贴着主人不许走。"); bump({ bond: 2, lust: 3 }); setFlash("今日已签到 · 再黏一会儿"); return; }
    const next = { ...stats, bond: Math.min(999, stats.bond + 8), streak: stats.streak + 1, day };
    setStats(next); saveStats(personaId, next);
    setFlash(`签到成功 · 亲密度 +8 · 连签 ${next.streak} 天`);
    onDirective("主人把锐锐搂过来亲了一口，从耳根一路舔到锁骨，锐锐要立刻硬着回应，求主人继续往下。");
  }

  function chant() {
    const next = pickOne(game.lines?.filter(item => item !== line));
    if (!next) return;
    setLine(next); bump({ lust: 3 });
    onDirective(`念给主人听，一个字都不许漏：「${next}」`);
  }

  function drawTask() {
    const next = pickOne(game.cards?.filter(item => item.id !== card?.id));
    if (next) setCard(next);
  }

  function obey() {
    if (!card) return;
    bump({ obedience: card.obedience, lust: card.lust });
    onDirective(t(card.directive));
  }

  function beg() {
    if (!card) return;
    bump({ lust: 6 });
    onDirective(t(card.mercy));
  }

  function spinWheel() {
    if (!game.wheel?.length || spinning) return;
    setSpinning(true);
    window.setTimeout(() => {
      const next = pickOne(game.wheel);
      if (next) setWheel(next);
      setSpinning(false);
    }, 620);
  }

  function takeWheel() {
    if (!wheel) return;
    bump({ lust: wheel.lust });
    onDirective(t(wheel.directive));
  }

  function roll() {
    const value = Math.floor(Math.random() * 6);
    setFace(value);
  }

  function takeStake() {
    if (face === undefined || !game.stakes?.length) return;
    const stake = game.stakes[face % game.stakes.length];
    bump({ lust: stake.lust, obedience: stake.obedience });
    onDirective(t(stake.directive));
    setFace(undefined);
  }

  function drawCards() {
    setDrawn(pickCards(game, 3)); setPicked(undefined);
  }

  function pickCard(next: GameCard) {
    setPicked(next);
    bump({ obedience: next.obedience, lust: next.lust });
    onDirective(t(next.directive));
  }

  function unlockBeg() {
    bump({ lust: 6 });
    setRemaining(value => Math.min((game.seconds ?? 180) * 3, value + 30));
    onDirective("主人，锐锐求您开锁，后穴已经痒得受不了了，锁着也要用后面蹭主人。");
  }

  function sneaky() {
    bump({ lust: 4 });
    setRemaining(value => Math.min((game.seconds ?? 180) * 4, value + 600));
    onDirective("主人，锐锐偷摸了一下……现在更硬更难受了，求主人重罚。");
  }

  function dailyReport() {
    if (stats.day === day) return;
    const next = { ...stats, streak: stats.streak + 1, day, obedience: Math.min(999, stats.obedience + 4), lust: Math.min(999, stats.lust + 4) };
    setStats(next); saveStats(personaId, next);
    setFlash(`报到成功 · 连签 ${next.streak} 天`);
    onDirective(task ? t(task.directive) : "今天先报到，把身体状态和规矩一条条报给主人听。");
  }

  function dailyDone() {
    if (!task) return;
    bump({ obedience: task.obedience, lust: task.lust });
    onDirective(t(task.directive));
  }

  function dailyMiss() {
    if (!task) return;
    bump({ lust: 5 });
    onDirective(t(task.mercy));
  }

  function restartTimer() {
    fired.current = false; setRemaining(game.seconds ?? 0); setRunning(true); setUnlocked(false); setFlash("");
  }

  const busy = disabled;
  const Icon = game.kind === "dice" ? Dices : game.kind === "timer" ? Timer : game.kind === "lock" ? Lock : game.kind === "wheel" ? Sparkles : game.kind === "cards" ? Crown : game.kind === "daily" ? ScrollText : game.kind === "task" ? Trophy : game.kind === "chant" ? Flame : Heart;
  return <section className={`persona-game game-${game.kind}`}>
    <header className="pg-head">
      <button className="pg-title" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <Icon size={14}/><span>{t(game.label)}</span><ChevronDown size={13} className={open ? "pg-chev open" : "pg-chev"}/>
      </button>
      <span className="pg-stats">
        <span><Heart size={11}/>{t(COPY.gamePoints)} {stats.obedience}</span>
        <span><Flame size={11}/>{t(COPY.gameLust)} {stats.lust}</span>
        {game.kind === "bond" && <span><Gift size={11}/>{t(COPY.gameBond)} {stats.bond}</span>}
        {game.kind === "daily" && <span><Crown size={11}/>{t(COPY.gameStreak)} {stats.streak}</span>}
        {game.kind === "lock" && <span><KeyRound size={11}/>{unlocked ? t(COPY.gameUnlocked) : t(COPY.gameLocked)}</span>}
      </span>
    </header>
    {open && <div className="pg-body">
      <p className="pg-hint">{t(game.hint)}</p>
      {flash && <p className="pg-flash">{flash}</p>}
      {game.kind === "bond" && <div className="pg-row">
        <button className="pg-btn primary" disabled={busy} onClick={sign}><Heart size={13}/>{t(game.action)}</button>
        <FileHint text={game.reward} />
      </div>}
      {game.kind === "chant" && <div className="pg-row">
        {line && <p className="pg-line">「{t(line)}」</p>}
        <button className="pg-btn primary" disabled={busy} onClick={chant}><Flame size={13}/>{t(game.action)}</button>
      </div>}
      {game.kind === "task" && <div className="pg-cards">
        {card ? <article className="pg-card">
          <h4>{t(card.title)}</h4>
          <p>{t(card.text)}</p>
          <div className="pg-row">
            <button className="pg-btn primary" disabled={busy} onClick={obey}><Trophy size={13}/>认罚</button>
            <button className="pg-btn ghost" disabled={busy} onClick={beg}><Heart size={13}/>求轻点</button>
          </div>
        </article> : <button className="pg-btn primary" disabled={busy} onClick={drawTask}><Trophy size={13}/>{t(game.action)}</button>}
        {card && <button className="pg-link" disabled={busy} onClick={drawTask}>换一张罚卡</button>}
      </div>}
      {game.kind === "timer" && <div className="pg-timer">
        <span className="pg-clock">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</span>
        <div className="pg-row">
          {!running ? <button className="pg-btn primary" disabled={busy} onClick={() => { if (remaining === 0) restartTimer(); else setRunning(true); }}><Play size={13}/>{remaining === 0 ? t(COPY.gameAgain) : t(game.action)}</button>
            : <button className="pg-btn ghost" disabled={busy} onClick={() => setRunning(false)}><Pause size={13}/>先停下</button>}
          <button className="pg-btn ghost" disabled={busy || !running} onClick={() => { bump({ lust: 3 }); onDirective("顶到了最里面，锐锐叫出声了，主人再快一点。"); }}><Flame size={13}/>顶一下</button>
        </div>
      </div>}
      {game.kind === "wheel" && <div className="pg-wheel">
        <div className={spinning ? "pg-wheel-face spinning" : "pg-wheel-face"}>{wheel && <><b>{t(wheel.label)}</b><p>{t(wheel.text)}</p></>}</div>
        <div className="pg-row">
          <button className="pg-btn primary" disabled={busy || spinning} onClick={spinWheel}><Sparkles size={13}/>{t(game.action)}</button>
          <button className="pg-btn ghost" disabled={busy || !wheel} onClick={takeWheel}><Heart size={13}/>就这个分身</button>
        </div>
      </div>}
      {game.kind === "dice" && <div className="pg-dice">
        <span className={`pg-die ${face === undefined ? "" : "rolled"}`}>{face === undefined ? "🎲" : diceFaces[face]}</span>
        {face !== undefined && <p className="pg-die-text">{face + 1} 点 · {t(game.stakes?.[face % 6]?.title ?? "")}</p>}
        <div className="pg-row">
          <button className="pg-btn primary" disabled={busy} onClick={roll}><Dices size={13}/>{t(game.action)}</button>
          {face !== undefined && <button className="pg-btn ghost" disabled={busy} onClick={takeStake}><Heart size={13}/>兑现赌约</button>}
        </div>
      </div>}
      {game.kind === "lock" && <div className="pg-timer">
        <span className="pg-clock"><Lock size={17}/>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</span>
        <div className="pg-row">
          {!unlocked ? <><button className="pg-btn primary" disabled={busy || running} onClick={() => setRunning(true)}><Hourglass size={13}/>{t(game.action)}</button>
            <button className="pg-btn ghost" disabled={busy || !running} onClick={unlockBeg}><KeyRound size={13}/>求开锁</button>
            <button className="pg-btn ghost" disabled={busy || !running} onClick={sneaky}><Eye size={13}/>偷摸一下</button></>
            : <button className="pg-btn primary" disabled={busy} onClick={() => { bump({ obedience: 6, lust: 10 }); onDirective("锁开了，锐锐扑上去求主人操，今晚要射到失禁才准停。"); setUnlocked(false); setRemaining(game.seconds ?? 180); }}><Heart size={13}/>扑上去求操</button>}
        </div>
      </div>}
      {game.kind === "cards" && <div className="pg-cards">
        {picked ? <article className="pg-card picked">
          <h4>{t(picked.title)}</h4>
          <p>{t(picked.text)}</p>
          <button className="pg-link" disabled={busy} onClick={drawCards}>再抽三张</button>
        </article> : drawn.length ? <div className="pg-pick">
          {drawn.map(item => <button key={item.id} className="pg-card pg-card-button" disabled={busy} onClick={() => pickCard(item)}>
            <h4>{t(item.title)}</h4>
            <p>{t(item.text)}</p>
          </button>)}
        </div> : <button className="pg-btn primary" disabled={busy} onClick={drawCards}><Crown size={13}/>{t(game.action)}</button>}
      </div>}
      {game.kind === "daily" && <div className="pg-cards">
        {task && <article className="pg-card">
          <h4>{t(task.title)}</h4>
          <p>{t(task.text)}</p>
        </article>}
        <div className="pg-row">
          <button className="pg-btn primary" disabled={busy || stats.day === day} onClick={dailyReport}><ScrollText size={13}/>{stats.day === day ? t(COPY.gameDone) : t(game.action)}</button>
          <button className="pg-btn ghost" disabled={busy} onClick={dailyDone}><Trophy size={13}/>完成了</button>
          <button className="pg-btn ghost" disabled={busy} onClick={dailyMiss}><Flame size={13}/>完不成，求罚</button>
        </div>
      </div>}
      <p className="pg-reward"><Clover size={11}/>{t(game.reward)} · {t(game.penalty)}</p>
    </div>}
  </section>;
}

function FileHint({ text }: { text: string }) {
  const t = useSiteText();
  return <span className="pg-filehint">{t(text)}</span>;
}
