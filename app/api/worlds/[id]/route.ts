import {db,identity,json,sameOrigin} from '@/lib/db';
import {validSnapshot} from '@/lib/validation';
import type {Snapshot} from '@/lib/game';
type Row={id:string;owner_id:string;seed:number;name:string;snapshot:string;revision:number;updated_at:number};
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){try{
  const {id}=await context.params,{owner,cookie}=await identity(request);const row=await db().prepare('SELECT * FROM worlds WHERE id = ?').bind(id).first<Row>();if(!row)return json({error:'World not found.'},404,cookie);
  const mine=row.owner_id===owner;
  if(!mine){const owned=await db().prepare('SELECT snapshot FROM worlds WHERE owner_id = ?').bind(owner).all<{snapshot:string}>();const unlocked=owned.results.some(r=>{const s=JSON.parse(r.snapshot) as Snapshot;return s.seconds>=72000&&s.tech===4&&Object.values(s.buildings).some(b=>b.type==='rocket');});if(!unlocked)return json({error:'Research orbital travel, build a shuttle and reach 20 active hours to visit other worlds.'},403,cookie);}
  return json({id,state:JSON.parse(row.snapshot),revision:row.revision,mine},200,cookie);
}catch{return json({error:'Could not load this world. Please retry.'},503);}}
export async function PUT(request:Request,context:Context){
  if(!sameOrigin(request))return json({error:'Request origin rejected.'},403);
  try{const {id}=await context.params,{owner}=await identity(request);const row=await db().prepare('SELECT * FROM worlds WHERE id = ? AND owner_id = ?').bind(id,owner).first<Row>();if(!row)return json({error:'Only the owner can save this world.'},403);
    if(Number(request.headers.get('content-length')||0)>2500000)return json({error:'World save is too large.'},413);
    const text=await request.text();if(text.length>2500000)return json({error:'World save is too large.'},413);
    const body=JSON.parse(text);if(!validSnapshot(body.state)||body.state.seed!==row.seed||body.state.name!==row.name||!Number.isInteger(body.revision))return json({error:'Invalid world save.'},400);
    if(body.revision!==row.revision)return json({error:'This world was saved in another tab. Reload before continuing.'},409);
    const previous=JSON.parse(row.snapshot) as Snapshot,now=Date.now();
    // Never credit more playtime than elapsed wall time; idle/background time is excluded by the client.
    body.state.seconds=Math.max(previous.seconds,Math.min(body.state.seconds,previous.seconds+Math.min(120,Math.max(0,(now-row.updated_at)/1000))));
    const r=await db().prepare('UPDATE worlds SET snapshot = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND owner_id = ? AND revision = ?').bind(JSON.stringify(body.state),now,id,owner,body.revision).run();
    if(!r.meta.changes)return json({error:'A newer save exists. Reload this world.'},409);
    return json({revision:row.revision+1,seconds:body.state.seconds});
  }catch{return json({error:'Save failed. Your current session is still in memory; retry saving.'},503);}
}
