import {Game, SIZE, wrap, delta, hash, type Building} from './game';

const W=48,H=24;
type Ctx=CanvasRenderingContext2D;
function poly(c:Ctx,points:number[][],color:string){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function box(c:Ctx,x:number,y:number,w:number,h:number,height:number,top:string,left:string,right:string){
  poly(c,[[x-w,y-height],[x,y+h-height],[x,y+h],[x-w,y]],left);
  poly(c,[[x,y+h-height],[x+w,y-height],[x+w,y],[x,y+h]],right);
  poly(c,[[x,y-h-height],[x+w,y-height],[x,y+h-height],[x-w,y-height]],top);
}
function shadow(c:Ctx,x:number,y:number,w:number,h:number){c.fillStyle='#0b1c1770';c.beginPath();c.ellipse(x+8,y+3,w,h,-.15,0,7);c.fill();}
export class Renderer{
  canvas:HTMLCanvasElement;ctx:Ctx;game:Game;width=100;height=100;zoom=1.8;frame=0;last=0;acc=0;
  atlas=new Map<string,HTMLCanvasElement>();raf=0;onHud:()=>void;hud=0;resizeObserver:ResizeObserver;mapCache:HTMLCanvasElement|null=null;mapKey='';
  constructor(canvas:HTMLCanvasElement,game:Game,onHud:()=>void){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false})!;this.game=game;this.onHud=onHud;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();this.raf=requestAnimationFrame(this.loop);}
  resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;const d=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.ctx.imageSmoothingEnabled=false;}
  destroy(){cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();}
  loop=(time:number)=>{const dt=this.last?Math.min((time-this.last)/1000,.1):0;this.last=time;if(!document.hidden){this.acc+=dt;while(this.acc>=.05){this.game.step(.05);this.acc-=.05;}this.draw(time);this.hud+=dt;if(this.hud>.2){this.hud=0;this.onHud();}}this.raf=requestAnimationFrame(this.loop);};
  screen(x:number,y:number){const p=this.game.state.player,dx=delta(x,p.x),dy=delta(y,p.y);return {x:this.width/2+(dx-dy)*W/2*this.zoom,y:this.height*.49+(dx+dy)*H/2*this.zoom};}
  unproject(x:number,y:number){const p=this.game.state.player;const dx=(x-this.width/2)/this.zoom/(W/2),dy=(y-this.height*.49)/this.zoom/(H/2);return{x:wrap(Math.floor(p.x+(dx+dy)/2)),y:wrap(Math.floor(p.y+(dy-dx)/2))};}
  sprite(kind:string,variant:number){
    const id=`${kind}:${variant}`;if(this.atlas.has(id))return this.atlas.get(id)!;
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;const x=64,y=140;
    if(kind==='tree'){
      shadow(c,x,y,24,9);c.fillStyle='#483d2c';c.fillRect(x-4,y-47,8,47);c.fillStyle='#786143';c.fillRect(x-3,y-41,3,39);
      const heights=[32,51,69,86];const widths=[29,25,20,13];
      for(let i=0;i<4;i++){const v=variant%3;poly(c,[[x,y-heights[i]-30],[x-widths[i],y-heights[i]+10],[x+widths[i],y-heights[i]+10]],['#34533a','#355742','#426045'][v]);poly(c,[[x,y-heights[i]-30],[x,y-heights[i]+9],[x-widths[i],y-heights[i]+10]],['#4c7048','#4f7650','#648353'][v]);poly(c,[[x+2,y-heights[i]-22],[x+widths[i],y-heights[i]+10],[x+4,y-heights[i]+6]],'#243f32');
        for(let j=0;j<9;j++){const rx=hash(j,i,variant)*widths[i]*1.4-widths[i]*.7,ry=hash(j,i+4,variant)*16;c.fillStyle=j%3?'#6f8b513d':'#182f2d50';c.fillRect(x+rx|0,y-heights[i]+ry-8|0,4+j%3*2,3);}}
    }else if(['stone','rock','ore','coal','copper','crystal'].includes(kind)){
      shadow(c,x,y,17,7);
      const top=kind==='crystal'?'#acd3cb':kind==='ore'?'#8a8171':kind==='coal'?'#626968':kind==='copper'?'#a28a71':'#969a86';
      for(let i=0;i<3;i++){const xx=x+(i-1)*12, yy=y+(i===1?-5:1), ht=10+hash(i,variant,4)*15;poly(c,[[xx-10,yy-ht],[xx-3,yy-ht-7],[xx+10,yy-ht+1],[xx+12,yy],[xx,yy+5],[xx-12,yy]],'#575e54');poly(c,[[xx-10,yy-ht],[xx-3,yy-ht-7],[xx+10,yy-ht+1],[xx,yy-ht+6]],top);poly(c,[[xx,yy-ht+6],[xx+10,yy-ht+1],[xx+12,yy],[xx,yy+5]],'#727a68');
        if(kind==='ore'||kind==='copper'||kind==='crystal'){c.fillStyle=kind==='crystal'?'#9fddcf':kind==='ore'?'#b37956':'#d29b69';for(let j=0;j<3;j++)c.fillRect(xx-5+j*4,yy-ht+j*4,4,4);}}
    }else if(kind==='berry'){
      shadow(c,x,y,15,5);for(let i=0;i<5;i++){c.fillStyle=i%2?'#688044':'#4c683e';c.fillRect(x-17+i*6,y-12-hash(i,3,variant)*10,12,16);}for(let i=0;i<8;i++){c.fillStyle=i%2?'#c79d85':'#c07a6e';c.fillRect(x-12+hash(i,2,variant)*24,y-14+hash(i,4,variant)*8,3,3);}
    }else if(kind==='deer'||kind==='boar'){
      const boar=kind==='boar';shadow(c,x,y,15,5);c.fillStyle=boar?'#62584b':'#b89966';c.fillRect(x-13,y-18,24,12);c.fillStyle=boar?'#48483e':'#816d4c';c.fillRect(x-10,y-7,3,8);c.fillRect(x+6,y-7,3,8);c.fillStyle=boar?'#716857':'#c2a674';c.fillRect(x+8,y-24,9,12);c.fillRect(x+13,y-20,7,6);c.fillStyle='#242c26';c.fillRect(x+14,y-22,2,2);if(!boar){c.fillStyle='#c3ba91';c.fillRect(x+8,y-34,2,12);c.fillRect(x+4,y-34,5,2);c.fillRect(x+11,y-30,6,2);}
    }
    this.atlas.set(id,canvas);return canvas;
  }
  ground(type:number,variant:number){
    const id=`ground:${type}:${variant}`;if(this.atlas.has(id))return this.atlas.get(id)!;
    const canvas=document.createElement('canvas');canvas.width=48;canvas.height=24;const c=canvas.getContext('2d')!;
    const colors=[['#3a6461','#416e66','#38645f','#3f6b65','#4b7269'],['#999c69','#a4a777','#a5a97a','#969d6a','#a5a47a'],['#6b814b','#73894f','#768950','#6e824c','#71834c'],['#7d8851','#7b824d','#858b51','#818952','#7a844b'],['#555d52','#596157','#505950','#5b6358','#565e52']];
    poly(c,[[24,0],[48,12],[24,24],[0,12]],colors[type][variant]);
    for(let i=0;i<7;i++){const x=hash(i,variant,type)*24+12,y=hash(i,variant+9,type)*8+8;c.fillStyle=i%3?'#344c3026':'#c5c99535';c.fillRect(Math.floor(x),Math.floor(y),2+i%3,1);}
    this.atlas.set(id,canvas);return canvas;
  }
  drawBuilding(c:Ctx,b:Building,x:number,y:number,t:number){
    const type=b.type;
    if(type==='floor'){box(c,x,y,23,11,3,'#8d805c','#5b513e','#706249');for(let j=-2;j<3;j++){c.strokeStyle='#514d3a66';c.beginPath();c.moveTo(x-21+j*4,y-2+j*2);c.lineTo(x+j*4,y+9-j*2);c.stroke();}return;}
    shadow(c,x,y,21,7);
    if(type==='wall'){box(c,x,y,23,11,35,'#a59469','#756248','#574c39');for(let j=0;j<4;j++){c.fillStyle='#3b382a55';c.fillRect(x,y-30+j*8,22,1);}return;}
    if(type==='campfire'){
      box(c,x,y,13,7,3,'#8d8d75','#62634f','#525a48');c.save();c.globalCompositeOperation='screen';const g=c.createRadialGradient(x,y-7,2,x,y-7,36);g.addColorStop(0,'#ecae4055');g.addColorStop(1,'#ecae4000');c.fillStyle=g;c.fillRect(x-36,y-43,72,72);c.restore();c.fillStyle='#55422d';c.fillRect(x-10,y-4,20,5);const flicker=Math.sin(t*.012)*3;poly(c,[[x-8,y-4],[x-6,y-18],[x-1,y-13],[x+2,y-27-flicker],[x+7,y-15],[x+9,y-3]],'#d88640');poly(c,[[x-4,y-4],[x+1,y-19],[x+6,y-3]],'#f5cc68');return;
    }
    if(type==='belt'){
      box(c,x,y,23,10,4,'#77795e','#444e40','#3e493d');box(c,x,y-3,19,7,1,'#4c5345','#3d493d','#343f34');const [dx,dy]=[[1,0],[0,1],[-1,0],[0,-1]][b.direction];
      const phase=(t/900)%1;for(let i=-1;i<2;i++){const f=(i+phase)/2,xx=x+(dx-dy)*12*f,yy=y-4+(dx+dy)*6*f;c.fillStyle='#afaa70';c.fillRect(xx-2,yy-1,4,2);}
    }else if(type==='chest'){box(c,x,y,17,9,17,'#b69a66','#8a714b','#695b40');c.fillStyle='#514d38';c.fillRect(x-2,y-12,4,8);}
    else if(type==='furnace'){box(c,x,y,18,10,26,'#999583','#716f60','#555c51');box(c,x+5,y-23,7,4,20,'#797c6e','#585e53','#414d43');c.fillStyle='#303c34';c.fillRect(x-12,y-17,13,12);c.fillStyle=(b.buffer.coal||0)>0?'#e7a64e':'#72533b';c.fillRect(x-10,y-12,9,7);for(let i=0;i<3;i++){c.fillStyle='#d0c8a521';c.fillRect(x+2+Math.sin(t*.001+i)*4,y-48-((t*.01+i*12)%26),5,5);}}
    else if(type==='drill'){box(c,x,y,19,10,8,'#959577','#626a59','#444f42');box(c,x-3,y-8,8,5,22,'#d1ba6e','#9b8952','#716644');c.fillStyle='#414b3d';c.fillRect(x+2,y-37,5,34);c.fillStyle='#a5ac8b';c.fillRect(x-6,y-38,22,5);c.fillRect(x+12,y-35,4,25);c.fillStyle='#c8bd80';c.fillRect(x+11,y-16+Math.sin(t*.01)*3,6,4);}
    else if(type==='beacon'){box(c,x,y,17,9,9,'#a0a794','#667568','#536558');box(c,x,y-9,7,4,33,'#8bbbad','#719588','#546e65');poly(c,[[x,y-59],[x+8,y-48],[x,y-38],[x-8,y-48]],'#b2e2c6');}
    else if(type==='rocket'){box(c,x,y,23,12,8,'#8c9382','#596453','#404e44');c.fillStyle='#c4c6ac';c.fillRect(x-9,y-66,18,59);poly(c,[[x-9,y-66],[x,y-86],[x+9,y-66]],'#d6d3b8');c.fillStyle='#436d70';c.fillRect(x-5,y-57,10,12);poly(c,[[x-9,y-29],[x-19,y-5],[x-9,y-8]],'#ba985c');poly(c,[[x+9,y-29],[x+19,y-5],[x+9,y-8]],'#ba985c');}
    else{box(c,x,y,20,11,23,'#7c907c','#556b5e','#3e574b');box(c,x,y-23,12,7,8,'#b8ae7d','#877f5a','#666b4e');c.fillStyle='#d0bb76';c.fillRect(x-12,y-15,5,4);c.fillStyle='#b6d398';c.fillRect(x-5,y-12,3,3);}
    if(Object.values(b.buffer).some(n=>n&&n>0)){c.fillStyle='#dac17e';c.fillRect(x-3,y-8,6,4);}
  }
  draw(t:number){
    const c=this.ctx,g=this.game,p=g.state.player,z=p.z, zoom=this.zoom;c.fillStyle=z?'#242b29':'#344432';c.fillRect(0,0,this.width,this.height);c.save();c.translate(this.width/2,this.height*.49);c.scale(zoom,zoom);
    const radius=Math.min(42,Math.ceil((this.width/zoom/W+this.height/zoom/H)/2)+3),px=Math.floor(p.x),py=Math.floor(p.y);
    const visible:{x:number;y:number;sx:number;sy:number}[]=[];
    for(let sum=-radius*2;sum<=radius*2;sum++)for(let a=-radius;a<=radius;a++){
      const b=sum-a;if(b< -radius||b>radius)continue;const x=px+a,y=py+b,dx=x-p.x,dy=y-p.y,sx=(dx-dy)*W/2,sy=(dx+dy)*H/2;
      if(sx< -this.width/zoom/2-70||sx>this.width/zoom/2+70||sy< -this.height/zoom*.49-10||sy>this.height/zoom*.51+130)continue;
      visible.push({x,y,sx,sy});const tile=g.tile(x,y),v=tile.variant;
      c.drawImage(this.ground(tile.type,v),Math.round(sx-24),Math.round(sy));
      if(tile.type===0){c.strokeStyle='#9cbb9833';c.beginPath();const dy2=Math.sin(t*.001+v)*1.5;c.moveTo(sx-9,sy+11+dy2);c.lineTo(sx+6,sy+11+dy2);c.stroke();}
      const build=g.building(x,y);if(build?.type==='floor'||build?.type==='belt')this.drawBuilding(c,build,sx,sy+12,t);
    }
    if(g.cursor){const cr=g.cursor,dx=delta(cr.x,p.x),dy=delta(cr.y,p.y),sx=(dx-dy)*24,sy=(dx+dy)*12;poly(c,[[sx,sy],[sx+24,sy+12],[sx,sy+24],[sx-24,sy+12]],'#edcf8738');c.strokeStyle='#e4c780';c.lineWidth=1;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+24,sy+12);c.lineTo(sx,sy+24);c.lineTo(sx-24,sy+12);c.closePath();c.stroke();}
    const entities:{depth:number;draw:()=>void}[]=[];
    for(const v of visible){const b=g.building(v.x,v.y),obj=g.object(v.x,v.y);if(b&&b.type!=='floor'&&b.type!=='belt')entities.push({depth:v.x+v.y+1,draw:()=>this.drawBuilding(c,b,v.sx,v.sy+12,t)});
      if(obj&&(!b||b.type==='drill'))entities.push({depth:v.x+v.y+.95,draw:()=>{const img=this.sprite(obj,g.tile(v.x,v.y).variant);const obscures=Math.abs(v.sx)<27&&v.sy>0&&v.sy<85;c.globalAlpha=obscures&&obj==='tree'?.4:1;c.drawImage(img,Math.round(v.sx-64),Math.round(v.sy+12-140));c.globalAlpha=1;}});}
    if(z===0)for(const a of g.animals){const dx=delta(a.x,p.x),dy=delta(a.y,p.y),sx=(dx-dy)*24,sy=(dx+dy)*12;if(Math.abs(sx)<this.width/zoom/2+50&&Math.abs(sy)<this.height/zoom/2+50)entities.push({depth:p.x+dx+p.y+dy,draw:()=>c.drawImage(this.sprite(a.kind?'boar':'deer',0),sx-64,sy-140)});}
    entities.push({depth:p.x+p.y,draw:()=>{shadow(c,0,0,9,4);const walking=g.keys.size>0||g.target;const bob=walking?Math.sin(t*.014)*1:0;c.fillStyle='#303d34';c.fillRect(-5,-10,4,10+bob);c.fillRect(2,-10,4,10-bob);c.fillStyle='#d7c99a';c.fillRect(-7,-24,14,15);c.fillStyle='#9b7d50';c.fillRect(-8,-22,4,14);c.fillStyle='#d7b48a';c.fillRect(-5,-34,10,10);c.fillStyle='#55543d';c.fillRect(-6,-37,12,5);c.fillStyle='#7b7e52';c.fillRect(-9,-32,17,3);c.fillStyle='#65563c';c.fillRect(6,-20,8,11);c.fillStyle='#c6ccc1';c.fillRect(13,-27,3,18);c.fillRect(9,-28,13,3);}});
    entities.sort((a,b)=>a.depth-b.depth);entities.forEach(e=>e.draw());
    c.restore();
    const day=(g.state.seconds%1200)/1200,night=g.state.rules.daylight==='night'? .42:g.state.rules.daylight==='day'?0:Math.max(0,Math.sin(day*Math.PI*2-Math.PI/2))*.36;
    if(night||z){c.fillStyle=`rgba(12,21,32,${z?.28:night})`;c.fillRect(0,0,this.width,this.height);}
    const vignette=c.createRadialGradient(this.width*.5,this.height*.48,this.height*.15,this.width*.5,this.height*.5,Math.max(this.width,this.height)*.65);vignette.addColorStop(0,'#101d1300');vignette.addColorStop(1,'#101d1370');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
    this.frame++;
  }
  minimap(canvas:HTMLCanvasElement){const c=canvas.getContext('2d')!,g=this.game,mk=`${g.state.seed}:${g.state.player.z}:${g.change}`;if(!this.mapCache||this.mapKey!==mk){this.mapCache=document.createElement('canvas');this.mapCache.width=this.mapCache.height=SIZE;this.mapKey=mk;const m=this.mapCache.getContext('2d')!;for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const tile=g.tile(x,y);m.fillStyle=['#355e60','#a5a17a','#77845a','#858859','#596057'][tile.type];m.fillRect(x,y,1,1);if(g.object(x,y)==='tree'){m.fillStyle='#44583e';m.fillRect(x,y,1,1);}}for(const b of Object.values(g.state.buildings))if(b.z===g.state.player.z){m.fillStyle='#d6b779';m.fillRect(b.x,b.y,2,2);}}
    if(canvas.width!==SIZE)canvas.width=canvas.height=SIZE;c.drawImage(this.mapCache,0,0);c.fillStyle='#f5e5b6';c.fillRect(g.state.player.x-1,g.state.player.y-1,3,3);
  }
}
