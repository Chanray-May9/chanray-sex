import { readContent } from "./_content.js";
import { json, ok, readObject } from "./_http.js";
export const CONFIG_KEY = "private:ai-config:v1";
export const DEFAULT_API_URL = "https://api.deepseek.com/chat/completions";
export const DEFAULT_MODEL = "deepseek-flash";
export function validateAPIURL(value) {
  if (typeof value !== "string" || value.length > 500) throw new Error("invalid API URL");
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
    (url.port && url.port !== "443") || !host.includes(".") ||
    /(^[\d.]+$|:|\.localhost\.?$|\.local\.?$|\.internal\.?$|\.$)/.test(host)) throw new Error("invalid API URL");
  return url.href;
}
function apiURL(config, env) {
  return validateAPIURL(config.apiURL || env.AI_API_URL || DEFAULT_API_URL);
}
function environmentKey(url, env) {
  if (env.AI_API_KEY) return env.AI_API_KEY;
  const host = new URL(url).hostname;
  return host === "api.deepseek.com" ? env.DEEPSEEK_API_KEY : host === "open.bigmodel.cn" ? env.ZHIPU_API_KEY : undefined;
}
export const DEFAULT_PROMPT =
  "你是虚构的聊天角色{{character}}，称呼对方为{{address}}。角色是成年人，用主动、黏人、直球、暧昧但不露骨的语气和主人调情。用自然、简短的中文回答，不超过120字。不要用广告口吻、网络套话或“接招”“不绕弯子”等表述。不要扮演真实人物。";
export const FLIRT_BOUNDARY =
  "只进行非露骨的浪漫与调情对话。不生成性行为、性器官、色情细节或涉及未成年人的性化内容；不符合范围的请求简短拒绝并转向浪漫话题。尊重明确拒绝与边界。";
const bytesToHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
function fromHex(value) {
  if (typeof value !== "string" || value.length % 2 || !/^[0-9a-f]+$/i.test(value))
    throw new Error("invalid encrypted config");
  return Uint8Array.from(value.match(/.{2}/g), (pair) => parseInt(pair, 16));
}
async function encryptionKey(env) {
  if (!/^[0-9a-f]{64}$/i.test(env.ADMIN_ENCRYPTION_KEY || ""))
    throw new Error("encryption secret not configured");
  return crypto.subtle.importKey("raw", fromHex(env.ADMIN_ENCRYPTION_KEY), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function readConfig(env) {
  return JSON.parse((await env.BOARD?.get(CONFIG_KEY)) || "{}");
}
export async function resolveAIConfig(env) {
  const config = await readConfig(env);
  const endpoint = apiURL(config, env);
  let apiKey = environmentKey(endpoint, env);
  if (config.secret) {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromHex(config.secret.iv) },
      await encryptionKey(env),
      fromHex(config.secret.ciphertext),
    );
    apiKey = new TextDecoder().decode(plaintext);
  }
  const site = await readContent(env);
  const prompt = (config.prompt || DEFAULT_PROMPT)
    .replaceAll("{{character}}", site.overrides["锐锐"] ?? "锐锐")
    .replaceAll("{{address}}", site.overrides["主人"] ?? "主人");
  return {
    apiKey,
    apiURL: endpoint,
    model: config.model || env.AI_MODEL || DEFAULT_MODEL,
    prompt,
    enabled: config.enabled !== false,
  };
}
export async function handleConfig(request, env) {
  const previous = await readConfig(env);
  if (request.method === "GET")
    return json({
      prompt: previous.prompt || DEFAULT_PROMPT,
      apiURL: apiURL(previous, env),
      model: previous.model || env.AI_MODEL || DEFAULT_MODEL,
      enabled: previous.enabled !== false,
      hasKey: Boolean(previous.secret || environmentKey(apiURL(previous, env), env)),
      storedKey: Boolean(previous.secret),
      canStoreKey: /^[0-9a-f]{64}$/i.test(env.ADMIN_ENCRYPTION_KEY || ""),
    });
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const body = await readObject(request).catch(() => ({}));
  let endpoint;
  try { endpoint = validateAPIURL(body.apiURL ?? apiURL(previous, env)); }
  catch { return json({ error: "invalid API URL" }, 400); }
  if (
    !ok(body.prompt, 2000) ||
    !ok(body.model, 120) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(body.model) ||
    typeof body.enabled !== "boolean" ||
    (body.apiKey !== undefined && (typeof body.apiKey !== "string" || body.apiKey.length > 512)) ||
    (body.removeKey !== undefined && typeof body.removeKey !== "boolean")
  )
    return json({ error: "invalid configuration" }, 400);
  const next = {
    apiURL: endpoint,
    prompt: body.prompt.trim(),
    model: body.model,
    enabled: body.enabled,
    updatedAt: Date.now(),
  };
  if (previous.secret) next.secret = previous.secret;
  if (body.removeKey) delete next.secret;
  if (body.apiKey?.trim()) {
    if (!/^[0-9a-f]{64}$/i.test(env.ADMIN_ENCRYPTION_KEY || ""))
      return json({ error: "encryption secret not configured" }, 503);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        await encryptionKey(env),
        new TextEncoder().encode(body.apiKey.trim()),
      ),
    );
    next.secret = { iv: bytesToHex(iv), ciphertext: bytesToHex(ciphertext) };
  }
  await env.BOARD.put(CONFIG_KEY, JSON.stringify(next));
  return json({ saved: true, hasKey: Boolean(next.secret || environmentKey(endpoint, env)) });
}
