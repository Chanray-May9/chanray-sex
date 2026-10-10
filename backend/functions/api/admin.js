import { handleContent } from "./_content.js";
import { handleConfig } from "./_config.js";
import { authorize } from "./_auth.js";
import { json } from "./_http.js";
async function handle({ request, env }) {
  const denied = await authorize(request, env); if (denied) return denied;
  if (!env.BOARD) return json({ error: "storage unavailable" }, 503);
  try {
    const dataset = new URL(request.url).searchParams.get("dataset");
    if (dataset === "content") return await handleContent(request, env);
    if (dataset === "ai") return await handleConfig(request, env);
    return json({ error: "invalid dataset" }, 400);
  } catch { return json({ error: "storage unavailable" }, 503); }
}
export const onRequestGet = handle;
export const onRequestPost = handle;
