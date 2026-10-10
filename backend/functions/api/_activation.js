import { digest, equalSecret, sameOrigin } from "./_auth.js";
import { json, readObject } from "./_http.js";
const COOKIE = "__Host-ruirui-hidden", YEAR = 365 * 24 * 60 * 60;
const hex = value => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, "0")).join("");
async function sign(payload, env) {
 const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_TOKEN), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
 return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("ruirui-hidden:" + payload)));
}
export async function readMode(request, env) {
 if (!request || !env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32) return null;
 const value = request.headers.get("Cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
 const match = typeof value === "string" && value.length < 200 && /^(\d+)\.([0-9a-f-]{36})\.(normal|hidden)\.([0-9a-f]{64})$/.exec(value);
 if (!match || Number(match[1]) <= Math.floor(Date.now()/1000) || Number(match[1]) > Math.floor(Date.now()/1000) + YEAR + 300) return null;
 const payload = `${match[1]}.${match[2]}.${match[3]}`;
 if (!await equalSecret(match[4], await sign(payload, env))) return null;
 return { expires:Number(match[1]), id:match[2], mode:match[3] };
}
async function modeResponse(grant, env) {
 const payload = `${grant.expires}.${grant.id}.${grant.mode}`;
 const response = json({ activated:true, mode:grant.mode });
 response.headers.set("Set-Cookie", `${COOKIE}=${payload}.${await sign(payload,env)}; Path=/; Max-Age=${Math.max(0,grant.expires-Math.floor(Date.now()/1000))}; HttpOnly; Secure; SameSite=Strict`);
 return response;
}
export async function handleMode({ request, env }) {
 const grant = await readMode(request,env);
 if (request.method === "GET") return json({ activated:Boolean(grant), mode:grant?.mode || "normal" });
 if (!sameOrigin(request)) return json({ error:"invalid origin" },403);
 if (!env.ACTIVATIONS || !env.ADMIN_TOKEN) return json({ error:"activation unavailable" },503);
 if (!(request.headers.get("Content-Type")||"").startsWith("application/json")) return json({error:"invalid content type"},415);
 const body = await readObject(request,2048).catch(()=>({}));
 if (body.action === "switch") {
  if (!grant) return json({error:"activation required"},401);
  if (!["normal","hidden"].includes(body.mode)) return json({error:"invalid mode"},400);
  return modeResponse({...grant,mode:body.mode},env);
 }
 if (body.action !== "activate" || typeof body.code !== "string" || body.code.length > 80) return json({error:"invalid code"},400);
 const code = body.code.toUpperCase().replace(/[\s-]/g, "");
 if (!/^RR[0-9A-F]{24}$/.test(code)) return json({error:"invalid code"},400);
 const address = request.headers.get("CF-Connecting-IP") || "unknown";
 const throttle = "activation:attempts:" + await digest(address);
 const attempts = Number(await env.BOARD?.get(throttle)) || 0;
 if (attempts >= 20) return json({error:"try later"},429);
 await env.BOARD?.put(throttle,String(attempts+1),{expirationTtl:900});
 const id = grant?.id || crypto.randomUUID(), usedAt = Date.now();
 // One conditional SQL update is the redemption. D1 serializes this write:
 // concurrent requests cannot both transition the same unused code.
 const redeemed = await env.ACTIVATIONS.prepare("UPDATE activation_codes SET used_at = ?, used_by = ? WHERE code_hash = ? AND used_at IS NULL AND revoked_at IS NULL RETURNING id").bind(usedAt,await digest(id),await digest(code)).first();
 if (!redeemed) return json({error:"code used or invalid"},409);
 return modeResponse({id,mode:"hidden",expires:Math.floor(Date.now()/1000)+YEAR},env);
}
export async function handleCodes(request,env) {
 if (!env.ACTIVATIONS) return json({error:"activation database unavailable"},503);
 if (request.method === "GET") {
  const listing = await env.ACTIVATIONS.prepare("SELECT id, batch_id AS batchId, created_at AS createdAt, used_at AS usedAt, revoked_at AS revokedAt FROM activation_codes ORDER BY created_at DESC, id DESC LIMIT 200").all();
  const counts = await env.ACTIVATIONS.prepare("SELECT COUNT(*) AS total, COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) AS used, COUNT(CASE WHEN used_at IS NULL AND revoked_at IS NULL THEN 1 END) AS available FROM activation_codes").first();
  return json({ records:listing.results,counts });
 }
 const body = await readObject(request,4096).catch(()=>({}));
 if (body.action === "revoke" && typeof body.id === "string" && /^[0-9a-f-]{36}$/.test(body.id)) {
  const revoked = await env.ACTIVATIONS.prepare("UPDATE activation_codes SET revoked_at = ? WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL RETURNING id").bind(Date.now(),body.id).first();
  return revoked ? json({revoked:true}) : json({error:"code already used or revoked"},409);
 }
 if (body.action !== "generate" || !Number.isInteger(body.count) || body.count < 1 || body.count > 100) return json({error:"invalid count"},400);
 const codes=[],statements=[],batchId=crypto.randomUUID(),createdAt=Date.now();
 for (let i=0;i<body.count;i++) {
  const raw = hex(crypto.getRandomValues(new Uint8Array(12))).toUpperCase();
  const code = "RR-"+raw.match(/.{6}/g).join("-");
  const id=crypto.randomUUID();codes.push({id,code});
  statements.push(env.ACTIVATIONS.prepare("INSERT INTO activation_codes (id, code_hash, batch_id, created_at) VALUES (?, ?, ?, ?)").bind(id,await digest("RR"+raw),batchId,createdAt));
 }
 await env.ACTIVATIONS.batch(statements);
 return json({batchId,codes});
}
