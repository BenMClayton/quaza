import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin=process.env.QUAZA_TEST_ORIGIN||'http://localhost:3000';
const jars={owner:'',visitor:''},created=[];
async function call(path,method='GET',body,who='owner',custom={}){const response=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(jars[who]?{Cookie:jars[who]}:{}),...custom},...(body?{body:JSON.stringify(body)}:{})});const cookie=response.headers.get('set-cookie');if(cookie)jars[who]=cookie.split(';')[0];const raw=await response.text();let data;try{data=JSON.parse(raw);}catch{data={error:raw};}return{status:response.status,data};}
try{
  const catalogue=await call('/api/worlds');assert.equal(catalogue.status,200);assert.ok(Array.isArray(catalogue.data.worlds));
  const createdWorld=await call('/api/worlds','POST',{name:'QA integration world',seed:731905});assert.equal(createdWorld.status,201);const {id,state}=createdWorld.data;created.push(id);assert.equal(state.seed,731905);
  assert.equal((await call(`/api/worlds/${id}`)).data.mine,true);
  await call('/api/worlds','GET',undefined,'visitor');
  assert.equal((await call(`/api/worlds/${id}`,'GET',undefined,'visitor')).status,403);
  assert.equal((await call(`/api/worlds/${id}`,'PUT',{state,revision:0},'visitor')).status,403);
  const forged=structuredClone(state);forged.inventory.wood=-10;
  assert.equal((await call(`/api/worlds/${id}`,'PUT',{state:forged,revision:0})).status,400);
  const updated=structuredClone(state);updated.inventory.wood=9;updated.seconds=72000;
  const saved=await call(`/api/worlds/${id}`,'PUT',{state:updated,revision:0});assert.equal(saved.status,200);assert.equal(saved.data.revision,1);assert.ok(saved.data.seconds<60,'server rejects artificial 20-hour clock advancement');
  const reloaded=await call(`/api/worlds/${id}`);assert.equal(reloaded.data.state.inventory.wood,9);assert.equal(reloaded.data.revision,1);
  assert.equal((await call(`/api/worlds/${id}`,'PUT',{state:updated,revision:0})).status,409);
  assert.equal((await call('/api/worlds','POST',{name:'forbidden'},'owner',{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await call('/api/worlds','POST',{name:''})).status,400);
  assert.equal((await call('/api/worlds/00000000-0000-0000-0000-000000000000')).status,404);
  console.log('API integration passed: catalogue, creation, owner reload, visitor restrictions, save validation, revision conflicts, playtime cap and origin checks.');
}finally{fs.mkdirSync('outputs',{recursive:true});fs.writeFileSync('outputs/api-test-worlds.json',JSON.stringify(created));}
