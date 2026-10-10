import {
  SESSION_SECONDS,
  createSession,
  digest,
  equalSecret,
  readSession,
  sameOrigin,
  sessionCookie,
} from "./_auth.js";
import { json, readObject } from "./_http.js";
async function handle({ request, env }) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32 || !env.ADMIN_PASSWORD || !env.BOARD)
    return json({ error: "login not configured" }, 503);
  if (request.method === "GET") {
    const session = await readSession(request, env);
    return json({ authenticated: Boolean(session) }, session ? 200 : 401);
  }
  if (!sameOrigin(request)) return json({ error: "invalid origin" }, 403);
  if (request.method === "DELETE") {
    const session = await readSession(request, env);
    if (session)
      await env.BOARD.put("private:admin-session-revoked:" + session.id, "1", {
        expirationTtl: Math.max(60, session.expires - Math.floor(Date.now() / 1000)),
      });
    const response = json({ authenticated: false });
    response.headers.set("Set-Cookie", sessionCookie("", 0));
    return response;
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    return json({ error: "invalid content type" }, 415);
  const attemptKey =
    "private:admin-login-attempts:" +
    (await digest(request.headers.get("CF-Connecting-IP") || "local"));
  const attempts = Number((await env.BOARD.get(attemptKey)) || 0);
  if (attempts >= 10) return json({ error: "too many attempts" }, 429);
  const body = await readObject(request, 2048).catch(() => null);
  if (
    typeof body?.password !== "string" ||
    body.password.length > 256 ||
    !(await equalSecret(body.password, env.ADMIN_PASSWORD))
  ) {
    await env.BOARD.put(attemptKey, String(attempts + 1), { expirationTtl: 900 });
    return json({ error: "invalid password" }, 401);
  }
  const response = json({ authenticated: true, expiresIn: SESSION_SECONDS });
  response.headers.set("Set-Cookie", sessionCookie(await createSession(env)));
  return response;
}
async function safely(context) {
  try {
    return await handle(context);
  } catch {
    return json({ error: "login unavailable" }, 503);
  }
}
export const onRequestGet = safely;
export const onRequestPost = safely;
export const onRequestDelete = safely;
