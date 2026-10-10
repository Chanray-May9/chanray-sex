"use client";
import { useState } from "react";

type Config = {
  apiURL: string;
  prompt: string;
  model: string;
  enabled: boolean;
  hasKey: boolean;
  storedKey: boolean;
  canStoreKey: boolean;
};
export function AISettings({ token, apiURL }: { token: string; apiURL: string }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [key, setKey] = useState("");
  const [removeKey, setRemoveKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(save = false) {
    if (!token.trim() || busy) return;
    setBusy(true);
    setMessage("处理中…");
    try {
      const url = new URL(apiURL, window.location.origin);
      url.searchParams.set("dataset", "ai");
      const headers = { "Content-Type": "application/json" };
      if (save && config) {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: config.prompt,
            apiURL: config.apiURL,
            model: config.model,
            enabled: config.enabled,
            apiKey: key,
            removeKey,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error("保存失败，请检查权限、输入或服务端加密配置。");
      }
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error("无法读取配置，请检查登录状态。");
      const body = await response.json() as Config;
      if (typeof body.prompt !== "string" || typeof body.model !== "string")
        throw new Error("接口返回无效数据。");
      setConfig(body);
      setKey("");
      setRemoveKey(false);
      setMessage(save ? "AI 配置已保存。" : "AI 配置已读取。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "请求失败。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-12 rounded border border-border bg-card p-6"
      aria-labelledby="ai-settings-title"
    >
      <h2 id="ai-settings-title" className="text-xl font-bold">
        AI 提示词与 Key 管理
      </h2>
      <button
        className="btn-mecha mt-4"
        disabled={busy || !token.trim()}
        onClick={() => void run()}
      >
        读取 AI 配置
      </button>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {message}
      </p>
      {config && (
        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(true);
          }}
        >
          <label className="grid gap-2">
            调情角色提示词
            <textarea
              className="rounded border border-border bg-background p-3"
              rows={5}
              maxLength={2000}
              required
              disabled={busy}
              value={config.prompt}
              onChange={(event) => setConfig({ ...config, prompt: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            API 地址
            <input
              className="rounded border border-border bg-background p-3"
              type="url"
              maxLength={500}
              required
              disabled={busy}
              value={config.apiURL}
              placeholder="https://api.deepseek.com/chat/completions"
              onChange={(event) => setConfig({ ...config, apiURL: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            模型名称
            <input
              className="rounded border border-border bg-background p-3"
              maxLength={120}
              required
              disabled={busy}
              value={config.model}
              onChange={(event) => setConfig({ ...config, model: event.target.value })}
            />
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              disabled={busy}
              checked={config.enabled}
              onChange={(event) => setConfig({ ...config, enabled: event.target.checked })}
            />
            启用 AI 调情互动
          </label>
          <p className="text-sm text-muted-foreground">
            Key 状态：{config.hasKey ? "已配置" : "未配置"}。
            {config.storedKey ? "使用后台加密保存的 Key。" : "使用服务端环境配置。"}
          </p>
          <label className="grid gap-2">
            替换 API Key（留空保留现有值）
            <input
              className="rounded border border-border bg-background p-3"
              type="password"
              autoComplete="off"
              maxLength={512}
              disabled={busy || !config.canStoreKey}
              value={key}
              onChange={(event) => setKey(event.target.value)}
            />
          </label>
          {!config.canStoreKey && (
            <p className="text-sm text-muted-foreground">
              后台 Key 管理需要服务端设置 ADMIN_ENCRYPTION_KEY。
            </p>
          )}
          <label className="flex gap-2">
            <input
              type="checkbox"
              disabled={busy || !config.storedKey}
              checked={removeKey}
              onChange={(event) => setRemoveKey(event.target.checked)}
            />
            删除后台保存的 Key（回退到服务端环境 Key）
          </label>
          <button className="btn-mecha justify-self-start" disabled={busy}>
            保存 AI 配置
          </button>
        </form>
      )}
    </section>
  );
}
