import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../backend/functions/_middleware.js';
const url='https://ruirui-whispers-20261010.pages.dev/api/admin';
test('Pages CORS allows only the configured origin and signed session headers',async()=>{
 const denied=await onRequest({request:new Request(url,{headers:{Origin:'https://evil.example'}}),next:()=>{throw Error('must not run');}});assert.equal(denied.status,403);
 const preflight=await onRequest({request:new Request(url,{method:'OPTIONS',headers:{Origin:'https://chanray-may9.github.io'}})});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://chanray-may9.github.io');assert.equal(preflight.headers.get('Access-Control-Allow-Credentials'),null);
 let incoming;
 const response=await onRequest({request:new Request(url,{headers:{Origin:'https://chanray-may9.github.io','X-Ruirui-Admin-Session':'123.abc.def','Cookie':'other=secret'}}),next:async request=>{incoming=request;return new Response('{}',{headers:{'Set-Cookie':'__Host-ruirui-admin=456.abc.def; HttpOnly; Secure'}});}});
 assert.equal(incoming.headers.get('Cookie'),'__Host-ruirui-admin=123.abc.def');assert.equal(incoming.headers.get('Origin'),new URL(url).origin);assert.equal(response.headers.get('X-Ruirui-Admin-Session'),'456.abc.def');assert.equal(response.headers.get('Set-Cookie'),null);
});
