"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ModeContext, type SiteMode } from "./SiteMode";
import { usePathname } from "next/navigation";
import { createContentTranslator, PREVIEW_KEY, readPreview, translateText } from "../public/site-content-runtime.js";
const ContentContext = createContext<Record<string, string>>({});
export function useSiteText() {
  const overrides = useContext(ContentContext);
  return useCallback(<T,>(value: T): T => translateText(value, overrides), [overrides]);
}
export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);
  const [mode, setMode] = useState<SiteMode>("normal");
  const [activated, setActivated] = useState(false);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const translator = createContentTranslator(document);
    const draft = readPreview(sessionStorage);
    let active = true;
    const apply = (values: Record<string, string>) => {
      if (!active) return;
      setOverrides(values);
      translator.update(values);
    };
    setPreview(Boolean(draft));
    const loadMode = async () => { try { const response = await fetch("/api/mode", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) }); const data = await response.json() as { mode?: SiteMode; activated?: boolean }; if (active && response.ok) { setMode(data.mode === "hidden" ? "hidden" : "normal"); setActivated(Boolean(data.activated)); } } catch {} };
    void loadMode();
    async function load() {
      try {
        const response = await fetch("/api/content", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) });
        const data = await response.json() as { overrides?: Record<string, string> };
        if (response.ok && data.overrides && !Array.isArray(data.overrides) && Object.values(data.overrides).every(value => typeof value === "string")) apply(data.overrides);
      } catch { /* Source copy remains available when content service is unavailable. */ }
    }
    if (draft) apply(draft); else void load();
    const visible = () => { if (!draft && !document.hidden) void load(); };
    const timer = setInterval(visible, 60000);
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; controller.abort(); translator.stop(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [pathname, version]);
  return <ModeContext.Provider value={{ mode, activated, refresh }}><ContentContext.Provider value={overrides}>{children}{preview && <aside className="preview-banner" data-cms-exempt><span>{translateText("文案预览 · 尚未发布", overrides)}</span><button onClick={() => { sessionStorage.removeItem(PREVIEW_KEY); location.reload(); }}>{translateText("退出预览", overrides)}</button></aside>}</ContentContext.Provider></ModeContext.Provider>;
}
