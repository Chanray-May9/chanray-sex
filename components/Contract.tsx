"use client";
import { useEffect, useState } from "react";
import { Heart, Check, Flame, Gift, Gavel } from "lucide-react";
import { CONTRACT } from "@/lib/erotic";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";

const SIGN_KEY = "ruirui:contract:v1";

export function Contract() {
  const t = useSiteText();
  const [signed, setSigned] = useState(false);
  useEffect(() => {
    try { setSigned(Boolean(localStorage.getItem(SIGN_KEY))); } catch {}
  }, []);
  function sign() {
    try { localStorage.setItem(SIGN_KEY, String(Date.now())); } catch {}
    setSigned(true);
  }
  return <section className="contract-section" id="rules" aria-labelledby="contract-title">
    <div className="contract-card">
      <header className="contract-head">
        <p className="section-eyebrow"><Gavel size={16}/>{t(COPY.navRules)}</p>
        <h2 id="contract-title">{t(CONTRACT.title)}</h2>
        <p className="contract-intro">{t(CONTRACT.intro)}</p>
      </header>
      <ol className="contract-rules">
        {CONTRACT.rules.map((rule, index) => <li key={rule}><span>{String(index + 1).padStart(2, "0")}</span><p>{t(rule)}</p></li>)}
      </ol>
      <div className="contract-columns">
        <div className="contract-block"><h3><Gift size={14}/>赏</h3><p>{t(CONTRACT.reward)}</p></div>
        <div className="contract-block"><h3><Flame size={14}/>罚</h3><p>{t(CONTRACT.punish)}</p></div>
      </div>
      <div className="contract-sign">
        {signed ? <p className="contract-signed"><Check size={15}/>{t(COPY.contractSigned)}</p> : <button className="primary-button" onClick={sign}><Heart size={15} fill="currentColor"/>{t(CONTRACT.signLabel)}</button>}
        <span>{signed ? t(COPY.signedBadge) : t(COPY.contractNote)}</span>
      </div>
    </div>
  </section>;
}
