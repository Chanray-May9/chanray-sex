import { sitePath } from "../lib/navigation";
import { apiFetch } from "../lib/api";
"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowUpRight, Heart, MessageCircle, Flower2, Sparkles, Pause, Play, RotateCcw, X, ImagePlus, Menu, ChevronRight, Plus, Check, LoaderCircle } from "lucide-react";
import { ModeSettings } from "./ModeSettings";
import { useSiteMode } from "./SiteMode";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";
import { loadRecords, loadRecord, saveRecord, summary, type RecordSummary } from "@/lib/chat-records";
type Mode = "whisper" | "ai";
type Message = { id: number; role: "user" | "assistant"; content: string; mode: Mode; image?: string; failed?: boolean };
const presets = [[COPY.prompt1, COPY.reply1], [COPY.prompt2, COPY.reply2], [COPY.prompt3, COPY.reply3], [COPY.prompt4, COPY.reply4]];
const whispers = [COPY.whisper1, COPY.whisper2, COPY.whisper3, COPY.whisper4];
export function Chat() {
  const t = useSiteText();
  const { mode: siteMode } = useSiteMode();
  const [recordScope, setRecordScope] = useState("normal");
  const [recordId, setRecordId] = useState<string>();
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [recordsReady, setRecordsReady] = useState(false);
  const [recordNotice, setRecordNotice] = useState("");
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [mode, setMode] = useState<Mode>("ai"), [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [attachment, setAttachment] = useState<string>(), [imageBusy, setImageBusy] = useState(false), [largeImage, setLargeImage] = useState<string>();
  const [whisper, setWhisper] = useState(0), [hearts, setHearts] = useState(0), [mood, setMood] = useState("peach"), [paused, setPaused] = useState(false);
  const [clearDialog, setClearDialog] = useState(false), [menu, setMenu] = useState(false), [panel, setPanel] = useState<"whispers" | "together" | null>(null);
  const scrollArea = useRef<HTMLDivElement>(null), composer = useRef<HTMLTextAreaElement>(null), fileInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null), dialog = useRef<HTMLDialogElement>(null), imageDialog = useRef<HTMLDialogElement>(null), sequence = useRef(0);
  useEffect(() => {
    let active = true;
    setRecordsReady(false); setMessages([]); setRecords([]);
    loadRecords(siteMode).then(saved => {
      if (!active) return;
      setRecords(saved.map(summary));
      const record = saved[0];
      if (record) { setRecordId(record.id); setMessages(record.messages); setMode(record.mode); sequence.current = Math.max(0, ...record.messages.map(message => message.id)); }
      else setRecordId(crypto.randomUUID());
      setRecordScope(siteMode); setRecordsReady(true);
    }).catch(() => { if (active) { setRecordNotice(COPY.historyReadError); setRecordId(crypto.randomUUID()); setRecordScope(siteMode); setRecordsReady(true); } });
    return () => { active = false; };
  }, [siteMode]);
  useEffect(() => {
    if (!recordsReady || !recordId || loadingRecord || recordScope !== siteMode) return;
    let active = true;
    const record = { id: recordId, updatedAt: Date.now(), mode, messages, scope: siteMode };
    saveRecord(record).then(() => {
      if (!active) return;
      setRecordNotice("");
      setRecords(old => [summary(record), ...old.filter(item => item.id !== record.id)]);
    }).catch(() => { if (active) setRecordNotice(COPY.historySaveError); });
    return () => { active = false; };
  }, [messages, mode, recordId, recordsReady, loadingRecord, recordScope, siteMode]);
  function newChat() { if (busy || imageBusy || !recordsReady || loadingRecord) return; setRecordId(crypto.randomUUID()); setMessages([]); setInput(""); setAttachment(undefined); setError(""); setMode("ai"); setMenu(false); }
  async function openRecord(id: string) {
    if (busy || imageBusy || loadingRecord || id === recordId) return;
    setLoadingRecord(true);
    try { const record = await loadRecord(id); if (!record) throw new Error(); setRecordId(record.id); setMessages(record.messages); setMode(record.mode); sequence.current = Math.max(sequence.current, ...record.messages.map(message => message.id)); setInput(""); setAttachment(undefined); setError(""); setMenu(false); }
    catch { setRecordNotice(COPY.historyReadError); }
    finally { setLoadingRecord(false); }
  }
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => document.documentElement.style.setProperty("--chat-height", `${viewport?.height ?? window.innerHeight}px`);
    resize(); viewport?.addEventListener("resize", resize); window.addEventListener("resize", resize);
    return () => { viewport?.removeEventListener("resize", resize); window.removeEventListener("resize", resize); document.documentElement.style.removeProperty("--chat-height"); };
  }, []);
  useEffect(() => {
    try { const saved = localStorage.getItem("ruirui:mood"); if (saved && ["peach", "rose", "cream"].includes(saved)) setMood(saved); } catch {}
    return () => abort.current?.abort();
  }, []);
  useEffect(() => { if (scrollArea.current) scrollArea.current.scrollTop = scrollArea.current.scrollHeight; }, [messages, busy, mode]);
  useEffect(() => { if (clearDialog) dialog.current?.showModal(); else dialog.current?.close(); }, [clearDialog]);
  useEffect(() => { if (largeImage) imageDialog.current?.showModal(); else imageDialog.current?.close(); }, [largeImage]);
  function changeMood(value: string) { setMood(value); try { localStorage.setItem("ruirui:mood", value); } catch {} }
  function sayPreset(index: number) { const [prompt, reply] = presets[index]; setMode("whisper"); setMessages(old => [...old, { id: ++sequence.current, role: "user", content: prompt, mode: "whisper" } as Message, { id: ++sequence.current, role: "assistant", content: reply, mode: "whisper" } as Message]); }
  async function chooseImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) { setError(t(COPY.imageInvalid)); return; }
    setImageBusy(true); setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d"); if (!context) throw new Error();
      context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      let quality = .85, data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > 1_200_000 && quality > .35) { quality -= .1; data = canvas.toDataURL("image/jpeg", quality); }
      if (data.length > 1_200_000) throw new Error();
      setAttachment(data); setMode("ai"); composer.current?.focus();
    } catch { setError(t(COPY.imageFailed)); }
    finally { setImageBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  async function send(retry?: Message) {
    if (busy || !recordsReady || loadingRecord || imageBusy || (!retry && !input.trim() && !attachment)) return;
    const user: Message = retry || { id: ++sequence.current, role: "user", content: input.trim(), mode: "ai", image: attachment };
    const history = messages.filter(message => message.mode === "ai" && !message.failed && message.id !== user.id).slice(-8);
    const payload = [...history.map(({ role, content, image }) => ({ role, content: content || (image ? t(COPY.attachmentText) : "") })), { role: "user", content: user.image ? [{ type: "text", text: user.content || t(COPY.imagePrompt) }, { type: "image_url", image_url: { url: user.image } }] : user.content }];
    setMessages(old => retry ? old.map(message => message.id === retry.id ? { ...message, failed: false } : message) : [...old, user]);
    if (!retry) { setInput(""); setAttachment(undefined); }
    setBusy(true); setMode("ai"); setError("");
    const controller = new AbortController(); abort.current = controller; const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await apiFetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "flirt", messages: payload }), signal: controller.signal });
      const body = await response.json() as { reply?: unknown };
      if (!response.ok || typeof body.reply !== "string" || !body.reply.trim()) throw new Error(t(user.image ? COPY.imageAIError : COPY.aiUnavailable));
      setMessages(old => [...old, { id: ++sequence.current, role: "assistant", content: body.reply as string, mode: "ai" }] as Message[]);
    } catch (cause) {
      setMessages(old => old.map(message => message.id === user.id ? { ...message, failed: true } : message));
      setError(controller.signal.aborted ? t(COPY.aiTimeout) : cause instanceof Error ? cause.message : t(COPY.aiUnavailable));
    } finally { clearTimeout(timeout); abort.current = null; setBusy(false); composer.current?.focus(); }
  }
  const visibleMessages = messages.filter(message => message.mode === mode);
  function showPanel(value: "whispers" | "together") { setPanel(value); setMenu(false); }
  return <div className={`ruirui-site chat-app mood-${mood} ${paused ? "motion-paused" : ""}`}>
    {menu && <button className="sidebar-backdrop" aria-label={t(COPY.menuClose)} onClick={() => setMenu(false)}/>}
    <aside className={`chat-sidebar ${menu ? "sidebar-open" : ""}`}>
      <a className="wordmark" href={sitePath("/")}><span className="brand-flower"><Flower2 size={26}/></span><span>{t(COPY.brand)}<small>{t(COPY.subtitle)}</small></span></a>
      <p className="sidebar-caption">{t(COPY.sidebarNote)}</p>
      <button className="sidebar-new" disabled={busy || !recordsReady || loadingRecord} onClick={newChat}><Plus size={19}/>{t(COPY.newChat)}</button>
      <p className="sidebar-label">{t(COPY.chatsLabel)}</p>
      <nav className="sidebar-nav" aria-label={t(COPY.navChat)}>
        <button className="selected" onClick={() => { setPanel(null); setMenu(false); }}><MessageCircle size={19}/><span>{t(COPY.navChat)}</span><span className="nav-dot"/></button>
        <button onClick={() => showPanel("whispers")}><Flower2 size={19}/><span>{t(COPY.navWhispers)}</span><ChevronRight size={15}/></button>
        <button onClick={() => showPanel("together")}><Heart size={19}/><span>{t(COPY.navTogether)}</span><ChevronRight size={15}/></button>
      </nav>
      <div className="history-list" aria-label={t(COPY.historyTitle)}>{records.filter(record => record.title || record.image).map(record => <button key={record.id} aria-pressed={record.id === recordId} disabled={busy || loadingRecord} onClick={() => void openRecord(record.id)}><MessageCircle size={14}/><span data-user-content>{record.title || t(COPY.attachmentText)}</span></button>)}</div>
      <div className="sidebar-love"><Heart size={36} strokeWidth={1}/><p>{t(COPY.heroLine1)}<br/>{t(COPY.heroLine2)}{t(COPY.heroLine3)}</p><small>{t(COPY.heroNote)}</small></div>
      <div className="sidebar-bottom"><div className="sidebar-settings"><span>{t(COPY.frontSettings)}</span><ModeSettings/></div><span>{t(COPY.moodLabel)}</span><div className="mood-options">{[["peach", COPY.moodPeach], ["rose", COPY.moodRose], ["cream", COPY.moodCream]].map(([value, label]) => <button className={`mood-choice mood-dot-${value}`} key={value} aria-label={t(label)} aria-pressed={mood === value} onClick={() => changeMood(value)}><i/>{t(label)}</button>)}</div><button className="motion-control" onClick={() => setPaused(value => !value)}>{paused ? <Play size={14}/> : <Pause size={14}/>}<span>{t(paused ? COPY.motionOff : COPY.motionOn)}</span></button><a href={sitePath("/admin")}><Sparkles size={15}/>{t(COPY.admin)}<ArrowUpRight size={14}/></a></div>
    </aside>
    <main className="chat-main" id="chat">
      <header className="chat-topbar"><button className="mobile-menu icon-button" aria-label={t(COPY.menuOpen)} onClick={() => setMenu(true)}><Menu size={23}/></button><div className="avatar">{t(COPY.brand)}<span/></div><div className="chat-person"><h1>{t(COPY.brand)}<Heart size={13}/></h1><p>{t(COPY.chatSubtitle)}</p></div><div className="chat-top-actions"><button className="icon-button" aria-label={t(COPY.navWhispers)} onClick={() => showPanel("whispers")}><Flower2 size={21}/></button><button className="icon-button" aria-label={t(COPY.clear)} onClick={() => setClearDialog(true)} disabled={busy || !visibleMessages.length}><RotateCcw size={19}/></button></div></header>
      <div className="chat-mode-row"><div className="mode-tabs" role="tablist" aria-label={t(COPY.navChat)}><button role="tab" aria-selected={mode === "ai"} onClick={() => { setMode("ai"); setError(""); }}><MessageCircle size={15}/>{t(COPY.modeAI)}</button><button role="tab" aria-selected={mode === "whisper"} onClick={() => { setMode("whisper"); setError(""); }}><Flower2 size={15}/>{t(COPY.modeWhisper)}</button></div><span>{t(COPY.sessionBadge)}</span></div>
      <div className="message-scroll" ref={scrollArea} role="log" aria-live="polite">
        <div className="chat-day"><span>{t(mode === "ai" ? COPY.historyHint : COPY.presetHint)}</span></div>
        <div className="chat-message assistant"><div className="message-avatar"><Flower2 size={23}/></div><div className="message-content"><span className="message-name">{t(COPY.assistantName)}</span><div className="bubble">{t(COPY.chatWelcome)}<span className="greeting-heart">♡</span></div></div></div>
        {visibleMessages.map(message => <div key={message.id} className={`chat-message ${message.role}`}><div className="message-avatar">{message.role === "assistant" ? <Flower2 size={23}/> : <Heart size={21}/>}</div><div className="message-content"><span className="message-name">{t(message.role === "assistant" ? COPY.assistantName : COPY.userName)}</span>{message.image && <button className="message-image" aria-label={t(COPY.imagePreview)} onClick={() => setLargeImage(message.image)}><img src={message.image} alt={t(COPY.imageAlt)} onLoad={() => { if (scrollArea.current) scrollArea.current.scrollTop = scrollArea.current.scrollHeight; }}/></button>}{message.content && <p className="bubble" data-user-content={message.mode === "ai" ? "" : undefined}>{message.mode === "whisper" ? t(message.content) : message.content}</p>}{message.failed && <button className="message-retry" disabled={busy} onClick={() => void send(message)}><RotateCcw size={13}/>{t(COPY.failedMessage)} · {t(COPY.retryMessage)}</button>}</div></div>)}
        {busy && <div className="chat-message assistant"><div className="message-avatar"><Flower2 size={23}/></div><div className="typing" aria-label={t(COPY.sending)}><span/><span/><span/></div></div>}
      </div>
      <div className="chat-input-area">
        {recordNotice && <p className="history-notice" role="status">{t(recordNotice)}</p>}
        {error && <div className="chat-error" role="alert"><p>{error}</p><a href={sitePath("/admin")}>{t(COPY.aiSettings)}<ArrowUpRight size={13}/></a></div>}
        {mode === "whisper" ? <div className="quick-area"><p>{t(COPY.quickLabel)}</p><div className="preset-choices">{presets.map(([prompt], index) => <button key={prompt} onClick={() => sayPreset(index)}>{t(prompt)}<Heart size={13}/></button>)}</div></div> : <form onSubmit={event => { event.preventDefault(); void send(); }}>
          {attachment && <div className="attachment-preview"><button type="button" aria-label={t(COPY.imagePreview)} onClick={() => setLargeImage(attachment)}><img src={attachment} alt={t(COPY.imageAlt)}/></button><span><Check size={14}/>{t(COPY.imageReady)}</span><button type="button" className="icon-button" aria-label={t(COPY.imageRemove)} onClick={() => setAttachment(undefined)}><X size={17}/></button></div>}
          <div className="chat-composer"><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => void chooseImage(event.target.files?.[0])}/><button className="attach-button icon-button" type="button" aria-label={t(COPY.imageChoose)} disabled={busy || !recordsReady || loadingRecord || imageBusy} onClick={() => fileInput.current?.click()}>{imageBusy ? <LoaderCircle className="spin" size={22}/> : <ImagePlus size={23}/>}</button><label className="sr-only" htmlFor="message">{t(COPY.composerLabel)}</label><textarea id="message" ref={composer} rows={1} maxLength={2000} disabled={!recordsReady || loadingRecord} value={input} onChange={event => setInput(event.target.value)} placeholder={t(COPY.messagePlaceholder)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}/><button className="send-button" type="submit" aria-label={t(COPY.send)} disabled={busy || !recordsReady || loadingRecord || imageBusy || (!input.trim() && !attachment)}><ArrowUp size={21}/></button></div><p className="composer-note">{imageBusy ? t(COPY.imageBusy) : t(COPY.composerNote)}</p>
        </form>}
      </div>
    </main>
    {panel && <div className="moments-overlay"><button className="moments-backdrop" aria-label={t(COPY.drawerClose)} onClick={() => setPanel(null)}/><section className="moments-sheet"><button className="sheet-close icon-button" aria-label={t(COPY.drawerClose)} onClick={() => setPanel(null)}><X size={22}/></button>{panel === "whispers" ? <article className="whisper-card" id="whispers"><Flower2 size={28}/><h2>{t(COPY.whisperTitle)}</h2><p className="whisper-intro">{t(COPY.whisperIntro)}</p><div className="handwritten-message" key={whisper}><p>{t(whispers[whisper])}</p><span className="letter-signature">— {t(COPY.whisperSignature)} ♡</span></div><button className="outline-button" onClick={() => setWhisper(value => (value + 1) % whispers.length)}>{t(COPY.nextWhisper)}<ChevronRight size={16}/></button></article> : <article className="together-card" id="together"><h2>{t(COPY.littleQuiet)}</h2><p>{t(COPY.littleDescription)}</p><button className="pulse-heart" onClick={() => setHearts(value => value + 1)} aria-label={t(COPY.littleTouch)}><Heart key={hearts} size={47} strokeWidth={1.1} fill={hearts ? "currentColor" : "none"}/><span className="heart-orbit"/></button><p className="heart-feedback" aria-live="polite">{t(hearts ? COPY.littleReceived : COPY.littleTouch)}</p></article>}</section></div>}
    <dialog className="clear-dialog" ref={dialog} onCancel={() => setClearDialog(false)}><button className="dialog-close" aria-label={t(COPY.close)} onClick={() => setClearDialog(false)}><X size={18}/></button><Heart size={30}/><h2>{t(COPY.clearAsk)}</h2><p className="clear-history-note">{t(COPY.historyClearNote)}</p><div><button className="outline-button" onClick={() => setClearDialog(false)}>{t(COPY.cancel)}</button><button className="primary-button" disabled={busy} onClick={() => { setMessages([]); setError(""); setInput(""); setAttachment(undefined); setClearDialog(false); }}>{t(COPY.confirmClear)}</button></div></dialog>
    <dialog className="image-dialog" ref={imageDialog} onCancel={() => setLargeImage(undefined)}><button className="image-close icon-button" aria-label={t(COPY.imageClose)} onClick={() => setLargeImage(undefined)}><X size={25}/></button>{largeImage && <img src={largeImage} alt={t(COPY.imageAlt)}/>}</dialog>
  </div>;
}

