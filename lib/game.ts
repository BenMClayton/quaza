export const SIZE = 96;
export const wrap = (n: number) => ((n % SIZE) + SIZE) % SIZE;
export const key = (x: number, y: number, z = 0) => `${wrap(Math.floor(x))},${wrap(Math.floor(y))},${z}`;
export const delta = (a: number, b: number) => ((a - b + SIZE * 1.5) % SIZE) - SIZE / 2;
export function hash(x: number, y: number, seed: number) {
  let n = Math.imul(x ^ seed, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number, scale: number, seed: number) {
  const ix = Math.floor(x / scale), iy = Math.floor(y / scale), period = SIZE / scale;
  let fx = (x / scale) % 1, fy = (y / scale) % 1;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed), b = hash((ix + 1) % period, iy, seed);
  const c = hash(ix, (iy + 1) % period, seed), d = hash((ix + 1) % period, (iy + 1) % period, seed);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
export const MINERALS = ['Hematite', 'Magnetite', 'Goethite', 'Limonite', 'Siderite'];
export const REFINING = [
  {process:'Crushing',cost:{ore:2},direct:2,fuel:1},
  {process:'Magnetic separation',cost:{ore:2},direct:0,fuel:1},
  {process:'Dehydration',cost:{ore:2,coal:1},direct:0,fuel:1},
  {process:'Gangue washing',cost:{ore:3,stone:1},direct:0,fuel:1},
  {process:'Carbonate roasting',cost:{ore:2,coal:2},direct:3,fuel:2},
] as const;
export type Item = 'wood' | 'stone' | 'ore' | 'coal' | 'iron' | 'copper' | 'crystal' | 'berry' | 'gear' | 'circuit' | 'science' | 'concentrate';
export const ITEMS: Record<Item, { name: string; color: string; symbol: string }> = {
  wood: {name:'Timber',color:'#b38b58',symbol:'▰'}, stone:{name:'Stone',color:'#b1b3a4',symbol:'⬟'},
  ore:{name:'Iron ore',color:'#ba765f',symbol:'◆'},coal:{name:'Coal',color:'#718184',symbol:'◆'},
  iron:{name:'Iron ingot',color:'#d5d7cc',symbol:'▱'},copper:{name:'Copper',color:'#d49365',symbol:'▰'},
  crystal:{name:'Crystal',color:'#99cecd',symbol:'♦'},berry:{name:'Berries',color:'#c48394',symbol:'✤'},
  gear:{name:'Iron gear',color:'#a7b9bb',symbol:'⚙'},circuit:{name:'Circuit',color:'#a8b87c',symbol:'▦'},
  science:{name:'Research',color:'#d8bc6d',symbol:'◈'},concentrate:{name:'Concentrate',color:'#d7a58c',symbol:'◈'},
};
export type Structure = 'floor' | 'wall' | 'campfire' | 'chest' | 'drill' | 'belt' | 'furnace' | 'washer' | 'assembler' | 'beacon' | 'rocket';
export type Building = { type: Structure; x: number; y: number; z: number; direction: number; progress: number; buffer: Partial<Record<Item, number>>; mode?: string };
export const BUILDS: Record<Structure, {name:string;cost:Partial<Record<Item,number>>;tech:number;description:string}> = {
  floor:{name:'Timber floor',cost:{wood:2},tech:0,description:'A foundation for a place of your own.'},
  wall:{name:'Timber wall',cost:{wood:4},tech:0,description:'Shelter that blocks creatures and movement.'},
  campfire:{name:'Campfire',cost:{stone:5,wood:3},tech:0,description:'Light and warmth. Rest nearby to recover health.'},
  chest:{name:'Storage chest',cost:{wood:8},tech:0,description:'Collects items delivered by conveyor belts. E to empty.'},
  furnace:{name:'Stone furnace',cost:{stone:12,wood:5},tech:0,description:'Load ore or concentrate and coal with E. Outputs iron in its facing direction.'},
  belt:{name:'Conveyor belt',cost:{iron:1},tech:1,description:'Moves one item per second to the next machine. R to rotate.'},
  drill:{name:'Mining drill',cost:{iron:8,gear:3},tech:1,description:'Place on an ore deposit. Automatically extracts finite reserves.'},
  washer:{name:'Ore processor',cost:{iron:10,stone:8},tech:1,description:'Processes magnetite and hydrated ores into smeltable concentrate.'},
  assembler:{name:'Assembler',cost:{iron:12,gear:4,copper:4},tech:2,description:'Load iron with E. Automatically produces gears, circuits or research.'},
  beacon:{name:'World anchor',cost:{iron:20,crystal:8,circuit:4},tech:2,description:'Claim a district and tune daylight, gravity and creature hostility.'},
  rocket:{name:'Orbital shuttle',cost:{iron:200,gear:80,circuit:40,crystal:30},tech:4,description:'Travel to another inhabited world after 20 active hours and orbital research.'},
};
export const TECHS = [
  {name:'First foothold',era:'I',description:'Gather, craft and build your first shelter.',cost:0},
  {name:'Mechanical age',era:'II',description:'Mining drills, ore processing and conveyors.',cost:5},
  {name:'Industrial age',era:'III',description:'Assemblers, circuits and world anchors.',cost:25},
  {name:'Planetary systems',era:'IV',description:'Advanced production and efficient mining.',cost:80},
  {name:'Beyond the horizon',era:'V',description:'Orbital shuttles and travel between worlds.',cost:200},
];
export type Tile = {type:number;object:string;variant:number;mineral:number};
export type Snapshot = {version:1;seed:number;name:string;player:{x:number;y:number;z:number;hp:number;food:number;stamina:number};inventory:Record<Item,number>;buildings:Record<string,Building>;removed:Record<string,number>;tech:number;xp:number;seconds:number;rules:{daylight:string;gravity:number;peaceful:boolean};stats:{gathered:number;smelted:number;built:number};selected:number};
export const HOTBAR = ['pickaxe','axe','floor','wall','campfire','furnace','belt','drill'] as const;
export class Game {
  state:Snapshot;
  tiles:Tile[][] = [];
  animals:{x:number;y:number;kind:number;phase:number}[]=[];
  keys = new Set<string>();
  target:{x:number;y:number}|null=null;
  cursor:{x:number;y:number}|null=null;
  paused=false;readOnly=false;rotation=0;cooldown=0;machineClock=0;change=0;
  notify:(message:string)=>void=()=>{};
  constructor(seed=731904, name='Verdant Reach', state?:Snapshot) {
    this.state = state || {version:1,seed,name,player:{x:48.5,y:48.5,z:0,hp:100,food:100,stamina:100},inventory:{wood:8,stone:6,ore:0,coal:4,iron:0,copper:0,crystal:0,berry:6,gear:0,circuit:0,science:0,concentrate:0},buildings:{},removed:{},tech:0,xp:0,seconds:0,rules:{daylight:'cycle',gravity:1,peaceful:false},stats:{gathered:0,smelted:0,built:0},selected:0};
    this.generate();
    if(!state) {
      for(let x=51;x<55;x++) for(let y=47;y<51;y++) this.placeInitial('floor',x,y);
      for(let x=51;x<55;x++) this.placeInitial('wall',x,47);
      for(let y=48;y<51;y++) this.placeInitial('wall',54,y);
      this.placeInitial('campfire',49,50); this.placeInitial('chest',52,48);
    }
  }
  placeInitial(type:Structure,x:number,y:number) {this.state.buildings[key(x,y)]={type,x,y,z:0,direction:0,progress:0,buffer:{}};}
  generate(){
    const seed=this.state.seed;
    for(let z=0;z<3;z++) {
      const layer:Tile[]=[];
      for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) {
        const r=hash(x,y,seed+z*37), n=noise(x,y,12,seed), m=noise(x,y,24,seed+8);
        let type=n<.29?0:n<.36?1:m>.64?3:2;
        let object=type>1?(r>.77?'tree':r<.06?'stone':r<.087?'ore':r<.10?'berry':r<.112?'coal':''):'';
        if(z>0){type=4;object=r<.16?'ore':r<.23?'coal':r<.28?'copper':r<.30&&z===2?'crystal':r>.40?'rock':'';}
        const d=Math.hypot(x-48,y-48);
        if(d<9&&z===0){type=2;if(d<5||x>=51&&x<=55&&y>=46&&y<=51)object='';}
        if(z===0&&x>=42&&x<=44&&y>=46&&y<=48)object='ore';
        if(z===0&&x===46&&y===50)object='berry';
        if(z>0&&d<3)object='';
        layer.push({type,object,variant:Math.floor(r*5),mineral:seed%5});
      }
      this.tiles.push(layer);
    }
    for(let i=0;i<22;i++) this.animals.push({x:wrap(30+hash(i,1,seed)*50),y:wrap(30+hash(i,2,seed)*50),kind:hash(i,3,seed)>.7?1:0,phase:i*1.7});
  }
  tile(x:number,y:number,z=this.state.player.z){return this.tiles[z][wrap(Math.floor(y))*SIZE+wrap(Math.floor(x))];}
  object(x:number,y:number,z=this.state.player.z){return (this.state.removed[key(x,y,z)]||0)>=this.reserve(this.tile(x,y,z).object)?'':this.tile(x,y,z).object;}
  reserve(object:string){return object==='tree'?3:object==='berry'?2:['ore','coal','copper','crystal'].includes(object)?80:object?3:0;}
  building(x:number,y:number,z=this.state.player.z){return this.state.buildings[key(x,y,z)];}
  walkable(x:number,y:number){const t=this.tile(x,y), b=this.building(x,y);return t.type!==0&&b?.type!=='wall'&&!['tree','rock'].includes(this.object(x,y));}
  affordable(cost:Partial<Record<Item,number>>){return Object.entries(cost).every(([i,n])=>this.state.inventory[i as Item]>=n!);}
  spend(cost:Partial<Record<Item,number>>){if(!this.affordable(cost))return false;for(const [i,n]of Object.entries(cost))this.state.inventory[i as Item]-=n!;return true;}
  mine(x:number,y:number){
    if(this.readOnly){this.notify('Visiting a saved world. Its owner controls changes.');return;}
    if(this.cooldown>0)return;
    const p=this.state.player;
    if(Math.hypot(delta(x+.5,p.x),delta(y+.5,p.y))>2.8){this.target={x:x+.5,y:y+.5};this.notify('Move closer to gather.');return;}
    const building=this.building(x,y);if(building&&building.type!=='floor'){this.interact(x,y);return;}
    const object=this.object(x,y);
    const item=({tree:'wood',stone:'stone',rock:'stone',ore:'ore',coal:'coal',berry:'berry',copper:'copper',crystal:'crystal'} as Record<string,Item>)[object];
    if(!item){this.interact(x,y);return;}
    if(p.stamina<4){this.notify('Catch your breath before gathering again.');return;}
    const gain=object==='tree'?3:1;
    this.state.inventory[item]+=gain;this.state.removed[key(x,y,p.z)]=(this.state.removed[key(x,y,p.z)]||0)+1;
    p.stamina-=4;this.state.stats.gathered+=gain;this.state.xp++;this.cooldown=.28;this.change++;
    this.notify(`+${gain} ${item==='ore'?MINERALS[this.tile(x,y).mineral]:ITEMS[item].name}`);
  }
  build(type:Structure,x:number,y:number){
    if(this.readOnly)return this.notify('Only the owner can build here.');
    const p=this.state.player, spec=BUILDS[type];
    if(this.state.tech<spec.tech)return this.notify(`Research ${TECHS[spec.tech].name} first.`);
    if(Math.hypot(delta(x+.5,p.x),delta(y+.5,p.y))>4)return this.notify('Build within four tiles of your position.');
    if(this.tile(x,y).type===0||this.building(x,y)||['tree','rock'].includes(this.object(x,y)))return this.notify('Clear this tile before building.');
    if(type==='wall'&&Math.floor(p.x)===wrap(x)&&Math.floor(p.y)===wrap(y))return this.notify('Step off the tile first.');
    if(type==='drill'&&!['ore','coal','copper','crystal'].includes(this.object(x,y)))return this.notify('Mining drills must sit on a mineral deposit.');
    if(type==='rocket'&&this.state.seconds<72000)return this.notify('Orbital travel requires 20 active hours on the frontier.');
    if(!this.spend(spec.cost))return this.notify('Not enough materials. Open crafting to see the recipe.');
    this.state.buildings[key(x,y,p.z)]={type,x:wrap(x),y:wrap(y),z:p.z,direction:this.rotation,progress:0,buffer:{},mode:'gear'};
    this.state.stats.built++;this.change++;this.notify(`${spec.name} placed`);
  }
  interact(x?:number,y?:number){
    const p=this.state.player;
    if(x===undefined||y===undefined){
      const nearby=Object.values(this.state.buildings).filter(b=>b.z===p.z&&Math.hypot(delta(b.x+.5,p.x),delta(b.y+.5,p.y))<2.8&&b.type!=='floor'&&b.type!=='wall').sort((a,b)=>Math.hypot(delta(a.x,p.x),delta(a.y,p.y))-Math.hypot(delta(b.x,p.x),delta(b.y,p.y)));
      if(nearby.length){x=nearby[0].x;y=nearby[0].y;}else if(this.cursor){x=this.cursor.x;y=this.cursor.y;}else return;
    }
    if(Math.hypot(delta(x+.5,p.x),delta(y+.5,p.y))>2.8)return this.notify('Move closer to interact.');
    const b=this.building(x,y);
    if(!b){if(this.object(x,y))this.mine(x,y);return;}
    if(this.readOnly)return this.notify(`${BUILDS[b.type].name} · visitor mode`);
    if(b.type==='campfire'){p.hp=Math.min(100,p.hp+12);return this.notify('Rested by the fire. +12 health');}
    if(b.type==='beacon')return this.notify('World anchor online. Open World settings to shape this district.');
    if(b.type==='rocket')return this.notify('Shuttle ready. Choose a destination in the Universe.');
    const inputs:Item[]=b.type==='furnace'?['ore','concentrate','coal']:b.type==='washer'?['ore','coal','stone']:b.type==='assembler'?['iron','copper','crystal']:[];
    let loaded=0, collected=0;
    for(const i of inputs){const n=Math.min(10,this.state.inventory[i],100-(b.buffer[i]||0));if(n>0){b.buffer[i]=(b.buffer[i]||0)+n;this.state.inventory[i]-=n;loaded+=n;}}
    for(const [i,n]of Object.entries(b.buffer))if(!inputs.includes(i as Item)&&n){this.state.inventory[i as Item]+=n;collected+=n;b.buffer[i as Item]=0;}
    this.notify(loaded||collected?`Loaded ${loaded} materials · collected ${collected} items`:'Machine empty. Bring ingredients or connect a conveyor.');this.change++;
  }
  dismantle(x:number,y:number){
    if(this.readOnly)return;const p=this.state.player,b=this.building(x,y);
    if(!b||Math.hypot(delta(x+.5,p.x),delta(y+.5,p.y))>4)return;
    for(const [i,n]of Object.entries(BUILDS[b.type].cost))this.state.inventory[i as Item]+=Math.floor(n!*.75);
    for(const [i,n]of Object.entries(b.buffer))this.state.inventory[i as Item]+=n!;
    delete this.state.buildings[key(x,y,p.z)];this.change++;this.notify('Dismantled · 75% of materials recovered');
  }
  craft(item:Item){
    if(this.readOnly)return;
    const recipes:Partial<Record<Item,Partial<Record<Item,number>>>>={gear:{iron:2},circuit:{iron:1,copper:2},science:{wood:3,stone:3},coal:{wood:3},concentrate:REFINING[this.state.seed%5].cost};
    if(!recipes[item])return;
    if(item==='circuit'&&this.state.tech<2)return this.notify('Research Industrial age first.');
    if(this.spend(recipes[item]!)){this.state.inventory[item]++;this.change++;this.notify(`Crafted ${ITEMS[item].name}`);}else this.notify('Not enough materials.');
  }
  research(){const t=TECHS[this.state.tech+1];if(!t)return;if(this.readOnly)return;if(this.state.inventory.science<t.cost)return this.notify(`Requires ${t.cost} research.`);this.state.inventory.science-=t.cost;this.state.tech++;this.notify(`${t.name} unlocked`);this.change++;}
  eat(){if(this.readOnly)return;if(this.state.inventory.berry>0){this.state.inventory.berry--;this.state.player.food=Math.min(100,this.state.player.food+22);this.notify('Ate berries · +22 food');}else this.notify('Forage berry bushes for food.');}
  descend(){if(this.readOnly)return this.notify('Return home to mine underground.');this.state.player.z=(this.state.player.z+1)%3;this.state.player.x=48.5;this.state.player.y=48.5;this.target=null;this.notify(['Back on the surface','Limestone caverns · depth 24 m','Crystal seams · depth 68 m'][this.state.player.z]);}
  machines(dt:number){
    const buildings=Object.values(this.state.buildings);
    for(const b of buildings){
      b.progress=Math.min(60,b.progress+dt*(this.state.tech>=3?1.5:1));const buf=b.buffer;
      if(b.type==='drill'&&b.progress>=3){b.progress=0;const o=this.object(b.x,b.y,b.z);const i=(['ore','coal','copper','crystal'].includes(o)?o:null) as Item|null;if(i&&(buf[i]||0)<20){buf[i]=(buf[i]||0)+1;const k=key(b.x,b.y,b.z);this.state.removed[k]=(this.state.removed[k]||0)+1;}}
      const refining=REFINING[this.state.seed%5];
      if(b.type==='washer'&&b.progress>=3&&Object.entries(refining.cost).every(([i,n])=>(buf[i as Item]||0)>=n)&&(buf.concentrate||0)<40){b.progress=0;for(const [i,n]of Object.entries(refining.cost))buf[i as Item]!-=n;buf.concentrate=(buf.concentrate||0)+1;}
      if(b.type==='furnace'&&b.progress>=4&&(buf.coal||0)>0&&(buf.iron||0)<40){
        const input=(buf.concentrate||0)>=2?'concentrate':refining.direct?'ore':null;
        const count=input==='ore'?refining.direct:2,fuel=input==='ore'?refining.fuel:1;
        if(input&&(buf[input]||0)>=count&&(buf.coal||0)>=fuel){b.progress=0;buf[input]!-=count;buf.coal!-=fuel;buf.iron=(buf.iron||0)+1;this.state.stats.smelted++;}
      }
      if(b.type==='assembler'&&b.progress>=4){const output=(b.mode||'gear') as Item;const cost=output==='gear'?{iron:2}:output==='circuit'?{iron:1,copper:2}:{iron:1,copper:1};if(Object.entries(cost).every(([i,n])=>(buf[i as Item]||0)>=n)&&(buf[output]||0)<40){for(const [i,n]of Object.entries(cost))buf[i as Item]!-=n;b.progress=0;buf[output]=(buf[output]||0)+1;}}
    }
    this.machineClock+=dt;
    if(this.machineClock>=1){this.machineClock=0;
      // Snapshot transfers before applying: each item crosses at most one belt per tick.
      const moves:{from:Building;to:Building;item:Item}[]=[];
      for(const b of buildings){if(!['belt','drill','furnace','washer','assembler'].includes(b.type))continue;
        const [dx,dy]=[[1,0],[0,1],[-1,0],[0,-1]][b.direction];const dest=this.building(b.x+dx,b.y+dy,b.z);if(!dest||['wall','floor','campfire','beacon','rocket'].includes(dest.type))continue;
        const inputs:Item[]=dest.type==='furnace'?['ore','coal','concentrate']:dest.type==='washer'?['ore','coal','stone']:dest.type==='assembler'?['iron','copper','crystal']:Object.keys(ITEMS) as Item[];
        const output=Object.keys(b.buffer).find(i=>(b.buffer[i as Item]||0)>0&&inputs.includes(i as Item)&&(dest.buffer[i as Item]||0)<(dest.type==='belt'?1:100)&&!(b.type==='furnace'&&i!=='iron')&&!(b.type==='washer'&&i!=='concentrate')&&!(b.type==='assembler'&&i!==b.mode)) as Item|undefined;
        if(output&&!moves.some(m=>m.to===dest&&m.item===output))moves.push({from:b,to:dest,item:output});
      }
      for(const m of moves){m.from.buffer[m.item]!--;m.to.buffer[m.item]=(m.to.buffer[m.item]||0)+1;}
    }
  }
  step(dt:number){
    if(this.paused)return;const s=this.state,p=s.player;this.cooldown=Math.max(0,this.cooldown-dt);
    let sx=0,sy=0;if(this.keys.has('w')||this.keys.has('arrowup'))sy--;if(this.keys.has('s')||this.keys.has('arrowdown'))sy++;if(this.keys.has('a')||this.keys.has('arrowleft'))sx--;if(this.keys.has('d')||this.keys.has('arrowright'))sx++;
    let dx=(sx+sy)*.707,dy=(sy-sx)*.707;
    if(dx||dy)this.target=null;
    else if(this.target){dx=delta(this.target.x,p.x);dy=delta(this.target.y,p.y);const len=Math.hypot(dx,dy);if(len<.15){this.target=null;dx=dy=0;}else{dx/=len;dy/=len;}}
    const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
    const run=this.keys.has('shift')&&p.stamina>5;const speed=(run?4:2.5)/Math.sqrt(s.rules.gravity);
    if(dx||dy){if(this.walkable(p.x+dx*speed*dt,p.y))p.x=wrap(p.x+dx*speed*dt);if(this.walkable(p.x,p.y+dy*speed*dt))p.y=wrap(p.y+dy*speed*dt);if(run)p.stamina=Math.max(0,p.stamina-dt*7);}
    p.stamina=Math.min(100,p.stamina+dt*4);
    if(!this.readOnly){s.seconds+=dt;p.food=Math.max(0,p.food-dt*.035);if(p.food===0)p.hp-=dt*.15;this.machines(dt);
      for(const a of this.animals){const nx=wrap(a.x+Math.sin(s.seconds*.2+a.phase)*dt*.3),ny=wrap(a.y+Math.cos(s.seconds*.15+a.phase)*dt*.3);if(this.tile(nx,ny,0).type>1){a.x=nx;a.y=ny;}if(a.kind===1&&!s.rules.peaceful&&p.z===0&&Math.hypot(delta(a.x,p.x),delta(a.y,p.y))<.8)p.hp-=dt*3;}
      if(p.hp<=0){p.hp=100;p.food=70;p.x=p.y=48.5;p.z=0;for(const i of Object.keys(s.inventory) as Item[])s.inventory[i]=Math.floor(s.inventory[i]*.8);this.notify('You awoke at camp. 20% of carried materials were lost.');}
    }
  }
}
