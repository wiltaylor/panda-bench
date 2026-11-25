import * as THREE from './vendor/three.module.min.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const TAU = Math.PI * 2;
const key = (x, y, z) => `${x},${y},${z}`;
const random = (a, b) => a + Math.random() * (b - a);

const ui = {
  intro: $('#intro'), hud: $('#hud'), pause: $('#pause'), over: $('#game-over'), touch: $('#touch-controls'),
  health: $('#health-number'), healthFill: $('#health-fill'), guard: $('#guard-number'), guardFill: $('#guard-fill'),
  score: $('#score'), wave: $('#wave-label'), enemies: $('#enemy-count'), target: $('#target-label'), crosshair: $('#crosshair'),
  feed: $('#event-feed'), damage: $('#damage-flash'), caption: $('#block-caption'), tool: $('#tool-name'),
  dirt: $('#dirt-count'), stone: $('#stone-count'), banner: $('#wave-banner'), map: $('#minimap'),
};

const state = {
  started: false, paused: true, dead: false, health: 100, guard: 100, score: 0, wave: 1,
  selected: 0, inventory: { dirt: 24, stone: 16 }, primary: false, touchShield: false,
  blocking: false, attackCooldown: 0, mineTime: 0, mineKey: '', elapsed: 0, nextWave: 0,
  sound: true, shake: 0, hurtCooldown: 0, attackAnim: 0, blockAnim: 0, guardBroken: 0,
};
const tools = [
  { name: 'BAMBOO SWORD', sub: 'Quick & sturdy' },
  { name: 'SEED BOW', sub: 'Panda persuasion, from afar' },
  { name: 'BAMBOO SHIELD', sub: 'Hold F with any tool' },
  { name: 'EARTH BLOCK', sub: 'Right click to place', block: 'dirt' },
  { name: 'STONE BLOCK', sub: 'Right click to place', block: 'stone' },
];

// Renderer and the permanent island scene.
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.13;
$('#world').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a3dcd8');
scene.fog = new THREE.Fog('#a3dcd8', 34, 82);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.06, 160);
camera.rotation.order = 'YXZ';
scene.add(camera);
scene.add(new THREE.HemisphereLight('#e9fff1', '#557553', 2.2));
const sun = new THREE.DirectionalLight('#fff2c7', 3.1);
sun.position.set(-22, 35, 17);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
sun.shadow.camera.right = sun.shadow.camera.top = 30;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.00025;
scene.add(sun);

// A shader sky gives the island a soft horizon without remote images.
const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 12), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { top: { value: new THREE.Color('#63b7cb') }, bottom: { value: new THREE.Color('#d9eee0') } },
  vertexShader: 'varying float vY; void main(){vY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'varying float vY;uniform vec3 top;uniform vec3 bottom;void main(){float h=smoothstep(-.15,.75,vY);gl_FragColor=vec4(mix(bottom,top,h),1.);}',
}));
scene.add(sky);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: '#fff4bb', fog: false }));
sunDisc.position.set(-48, 50, -75);
sunDisc.lookAt(camera.position);
scene.add(sunDisc);

function pixelTexture(base, flecks, side = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 16, 16);
  let seed = 9127;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 68; i++) {
    ctx.fillStyle = flecks[Math.floor(rnd() * flecks.length)];
    const s = rnd() > .84 ? 2 : 1;
    ctx.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), s, s);
  }
  if (side) {
    ctx.fillStyle = '#65a844'; ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#7dbc50';
    for (let x = 0; x < 16; x += 2) ctx.fillRect(x, 2, 1, Math.floor(rnd() * 3));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const textures = {
  grass: pixelTexture('#78b94b', ['#8cc958', '#619b3d', '#a4ce64', '#507f36']),
  grassSide: pixelTexture('#8a5b35', ['#a77443', '#69462d', '#b5834d'], true),
  dirt: pixelTexture('#8a5b35', ['#a77443', '#69462d', '#b5834d', '#755035']),
  stone: pixelTexture('#87918a', ['#a4aca2', '#69766f', '#b8bbae', '#758079']),
  sand: pixelTexture('#d9ca83', ['#eee1a1', '#c0af6d', '#e5d590']),
  wood: pixelTexture('#80603a', ['#a07c47', '#654b30', '#b28a51']),
  leaves: pixelTexture('#3d884b', ['#55a358', '#2f6e40', '#72b65c', '#397c43']),
  planks: pixelTexture('#b38a50', ['#c69e60', '#94703f', '#d1ae71']),
};
function mat(texture, extra = {}) { return new THREE.MeshStandardMaterial({ map: texture, roughness: .94, ...extra }); }
const simpleMaterials = Object.fromEntries(Object.entries(textures).map(([k, v]) => [k, mat(v)]));
const grassMaterials = [mat(textures.grassSide), mat(textures.grassSide), mat(textures.grass), mat(textures.dirt), mat(textures.grassSide), mat(textures.grassSide)];
const blockMaterials = { ...simpleMaterials, grass: grassMaterials };
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blocks = new Map();
let blockMeshes = [];
const WORLD = 22;

function heightAt(x, z) {
  if (x >= 7 && x <= 13 && z >= -8 && z <= -2) return 3;
  const creek = -6 + Math.sin(z * .19) * 2;
  const d = Math.abs(x - creek);
  if (d < 1.65) return 1;
  let h = Math.floor(2.8 + Math.sin(x * .24) * .55 + Math.cos(z * .22) * .55 + Math.sin((x + z) * .31) * .3);
  if (d < 3) h = Math.min(h, 2);
  return clamp(h, 2, 4);
}
function setBlock(x, y, z, type) { blocks.set(key(x, y, z), { x, y, z, type }); }
function generateWorld() {
  for (let x = -WORLD; x <= WORLD; x++) for (let z = -WORLD; z <= WORLD; z++) {
    const h = heightAt(x, z);
    for (let y = 0; y <= h; y++) setBlock(x, y, z, y === 0 || y < h - 1 ? 'stone' : y === h ? (h <= 1 ? 'sand' : 'grass') : 'dirt');
  }
  // A tiny open-front ranger hut, built from real editable blocks.
  for (let x = 8; x <= 12; x++) for (let z = -7; z <= -3; z++) setBlock(x, 4, z, 'planks');
  for (let y = 5; y <= 6; y++) for (let x = 8; x <= 12; x++) for (let z = -7; z <= -3; z++) {
    if (x === 8 || x === 12 || z === -7 || (z === -3 && !(x === 10 && y < 7))) setBlock(x, y, z, (x === 8 || x === 12) && (z === -7 || z === -3) ? 'wood' : 'planks');
  }
  for (let x = 7; x <= 13; x++) for (let z = -8; z <= -2; z++) setBlock(x, 7, z, 'planks');
  for (let x = 8; x <= 12; x++) for (let z = -7; z <= -3; z++) if (x === 8 || x === 12 || z === -7 || z === -3) setBlock(x, 8, z, 'planks');
  const trees = [[-13,-5],[-16,8],[15,8],[6,-14],[-3,-15],[17,-11],[-17,-15],[12,14],[-13,16],[18,0]];
  trees.forEach(([x,z], n) => {
    const h = heightAt(x,z);
    for (let y = 1; y <= 4 + n % 2; y++) setBlock(x,h+y,z,'wood');
    for (let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) for(let dy=3;dy<=5;dy++) {
      if (Math.abs(dx)+Math.abs(dz)+Math.abs(dy-4) < 4 && !(dx===0&&dz===0&&dy<5)) setBlock(x+dx,h+dy,z+dz,'leaves');
    }
    setBlock(x,h+6,z,'leaves');
  });
}
generateWorld();
function rebuildBlocks() {
  blockMeshes.forEach(m => { scene.remove(m); m.dispose(); });
  blockMeshes = [];
  const byType = {};
  const neighbors=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  blocks.forEach(b => {
    if(neighbors.every(([dx,dy,dz])=>blocks.has(key(b.x+dx,b.y+dy,b.z+dz))))return;
    (byType[b.type] ||= []).push(b);
  });
  const matrix = new THREE.Matrix4();
  Object.entries(byType).forEach(([type, list]) => {
    const mesh = new THREE.InstancedMesh(blockGeometry, blockMaterials[type] || blockMaterials.dirt, list.length);
    list.forEach((b, i) => { matrix.makeTranslation(b.x,b.y,b.z); mesh.setMatrixAt(i,matrix); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.coords = list;
    mesh.userData.isBlock = true;
    mesh.castShadow = ['wood','leaves','planks'].includes(type);
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh); blockMeshes.push(mesh);
  });
}
rebuildBlocks();

const water = new THREE.Mesh(new THREE.PlaneGeometry(150,150), new THREE.MeshStandardMaterial({ color:'#53b9b5',transparent:true,opacity:.73,roughness:.25,metalness:.08 }));
water.rotation.x=-Math.PI/2; water.position.y=1.58; water.receiveShadow=true; scene.add(water);
// Blocky clouds and bamboo provide a silhouette even from the title screen.
const clouds = [];
const cloudMat = new THREE.MeshLambertMaterial({color:'#f3f3da',transparent:true,opacity:.8});
for(let i=0;i<11;i++){
  const g=new THREE.Group();
  for(let j=0;j<4;j++){const m=new THREE.Mesh(new THREE.BoxGeometry(random(3,7),random(.7,1.4),random(2,4)),cloudMat);m.position.set(j*2+random(-1,1),random(-.3,.3),random(-1,1));g.add(m);}
  g.position.set(random(-65,45),random(17,26),random(-65,25));scene.add(g);clouds.push(g);
}
const bambooMat = new THREE.MeshStandardMaterial({color:'#4f913d',roughness:.9});
const bambooLight = new THREE.MeshStandardMaterial({color:'#82ad4a',roughness:.9});
[[-11,2],[15,2],[-2,-11],[5,14],[-18,1],[18,15]].forEach(([x,z])=>{
  for(let i=0;i<5;i++){
    const bx=x+random(-1,1),bz=z+random(-1,1),ground=heightAt(Math.round(bx),Math.round(bz))+.5,h=random(3,6);
    const stalk=new THREE.Mesh(new THREE.BoxGeometry(.18,h,.18),i%2?bambooMat:bambooLight);stalk.position.set(bx,ground+h/2,bz);stalk.castShadow=true;scene.add(stalk);
    for(let j=0;j<3;j++){const leaf=new THREE.Mesh(new THREE.BoxGeometry(.75,.09,.2),bambooMat);leaf.position.set(bx+(j%2?.3:-.3),ground+h-.4-j*.45,bz);leaf.rotation.z=j%2?.4:-.4;scene.add(leaf);}
  }
});
// Small warm flowers.
const flowerMat = new THREE.MeshBasicMaterial({color:'#ffe06a',side:THREE.DoubleSide});
for(let i=0;i<42;i++){
  const x=Math.floor(random(-19,20)),z=Math.floor(random(-19,20));if(heightAt(x,z)<2)continue;
  const f=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),flowerMat);f.position.set(x+random(-.35,.35),heightAt(x,z)+.62,z+random(-.35,.35));f.rotation.x=-Math.PI/2;scene.add(f);
}

const selection = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.018,1.018,1.018)),new THREE.LineBasicMaterial({color:'#f8ffcf',transparent:true,opacity:.85,depthTest:false}));
selection.renderOrder=8;selection.visible=false;scene.add(selection);

// Player movement and voxel collision.
const player = { feet:new THREE.Vector3(0,5,10), velocity:new THREE.Vector3(), yaw:0, pitch:-.07, grounded:false, bob:0 };
const keys = {};
function surfaceAt(x,z,maxY=20){
  const xi=Math.round(x),zi=Math.round(z);let top=-5;
  for(let y=Math.min(14,Math.floor(maxY));y>=0;y--){const b=blocks.get(key(xi,y,zi));if(b){top=y+.5;break;}}
  return top;
}
function resetPlayer(){
  const y=surfaceAt(0,10)+.51;player.feet.set(0,y,10);player.velocity.set(0,0,0);player.yaw=0;player.pitch=-.055;
  camera.position.copy(player.feet).add(new THREE.Vector3(0,1.62,0));camera.rotation.set(player.pitch,player.yaw,0);
}
resetPlayer();
function collides(x,y,z){
  const r=.29;
  for(let bx=Math.floor(x-r+.5);bx<=Math.floor(x+r+.5);bx++)for(let bz=Math.floor(z-r+.5);bz<=Math.floor(z+r+.5);bz++)for(let by=Math.floor(y+.08+.5);by<=Math.floor(y+1.7+.5);by++){
    if(blocks.has(key(bx,by,bz)))return true;
  }
  return false;
}
function movePlayer(dt){
  const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0)+touchMove.y;
  const strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0)+touchMove.x;
  const moving=Math.abs(forward)+Math.abs(strafe)>.05;
  const speed=(keys.ShiftLeft||keys.ShiftRight?5.7:4.25)*(state.blocking?.58:1);
  const len=Math.max(1,Math.hypot(forward,strafe));
  const sin=Math.sin(player.yaw),cos=Math.cos(player.yaw);
  // Camera-relative basis: forward is -Z at yaw zero.
  const mx=(strafe/len*cos-forward/len*sin)*speed*dt;
  const mz=(-strafe/len*sin-forward/len*cos)*speed*dt;
  function axis(nx,nz){
    if(!collides(nx,player.feet.y,nz)){player.feet.x=nx;player.feet.z=nz;return;}
    if(player.grounded&&!collides(nx,player.feet.y+1.01,nz)){player.feet.y+=1.01;player.feet.x=nx;player.feet.z=nz;}
  }
  axis(player.feet.x+mx,player.feet.z);axis(player.feet.x,player.feet.z+mz);
  player.velocity.y-=18*dt;
  const oldY=player.feet.y,newY=oldY+player.velocity.y*dt;
  if(player.velocity.y<=0){
    let floor=-10;
    const r=.28;
    for(let bx=Math.floor(player.feet.x-r+.5);bx<=Math.floor(player.feet.x+r+.5);bx++)
      for(let bz=Math.floor(player.feet.z-r+.5);bz<=Math.floor(player.feet.z+r+.5);bz++)
        for(let by=Math.min(14,Math.floor(oldY+.2));by>=0;by--){
          if(!blocks.has(key(bx,by,bz)))continue;
          const top=by+.5;if(top<=oldY+.15&&top>=newY-.05)floor=Math.max(floor,top);
          break;
        }
    if(floor>-5){player.feet.y=floor;player.velocity.y=0;player.grounded=true;}else{player.feet.y=newY;player.grounded=false;}
  }else{if(collides(player.feet.x,newY,player.feet.z)){player.velocity.y=0;}else player.feet.y=newY;player.grounded=false;}
  if(player.feet.y<-4){damagePlayer(18);resetPlayer();}
  player.feet.x=clamp(player.feet.x,-21.4,21.4);player.feet.z=clamp(player.feet.z,-21.4,21.4);
  if(moving&&player.grounded)player.bob+=dt*10;else player.bob=lerp(player.bob,Math.round(player.bob/TAU)*TAU,dt*5);
  const bob=moving&&player.grounded?Math.sin(player.bob)*.035:0;
  const shake=state.shake>0?random(-state.shake,state.shake):0;
  camera.position.set(player.feet.x+shake,player.feet.y+1.62+bob+shake,player.feet.z+shake);
  camera.rotation.set(player.pitch+shake*.08,player.yaw,0);
}
function jump(){if(state.started&&!state.paused&&player.grounded){player.velocity.y=7;player.grounded=false;sound(180,.09,'square',.025,70);}}

// Procedural panda models.
const pandaMats={
  white:new THREE.MeshStandardMaterial({color:'#f3f0da',roughness:.9}),black:new THREE.MeshStandardMaterial({color:'#1d2927',roughness:.9}),
  nose:new THREE.MeshStandardMaterial({color:'#111b19',roughness:1}),eye:new THREE.MeshBasicMaterial({color:'#e9ffd9'}),
};
function box(parent,size,pos,material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function alertSprite(){
  const c=document.createElement('canvas');c.width=64;c.height=80;const x=c.getContext('2d');x.fillStyle='#ffdf55';x.beginPath();x.arc(32,34,25,0,TAU);x.fill();x.fillStyle='#263b2e';x.font='900 48px system-ui';x.textAlign='center';x.fillText('!',32,51);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));s.scale.set(.8,1,1);s.visible=false;return s;
}
function makePanda(x,z){
  const group=new THREE.Group();const data={group,health:100,maxHealth:100,cooldown:random(1.4,3.3),telegraph:0,walk:Math.random()*TAU,dead:false,flash:0};
  const body=box(group,[.95,1,.66],[0,1.03,0],pandaMats.white);
  box(group,[.88,.76,.74],[0,1.82,.05],pandaMats.white);
  box(group,[.3,.3,.3],[-.33,2.2,.02],pandaMats.black);box(group,[.3,.3,.3],[.33,2.2,.02],pandaMats.black);
  const ep1=box(group,[.23,.28,.05],[-.22,1.89,.431],pandaMats.black);ep1.rotation.z=-.18;
  const ep2=box(group,[.23,.28,.05],[.22,1.89,.431],pandaMats.black);ep2.rotation.z=.18;
  box(group,[.065,.075,.025],[-.21,1.91,.463],pandaMats.eye);box(group,[.065,.075,.025],[.21,1.91,.463],pandaMats.eye);
  box(group,[.19,.13,.08],[0,1.66,.46],pandaMats.nose);
  const armL=box(group,[.28,.85,.3],[-.59,1.08,.02],pandaMats.black),armR=box(group,[.28,.85,.3],[.59,1.08,.02],pandaMats.black);
  const legL=box(group,[.34,.5,.4],[-.27,.29,.04],pandaMats.black),legR=box(group,[.34,.5,.4],[.27,.29,.04],pandaMats.black);
  box(group,[.24,.24,.24],[0,.95,-.43],pandaMats.white);
  const alert=alertSprite();alert.position.set(0,2.95,0);group.add(alert);
  const bar=new THREE.Group();bar.position.set(0,2.55,0);const back=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.09),new THREE.MeshBasicMaterial({color:'#23392f',depthTest:false}));const fill=new THREE.Mesh(new THREE.PlaneGeometry(1,.055),new THREE.MeshBasicMaterial({color:'#d8ef58',depthTest:false}));fill.position.z=.005;bar.add(back,fill);bar.visible=false;group.add(bar);
  group.position.set(x,surfaceAt(x,z),z);group.traverse(o=>o.userData.panda=data);scene.add(group);
  Object.assign(data,{body,armL,armR,legL,legR,alert,bar,barFill:fill});return data;
}
let pandas=[];
function spawnWave(wave,initial=false){
  const spots=[[0,1],[4,-4],[-3,-7],[13,3],[-13,9],[7,13],[-10,-12],[16,-7]];
  const count=Math.min(3+wave-1,7);
  for(let i=0;i<count;i++){
    let [x,z]=spots[(i+(wave-1)*2)%spots.length];
    if(!initial){const a=(i/count)*TAU+Math.random();x=clamp(player.feet.x+Math.cos(a)*random(10,15),-19,19);z=clamp(player.feet.z+Math.sin(a)*random(10,15),-19,19);}
    pandas.push(makePanda(x,z));
  }
  ui.wave.textContent=`WAVE ${wave}`;ui.enemies.textContent=`${count} PANDA${count===1?'':'S'} NEARBY`;
  if(!initial){ui.banner.querySelector('strong').textContent=`WAVE ${wave}`;ui.banner.querySelector('span').textContent=`${count} pineapple enthusiasts incoming`;ui.banner.classList.remove('show');void ui.banner.offsetWidth;ui.banner.classList.add('show');toast(`<b>Wave ${wave}</b> has found you`);}
}
spawnWave(1,true);

function pineappleModel(scale=1){
  const g=new THREE.Group();
  const fruit=new THREE.Mesh(new THREE.DodecahedronGeometry(.29*scale,0),new THREE.MeshStandardMaterial({color:'#e8b93e',roughness:.72}));fruit.scale.y=1.25;fruit.castShadow=true;g.add(fruit);
  const leafMat=new THREE.MeshStandardMaterial({color:'#4f913f',roughness:1});
  for(let i=0;i<5;i++){const l=new THREE.Mesh(new THREE.ConeGeometry(.075*scale,.4*scale,4),leafMat);const a=i/5*TAU;l.position.set(Math.cos(a)*.08*scale,.35*scale,Math.sin(a)*.08*scale);l.rotation.z=Math.cos(a)*.45;l.rotation.x=Math.sin(a)*.45;g.add(l);}
  return g;
}
const projectiles=[];
function throwPineapple(p){
  const fruit=pineappleModel(1.15);fruit.position.copy(p.group.position).add(new THREE.Vector3(0,1.85,0));scene.add(fruit);
  const target=camera.position.clone().add(new THREE.Vector3(player.velocity.x,0,player.velocity.z));
  const dist=fruit.position.distanceTo(target);const velocity=target.sub(fruit.position).normalize().multiplyScalar(8.5+state.wave*.3);velocity.y+=dist*.06;
  projectiles.push({mesh:fruit,velocity,enemy:true,age:0});sound(145,.18,'sawtooth',.025,-70);
}
function shootSeed(){
  if(state.attackCooldown>0)return;state.attackCooldown=.48;state.attackAnim=1;
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.095,6,5),new THREE.MeshBasicMaterial({color:'#eff58a'}));
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);mesh.position.copy(camera.position).add(dir.clone().multiplyScalar(.65));scene.add(mesh);
  projectiles.push({mesh,velocity:dir.multiplyScalar(22),enemy:false,age:0});sound(420,.09,'square',.025,-140);
}
function damagePlayer(amount){
  if(state.hurtCooldown>0||state.dead)return;state.hurtCooldown=.3;
  state.health=clamp(state.health-amount,0,100);state.shake=.11;ui.damage.classList.add('hit');setTimeout(()=>ui.damage.classList.remove('hit'),170);sound(85,.22,'sawtooth',.05,-35);updateVitals();
  if(state.health<=0)gameOver();
}
function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];p.age+=dt;p.velocity.y-=p.enemy?2.2*dt:1.2*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*7;p.mesh.rotation.z+=dt*5;
    let remove=p.age>5;
    const pos=p.mesh.position;
    if(blocks.has(key(Math.round(pos.x),Math.round(pos.y),Math.round(pos.z)))){burst(pos,p.enemy?'#e8bb46':'#e8f18a',5,.09);remove=true;}
    if(!remove&&p.enemy&&pos.distanceTo(camera.position)<.72){
      if(state.blocking&&state.guard>0){state.guard=clamp(state.guard-17,0,100);if(state.guard===0)state.guardBroken=1.5;state.blockAnim=1;ui.caption.classList.add('show');setTimeout(()=>ui.caption.classList.remove('show'),500);sound(130,.12,'square',.06,100);burst(pos,'#d8f05a',9,.12);toast('<b>Blocked!</b> Pineapple neutralized');}
      else{damagePlayer(12+Math.min(state.wave,5));burst(pos,'#f4c34f',10,.12);}remove=true;updateVitals();
    }
    if(!remove&&!p.enemy){
      for(const panda of pandas){if(!panda.dead&&pos.distanceTo(panda.group.position.clone().add(new THREE.Vector3(0,1.3,0)))<.85){hitPanda(panda,28);burst(pos,'#d8f05a',7,.1);remove=true;break;}}
    }
    if(remove){scene.remove(p.mesh);projectiles.splice(i,1);}
  }
}
function hitPanda(panda,amount){
  if(panda.dead)return;panda.health-=amount;panda.bar.visible=true;panda.flash=.16;panda.group.scale.set(1.08,.93,1.08);sound(210,.1,'square',.035,80);updateTarget();
  if(panda.health<=0){
    panda.dead=true;burst(panda.group.position.clone().add(new THREE.Vector3(0,1,0)),'#f0eed9',18,.16);burst(panda.group.position.clone().add(new THREE.Vector3(0,1,0)),'#27372e',10,.13);
    scene.remove(panda.group);pandas=pandas.filter(p=>p!==panda);state.score++;ui.score.textContent=String(state.score).padStart(2,'0');ui.enemies.textContent=`${pandas.length} PANDA${pandas.length===1?'':'S'} NEARBY`;toast('<b>Panda bonked!</b> +5 health');state.health=clamp(state.health+5,0,100);updateVitals();sound(280,.12,'square',.04,160);
    if(!pandas.length){state.nextWave=5;toast('Island clear. <b>Next wave in 5s</b>');}
  }
}
function updatePandas(dt){
  pandas.forEach((p,index)=>{
    p.cooldown-=dt;p.flash-=dt;if(p.flash<=0)p.group.scale.lerp(new THREE.Vector3(1,1,1),dt*12);
    const dx=player.feet.x-p.group.position.x,dz=player.feet.z-p.group.position.z,dist=Math.hypot(dx,dz);
    p.group.rotation.y=Math.atan2(dx,dz);
    if(p.telegraph>0){p.telegraph-=dt;p.armR.rotation.x=-2.3;p.alert.visible=true;if(p.telegraph<=0){p.alert.visible=false;throwPineapple(p);p.cooldown=random(2.2,3.8)-Math.min(state.wave*.08,.6);}}
    else{
      p.armR.rotation.x=lerp(p.armR.rotation.x,0,dt*8);
      if(dist<18&&dist>2.3&&p.cooldown<=0){p.telegraph=.65;sound(520,.08,'sine',.015,120);}
      let speed=0;if(dist<13&&dist>3.1)speed=.55+state.wave*.035;
      if(speed){const nx=p.group.position.x+dx/dist*speed*dt,nz=p.group.position.z+dz/dist*speed*dt;const ground=surfaceAt(nx,nz,p.group.position.y+1.2);if(ground>p.group.position.y-.8&&ground<p.group.position.y+1.1){p.group.position.x=nx;p.group.position.z=nz;p.group.position.y=lerp(p.group.position.y,ground,dt*9);}p.walk+=dt*7;}
    }
    const walk=Math.sin(p.walk)*.35;p.armL.rotation.x=walk;p.legL.rotation.x=walk;p.legR.rotation.x=-walk;
    p.body.position.y=1.03+Math.abs(Math.sin(p.walk))*.025;
    p.bar.lookAt(camera.position);p.barFill.scale.x=clamp(p.health/p.maxHealth,0,1);p.barFill.position.x=-(1-p.barFill.scale.x)/2;
  });
}

// Mining, building, and the first-person tool models.
const raycaster=new THREE.Raycaster();raycaster.far=24;
let target=null;
function updateTarget(){
  if(!state.started||state.paused){selection.visible=false;return;}
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects([...blockMeshes,...pandas.map(p=>p.group)],true);
  target=null;
  for(const hit of hits){
    if(hit.object.userData.panda){const p=hit.object.userData.panda;if(!p.dead){target={kind:'panda',panda:p,distance:hit.distance,point:hit.point};break;}}
    else if(hit.object.userData.isBlock&&Number.isInteger(hit.instanceId)){
      const b=hit.object.userData.coords[hit.instanceId];target={kind:'block',block:b,distance:hit.distance,point:hit.point,normal:hit.face.normal.clone()};break;
    }
  }
  selection.visible=false;ui.crosshair.classList.toggle('hostile',target?.kind==='panda'&&target.distance<4);
  ui.target.classList.toggle('visible',!!target&&target.distance<(target.kind==='block'?5:7));
  ui.target.classList.toggle('mining',false);
  if(!target)return;
  if(target.kind==='block'&&target.distance<=5){selection.visible=true;selection.position.set(target.block.x,target.block.y,target.block.z);ui.target.querySelector('strong').textContent=target.block.type.toUpperCase()+' BLOCK';ui.target.querySelector('span').textContent=target.block.y===0?'Bedrock cannot be mined':'Hold to mine';}
  else if(target.kind==='panda'){ui.target.querySelector('strong').textContent='PINEAPPLE PANDA';ui.target.querySelector('span').textContent=target.distance<3.8?'Click to bonk':`${Math.ceil(target.panda.health)} HP · Keep your distance`;}
}
function primaryStart(){
  if(state.paused||state.dead)return;
  state.primary=true;
  if(state.selected===1)shootSeed();
  else if(state.selected===2){shieldBash();}
  else if(target?.kind==='panda'&&target.distance<3.8&&state.attackCooldown<=0){state.attackCooldown=.42;state.attackAnim=1;hitPanda(target.panda,38);}
}
function shieldBash(){if(state.attackCooldown>0)return;state.attackCooldown=.65;state.attackAnim=1;if(target?.kind==='panda'&&target.distance<3)hitPanda(target.panda,18);sound(110,.1,'square',.03,20);}
function updateActions(dt){
  state.attackCooldown=Math.max(0,state.attackCooldown-dt);state.hurtCooldown=Math.max(0,state.hurtCooldown-dt);
  if(state.primary&&(state.selected===0||state.selected>=3)&&target?.kind==='panda'&&target.distance<3.8&&state.selected===0&&state.attackCooldown<=0){state.attackCooldown=.42;state.attackAnim=1;hitPanda(target.panda,38);}
  if(state.primary&&state.selected===1&&state.attackCooldown<=0)shootSeed();
  const canMine=state.primary&&state.selected!==1&&state.selected!==2&&target?.kind==='block'&&target.distance<=5&&target.block.y>0;
  if(canMine){
    const k=key(target.block.x,target.block.y,target.block.z);if(state.mineKey!==k){state.mineKey=k;state.mineTime=0;}
    const hardness={grass:.42,dirt:.45,sand:.35,stone:1.25,wood:.9,leaves:.25,planks:.8}[target.block.type]||.6;
    state.mineTime+=dt*(state.selected===0?1.35:1);ui.target.classList.add('mining');ui.target.querySelector('div i').style.width=`${Math.min(100,state.mineTime/hardness*100)}%`;
    if(state.mineTime>=hardness){breakBlock(target.block);state.mineTime=0;state.mineKey='';state.attackAnim=1;}
  }else{state.mineTime=0;state.mineKey='';ui.target.querySelector('div i').style.width='0%';}
}
function breakBlock(b){
  blocks.delete(key(b.x,b.y,b.z));if(b.type==='stone')state.inventory.stone=Math.min(99,state.inventory.stone+1);else state.inventory.dirt=Math.min(99,state.inventory.dirt+1);
  updateInventory();rebuildBlocks();burst(new THREE.Vector3(b.x,b.y,b.z),b.type==='stone'?'#a1aaa1':b.type==='leaves'?'#4d914b':'#a77843',12,.12);sound(105,.1,'square',.035,-25);toast(`+1 <b>${b.type==='stone'?'stone':'earth'} block</b>`);target=null;
}
function placeBlock(){
  if(state.paused||state.dead)return;const tool=tools[state.selected];
  if(!tool.block){toast('Select <b>earth or stone</b> to build');return;}
  if(!target||target.kind!=='block'||target.distance>5)return;
  if(state.inventory[tool.block]<=0){toast('Out of blocks. <b>Mine some more!</b>');return;}
  const b=target.block,n=target.normal;const x=b.x+Math.round(n.x),y=b.y+Math.round(n.y),z=b.z+Math.round(n.z);
  if(blocks.has(key(x,y,z)))return;
  if(Math.abs(player.feet.x-x)<.8&&Math.abs(player.feet.z-z)<.8&&y+.5>player.feet.y&&y-.5<player.feet.y+1.8){toast('A little too close to build there');return;}
  setBlock(x,y,z,tool.block);state.inventory[tool.block]--;updateInventory();rebuildBlocks();sound(150,.08,'square',.035,40);burst(new THREE.Vector3(x,y,z),'#d8f05a',5,.07);state.attackAnim=.6;
}
function updateInventory(){ui.dirt.textContent=state.inventory.dirt;ui.stone.textContent=state.inventory.stone;}
function selectSlot(i){state.selected=clamp(i,0,4);state.primary=false;state.mineTime=0;$$('.slot').forEach((s,j)=>s.classList.toggle('selected',j===state.selected));ui.tool.querySelector('span').textContent=tools[state.selected].name;ui.tool.querySelector('small').textContent=tools[state.selected].sub;updateViewModel();sound(300,.035,'sine',.012,30);}

const viewModel=new THREE.Group();camera.add(viewModel);viewModel.position.set(.52,-.48,-.85);
const vmMats={bamboo:new THREE.MeshStandardMaterial({color:'#9dbd54',roughness:.75}),dark:new THREE.MeshStandardMaterial({color:'#42673a',roughness:.8}),wood:new THREE.MeshStandardMaterial({color:'#9a713e',roughness:.9})};
let swordModel,shieldModel,bowModel,blockModel;
function buildViewModels(){
  swordModel=new THREE.Group();const blade=box(swordModel,[.1,.7,.1],[0,.23,0],vmMats.bamboo);blade.rotation.z=-.18;box(swordModel,[.32,.08,.12],[-.05,-.11,0],vmMats.dark);box(swordModel,[.12,.26,.12],[.02,-.27,0],vmMats.wood);swordModel.rotation.z=-.3;viewModel.add(swordModel);
  bowModel=new THREE.Group();const fruit=pineappleModel(.85);bowModel.add(fruit);box(bowModel,[.09,.55,.09],[.25,-.1,0],vmMats.wood).rotation.z=-.4;bowModel.rotation.z=-.2;viewModel.add(bowModel);
  shieldModel=new THREE.Group();const shield=box(shieldModel,[.65,.78,.12],[0,0,0],vmMats.wood);for(const x of [-.29,.29])box(shieldModel,[.07,.85,.16],[x,0,0],vmMats.bamboo);for(const y of [-.34,.34])box(shieldModel,[.66,.07,.16],[0,y,0],vmMats.bamboo);box(shieldModel,[.24,.24,.16],[0,0,.01],vmMats.dark);shieldModel.position.set(-.15,.03,0);shieldModel.rotation.y=-.35;viewModel.add(shieldModel);
  blockModel=new THREE.Mesh(blockGeometry,blockMaterials.dirt);blockModel.scale.setScalar(.48);blockModel.rotation.set(.2,.5,0);viewModel.add(blockModel);
  viewModel.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.renderOrder=10;}});
}
buildViewModels();
viewModel.visible=false;
function updateViewModel(){
  swordModel.visible=state.selected===0;bowModel.visible=state.selected===1;shieldModel.visible=state.blocking;blockModel.visible=state.selected>=3&&!state.blocking;
  if(state.selected>=3)blockModel.material=blockMaterials[tools[state.selected].block];
  if(state.blocking){swordModel.visible=false;bowModel.visible=false;blockModel.visible=false;}
}
function animateViewModel(dt){
  state.attackAnim=Math.max(0,state.attackAnim-dt*3.6);state.blockAnim=Math.max(0,state.blockAnim-dt*4);
  const moving=keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||Math.abs(touchMove.x)+Math.abs(touchMove.y)>.1;
  const bob=moving?Math.sin(player.bob)*.018:0;
  viewModel.position.set(.52+bob,-.48+Math.abs(bob),-.85+state.attackAnim*.13-state.blockAnim*.12);
  viewModel.rotation.set(-state.attackAnim*.7,0,-state.attackAnim*.35);
  if(state.blocking){viewModel.position.set(.47,-.48,-.95-state.blockAnim*.1);viewModel.scale.setScalar(.8);}else viewModel.scale.setScalar(1);
  updateViewModel();
}

// Tiny cube particles and short event messages.
const particles=[];
function burst(position,color,count,size){
  const material=new THREE.MeshBasicMaterial({color});
  for(let i=0;i<count;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),material);mesh.position.copy(position);scene.add(mesh);particles.push({mesh,velocity:new THREE.Vector3(random(-2.4,2.4),random(1,3.5),random(-2.4,2.4)),life:random(.35,.75)});}
}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.velocity.y-=7*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*5;p.mesh.scale.setScalar(clamp(p.life*2,0,1));if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}}
function toast(html){const el=document.createElement('div');el.className='toast';el.innerHTML=html;ui.feed.appendChild(el);while(ui.feed.children.length>4)ui.feed.firstChild.remove();setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),450);},2400);}
function updateVitals(){ui.health.textContent=Math.ceil(state.health);ui.healthFill.style.width=state.health+'%';ui.guard.textContent=Math.ceil(state.guard);ui.guardFill.style.width=state.guard+'%';}

// Web Audio sounds are generated locally and only start after user interaction.
let audio=null;
function sound(freq,duration,type='sine',volume=.025,slide=0){
  if(!state.sound)return;try{audio||=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
}
function toggleSound(){state.sound=!state.sound;[$('#sound-button'),$('#intro-sound')].forEach(b=>b.style.opacity=state.sound?1:.45);if(state.sound)sound(440,.08,'sine',.025,100);}

// North-up map with live players, enemies, and projectiles.
const mapCtx=ui.map.getContext('2d');let mapTimer=0;
function drawMap(){
  const c=mapCtx,W=180,S=W/(WORLD*2+4);c.clearRect(0,0,W,W);c.fillStyle='#5bb6b2';c.fillRect(0,0,W,W);
  for(let x=-WORLD;x<=WORLD;x++)for(let z=-WORLD;z<=WORLD;z++){
    const h=heightAt(x,z),b=blocks.get(key(x,h,z));c.fillStyle=!b?'#5bb6b2':b.type==='sand'?'#d5ca8b':b.type==='stone'?'#88978b':b.type==='planks'?'#ad8d55':b.type==='wood'||b.type==='leaves'?'#397b46':h>=4?'#79a852':'#6d9c4f';c.fillRect((x+WORLD+2)*S,(z+WORLD+2)*S,S+1,S+1);
  }
  const dot=(x,z,color,r)=>{c.fillStyle=color;c.beginPath();c.arc((x+WORLD+2)*S,(z+WORLD+2)*S,r,0,TAU);c.fill();};
  projectiles.filter(p=>p.enemy).forEach(p=>dot(p.mesh.position.x,p.mesh.position.z,'#ffe16b',1.5));pandas.forEach(p=>{dot(p.group.position.x,p.group.position.z,'#fff4d9',3);dot(p.group.position.x,p.group.position.z,'#e77857',1.7);});
  c.save();c.translate((player.feet.x+WORLD+2)*S,(player.feet.z+WORLD+2)*S);c.rotate(-player.yaw);c.fillStyle='#e8ff74';c.strokeStyle='#173a30';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-6);c.lineTo(4.5,5);c.lineTo(0,3);c.lineTo(-4.5,5);c.closePath();c.fill();c.stroke();c.restore();
}

// Desktop input.
document.addEventListener('keydown',e=>{
  keys[e.code]=true;if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  if(e.code==='Escape'&&state.started&&!state.paused)showPause();
  if(e.code==='Space'&&!e.repeat)jump();if(e.code==='KeyF')state.touchShield=true;
  if(/^Digit[1-5]$/.test(e.code))selectSlot(Number(e.code.slice(-1))-1);
  if(e.code==='KeyE')placeBlock();
});
document.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyF')state.touchShield=false;});
document.addEventListener('mousemove',e=>{
  if(!state.started||state.paused)return;if(document.pointerLockElement===renderer.domElement){player.yaw-=e.movementX*.0022;player.pitch=clamp(player.pitch-e.movementY*.0022,-1.45,1.45);}
});
renderer.domElement.addEventListener('mousedown',e=>{
  if(!state.started||state.paused)return;
  if(!isTouch&&document.pointerLockElement!==renderer.domElement){renderer.domElement.requestPointerLock?.();return;}
  if(e.button===0)primaryStart();if(e.button===2)placeBlock();
});
document.addEventListener('mouseup',e=>{if(e.button===0)state.primary=false;});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{if(state.started&&!state.dead&&!isTouch&&document.pointerLockElement!==renderer.domElement)showPause();});
$$('.slot').forEach((el,i)=>el.addEventListener('click',e=>{e.stopPropagation();selectSlot(i);}));

// Touch input: left stick, right-side look, and independent action buttons.
const touchMove={x:0,y:0};let stickId=null,lookId=null,lookLast={x:0,y:0};
const stick=$('#joystick'),knob=$('#joystick-knob');
function moveStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.33,l=Math.hypot(dx,dy);if(l>max){dx*=max/l;dy*=max/l;}touchMove.x=dx/max;touchMove.y=-dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`;}
stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e);});
function endStick(e){if(e.pointerId===stickId){stickId=null;touchMove.x=touchMove.y=0;knob.style.transform='';}}stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
const look=$('#look-zone');look.addEventListener('pointerdown',e=>{lookId=e.pointerId;lookLast={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId);});look.addEventListener('pointermove',e=>{if(e.pointerId!==lookId||state.paused)return;player.yaw-=(e.clientX-lookLast.x)*.005;player.pitch=clamp(player.pitch-(e.clientY-lookLast.y)*.005,-1.4,1.4);lookLast={x:e.clientX,y:e.clientY};});look.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null;});
function holdButton(selector,start,end=()=>{}){const el=$(selector);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);el.classList.add('active');start();});const finish=e=>{el.classList.remove('active');end();};el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);}
holdButton('#touch-mine',primaryStart,()=>state.primary=false);holdButton('#touch-place',placeBlock);holdButton('#touch-jump',jump);holdButton('#touch-shield',()=>state.touchShield=true,()=>state.touchShield=false);

function startGame(){
  if(state.started)return;state.started=true;state.paused=false;viewModel.visible=true;ui.intro.classList.remove('active');ui.hud.classList.remove('hidden');if(isTouch)ui.touch.classList.remove('hidden');resetPlayer();updateVitals();updateInventory();sound(260,.15,'sine',.03,180);
  if(!isTouch)renderer.domElement.requestPointerLock?.();
  setTimeout(()=>{ui.banner.classList.add('show');toast('<b>Tip:</b> Hold F when you see a !');},500);
}
function showPause(){if(!state.started||state.dead||state.paused)return;state.paused=true;state.primary=false;state.touchShield=false;ui.pause.classList.add('active');ui.touch.classList.add('hidden');if(document.pointerLockElement)document.exitPointerLock?.();}
function resume(){if(state.dead)return;state.paused=false;ui.pause.classList.remove('active');if(isTouch)ui.touch.classList.remove('hidden');else renderer.domElement.requestPointerLock?.();}
function gameOver(){state.dead=true;state.paused=true;state.primary=false;$('#final-score').textContent=`${state.score} panda${state.score===1?'':'s'}`;$('#final-wave').textContent=state.wave;ui.over.classList.add('active');ui.touch.classList.add('hidden');if(document.pointerLockElement)document.exitPointerLock?.();}
$('#start-button').addEventListener('click',startGame);$('#pause-button').addEventListener('click',showPause);$('#resume-button').addEventListener('click',resume);$('#restart-button').addEventListener('click',()=>location.reload());$('#retry-button').addEventListener('click',()=>location.reload());$('#sound-button').addEventListener('click',toggleSound);$('#intro-sound').addEventListener('click',toggleSound);

let last=performance.now(),introTime=0;
function frame(now){
  requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;introTime+=dt;
  clouds.forEach((c,i)=>{c.position.x+=dt*(.13+i%3*.04);if(c.position.x>65)c.position.x=-75;});
  water.material.opacity=.71+Math.sin(now*.001)*.025;
  if(!state.started){
    const a=.67+Math.sin(introTime*.07)*.08;camera.position.set(Math.sin(a)*27,13.5+Math.sin(introTime*.15),Math.cos(a)*27);camera.lookAt(0,3,-1);
    pandas.forEach(p=>{p.walk+=dt*.7;p.armL.rotation.x=Math.sin(p.walk)*.15;p.group.rotation.y=Math.sin(introTime*.2)*.2;});
  }else if(!state.paused){
    state.elapsed+=dt;state.shake=Math.max(0,state.shake-dt*.5);state.guardBroken=Math.max(0,state.guardBroken-dt);state.blocking=(state.touchShield||state.selected===2)&&state.guard>0&&state.guardBroken<=0;
    if(!state.blocking)state.guard=clamp(state.guard+dt*8,0,100);
    movePlayer(dt);updateTarget();updateActions(dt);updatePandas(dt);updateProjectiles(dt);updateParticles(dt);animateViewModel(dt);updateVitals();
    $('#day-label').textContent=`DAY 01 · ${String(9+Math.floor(state.elapsed/90)).padStart(2,'0')}:${String(Math.floor(state.elapsed)%60).padStart(2,'0')}`;
    if(state.nextWave>0){state.nextWave-=dt;if(state.nextWave<=0){state.wave++;state.health=clamp(state.health+15,0,100);state.guard=100;spawnWave(state.wave);}}
    mapTimer-=dt;if(mapTimer<=0){drawMap();mapTimer=.15;}
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
// Expose a tiny read-only snapshot for automated smoke tests.
window.__pandaGame=()=>({started:state.started,paused:state.paused,health:state.health,guard:state.guard,score:state.score,wave:state.wave,blocks:blocks.size,pandas:pandas.length,projectiles:projectiles.length,selected:state.selected,primary:state.primary,mineTime:state.mineTime,locked:document.pointerLockElement===renderer.domElement,position:player.feet.toArray(),pitch:player.pitch,target:target?{kind:target.kind,distance:target.distance,type:target.block?.type,coords:target.block?[target.block.x,target.block.y,target.block.z]:null}:null,inventory:{...state.inventory},camera:camera.position.toArray(),direction:camera.getWorldDirection(new THREE.Vector3()).toArray()});
