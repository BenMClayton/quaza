import {env} from 'cloudflare:workers';
import type {D1Database} from '@cloudflare/workers-types';
export function db(){const binding=(env as unknown as {DB?:D1Database}).DB;if(!binding)throw new Error('World storage is unavailable.');return binding;}
export async function identity(request:Request){
  const raw=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('quaza_explorer='))?.split('=')[1];
  const token=raw&&/^[a-f0-9-]{36}$/.test(raw)?raw:crypto.randomUUID();
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  const owner=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return {owner,cookie:raw===token?null:`quaza_explorer=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`};
}
export function json(data:unknown,status=200,cookie:string|null=null){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store',...(cookie?{'Set-Cookie':cookie}:{})}});}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return request.headers.get('sec-fetch-site')!=='cross-site'&&(!origin||origin===new URL(request.url).origin);}
