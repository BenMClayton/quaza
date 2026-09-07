import {db,identity,json,sameOrigin} from '@/lib/db';
import {Game} from '@/lib/game';
export async function GET(request:Request){try{
  const {owner,cookie}=await identity(request),cursor=new URL(request.url).searchParams.get('before');
  if(cursor&&!/^\d{1,16}:[a-f0-9-]{36}$/.test(cursor))return json({error:'Invalid catalogue cursor.'},400,cookie);
  const [time,id]=cursor?.split(':')||[];
  const columns='SELECT id, name, seed, updated_at, (owner_id = ?) AS mine FROM worlds';
  const result=cursor?await db().prepare(`${columns} WHERE updated_at < ? OR (updated_at = ? AND id < ?) ORDER BY updated_at DESC, id DESC LIMIT 51`).bind(owner,Number(time),Number(time),id).all<{id:string;updated_at:number}>():await db().prepare(`${columns} ORDER BY updated_at DESC, id DESC LIMIT 51`).bind(owner).all<{id:string;updated_at:number}>();
  const owned=await db().prepare(`${columns} WHERE owner_id = ? ORDER BY updated_at DESC`).bind(owner,owner).all<{id:string;updated_at:number}>();
  const page=result.results.slice(0,50),last=page.at(-1),rows=[...owned.results,...page];
  return json({worlds:[...new Map(rows.map(w=>[w.id,w])).values()],nextCursor:result.results.length>50&&last?`${last.updated_at}:${last.id}`:null},200,cookie);
}catch{return json({error:'World storage is unavailable. Please retry.'},503);}}
export async function POST(request:Request){
  if(!sameOrigin(request))return json({error:'Request origin rejected.'},403);
  try{if(Number(request.headers.get('content-length')||0)>2048)return json({error:'Request too large.'},413);const {owner,cookie}=await identity(request);const body=await request.json() as {name?:unknown;seed?:unknown};
    if(typeof body.name!=='string'||!body.name.trim()||body.name.trim().length>40)return json({error:'Choose a name between 1 and 40 characters.'},400);
    const seed=typeof body.seed==='number'&&Number.isInteger(body.seed)&&body.seed>=0&&body.seed<=2147483647?body.seed:crypto.getRandomValues(new Uint32Array(1))[0]%2147483647;
    const name=body.name.trim(),id=crypto.randomUUID(),now=Date.now(),state=new Game(seed,name).state;
    const r=await db().prepare('INSERT INTO worlds (id, owner_id, name, seed, snapshot, revision, created_at, updated_at) SELECT ?, ?, ?, ?, ?, 0, ?, ? WHERE (SELECT COUNT(*) FROM worlds WHERE owner_id = ?) < 10').bind(id,owner,name,seed,JSON.stringify(state),now,now,owner).run();
    if(!r.meta.changes)return json({error:'Your explorer already has 10 worlds.'},409,cookie);
    return json({id,state,revision:0,mine:true},201,cookie);
  }catch{return json({error:'Could not create a world. Please retry.'},503);}
}
