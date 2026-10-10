import catalog from "../../src/content/catalog.json" with { type: "json" };
import { json, readObject } from "./_http.js";
import { normalizeText } from "../../public/site-content-runtime.js";
export const CONTENT_KEY = "public:site-content:v1";
export const HISTORY_PREFIX = "private:site-content:history:";
export function validOverrides(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length <= 2000 &&
    Object.entries(value).every(
      ([original, text]) =>
        original.length > 0 &&
        original.length <= 6000 &&
        normalizeText(original) === original &&
        typeof text === "string" &&
        text.length <= 6000,
    )
  );
}
export async function readContent(env) {
  const raw = await env.BOARD?.get(CONTENT_KEY);
  if (!raw) return { overrides: {}, revision: "initial", updatedAt: null };
  const content = JSON.parse(raw);
  if (!validOverrides(content.overrides) || typeof content.revision !== "string")
    throw new Error("invalid stored content");
  return content;
}
async function history(env, cursor) {
  const listing = await env.BOARD.list({
    prefix: HISTORY_PREFIX,
    limit: 30,
    ...(cursor ? { cursor } : {}),
  });
  return {
    items: listing.keys.map(({ name, metadata }) => ({ id: name, ...metadata })),
    cursor: listing.list_complete ? null : listing.cursor,
  };
}
export async function handleContent(request, env) {
  const current = await readContent(env);
  if (request.method === "GET")
    return json({
      ...current,
      catalog,
      history: await history(env, new URL(request.url).searchParams.get("cursor")),
    });
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const body = await readObject(request, 262144).catch(() => ({}));
  if (body.baseRevision !== current.revision)
    return json({ error: "content changed, reload before publishing" }, 409);
  let next;
  if (body.action === "restore") {
    if (typeof body.snapshot !== "string" || !body.snapshot.startsWith(HISTORY_PREFIX))
      return json({ error: "invalid snapshot" }, 400);
    const raw = await env.BOARD.get(body.snapshot);
    if (!raw) return json({ error: "snapshot not found" }, 404);
    next = JSON.parse(raw).overrides;
  } else if (body.action === "publish") next = body.overrides;
  else return json({ error: "invalid action" }, 400);
  if (!validOverrides(next)) return json({ error: "invalid content" }, 400);
  const snapshotId =
    HISTORY_PREFIX +
    String(9_999_999_999_999 - Date.now()).padStart(13, "0") +
    "-" +
    crypto.randomUUID();
  const metadata = {
    createdAt: Date.now(),
    count: Object.keys(current.overrides).length,
    revision: current.revision,
  };
  // Persist the exact previous version before changing the published document.
  await env.BOARD.put(snapshotId, JSON.stringify(current), { metadata });
  const updated = { overrides: next, revision: crypto.randomUUID(), updatedAt: Date.now() };
  await env.BOARD.put(CONTENT_KEY, JSON.stringify(updated));
  return json({ ...updated, backup: snapshotId });
}
