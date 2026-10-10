import { scopedEnv } from "./_scope.js";
import { readMode } from "./_activation.js";
import { readContent } from "./_content.js";
import { json } from "./_http.js";
export async function onRequestGet({ request, env }) {
  try {
    const mode = await readMode(request, env);
    const content = await readContent(scopedEnv(env, mode?.mode));
    const response = json(content);
    // Only published text is public. Never include admin history, prompts, tokens or keys.
    response.headers.set("Vary", "Cookie");
    return response;
  } catch {
    return json({ error: "content unavailable" }, 503);
  }
}
