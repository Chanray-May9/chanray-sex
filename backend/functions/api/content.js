import { readContent } from "./_content.js";
import { json } from "./_http.js";
export async function onRequestGet({ env }) {
  try {
    const content = await readContent(env);
    const response = json(content);
    // Only published text is public. Never include admin history, prompts, tokens or keys.
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch {
    return json({ error: "content unavailable" }, 503);
  }
}
