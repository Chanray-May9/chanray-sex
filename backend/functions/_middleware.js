const ALLOWED = "https://chanray-may9.github.io";
const SESSION_HEADERS = ["X-Ruirui-Admin-Session","X-Ruirui-Mode-Session"];
export async function onRequest(context) {
 const origin=context.request.headers.get("Origin");
 const cross = origin === ALLOWED;
 if (origin && origin !== new URL(context.request.url).origin && !cross) return new Response("Forbidden",{status:403});
 const cors = headers => { headers.set("Access-Control-Allow-Origin",ALLOWED);headers.set("Vary","Origin");headers.set("Access-Control-Expose-Headers",SESSION_HEADERS.join(", ")); };
 if (context.request.method === "OPTIONS") {
  if (!cross) return new Response(null,{status:403});
  const headers=new Headers();cors(headers);headers.set("Access-Control-Allow-Methods","GET, POST, DELETE, OPTIONS");headers.set("Access-Control-Allow-Headers","Content-Type, X-Ruirui-Admin-Session, X-Ruirui-Mode-Session");headers.set("Access-Control-Max-Age","600");return new Response(null,{status:204,headers});
 }
 let request=context.request;
 if(cross) {
  const headers=new Headers(request.headers);headers.set("Origin",new URL(request.url).origin);
  const cookies=[];
  for(const [header,name] of [[SESSION_HEADERS[0],"__Host-ruirui-admin"],[SESSION_HEADERS[1],"__Host-ruirui-hidden"]]) {
   const value=headers.get(header);if(value && value.length <= 200 && /^[0-9a-z.-]+$/.test(value)) cookies.push(`${name}=${value}`);
  }
  headers.set("Cookie",cookies.join("; "));
  request=new Request(request,{headers});
 }
 const response=await context.next(request);
 if(!cross) return response;
 const headers=new Headers(response.headers);cors(headers);
 const cookie=headers.get("Set-Cookie");
 if(cookie) {
  const pair=cookie.split(";")[0];const index=pair.indexOf("=");
  const name=pair.slice(0,index),value=pair.slice(index+1);
  if(name === "__Host-ruirui-admin") headers.set(SESSION_HEADERS[0],value);
  if(name === "__Host-ruirui-hidden") headers.set(SESSION_HEADERS[1],value);
  headers.delete("Set-Cookie");
 }
 return new Response(response.body,{status:response.status,headers});
}
