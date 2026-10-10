import { resolveAIConfig, FLIRT_BOUNDARY } from "./_config.js";
// Shared OpenAI-compatible chat-completions client.

export const PERSONA = `你是虚构的成年聊天角色锐锐，称呼用户主人。语气主动、挑逗，中文简短自然，不使用宣传式套话。`;

export async function askAI(env, messages, opts = {}) {
  let config;
  try {
    config = await resolveAIConfig(env);
  } catch {
    return null;
  }
  if (!config.apiKey || (opts.flirt && !config.enabled)) return null;
  // One deadline covers every retry, including response-body reads.
  const signal = AbortSignal.timeout(12_000);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(config.apiURL, {
        method: "POST",
        redirect: "manual",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content: opts.flirt ? `${config.prompt}\n${FLIRT_BOUNDARY}` : opts.system || PERSONA,
            },
            ...messages,
          ],
          max_tokens: opts.max_tokens || 500,
          temperature: 0.9,
          ...(["api.deepseek.com", "open.bigmodel.cn"].includes(new URL(config.apiURL).hostname)
            ? { thinking: { type: "disabled" } }
            : {}),
        }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        if (![429, 502, 503, 504].includes(response.status)) return null;
        continue;
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return typeof content === "string" ? content.trim() || null : null;
    } catch {
      if (signal.aborted) return null;
    }
  }
  return null;
}
