"use client";
import { useEffect, useState } from "react";
import { Check, Gift, Flame, Gavel, Stamp } from "lucide-react";
import { CONTRACT } from "@/lib/erotic";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

const SIGN_KEY = "ruirui:contract:v1";
const numerals = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

export function Contract() {
  const t = useSiteText();
  const [signedAt, setSignedAt] = useState(0);
  useEffect(() => {
    try { setSignedAt(Number(localStorage.getItem(SIGN_KEY)) || 0); } catch {}
  }, []);
  function sign() {
    const now = Date.now();
    try { localStorage.setItem(SIGN_KEY, String(now)); } catch {}
    setSignedAt(now);
  }
  const signed = signedAt > 0;
  const date = signed ? new Date(signedAt) : new Date();
  const dateText = `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  return <section className="contract-section" id="rules" aria-labelledby="contract-title">
    <div className={`contract-paper ${signed ? "signed" : ""}`}>
      <span className="contract-tape tape-left" aria-hidden/>
      <span className="contract-tape tape-right" aria-hidden/>
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
        <div className="sign-row"><span>甲方 · 主人</span><i className="sign-blank"/></div>
        <div className="sign-row"><span>乙方 · 锐锐</span><i className="sign-name">{signed ? "锐锐" : ""}</i></div>
        <p className="contract-date">签订于 {dateText}</p>
      </div>
      <div className="contract-bottom">
        <div className="fingerprint" aria-hidden>
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
          <span>锐锐的指印</span>
        </div>
        {signed
          ? <p className="contract-signed"><Check size={15}/>{t(COPY.contractSigned)}</p>
          : <button className="contract-sign-button" onClick={sign}><Stamp size={16} fill="currentColor"/>{t(CONTRACT.signLabel)}</button>}
        <p className="contract-note"><Gavel size={13}/>{t(COPY.contractNote)}</p>
      </div>
      {signed && <span className="contract-seal" aria-hidden>已<br/>签</span>}
      <span className="contract-watermark" aria-hidden>契</span>
    </div>
  </section>;
}
