"use client";
import { useEffect, useState } from "react";
import { Check, Gift, Flame, Gavel, Stamp, PenLine, RotateCcw } from "lucide-react";
import { CONTRACT } from "@/lib/erotic";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

const SIGN_KEY = "ruirui:contract:v2";
const numerals = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
type SignState = { name: string; at: number; sealed: boolean };

export function Contract() {
  const t = useSiteText();
  const [sign, setSign] = useState<SignState | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(SIGN_KEY); if (raw) setSign(JSON.parse(raw) as SignState); } catch {}
  }, []);
  function persist(next: SignState | null) {
    setSign(next);
    try { if (next) localStorage.setItem(SIGN_KEY, JSON.stringify(next)); else localStorage.removeItem(SIGN_KEY); } catch {}
  }
  function commitName() {
    const name = draft.trim() || "主人";
    persist({ name, at: Date.now(), sealed: false });
    setEditing(false);
    setDraft("");
  }
  function seal() {
    if (!sign) return;
    persist({ ...sign, sealed: true, at: Date.now() });
  }
  function tear() {
    if (!armed) { setArmed(true); window.setTimeout(() => setArmed(false), 4000); return; }
    persist(null);
    setArmed(false);
  }
  const sealed = Boolean(sign?.sealed);
  const dateText = sign ? `${new Date(sign.at).getFullYear()} 年 ${new Date(sign.at).getMonth() + 1} 月 ${new Date(sign.at).getDate()} 日` : "";
  const status = sealed ? "已生效 · 卖身契" : sign ? "已落笔 · 待按手印" : "未签 · 等主人落笔";
  return <section className="contract-section" id="rules" aria-labelledby="contract-title">
    <div className={`contract-paper ${sealed ? "signed" : ""}`}>
      <span className="contract-tape tape-left" aria-hidden/>
      <span className="contract-tape tape-right" aria-hidden/>
      <span className={`contract-status ${sealed ? "sealed" : sign ? "written" : ""}`}>{status}</span>
      <header className="contract-head">
        <p className="contract-no">契 字 第 零 壹 号 · 主人亲启</p>
        <h2 id="contract-title">{t(CONTRACT.title)}</h2>
        <p className="contract-sub">{t(CONTRACT.intro)}</p>
      </header>
      <div className="contract-parties">
        <p><b>立契人</b><span>锐锐，十八岁，男娘，受</span></p>
        <p><b>买主</b><span>主人</span></p>
        <p className="contract-oath">今因淫荡难耐，自愿将身子、后穴、肉棒与每一声浪叫，全数卖与主人所有。此后跪、趴、含、挨操、挨罚，皆听主人一句话，绝不反悔。</p>
      </div>
      <ol className="contract-clauses">
        {CONTRACT.rules.map((rule, index) => <li key={rule}>
          <span className="clause-no">第{numerals[index] ?? index + 1}条</span>
          <p>{t(rule)}</p>
        </li>)}
      </ol>
      <div className="contract-terms">
        <div><b><Gift size={13}/>赏</b><p>{t(CONTRACT.reward)}</p></div>
        <div><b><Flame size={13}/>罚</b><p>{t(CONTRACT.punish)}</p></div>
      </div>
      <div className="contract-signatures">
        <div className={`sign-row sign-master ${editing ? "editing" : ""}`}>
          <span>甲方 · 主人</span>
          {editing
            ? <form className="sign-form" onSubmit={event => { event.preventDefault(); commitName(); }}>
                <input autoFocus value={draft} maxLength={12} placeholder="写下主人的名字" onChange={event => setDraft(event.target.value)}/>
                <button type="submit"><PenLine size={13}/>落笔</button>
                <button type="button" className="sign-cancel" onClick={() => { setEditing(false); setDraft(""); }}>先不签</button>
              </form>
            : <button className="sign-line-button" onClick={() => { setEditing(true); setDraft(sign?.name ?? ""); }}>
                {sign ? <i className="sign-name master">{sign.name}</i> : <><PenLine size={13}/>点这里，签下主人的名字</>}
              </button>}
        </div>
        <div className="sign-row"><span>乙方 · 锐锐</span><i className="sign-name signed-always">锐锐</i></div>
        {sealed && <p className="contract-date">签订于 {dateText}</p>}
      </div>
      <div className="contract-bottom">
        <button className={`fingerprint ${sign ? "ready" : ""} ${sealed ? "stamped" : ""}`} onClick={seal} disabled={!sign || sealed} aria-label="按下手印，契约生效">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M32 5c15 0 27 12 27 27"/>
            <path d="M32 11c11.6 0 21 9.4 21 21"/>
            <path d="M32 17c8.3 0 15 6.7 15 15"/>
            <path d="M32 23c5 0 9 4 9 9"/>
            <path d="M32 29c2.2 0 4 1.8 4 4"/>
            <path d="M32 35c0 5 4 9 9 9"/>
            <path d="M23 38c0 6 4 11 10 13"/>
            <path d="M17 30c0 9 4 17 11 22"/>
          </svg>
          <span>{sealed ? "锐锐的指印" : sign ? "按住，按下指印" : "先让主人落笔"}</span>
        </button>
        {sealed
          ? <p className="contract-signed"><Check size={15}/>{t(COPY.contractSigned)}</p>
          : <p className="contract-hint">{sign ? "名字落下了，再按手印才算卖身。" : "契书还没签，锐锐一直在等主人落笔。"}</p>}
        <p className="contract-note"><Gavel size={13}/>{t(COPY.contractNote)}</p>
      </div>
      {sealed && <button className={`contract-tear ${armed ? "armed" : ""}`} onClick={tear}><RotateCcw size={12}/>{armed ? "再点一次，撕毁重签" : "撕毁，重签"}</button>}
      {sealed && <span className="contract-seal" aria-hidden>已<br/>签</span>}
      <span className="contract-watermark" aria-hidden>契</span>
    </div>
  </section>;
}
