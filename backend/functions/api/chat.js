import { json, ok, readObject } from "./_http.js";
// AI endpoint: chat with 锐锐酱, or generate a site theme from a description.
import { askAI, PERSONA } from "./_ai.js";

function validContent(message) {
  if (ok(message.content, 2000)) return true;
  if (message.role !== "user" || !Array.isArray(message.content) || message.content.length !== 2) return false;
  const [text, image] = message.content;
  const url = image?.image_url?.url;
  if (text?.type !== "text" || !ok(text.text, 2000) || image?.type !== "image_url" || typeof url !== "string" || url.length > 1_400_000) return false;
  // Inline raster images only: never let a provider fetch arbitrary visitor URLs.
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
  if (!match || match[2].length % 4 !== 0) return false;
  try {
    const prefix = atob(match[2].slice(0, 32));
    return match[1] === "jpeg" ? prefix.startsWith("\xff\xd8\xff") : match[1] === "png" ? prefix.startsWith("\x89PNG\r\n\x1a\n") : prefix.startsWith("RIFF") && prefix.slice(8, 12) === "WEBP";
  } catch { return false; }
}

const THEME_SYSTEM = `你是网站换装魔法师。用户描述想要的网站风格，你输出一个JSON对象（不要markdown代码块），格式：
{"theme":{"--bg":"页面背景色","--bg2":"次背景色","--pri":"主题色(可爱明亮)","--pri-deep":"深主题色","--acc":"点缀色","--ink":"正文字色(要和背景有足够对比度)","--ink-soft":"浅字色","--fs":"字号如16px或18px","--radius":"圆角如1.6rem"},"comment":"一句可爱的变身宣言(20字内)"}
所有颜色用hex。保持整体柔和可爱、可读性好。只输出JSON。`;

export async function onRequestPost({ request, env }) {
  const body = await readObject(request, 2_000_000).catch(() => ({}));

  if (body.mode === "theme") {
    if (!ok(body.desc, 200)) return json({ error: "invalid description" }, 400);
    const content = await askAI(
      env,
      [{ role: "user", content: String(body.desc || "").slice(0, 200) }],
      { system: THEME_SYSTEM, max_tokens: 400 },
    );
    try {
      const parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
      const keys = ["--bg", "--bg2", "--pri", "--pri-deep", "--acc", "--ink", "--ink-soft"];
      if (
        !parsed.theme ||
        !keys.every((key) => /^#[0-9a-f]{6}$/i.test(parsed.theme[key])) ||
        !/^(1[4-9]|20)px$/.test(parsed.theme["--fs"]) ||
        !/^[0-3](?:\.\d{1,2})?rem$/.test(parsed.theme["--radius"]) ||
        !ok(parsed.comment, 100)
      )
        throw new Error("invalid theme");
      const theme = Object.fromEntries(
        [...keys, "--fs", "--radius"].map((key) => [key, parsed.theme[key]]),
      );
      return json({ theme, comment: parsed.comment });
    } catch {
      return json({ error: "bad theme json" }, 502);
    }
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 10 ||
    !body.messages.every(
      (message) =>
        message && ["user", "assistant"].includes(message.role) && validContent(message),
    )
  )
    return json({ error: "invalid messages" }, 400);
  const messages = body.messages.map(({ role, content }) => ({ role, content }));
  if (body.mode && !["chat", "flirt"].includes(body.mode))
    return json({ error: "invalid mode" }, 400);
  const reply = await askAI(env, messages, { system: PERSONA, flirt: body.mode === "flirt" });
  return reply ? json({ reply }) : json({ error: "upstream" }, 502);
}
