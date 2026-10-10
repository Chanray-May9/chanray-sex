"use client";
import { useMemo, useState } from "react";
import { useSiteText } from "./SiteContent";
import { PREVIEW_KEY, normalizeText } from "../public/site-content-runtime.js";

type Entry = { original: string; groups: string[]; sources: string[] };
type History = { id: string; createdAt: number; count: number; revision: string };
type Content = {
  catalog: Entry[];
  overrides: Record<string, string>;
  revision: string;
  history: { items: History[]; cursor: string | null };
};
const PAGES = [["首页", ""], ["聊天", "chat"], ["后台", "admin"]];
function valid(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.entries(value).length <= 2000 &&
    Object.entries(value).every(
      ([key, text]) =>
        key.length > 0 &&
        key.length <= 6000 &&
        normalizeText(key) === key &&
        typeof text === "string" &&
        text.length <= 6000,
    ),
  );
}
export function ContentEditor({ token, apiURL }: { token: string; apiURL: string }) {
  const t = useSiteText();
  const [content, setContent] = useState<Content | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState("");
  const [original, setOriginal] = useState("");
  const [replacement, setReplacement] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<History[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const catalog = useMemo(() => {
    const entries = [...(content?.catalog || [])];
    for (const key of Object.keys(draft))
      if (!entries.some((entry) => entry.original === key))
        entries.push({ original: key, groups: ["手动添加"], sources: [] });
    return entries;
  }, [content, draft]);
  const groups = useMemo(() => [...new Set(catalog.flatMap((entry) => entry.groups))], [catalog]);
  const filtered = catalog.filter(
    (entry) =>
      (!group || entry.groups.includes(group)) &&
      (!query ||
        [entry.original, draft[entry.original] || ""].some((value) =>
          value.toLowerCase().includes(query.toLowerCase()),
        )),
  );
  const dirty =
    JSON.stringify(Object.entries(draft).sort()) !==
    JSON.stringify(Object.entries(content?.overrides || {}).sort());
  async function request(body?: object, nextCursor?: string) {
    const url = new URL(apiURL, window.location.origin);
    url.searchParams.set("dataset", "content");
    if (nextCursor) url.searchParams.set("cursor", nextCursor);
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 409
          ? "线上文案已变化，请导出草稿，再重新读取。"
          : response.status === 401
            ? "登录已失效，请重新登录。"
            : "文案操作失败，请检查后端配置。",
      );
    return await response.json() as Content;
  }
  async function load(more = false) {
    if (busy || !token.trim()) return;
    if (!more && dirty && !window.confirm(t("重新读取会丢弃未发布的修改，确认继续？"))) return;
    setBusy(true);
    setMessage("读取中…");
    try {
      const body = await request(undefined, more ? cursor || undefined : undefined);
      if (!valid(body.overrides) || !Array.isArray(body.catalog) || !body.history)
        throw new Error("接口数据无效。");
      if (more) setHistory((values) => [...values, ...body.history.items]);
      else {
        setContent(body);
        setDraft(body.overrides);
        setHistory(body.history.items);
      }
      setCursor(body.history.cursor);
      setMessage("全站文案已读取。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取失败。");
    } finally {
      setBusy(false);
    }
  }
  async function publish(snapshot?: string) {
    if (!content || busy) return;
    if (
      !window.confirm(
        t(snapshot
          ? "确认恢复这个历史版本？当前版本会先自动备份。"
          : "确认发布当前文案？当前线上版本会先自动备份。"),
      )
    )
      return;
    setBusy(true);
    setMessage("保存中…");
    try {
      await request(
        snapshot
          ? { action: "restore", snapshot, baseRevision: content.revision }
          : { action: "publish", overrides: draft, baseRevision: content.revision },
      );
      const body = await request();
      setContent(body);
      setDraft(body.overrides);
      setHistory(body.history.items);
      setCursor(body.history.cursor);
      setMessage(snapshot ? "历史版本已恢复。" : "文案已发布。KV 传播可能需要稍等片刻。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  }
  function edit(key: string, value: string) {
    setDraft((values) => ({ ...values, [key]: value }));
  }
  function reset(key: string) {
    setDraft((values) => {
      const next = { ...values };
      delete next[key];
      return next;
    });
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, overrides: draft }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `chanray-site-text-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 262144) throw new Error("备份文件不能超过 256KB。");
      const body = JSON.parse(await file.text());
      const values = body.overrides || body;
      if (!valid(values)) throw new Error("备份格式无效。");
      setDraft(values);
      setMessage("备份已导入为草稿，尚未发布。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败。");
    }
  }
  function preview() {
    sessionStorage.setItem(
      PREVIEW_KEY,
      JSON.stringify({ createdAt: Date.now(), overrides: draft, scope: new URL(apiURL, location.origin).searchParams.get("scope") || "normal" }),
    );
    const url = new URL(import.meta.env.BASE_URL + page, window.location.origin);
    const opened = window.open(url.href, "ruirui-content-preview-" + Date.now());
    if (!opened) {
      setMessage("浏览器拦截了预览窗口，请允许弹出窗口后重试。");
      return;
    }
    setMessage("已打开预览。预览不会发布文案，也不会传递管理令牌。");
  }
  return (
    <section
      className="mt-10 rounded-xl border border-border bg-card p-5 sm:p-8"
      aria-labelledby="content-editor-title"
    >
      <h2 id="content-editor-title" className="text-2xl font-bold">
        全站文字管理
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        编辑标题、正文、导航、按钮、提示、图片说明与页面描述。相同原文默认全站一起替换。留空可以隐藏文字，不会删除对应功能。
      </p>
      <button
        className="btn-mecha mt-5"
        disabled={busy || !token.trim()}
        onClick={() => void load()}
      >
        读取全站文案
      </button>
      <p className="my-4 text-sm" role="status">
        {message}
      </p>
      {content && (
        <>
          <div className="flex flex-wrap gap-3">
            <button className="btn-mecha" disabled={busy || !dirty} onClick={() => void publish()}>
              发布修改
            </button>
            <button className="btn-mecha" disabled={busy} onClick={download}>
              导出草稿 / 备份
            </button>
            <label className="btn-mecha cursor-pointer">
              导入备份
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                disabled={busy}
                onChange={(event) => void importFile(event.target.files?.[0])}
              />
            </label>
            <button
              className="btn-mecha"
              disabled={busy}
              onClick={() => {
                if (window.confirm(t("将全部文案恢复为源码默认值？此操作只生成草稿，发布后生效。")))
                  setDraft({});
              }}
            >
              全部恢复默认
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <label className="flex items-center gap-2">
              预览页面
              <select
                className="rounded border border-border bg-background p-2"
                value={page}
                onChange={(event) => setPage(event.target.value)}
              >
                {PAGES.map(([label, path]) => (
                  <option key={path} value={path}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-mecha" onClick={preview}>
              打开草稿预览
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              搜索原文或新文案
              <input
                className="rounded border border-border bg-background p-3"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setLimit(25);
                }}
              />
            </label>
            <label className="grid gap-2">
              分类
              <select
                className="rounded border border-border bg-background p-3"
                value={group}
                onChange={(event) => {
                  setGroup(event.target.value);
                  setLimit(25);
                }}
              >
                <option value="">全站</option>
                {groups.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="my-4 text-sm text-muted-foreground">
            可编辑条目：<span data-cms-exempt>{catalog.length}</span>；匹配：
            <span data-cms-exempt>{filtered.length}</span>；已替换：
            <span data-cms-exempt>{Object.keys(draft).length}</span>。
            {dirty ? "有未发布修改。" : "当前草稿与线上一致。"}
          </p>
          <div className="space-y-5">
            {filtered.slice(0, limit).map((entry) => (
              <div key={entry.original} className="rounded-lg border border-border p-4">
                <p data-cms-exempt className="mb-2 text-xs text-muted-foreground">
                  {entry.groups.join(" / ")}
                </p>
                <label className="grid gap-2">
                  <span data-cms-exempt className="whitespace-pre-wrap break-words text-sm">
                    {entry.original}
                  </span>
                  <textarea
                    className="min-h-20 rounded border border-border bg-background p-3"
                    maxLength={6000}
                    disabled={busy}
                    value={
                      Object.hasOwn(draft, entry.original) ? draft[entry.original] : entry.original
                    }
                    onChange={(event) => edit(entry.original, event.target.value)}
                  />
                </label>
                <button
                  className="mt-2 text-sm underline"
                  disabled={busy || !Object.hasOwn(draft, entry.original)}
                  onClick={() => reset(entry.original)}
                >
                  恢复此项默认
                </button>
              </div>
            ))}
          </div>
          {filtered.length > limit && (
            <button className="btn-mecha mt-5" onClick={() => setLimit((value) => value + 25)}>
              显示更多条目
            </button>
          )}
          <details className="mt-8 rounded-lg border border-border p-4">
            <summary className="cursor-pointer font-bold">添加未收录的文字</summary>
            <p className="mt-3 text-sm text-muted-foreground">
              复制页面上的原文，填入替换文字。适用于新内容和动态提示。只替换文本，不执行 HTML
              或脚本。
            </p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                原文
                <textarea
                  className="rounded border border-border bg-background p-3"
                  value={original}
                  onChange={(event) => setOriginal(event.target.value)}
                />
              </label>
              <label className="grid gap-2">
                替换文字
                <textarea
                  className="rounded border border-border bg-background p-3"
                  value={replacement}
                  onChange={(event) => setReplacement(event.target.value)}
                />
              </label>
              <button
                className="btn-mecha justify-self-start"
                disabled={!normalizeText(original) || busy}
                onClick={() => {
                  edit(normalizeText(original), replacement);
                  setOriginal("");
                  setReplacement("");
                  setMessage("文字已加入草稿。");
                }}
              >
                加入草稿
              </button>
            </div>
          </details>
          <details className="mt-8 rounded-lg border border-border p-4">
            <summary className="cursor-pointer font-bold">历史版本与恢复</summary>
            <p className="mt-3 text-sm text-muted-foreground">
              每次发布前自动备份完整文案。恢复历史版本前也会备份当前版本。
            </p>
            <ul className="mt-4 space-y-3">
              {history.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                  <span data-cms-exempt className="text-sm">
                    {new Date(item.createdAt).toLocaleString()} · {item.count} 项替换
                  </span>
                  <button
                    className="btn-mecha"
                    disabled={busy}
                    onClick={() => void publish(item.id)}
                  >
                    恢复该版本
                  </button>
                </li>
              ))}
            </ul>
            {cursor && (
              <button className="btn-mecha mt-4" disabled={busy} onClick={() => void load(true)}>
                读取更多历史
              </button>
            )}
            {history.length === 0 && <p className="mt-3 text-sm">暂无历史版本。</p>}
          </details>
        </>
      )}
    </section>
  );
}
