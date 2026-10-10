"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  }, [pathname]);
  return <ContentContext.Provider value={overrides}>{children}{preview && <aside className="preview-banner" data-cms-exempt><span>文案预览 · 尚未发布</span><button onClick={() => { sessionStorage.removeItem(PREVIEW_KEY); location.reload(); }}>退出预览</button></aside>}</ContentContext.Provider>;
}
