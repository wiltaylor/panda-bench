const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const game = document.querySelector('#game');
const intro = document.querySelector('#intro');
const play = document.querySelector('#play');
const title = document.querySelector('#title');
const hint = document.querySelector('#intro-hint');
const touch = matchMedia('(pointer:coarse)').matches;
if (touch) hint.textContent = 'Joystick to move · Drag the world to look';

const types = {
  grass: ['#89aa50','#657f39','#51442e'],
  dirt: ['#a27d51','#886642','#62482f'],
  stone: ['#9b9b82','#7f8170','#626655'],
  wood: ['#d4ad68','#8a633a','#68462d'],
  leaf: ['#83a748','#547a37','#3c5e31'],
  bamboo: ['#aab959','#728e3a','#546b33'],
  cream: ['#fff2cf','#e3dcbf','#b6b69d'],
  black: ['#3e4641','#303834','#222c29'],
  gold: ['#ffe188','#e8a23d','#c07a32'],
  white: ['#ffffff','#fff6df','#e1ddc8']
};
const key = (x,y,z) => `${x},${y},${z}`;
const random = (x,z) => {
  const value = Math.sin(x * 125.7 + z * 81.29) * 43758.5453;
  return value - Math.floor(value);
};
let blocks, pandas, shots, player, selected, counts, defeated;
const trees = [[-12,-1],[-8,4],[-13,9],[-5,12],[10,7],[13,-2],[2,18],[15,16],[-14,18],[7,22]];
const bamboo = [[-6,-2],[-6.4,-1.5],[-5.8,-1.3],[7,3],[7.4,3.3],[7.7,2.7],[-6,10],[-6.4,10.4],[6,16],[6.7,16.4]];
function reset() {
  blocks = new Map();
  const heightMap = new Map();
  for (let x=-18; x<=18; x++) for (let z=-16; z<=26; z++) {
    const hill = Math.max(0, Math.abs(x)-6) * .28 + Math.max(0,z-10)*.24;
    const h = Math.max(0, Math.floor(hill + Math.sin(x*.44+z*.22)*.95 + Math.cos(z*.38)*.85));
    heightMap.set(key(x,0,z),h);
    for (let y=-2; y<=h; y++) blocks.set(key(x,y,z), y===h ? 'grass' : y===-2 ? 'stone' : 'dirt');
  }
  for (const [x,z] of trees) {
    const h = heightMap.get(key(x,0,z));
    const tall = 4 + Math.floor(random(x,z)*3);
    for (let i=1;i<=tall;i++) blocks.set(key(x,h+i,z),'wood');
    for (let a=-2;a<=2;a++) for (let b=-2;b<=2;b++) for (let c=0;c<=2;c++) {
      if (Math.abs(a)+Math.abs(b)+c<5 && (c!==0 || a!==0 || b!==0)) blocks.set(key(x+a,h+tall+c,z+b),'leaf');
    }
  }
  pandas = [[4,-1],[-4,8],[8,12],[-1,18]].map(([x,z],i)=>({x,z,y:ground(x,z)+1,hp:3,wait:2+i*.9,flash:0}));
  shots = [];
  player = {x:0,z:-8.5,y:2.65,yaw:.08,pitch:-.07,velocity:0,hp:5,guard:0,swing:0,hurt:0};
  selected=0;
  counts=[0,0,24,16,12];
  defeated=0;
  updateHUD();
}
const items=['Wooden sword','Wooden shield','Grass block','Stone block','Wood block'];
const materials=[null,null,'grass','stone','wood'];
const icons=[
  '<path fill="#dcb47b" d="M18 2h7v7h-4v4h-4v4h-4v-4h3V9h2z"/><path fill="#a77649" d="M7 13h5v4h5v4h-4v-3h-2v5H7v4H3v-4h3v-5h3v-2H7z"/>',
  '<path fill="#e1b677" d="M5 3h18v14h-3v5h-4v4h-4v-4H8v-5H5z"/><path fill="#92613d" d="M8 6h12v11h-4v6h-4v-6H8z"/><path fill="#e1b677" d="M12 8h4v10h-4z"/>',
  ...[['#a2bf5b','#657f3e','#87613d'],['#adad96','#858678','#686a5c'],['#deb576','#a97943','#805430']].map(([a,b,c])=>`<path fill="${a}" d="M2 7l12-5 12 5-12 6z"/><path fill="${b}" d="M2 7l12 6v13L2 20z"/><path fill="${c}" d="M14 13l12-6v13l-12 6z"/>`)
];
const slots = document.querySelector('#slots');
items.forEach((item,index)=>{
  const button=document.createElement('button');
  button.className='slot';
  button.setAttribute('aria-label',item);
  button.innerHTML=`<small>${index+1}</small><svg viewBox="0 0 28 28" aria-hidden="true">${icons[index]}</svg><b></b>`;
  button.onclick=()=>equip(index);
  slots.append(button);
});
function equip(index) {
  selected=index;
  updateHUD();
}
function updateHUD() {
  document.querySelector('#equipped').textContent=items[selected].toUpperCase();
  document.querySelector('#hearts').textContent=Array.from({length:5},(_,i)=>i<player.hp?'♥':'♡').join(' ');
  document.querySelector('#hearts').setAttribute('aria-label',`Health ${player.hp} of 5`);
  document.querySelector('#threat').textContent=defeated===4?'Valley secured':defeated?`${4-defeated} pandas left`:'Pandas nearby';
  Array.from(slots.children).forEach((slot,i)=>{
    slot.classList.toggle('selected',i===selected);
    slot.setAttribute('aria-pressed',i===selected);
    slot.querySelector('b').textContent=i>=2?counts[i]:'';
  });
}
function ground(x,z,ceiling=Infinity) {
  const a=Math.floor(x), b=Math.floor(z);
  for(let y=12;y>=-2;y--) if(y+1<=ceiling && blocks.has(key(a,y,b))) return y;
  return -3;
}
const faces=[
  {d:[0,1,0],c:[[0,1,0],[1,1,0],[1,1,1],[0,1,1]],shade:1,tone:0},
  {d:[0,0,-1],c:[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],shade:1,tone:1},
  {d:[0,0,1],c:[[1,0,1],[0,0,1],[0,1,1],[1,1,1]],shade:.94,tone:1},
  {d:[-1,0,0],c:[[0,0,1],[0,0,0],[0,1,0],[0,1,1]],shade:.93,tone:2},
  {d:[1,0,0],c:[[1,0,0],[1,0,1],[1,1,1],[1,1,0]],shade:1,tone:2},
  {d:[0,-1,0],c:[[0,0,1],[1,0,1],[1,0,0],[0,0,0]],shade:.78,tone:2}
];
const palette={};
function color(type,tone,shade,fog) {
  const base=types[type][tone];
  if (!palette[base]) palette[base]=[1,3,5].map(i=>parseInt(base.slice(i,i+2),16));
  return `rgb(${palette[base].map((n,i)=>Math.round(n*shade*(1-fog)+[143,185,166][i]*fog)).join(',')})`;
}
let w,h,focal,cam,cy,sy,cp,sp,polys;
function cameraPoint(x,y,z) {
  const dx=x-cam.x, dz=z-cam.z, up=y-cam.y;
  const forward=dx*sy+dz*cy;
  return [dx*cy-dz*sy,up*cp-forward*sp,forward*cp+up*sp];
}
function polygon(points,fill,texture,outline) {
  if(points.every(p=>p[2]<.12)) return;
  const clipped=[];
  for(let i=0;i<points.length;i++){
    const a=points[i], b=points[(i+1)%points.length];
    if(a[2]>=.12) clipped.push(a);
    if((a[2]<.12)!==(b[2]<.12)){
      const t=(.12-a[2])/(b[2]-a[2]);
      clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.12]);
    }
  }
  const screen=clipped.map(([x,y,z])=>[w/2+x/z*focal,h/2-y/z*focal]);
  if(screen.every(p=>p[0]<0)||screen.every(p=>p[0]>w)||screen.every(p=>p[1]<0)||screen.every(p=>p[1]>h)) return;
  polys.push({screen,fill,texture,outline,depth:points.reduce((sum,p)=>sum+p[2],0)/points.length});
}
function box(x,y,z,a,b,c,type,terrain=false,outline=false) {
  const dist=Math.hypot(x-cam.x,z-cam.z);
  const fog=Math.min(.72,Math.max(0,(dist-9)/43));
  const noise=random(x+y*.93,z+y*.73);
  for(const face of faces){
    const [dx,dy,dz]=face.d;
    const facing=dx*(cam.x-(dx>0?x+a:x))+dy*(cam.y-(dy>0?y+b:y))+dz*(cam.z-(dz>0?z+c:z));
    if(facing<=0 || (terrain && blocks.has(key(x+dx,y+dy,z+dz)))) continue;
    const shade=face.shade*(terrain?.91+noise*.16:1);
    const corners=face.c.map(([i,j,k])=>cameraPoint(x+i*a,y+j*b,z+k*c));
    polygon(corners,color(type,face.tone,shade,fog),terrain&&dist<23&&face.tone<2?noise:null,outline);
  }
}
function panda(p) {
  const {x,y,z}=p;
  const fur=p.flash>0?'white':'cream';
  box(x-.48,y+.3,z-.42,.96,.64,.9,fur);
  for(const a of [-.45,.2]) for(const b of [-.38,.28]) box(x+a,y,z+b,.25,.45,.25,'black');
  box(x-.48,y+.69,z-.73,.96,.74,.66,fur);
  for(const a of [-.48,.26]) box(x+a,y+1.32,z-.64,.23,.27,.25,'black');
  for(const a of [-.35,.13]) {
    box(x+a,y+1.00,z-.759,.22,.22,.037,'black');
    box(x+a+.06,y+1.12,z-.778,.067,.067,.022,'white');
  }
  box(x-.20,y+.81,z-.84,.40,.23,.18,fur);
  box(x-.10,y+.95,z-.889,.20,.10,.068,'black');
}
function pineapple(x,y,z,s=.24) {
  box(x-s/2,y,z-s/2,s,s*1.16,s,'gold');
  box(x-s*.22,y+s*1.16,z-s*.22,s*.44,s*.64,s*.44,'leaf');
}
function bambooStalk(x,z) {
  const y=ground(x,z)+1;
  const sections=3+Math.floor(random(x,z)*3);
  for(let i=0;i<sections;i++){
    box(x,y+i*.63,z,.12,.63,.12,'bamboo');
    box(x-.022,y+i*.63+.56,z-.022,.164,.065,.164,'leaf');
    if(i>=2){
      const side=i%2?-.31:.10;
      box(x+side,y+i*.63+.41,z,.34,.10,.15,'leaf');
      box(x+side+(i%2?-.17:.26),y+i*.63+.49,z,.24,.08,.14,'leaf');
    }
  }
}
function backdrop() {
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#76aaa1');sky.addColorStop(.58,'#c4d4ac');sky.addColorStop(1,'#a2b583');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const horizon=h/2+Math.tan(cam.pitch)*focal;
  const shift=cam.yaw*w*.26;
  ctx.fillStyle='#f4dc9b';
  ctx.fillRect(w*.76-shift,horizon-h*.31,h*.085,h*.085);
  for(let layer=0;layer<3;layer++){
    ctx.fillStyle=['#a7c4a8','#89ad98','#739d87'][layer];
    const step=w/27;
    ctx.beginPath();ctx.moveTo(0,h);
    for(let i=-1;i<29;i++){
      const height=(.06+random(i,layer+34)*.14)*h;
      const y=horizon+layer*h*.036-height;
      ctx.lineTo(i*step,y);ctx.lineTo((i+1)*step,y);
    }
    ctx.lineTo(w,h);ctx.fill();
  }
  ctx.fillStyle='#fff2ca42';
  for(let i=0;i<7;i++){
    const x=((i*w*.193-shift+w*3)%(w*1.16))-.1*w;
    const y=horizon-h*(.20+random(i,39)*.22);
    ctx.fillRect(x,y,h*.16,h*.019);ctx.fillRect(x+h*.04,y-h*.015,h*.085,h*.02);
  }
}
function render(time) {
  cam=started?player:{x:-1.4,y:3.9,z:-9,yaw:.12,pitch:-.13};
  cy=Math.cos(cam.yaw);sy=Math.sin(cam.yaw);cp=Math.cos(cam.pitch);sp=Math.sin(cam.pitch);
  focal=Math.max(h*.82,w*.57);
  backdrop();
  polys=[];
  const aim=started&&!paused?target().block:null;
  for(const [id,type] of blocks){
    const [x,y,z]=id.split(',').map(Number);
    if(Math.abs(x-cam.x)>34||Math.abs(z-cam.z)>36) continue;
    box(x,y,z,1,1,1,type,true,aim?.id===id);
  }
  for(const p of pandas) if(p.hp>0) panda(p);
  for(const [x,z] of bamboo) bambooStalk(x,z);
  for(const s of shots) pineapple(s.x,s.y,s.z);
  if(!started){
    const y=2.13+Math.sin(time*.0025)*.19;
    pineapple(3.2,y,-2.8,.42);
    pineapple(6.05,1.12,0,.25);
  }
  polys.sort((a,b)=>b.depth-a.depth);
  for(const {screen,fill,texture,outline} of polys){
    ctx.beginPath();screen.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=fill;ctx.lineWidth=1;ctx.stroke();
    if(texture!==null&&screen.length===4){
      const [a,b,c,d]=screen;
      const point=(u,v)=>[(a[0]*(1-u)+b[0]*u)*(1-v)+(d[0]*(1-u)+c[0]*u)*v,(a[1]*(1-u)+b[1]*u)*(1-v)+(d[1]*(1-u)+c[1]*u)*v];
      for(let i=0;i<5;i++){
        const u=.08+random(i,texture)*.70,v=.07+random(texture,i)*.73;
        ctx.beginPath();[[u,v],[u+.12,v],[u+.12,v+.08],[u,v+.08]].forEach(([j,k],n)=>n?ctx.lineTo(...point(j,k)):ctx.moveTo(...point(j,k)));
        ctx.fillStyle=i%2?'#fff3b622':'#1a392521';ctx.fill();
      }
    }
    if(outline){ctx.strokeStyle='#ffedaa';ctx.lineWidth=2;ctx.stroke();}
  }
  if(started&&!paused) drawTool();
}
function drawTool(){
  const square= Math.min(w,h)*.007;
  ctx.save();
  ctx.translate(w*.77-player.swing*110,h*.83+player.swing*35);
  ctx.rotate(-.29-player.swing*1.5);
  ctx.scale(square,square);
  if(selected===0){
    ctx.fillStyle='#4e392a';ctx.fillRect(-2,-2,4,20);ctx.fillRect(-7,-4,14,4);
    ctx.fillStyle='#d4a86f';ctx.fillRect(-3,-29,6,26);ctx.fillRect(-2,-32,4,4);
    ctx.fillStyle='#f0cc8f';ctx.fillRect(-3,-29,2,24);
  } else if(selected===1){
    ctx.fillStyle='#d8b075';ctx.fillRect(-11,-16,22,23);ctx.fillRect(-8,7,16,5);
    ctx.fillStyle='#886140';ctx.fillRect(-8,-13,16,20);ctx.fillStyle='#e0bb7e';ctx.fillRect(-2,-12,4,18);
  } else {
    ctx.fillStyle=types[materials[selected]][1];ctx.fillRect(-9,-8,19,17);
    ctx.fillStyle=types[materials[selected]][0];ctx.fillRect(-9,-12,19,6);
  }
  ctx.restore();
  if(player.guard>0){ctx.strokeStyle='#f9d48c99';ctx.lineWidth=8;ctx.strokeRect(0,0,w,h);}
  if(player.hurt>0){ctx.fillStyle=`rgba(207,50,28,${player.hurt*.42})`;ctx.fillRect(0,0,w,h);}
}
function direction() {
  return [Math.sin(player.yaw)*Math.cos(player.pitch),Math.sin(player.pitch),Math.cos(player.yaw)*Math.cos(player.pitch)];
}
function target() {
  const [dx,dy,dz]=direction();
  let previous=null;
  for(let d=.05;d<6;d+=.05){
    const x=player.x+dx*d,y=player.y+dy*d,z=player.z+dz*d;
    const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),id=key(a,b,c);
    if(blocks.has(id)) return {block:{id,a,b,c},previous};
    const hit=pandas.find(p=>p.hp>0&&Math.abs(x-p.x)<.59&&Math.abs(z-p.z)<.77&&y>p.y&&y<p.y+1.58);
    if(hit) return {panda:hit,distance:d};
    previous={id,a,b,c};
  }
  return {};
}
let started=false,paused=false,ended=false,noticeTimer;
const keys=new Set();
const movement={x:0,y:0};
const feedback=document.querySelector('#feedback');
function notify(message) {
  feedback.textContent=message;
  clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>feedback.textContent='',1400);
}
function primary() {
  if(!started||paused) return;
  player.swing=.25;
  const hit=target();
  if(hit.panda&&hit.distance<3.8){
    const p=hit.panda;
    p.hp-=selected===0?2:1;
    p.flash=.2;
    if(p.hp<=0){defeated++;updateHUD();notify('Panda chased away');if(defeated===4) finish(true);}
  } else if(hit.block){
    const type=blocks.get(hit.block.id);
    blocks.delete(hit.block.id);
    const item=materials.indexOf(type==='dirt'||type==='leaf'?'grass':type);
    if(item>=2) counts[item]++;
    updateHUD();
  }
}
function secondary() {
  if(!started||paused) return;
  if(selected===1){player.guard=1.1;notify('Shield raised');return;}
  if(selected===0){
    notify('Equip the shield to block');
    return;
  }
  const hit=target();
  if(!hit.block||!hit.previous) return;
  if(!counts[selected]){notify('Out of blocks');return;}
  const {id,a,b,c}=hit.previous;
  if(Math.abs(player.x-a-.5)<.75&&Math.abs(player.z-c-.5)<.75&&b<player.y&&b+1>player.y-1.65) return;
  blocks.set(id,materials[selected]);
  counts[selected]--;
  updateHUD();
}
function collides(x,y,z) {
  for(const a of [x-.2,x+.2]) for(const c of [z-.2,z+.2]) for(const b of [y-1.57,y-.75,y+.08])
    if(blocks.has(key(Math.floor(a),Math.floor(b),Math.floor(c)))) return true;
  return false;
}
function jump(){
  if(started&&!paused&&player.y<=ground(player.x,player.z,player.y-1.55)+2.67&&player.velocity===0) player.velocity=6.3;
}
function update(dt) {
  if(!started||paused) return;
  const p=player;
  p.swing=Math.max(0,p.swing-dt);
  p.guard=Math.max(0,p.guard-dt);
  p.hurt=Math.max(0,p.hurt-dt);
  if(keys.has('arrowleft')) p.yaw-=dt*1.8;
  if(keys.has('arrowright')) p.yaw+=dt*1.8;
  if(keys.has('arrowup')) look(0,-dt*250);
  if(keys.has('arrowdown')) look(0,dt*250);
  const side=Number(keys.has('d'))-Number(keys.has('a'))+movement.x;
  const forward=Number(keys.has('w'))-Number(keys.has('s'))-movement.y;
  const speed=dt*4.6/Math.max(1,Math.hypot(side,forward));
  const dx=(side*Math.cos(p.yaw)+forward*Math.sin(p.yaw))*speed;
  const dz=(forward*Math.cos(p.yaw)-side*Math.sin(p.yaw))*speed;
  if(Math.abs(p.x+dx)<18&&!collides(p.x+dx,p.y,p.z)) p.x+=dx;
  if(p.z+dz>-15.7&&p.z+dz<26&&!collides(p.x,p.y,p.z+dz)) p.z+=dz;
  p.velocity-=dt*17;
  const next=p.y+p.velocity*dt;
  const floor=ground(p.x,p.z,p.y-1.60)+2.65;
  if(p.velocity<=0&&next<=floor){p.y=floor;p.velocity=0;}
  else if(p.velocity>0&&collides(p.x,next,p.z)){p.velocity=0;}
  else p.y=next;
  for(const animal of pandas){
    if(animal.hp<=0) continue;
    animal.flash=Math.max(0,animal.flash-dt);
    const dx=p.x-animal.x,dz=p.z-animal.z,distance=Math.hypot(dx,dz);
    if(distance<13&&distance>3.0){
      const x=animal.x+dx/distance*dt*1.05,z=animal.z+dz/distance*dt*1.05;
      const y=ground(x,z)+1;
      if(Math.abs(y-animal.y)<=1){animal.x=x;animal.z=z;animal.y=y;}
    }
    animal.wait-=dt;
    if(animal.wait<=0&&distance<14){
      const y=animal.y+1.28,t=Math.max(.35,distance/8);
      shots.push({x:animal.x,y,z:animal.z,vx:dx/t,vz:dz/t,vy:(p.y-.3-y)/t+3*t,ttl:3});
      animal.wait=2.4+random(animal.x,animal.z)*1.7;
    }
  }
  shots=shots.filter(s=>{
    s.ttl-=dt;s.x+=s.vx*dt;s.z+=s.vz*dt;s.y+=s.vy*dt;s.vy-=6*dt;
    if(s.ttl<0||blocks.has(key(Math.floor(s.x),Math.floor(s.y),Math.floor(s.z)))) return false;
    if(Math.hypot(s.x-p.x,s.z-p.z)<.52&&s.y>p.y-1.58&&s.y<p.y+.2){
      if(p.guard>0) notify('Pineapple blocked');
      else if(p.hurt===0){p.hp--;p.hurt=.34;updateHUD();if(!p.hp)finish(false);}
      return false;
    }
    return true;
  });
}
function showMenu(state) {
  paused=true;
  intro.hidden=false;
  game.classList.remove('playing');
  keys.clear();
  movement.x=movement.y=0;
  document.querySelector('#knob').style.transform='';
  if(document.pointerLockElement===canvas) document.exitPointerLock();
  title.textContent=state;
  title.classList.add('status-title');
  play.innerHTML=`${ended?'PLAY AGAIN':'RESUME'} <span>↗</span>`;
  intro.querySelector('p').textContent=ended
    ? (player.hp?'You chased every panda out of the valley.':'The pandas took the valley. Give it another go.')
    : (touch?'Drag to look. Use the joystick to move. Tap a slot to equip a tool.':'WASD to move, Space to jump, mouse to look. Left click to hit or break, right click to place a block or raise the shield.');
}
function finish(won) {ended=true;showMenu(won?'VALLEY SECURED':'PINEAPPLED');}
function look(x,y) {
  player.yaw+=x*.004;
  player.pitch=Math.max(-1.43,Math.min(1.43,player.pitch-y*.004));
}
play.onclick=()=>{
  if(ended) reset();
  started=true;paused=false;ended=false;
  intro.hidden=true;game.classList.add('playing');
  canvas.focus();
  if(!touch) captureMouse();
};
document.querySelector('#help').onclick=()=>{
  if(started&&!paused) showMenu('PAUSED');
  else if(started) play.click();
  else notify(touch?'Drag to look · Tap a slot to equip':'WASD · Space to jump · 1–5 to equip');
};
function captureMouse() {
  try { canvas.requestPointerLock?.()?.catch(()=>{}); } catch {}
}
document.addEventListener('keydown',e=>{
  if(!started||paused) return;
  const k=e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  keys.add(k);
  if(k===' ') jump();
  if(k>='1'&&k<='5') equip(Number(k)-1);
  if(k==='escape') showMenu('PAUSED');
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('pointerlockchange',()=>{
  if(started&&!paused&&document.pointerLockElement!==canvas) showMenu('PAUSED');
});
document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement===canvas&&!paused) look(e.movementX,e.movementY);
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
let drag=null;
canvas.addEventListener('pointerdown',e=>{
  if(!started||paused) return;
  if(e.pointerType==='touch'||document.pointerLockElement!==canvas&&e.button===0){
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,touch:e.pointerType==='touch'};
    canvas.setPointerCapture(e.pointerId);
  } else if(e.button===0) primary();
  else if(e.button===2) secondary();
});
canvas.addEventListener('pointermove',e=>{
  if(drag?.id!==e.pointerId||paused) return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)+Math.abs(dy)>2) drag.moved=true;
  look(dx,dy);drag.x=e.clientX;drag.y=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
  if(drag?.id!==e.pointerId) return;
  if(!drag.touch&&!drag.moved) primary();
  drag=null;
});
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{
  if(!started||paused) return;
  e.preventDefault();equip((selected+Math.sign(e.deltaY)+5)%5);
},{passive:false});
const stick=document.querySelector('#stick');
const knob=document.querySelector('#knob');
function moveStick(e){
  const r=stick.getBoundingClientRect();
  const x=(e.clientX-r.left-r.width/2)/35,y=(e.clientY-r.top-r.height/2)/35;
  const scale=Math.max(1,Math.hypot(x,y));
  movement.x=x/scale;movement.y=y/scale;
  knob.style.transform=`translate(${movement.x*32}px,${movement.y*32}px)`;
}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);moveStick(e);};
stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId)) moveStick(e);};
stick.onlostpointercapture=()=>{movement.x=movement.y=0;knob.style.transform='';};
const actions={jump,primary,secondary};
document.querySelectorAll('[data-action]').forEach(button=>button.onclick=actions[button.dataset.action]);
function resize(){
  const dpr=Math.min(1.5,devicePixelRatio||1);
  w=canvas.clientWidth;h=canvas.clientHeight;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',resize);
reset();
resize();
let last=performance.now();
function frame(time){
  update(Math.min(.045,(time-last)/1000));
  render(time);
  last=time;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
