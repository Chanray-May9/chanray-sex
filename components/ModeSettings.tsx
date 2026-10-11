import { apiFetch } from "../lib/api";
"use client";
import { useEffect, useRef, useState } from "react";
import { Settings, X, Check, KeyRound } from "lucide-react";
import { PREVIEW_KEY } from "../public/site-content-runtime.js";
import { COPY } from "@/lib/site-copy";
import { useSiteText } from "./SiteContent";
import { useSiteMode, type SiteMode } from "./SiteMode";
export function ModeSettings({ className = "" }: { className?: string }) {
 const t=useSiteText(), { mode, activated, refresh }=useSiteMode();
 const [open,setOpen]=useState(false),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 async function change(next?:SiteMode){
  if(busy)return;setBusy(true);setNotice("");
  try{const response=await apiFetch("/api/mode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next?{action:"switch",mode:next}:{action:"activate",code:code.trim()}),signal:AbortSignal.timeout(15000)});await response.json();if(!response.ok)throw new Error(response.status===409?t(COPY.codeInvalid):response.status===429?t(COPY.codeTryLater):t(COPY.modeError));sessionStorage.removeItem(PREVIEW_KEY);setCode("");setNotice(next?COPY.modeSaved:COPY.codeActivated);refresh();}
  catch(error){setNotice(error instanceof Error?error.message:t(COPY.modeError));}finally{setBusy(false);}
 }
 return <><button className={`icon-button settings-trigger ${className}`} aria-label={t(COPY.frontSettings)} onClick={()=>{setOpen(true);setNotice("");}}><Settings size={20}/></button><dialog className="mode-settings-dialog" ref={dialog} onCancel={()=>setOpen(false)}><button className="dialog-close icon-button" aria-label={t(COPY.closeSettings)} onClick={()=>setOpen(false)}><X size={21}/></button><Settings size={26}/><h2>{t(COPY.frontSettings)}</h2><p className="settings-description">{t(COPY.modeDescription)}</p><div className="mode-options">{(["normal","hidden"] as const).map(value=><button key={value} disabled={busy||value===mode||(value==="hidden"&&!activated)} aria-pressed={mode===value} onClick={()=>void change(value)}><span>{t(value==="normal"?COPY.normalMode:COPY.hiddenMode)}</span>{mode===value&&<Check size={17}/>}</button>)}</div>{!activated?<form onSubmit={event=>{event.preventDefault();void change();}}><label htmlFor="activation-code"><KeyRound size={16}/>{t(COPY.activationLabel)}</label><input id="activation-code" value={code} autoComplete="off" spellCheck={false} maxLength={80} placeholder={t(COPY.activationPlaceholder)} disabled={busy} onChange={event=>setCode(event.target.value)}/><button className="primary-button" type="submit" disabled={busy||!code.trim()}>{t(busy?COPY.activating:COPY.activateHidden)}</button><p className="activation-note">{t(COPY.activationNote)}</p></form>:<p className="activation-note">{t(COPY.activatedNote)}</p>}{notice&&<p className="mode-notice" role="status">{t(notice)}</p>}</dialog></>;
}
