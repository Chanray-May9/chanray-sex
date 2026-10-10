import { json } from "./_http.js";
export const COOKIE_NAME = "__Host-ruirui-admin";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const bytes = new TextEncoder();
const hex = (value) =>
  Array.from(new Uint8Array(value), (b) => b.toString(16).padStart(2, "0")).join("");
export async function digest(value) {
  return hex(await crypto.subtle.digest("SHA-256", bytes.encode(value)));
}
export async function equalSecret(actual, expected) {
  const [a, b] = await Promise.all([digest(actual), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export function sameOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}
async function signature(value, env) {
  const key = await crypto.subtle.importKey(
    "raw",
    bytes.encode(env.ADMIN_TOKEN),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, bytes.encode(value)));
}
export async function createSession(env) {
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${crypto.randomUUID()}`;
  return `${payload}.${await signature(payload, env)}`;
}
export async function readSession(request, env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32) return null;
  const cookie = request.headers
    .get("Cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(COOKIE_NAME + "="))
    ?.slice(COOKIE_NAME.length + 1);
  if (!cookie || cookie.length > 200) return null;
  const match = /^(\d+)\.([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(cookie);
  if (!match) return null;
  const expires = Number(match[1]);
  const now = Math.floor(Date.now() / 1000);
  if (expires <= now || expires > now + SESSION_SECONDS) return null;
  if (!(await equalSecret(match[3], await signature(`${match[1]}.${match[2]}`, env)))) return null;
  if (await env.BOARD?.get("private:admin-session-revoked:" + match[2])) return null;
  return { id: match[2], expires };
}
export function sessionCookie(value, maxAge = SESSION_SECONDS) {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export async function authorize(request, env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32)
    return json({ error: "admin not configured" }, 503);
  const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (bearer && (await equalSecret(bearer, env.ADMIN_TOKEN))) return null;
  if (!(await readSession(request, env))) return json({ error: "unauthorized" }, 401);
  if (request.method !== "GET" && !sameOrigin(request))
    return json({ error: "invalid origin" }, 403);
  return null;
}
