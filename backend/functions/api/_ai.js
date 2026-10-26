import { resolveAIConfig } from "./_config.js";
import { PERSONAS, PERSONA_MODE_PROMPT } from "./_personas.js";
// Shared OpenAI-compatible chat-completions client.

// Legacy single-window fallback persona, kept exported for existing callers.
export const PERSONA = PERSONA_MODE_PROMPT;

export const DEFAULT_MAX_TOKENS = 900;

export async function askAI(env, messages, opts = {}) {
  let config;
  try {
    config = await resolveAIConfig(env);
  } catch {
    return null;
  }
  if (!config.apiKey || (opts.flirt && !config.enabled)) return null;
  const persona =
    opts.persona && Object.hasOwn(PERSONAS, opts.persona) ? PERSONAS[opts.persona] : null;
  // Persona window wins; legacy flirt mode uses the configured prompt as-is
  // (no boundary appendix); everything else falls back to the explicit persona.
  const system = persona ? persona.system : opts.flirt ? config.prompt : opts.system || PERSONA;
  const maxTokens = opts.max_tokens || persona?.maxTokens || DEFAULT_MAX_TOKENS;
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
          messages: [{ role: "system", content: system }, ...messages],
          max_tokens: maxTokens,
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
