import {BUILDS,ITEMS,SIZE,key,type Snapshot} from './game';
const num=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function validSnapshot(v:unknown):v is Snapshot{
  if(!obj(v)||v.version!==1||!num(v.seed,0,2147483647)||!Number.isInteger(v.seed)||typeof v.name!=='string'||v.name.length<1||v.name.length>40)return false;
  if(!obj(v.player)||!num(v.player.x,0,SIZE)||!num(v.player.y,0,SIZE)||!num(v.player.z,0,2)||!Number.isInteger(v.player.z)||!num(v.player.hp,0,100)||!num(v.player.food,0,100)||!num(v.player.stamina,0,100))return false;
  const inventory=v.inventory;
  if(!obj(inventory)||Object.keys(inventory).length!==Object.keys(ITEMS).length||!Object.keys(ITEMS).every(k=>num(inventory[k],0,1e7)&&Number.isInteger(inventory[k])))return false;
  if(!obj(v.rules)||!['cycle','day','night'].includes(String(v.rules.daylight))||![.6,1,1.5].includes(Number(v.rules.gravity))||typeof v.rules.peaceful!=='boolean')return false;
  if(!num(v.tech,0,4)||!Number.isInteger(v.tech)||!num(v.xp,0,1e9)||!num(v.seconds,0,1e9)||!num(v.selected,0,7)||!Number.isInteger(v.selected))return false;
  const stats=v.stats;
  if(!obj(stats)||!['built','gathered','smelted'].every(k=>num(stats[k],0,1e9)))return false;
  if(!obj(v.buildings)||Object.keys(v.buildings).length>15000||!obj(v.removed)||Object.keys(v.removed).length>SIZE*SIZE*3)return false;
  for(const [k,b]of Object.entries(v.buildings)){
    if(!obj(b)||typeof b.type!=='string'||!Object.hasOwn(BUILDS,b.type)||!num(b.x,0,SIZE-1)||!num(b.y,0,SIZE-1)||!num(b.z,0,2)||![b.x,b.y,b.z].every(Number.isInteger)||k!==key(b.x as number,b.y as number,b.z as number)||!num(b.direction,0,3)||!Number.isInteger(b.direction)||!num(b.progress,0,1e9)||!obj(b.buffer))return false;
    if(Object.entries(b.buffer).some(([i,n])=>!Object.hasOwn(ITEMS,i)||!num(n,0,1e6)||!Number.isInteger(n)))return false;
    if(b.mode!==undefined&&!['gear','circuit','science'].includes(String(b.mode)))return false;
  }
  for(const [k,n]of Object.entries(v.removed)){const [x,y,z]=k.split(',').map(Number);if(![x,y,z].every(Number.isInteger)||!num(x,0,95)||!num(y,0,95)||!num(z,0,2)||k!==key(x,y,z)||!num(n,0,80)||!Number.isInteger(n))return false;}
  return true;
}
