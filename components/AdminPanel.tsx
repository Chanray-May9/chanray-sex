"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Flower2 } from "lucide-react";
import { ContentEditor } from "./ContentEditor";
import { AISettings } from "./AISettings";
import { AdminOverview } from "./AdminOverview";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";
export function AdminPanel() {
  const t = useSiteText();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("输入管理密码登录。");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin-session", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) }).then(async response => {
      const data = await response.json() as { authenticated?: boolean };
      if (response.ok && data.authenticated) { setAuthenticated(true); setMessage("已登录，可以管理网站。"); }
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  async function session(logout = false) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin-session", { method: logout ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, ...(logout ? {} : { body: JSON.stringify({ password }) }), signal: AbortSignal.timeout(15000) });
      await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "密码不正确。" : response.status === 429 ? "尝试次数较多，请稍后再试。" : "操作失败，请稍后再试。");
      setAuthenticated(!logout); setPassword(""); setMessage(logout ? "已退出管理。" : "已登录，可以管理网站。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作失败。"); }
    finally { setBusy(false); }
  }
  return <main className="admin-page">
    <a className="admin-back" href="/"><ArrowLeft size={16}/>{t(COPY.backHome)}</a>
    <header className="admin-title"><Flower2 size={30}/><div><h1>{t(COPY.adminTitle)}</h1><p>{t(COPY.adminDescription)}</p></div></header>
    <section className="admin-auth">
      {!authenticated ? <form onSubmit={event => { event.preventDefault(); void session(); }}><label htmlFor="admin-password">管理密码</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} required/><button className="primary-button" type="submit" disabled={busy || !password}>{busy ? "登录中…" : "登录"}</button></form> : <div className="authenticated-bar"><span>已登录 · 刷新页面仍可继续管理</span><button className="outline-button" disabled={busy} onClick={() => void session(true)}>退出管理</button></div>}
      <p role="status">{message}</p>
    </section>
    {authenticated && <><AdminOverview token="session" apiURL="/api/admin"/><ContentEditor token="session" apiURL="/api/admin"/><AISettings token="session" apiURL="/api/admin"/></>}
  </main>;
}
