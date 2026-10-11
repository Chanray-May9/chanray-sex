import { apiFetch } from "../lib/api";
"use client";
import { useState } from "react";
type Overview = {
  counts: Record<string, number>;
  checkedAt: string;
  storage: string;
  aiKeyConfigured: boolean;
  encryptionConfigured: boolean;
};
export function AdminOverview({ token, apiURL }: { token: string; apiURL: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function load() {
    if (busy || !token.trim()) return;
    setBusy(true);
    try {
      const url = new URL(apiURL, location.origin);
      url.searchParams.set("dataset", "overview");
      const r = await apiFetch(url, {
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw Error();
      setData(await r.json() as Overview);
      setNotice("概览已更新。");
    } catch {
      setNotice("读取失败，请检查登录状态。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="admin-overview"
      className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">数据概览</h2>
        <button className="btn-mecha" disabled={busy || !token.trim()} onClick={() => void load()}>
          刷新概览
        </button>
      </div>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {notice}
      </p>
      {data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries({
              board: "留言",
              forum: "帖子",
              room: "聊天记录",
              rate: "评分项目",
            }).map(([k, v]) => (
              <div className="rounded-xl bg-background p-4" key={k}>
                <div className="text-xs text-muted-foreground">{v}</div>
                <strong className="mt-2 block text-3xl text-primary">{data.counts[k]}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>存储：{data.storage}</span>
            <span>环境 AI Key：{data.aiKeyConfigured ? "已配置" : "未配置"}</span>
            <span>Key 加密：{data.encryptionConfigured ? "已配置" : "未配置"}</span>
            <time>读取时间：{data.checkedAt.replace("T", " ").slice(0, 19)} UTC</time>
          </div>
        </>
      )}
    </section>
  );
}
