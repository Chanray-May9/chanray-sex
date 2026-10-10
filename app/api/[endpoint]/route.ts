import { dedicatedCatalog } from "@/lib/site-copy";
const BACKEND = "https://chanray-upgraded-20261010.pages.dev";
const METHODS: Record<string, string[]> = { content: ["GET"], chat: ["POST"], admin: ["GET", "POST", "DELETE"], "admin-session": ["GET", "POST", "DELETE"] };
export const dynamic = "force-dynamic";
async function handle(request: Request, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  if (!METHODS[endpoint]) return Response.json({ error: "not found" }, { status: 404 });
  if (!METHODS[endpoint].includes(request.method)) return Response.json({ error: "method not allowed" }, { status: 405 });
  const requestURL = new URL(request.url);
  if (request.method !== "GET" && request.headers.get("Origin") !== requestURL.origin) return Response.json({ error: "invalid origin" }, { status: 403 });
  const target = new URL(`/api/${endpoint}`, BACKEND);
  target.search = requestURL.search;
  const headers = new Headers({ "Accept": "application/json" });
  const cookie = request.headers.get("Cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith("__Host-chanray-admin="));
  if (cookie) headers.set("Cookie", cookie);
  if (request.method !== "GET") {
    headers.set("Origin", BACKEND);
    headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
  }
  try {
    let body: Uint8Array | undefined;
    if (request.body) {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const value = await reader.read();
        if (value.done) break;
        size += value.value.byteLength;
        if (size > 262144) { await reader.cancel(); return Response.json({ error: "body too large" }, { status: 413 }); }
        chunks.push(value.value);
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    }
    const response = await fetch(target, { method: request.method, headers, body: body as BodyInit | undefined, redirect: "manual", signal: AbortSignal.timeout(18000) });
    if (response.status >= 300 && response.status < 400) throw new Error("Unexpected upstream redirect");
    const resultHeaders = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    const setCookie = response.headers.get("Set-Cookie");
    if (setCookie) resultHeaders.set("Set-Cookie", setCookie);
    if (endpoint === "admin" && request.method === "GET" && target.searchParams.get("dataset") === "content" && response.ok) {
      const data = await response.json() as Record<string, unknown>;
      data.catalog = dedicatedCatalog;
      return Response.json(data, { headers: resultHeaders });
    }
    return new Response(response.body, { status: response.status, headers: resultHeaders });
  } catch (error) { console.error("Upstream connection failed:", error instanceof Error ? error.message : "unknown"); return Response.json({ error: "service unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
export { handle as GET, handle as POST, handle as DELETE };
