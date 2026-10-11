const BACKEND = "https://ruirui-whispers-20261010.pages.dev";
const names = {admin:"ruirui-admin-session", mode:"ruirui-hidden-session"};
function cookie(name:string) { return document.cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1); }
export async function apiFetch(input:string|URL, init:RequestInit = {}) {
 const target = new URL(input, location.origin);
 if (!target.pathname.startsWith("/api/")) throw new Error("Invalid API path");
 const headers = new Headers(init.headers);
 const admin = cookie(names.admin), mode = cookie(names.mode);
 if(admin) headers.set("X-Ruirui-Admin-Session",admin);
 if(mode) headers.set("X-Ruirui-Mode-Session",mode);
 const response = await fetch(BACKEND + target.pathname + target.search, {...init, headers, credentials:"omit"});
 for (const [kind,name] of Object.entries(names)) {
  const value = response.headers.get(kind === "admin" ? "X-Ruirui-Admin-Session" : "X-Ruirui-Mode-Session");
  if(value !== null) {
   const age = value ? Math.max(0, Number(value.split(".")[0])-Math.floor(Date.now()/1000)) : 0;
   document.cookie = `${name}=${value}; Path=${import.meta.env.BASE_URL}; Max-Age=${age}; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
  }
 }
 return response;
}
