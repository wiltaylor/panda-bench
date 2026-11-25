/* global THREE */
const $ = (id) => document.getElementById(id);
const canvasHost = $('view');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch {
  $('overlay-copy').textContent = 'This game needs a browser with WebGL enabled.';
  $('play').disabled = true;
}
if (renderer) runGame();

function runGame() {
  const T = THREE;
  const scene = new T.Scene();
  scene.background = new T.Color('#b8d9bd');
  scene.fog = new T.FogExp2('#b8d9bd', 0.035);
  const camera = new T.PerspectiveCamera(66, 1, 0.04, 105);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  canvasHost.append(renderer.domElement);
  const canvas = renderer.domElement;
  let redraw=true;
  new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = canvasHost;
    camera.aspect = w / Math.max(h, 1);
    camera.fov = camera.aspect < 0.85 ? 74 : 66;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    redraw=true;
  }).observe(canvasHost);

  scene.add(new T.HemisphereLight('#fff4cf', '#698879', 2.12));
  const sunlight = new T.DirectionalLight('#fff0c1', 2.05);
  sunlight.position.set(-12, 23, 11);
  scene.add(sunlight);
  const cube = new T.BoxGeometry();
  const matrix = new T.Matrix4();
  const dummy = new T.Object3D();
  let seed = 7231;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function paint(base, kind) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 16;
    const context = tile.getContext('2d');
    const color = new T.Color(base);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const brightness = 0.82 + random() * 0.28;
        context.fillStyle = color.clone().multiplyScalar(brightness).getStyle();
        if (kind === 'plank' && (y % 5 === 0 || (x === (y < 8 ? 4 : 12) && y % 5 < 3))) {
          context.fillStyle = '#907044';
        }
        if (kind === 'grassSide' && y < 3 + (x * 7 % 5)) {
          context.fillStyle = color.clone().set('#61943b').multiplyScalar(brightness).getStyle();
        }
        context.fillRect(x, y, 1, 1);
      }
    }
    const texture = new T.CanvasTexture(tile);
    texture.magFilter = T.NearestFilter;
    texture.colorSpace = T.SRGBColorSpace;
    return new T.MeshLambertMaterial({ map: texture });
  }

  const grassTop = paint('#76a746');
  const grassSide = paint('#87633f', 'grassSide');
  const ground = paint('#826044');
  const materials = {
    grass: [grassSide, grassSide, grassTop, ground, grassSide, grassSide],
    dirt: ground,
    path: paint('#bc9a61'),
    stone: paint('#84938b'),
    plank: paint('#c7a25c', 'plank'),
  };
  const solid = (color) => new T.MeshLambertMaterial({ color });
  const leaf = ['#406d36', '#568642', '#729c47', '#326344'].map((c) => paint(c));
  const bark = paint('#765337');
  const stalk = ['#628a39', '#85a845', '#a4b65d'].map(solid);
  const band = solid('#3f6435');
  const white = paint('#f5ecda');
  const black = paint('#26312e');
  const nose = solid('#121f1e');
  const cream = solid('#fff7e3');
  const fruit = paint('#ebb444');
  const fruitMark = solid('#b97c2a');
  const crown = solid('#6c932f');
  const steel = solid('#9cafac');
  const shadow = new T.MeshBasicMaterial({ color:'#33491f', transparent:true, opacity:0.31, depthWrite:false });

  const blocks = new Map();
  const terrain = new T.Group();
  scene.add(terrain);
  const key = (x, y, z) => `${x},${y},${z}`;
  const blockAt = (x, y, z) => blocks.get(key(x, y, z));
  const setBlock = (x, y, z, type) => blocks.set(key(x, y, z), { x, y, z, type });
  const sides = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const heights = new Map();
  const topAt = (x, z) => heights.get(`${x},${z}`) ?? 0;
  function terrainHeight(x, z) {
    const edge = Math.max(0, Math.abs(x) - 5) * 0.27 + Math.max(0, -z - 7) * 0.25;
    const ridges = Math.sin(x * 0.43 + z * 0.27) + Math.cos(z * 0.44 - x * 0.2);
    return Math.min(9, Math.max(-1, Math.floor(edge + ridges * 0.93 - 0.6)));
  }

  function rebuildTerrain() {
    for (const mesh of [...terrain.children]) {
      terrain.remove(mesh);
      mesh.dispose();
    }
    const groups = new Map();
    for (const block of blocks.values()) {
      const { x, y, z, type } = block;
      if (sides.every(([a,b,c]) => blockAt(x+a,y+b,z+c))) continue;
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(block);
    }
    for (const [type, group] of groups) {
      const mesh = new T.InstancedMesh(cube, materials[type], group.length);
      group.forEach(({x,y,z}, index) => {
        mesh.setMatrixAt(index, matrix.makeTranslation(x,y,z));
        const shade = 0.81 + ((Math.imul(x + 71, 463) ^ Math.imul(z + 71, 173)) & 15) / 80;
        mesh.setColorAt(index, new T.Color(shade, shade, shade));
      });
      terrain.add(mesh);
    }
  }

  function box(parent, material, x, y, z, w, h, d) {
    const mesh = new T.Mesh(cube, material);
    mesh.position.set(x,y,z);
    mesh.scale.set(w,h,d);
    parent.add(mesh);
    return mesh;
  }

  const scenery = new Map();
  function decoration(mat,x,y,z,w,h,d,tilt=0) {
    if (!scenery.has(mat)) scenery.set(mat, []);
    dummy.position.set(x,y,z);
    dummy.scale.set(w,h,d);
    dummy.rotation.set(0,0,tilt);
    dummy.updateMatrix();
    scenery.get(mat).push(dummy.matrix.clone());
  }

  function bamboo(x,z,height) {
    const y = topAt(Math.round(x),Math.round(z)) + 0.5;
    const mat = stalk[Math.floor(random()*stalk.length)];
    decoration(mat,x,y+height/2,z,0.16,height,0.16);
    for (let s = 0.6; s < height; s += 0.72) {
      decoration(band,x,y+s,z,0.195,0.055,0.195);
      if (s > 1.55 && random() < 0.65) {
        const sign = random() < 0.5 ? -1 : 1;
        decoration(leaf[2],x+sign*0.24,y+s+0.13,z,0.48,0.075,0.19,sign*0.45);
        decoration(leaf[1],x+sign*0.45,y+s+0.22,z,0.3,0.06,0.17,-sign*0.18);
      }
    }
  }

  function tree(x,z,height) {
    const y = topAt(x,z) + 0.5;
    decoration(bark,x,y+height/2,z,0.65,height,0.65);
    decoration(leaf[0],x,y+height,z,3.8,1.05,3.4);
    decoration(leaf[1],x+0.18,y+height+0.7,z-0.16,3.1,0.84,2.75);
    decoration(leaf[2],x-0.3,y+height+1.23,z-0.32,1.9,0.45,1.75);
    decoration(leaf[3],x-1.23,y+height-0.58,z+0.45,0.85,0.42,1.25);
  }

  function createWorld() {
    seed = 551;
    for (let z=-38; z<=17; z++) {
      for (let x=-28; x<=28; x++) {
        const path = z > -10 && Math.abs(x - Math.round(Math.sin(z * 0.23) * 1.5)) <= 1;
        const height = path ? 0 : terrainHeight(x,z);
        heights.set(`${x},${z}`, height);
        for (let y=-2; y<=height; y++) {
          setBlock(x,y,z,y === height ? (path ? 'path' : 'grass') : y < -1 ? 'stone' : 'dirt');
        }
        if (!path && random()<0.15) {
          const h = 0.16+random()*0.26;
          decoration(leaf[2],x+0.14,height+0.5+h/2,z,0.055,h,0.075,-0.25);
          decoration(leaf[1],x,height+0.5+h/2,z+0.07,0.07,h,0.09,0.27);
        }
      }
    }
    for (let i=0; i<220; i++) {
      const x = Math.round(random()*48-24);
      const z = Math.round(random()*46-35);
      if (Math.abs(x)<5 && z>-12) continue;
      if (i%4===0) tree(x,z,3+random()*3);
      else bamboo(x+random()*0.7,z+random()*0.7,2+random()*4);
    }
    for (const [x,z,h] of [[-7,1,6],[7,0,7],[-8,-6,5],[8,-8,5],[-5,-10,4],[5,-12,5]]) tree(x,z,h);
    for (const [x,z] of [[-5,4],[5,5],[-5,-3],[5,-4],[-8,4],[8,3]]) {
      for (let i=0;i<4;i++) bamboo(x+i*0.3,z+random(),2.5+random()*2.5);
    }
    for (const [x,z] of [[-4,3],[4,2],[-3,-4],[5,-6]]) {
      const y=topAt(x,z)+0.5;
      decoration(leaf[3],x,y+0.17,z,0.6,0.34,0.55);
      decoration(leaf[2],x+0.07,y+0.38,z,0.43,0.22,0.42);
    }
    const cloud = new T.MeshBasicMaterial({ color:'#f8efcf', transparent:true, opacity:0.70, depthWrite:false });
    for (const [x,y,z,w] of [[-17,16,-30,14],[9,19,-38,18],[22,15,-32,12],[-1,14,-30,7]]) {
      decoration(cloud,x,y,z,w,0.62,1.2);
      decoration(cloud,x-w*0.2,y+0.51,z-0.12,w*0.5,0.5,0.95);
    }
    for (const [mat, matrices] of scenery) {
      const mesh = new T.InstancedMesh(cube,mat,matrices.length);
      matrices.forEach((entry,index) => mesh.setMatrixAt(index,entry));
      scene.add(mesh);
    }
    rebuildTerrain();
  }
  createWorld();
  const originalBlocks = new Map(blocks);

  const pandas = [];
  const throws = [];
  function panda(x,z,index) {
    const body = new T.Group();
    body.position.set(x,topAt(x,z)+0.5,z);
    body.rotation.y = -x*0.11;
    scene.add(body);
    box(body,shadow,0,0.006,0,1.85,0.013,1.5);
    box(body,white,0,0.72,-0.16,1.12,0.99,1.06);
    box(body,black,0,1.04,0.17,1.17,0.47,0.49);
    for (const side of [-1,1]) {
      box(body,black,side*0.36,0.25,-0.3,0.38,0.5,0.48);
      box(body,black,side*0.57,0.65,0.36,0.37,0.62,0.46);
    }
    const head = new T.Group();
    head.position.set(0,1.41,0.35);
    body.add(head);
    box(head,white,0,0.06,0,1.15,0.85,0.77);
    for (const side of [-1,1]) {
      box(head,black,side*0.45,0.52,-0.05,0.33,0.32,0.32);
      const patch = box(head,black,side*0.302,0.1,0.398,0.28,0.31,0.09);
      patch.rotation.z = -side*0.26;
      box(head,cream,side*0.27,0.13,0.451,0.077,0.078,0.02);
    }
    box(head,cream,0,-0.13,0.43,0.42,0.26,0.24);
    box(head,nose,0,-0.075,0.565,0.19,0.105,0.05);
    const held = pineapple();
    held.scale.setScalar(0.78);
    held.position.set(index%2 ? -0.74 : 0.74,0.96,0.56);
    body.add(held);
    pandas.push({ body, head, held, hits:3, next:2.7+index*1.35, hurt:0 });
  }

  function pineapple() {
    const art = new T.Group();
    box(art,fruit,0,0,0,0.35,0.41,0.34);
    for (const [x,y,z] of [[-.095,-.095,.174],[.09,.079,.174],[.08,-.11,-.174],[-.174,.065,.05],[.174,.08,.05]]) {
      box(art,fruitMark,x,y,z,0.067,0.07,0.067);
    }
    box(art,crown,0,0.27,0,0.12,0.19,0.12);
    box(art,crown,-0.1,0.24,0,0.09,0.16,0.11).rotation.z=0.55;
    box(art,crown,0.1,0.24,0,0.09,0.16,0.11).rotation.z=-0.55;
    return art;
  }

  const previewFruit = pineapple();
  previewFruit.position.set(-3.15,2.36,3.65);
  previewFruit.rotation.set(0.3,0.45,-0.37);
  scene.add(previewFruit);

  const tool = new T.Group();
  camera.add(tool);
  tool.position.set(0.5,-0.38,-0.8);
  function showTool(slot) {
    tool.clear();
    if (slot < 2) {
      box(tool,bark,0,0,0,0.075,0.42,0.07);
      if (slot === 0) {
        box(tool,materials.plank,0,0.35,0,0.1,0.6,0.07);
        box(tool,materials.plank,0,0.11,0,0.23,0.06,0.085);
      } else {
        box(tool,steel,0,0.23,0,0.4,0.085,0.085);
        box(tool,steel,-0.18,0.17,0,0.08,0.13,0.085);
        box(tool,steel,0.18,0.17,0,0.08,0.13,0.085);
      }
    } else if (slot === 2) {
      box(tool,materials.plank,0,0.05,0,0.38,0.45,0.08);
      box(tool,materials.plank,0,-0.2,0,0.27,0.09,0.08);
      box(tool,steel,0,0.05,0.05,0.08,0.12,0.04);
    } else {
      box(tool,materials[slot===3?'plank':'stone'],0,0.03,0,0.25,0.25,0.25);
    }
  }

  const touchMode = matchMedia('(pointer: coarse)').matches;
  const keys = new Set();
  const slots = [...$('slots').querySelectorAll('button')];
  const items = ['Wooden sword','Pickaxe','Shield','Bamboo planks','Stone'];
  const player = new T.Vector3();
  const aim = new T.Vector3();
  let active=false, begun=false, ended=false, health=5, slot=0;
  let yaw=0, pitch=-0.13, vertical=0, grounded=false, swing=0, elapsed=0;
  let planks=24, stones=16, joyX=0, joyY=0, sound=false, audio, noticeTimer;
  let lastHit=-10;
  const eye=1.62;
  let mouseLook=false;
  let firstLockedMove=false;
  const target = new T.LineSegments(new T.EdgesGeometry(cube),new T.LineBasicMaterial({color:'#fff4c1'}));
  target.scale.setScalar(1.012);
  scene.add(target);

  function updateHUD() {
    $('hearts').replaceChildren(...Array.from({length:5},(_,i)=>{
      const heart=document.createElement('span');
      heart.textContent='♥ ';
      if(i>=health) heart.className='lost';
      return heart;
    }));
    $('hearts').setAttribute('aria-label',`${health} of 5 hearts`);
    $('remaining').textContent=String(pandas.filter(p=>p.hits>0).length).padStart(2,'0');
    $('planks').textContent=planks;
    $('stones').textContent=stones;
  }

  function select(index) {
    slot=index;
    slots.forEach((button,i)=>{
      button.classList.toggle('selected',i===slot);
      button.setAttribute('aria-pressed',i===slot);
    });
    $('item-name').textContent=items[index].toUpperCase();
    showTool(index);
  }

  function notify(message) {
    $('notice').textContent=message;
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{$('notice').textContent='';},1700);
  }

  function beep(freq, length=0.09) {
    if(!sound || !audio) return;
    const oscillator=audio.createOscillator();
    const gain=audio.createGain();
    oscillator.type='triangle';
    oscillator.frequency.setValueAtTime(freq,audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(freq*0.6,audio.currentTime+length);
    gain.gain.setValueAtTime(0.12,audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+length);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime+length);
  }

  function reset() {
    if (begun) {
      blocks.clear();
      originalBlocks.forEach((block,k)=>blocks.set(k,block));
      rebuildTerrain();
    }
    pandas.splice(0).forEach(p=>scene.remove(p.body));
    throws.splice(0).forEach(p=>scene.remove(p.mesh));
    panda(-3,1,0);
    panda(3,0,1);
    panda(1,-5,2);
    player.set(0,0.5,8);
    yaw=0; pitch=-0.13; vertical=0; elapsed=0; lastHit=-10;
    health=5; planks=24; stones=16; grounded=true; ended=false;
    $('notice').textContent='';
    select(0);
    updateHUD();
    positionCamera();
  }

  function positionCamera() {
    if (begun) {
      camera.rotation.set(pitch,yaw,0);
      camera.position.set(player.x,player.y+eye,player.z);
    } else {
      camera.position.set(0.12,3.8,8.8);
      camera.lookAt(0,1.4,-4);
    }
    camera.getWorldDirection(aim);
  }

  function trace(distance) {
    let previous;
    for (let t=0.12;t<=distance;t+=0.045) {
      const x=Math.round(camera.position.x+aim.x*t);
      const y=Math.round(camera.position.y+aim.y*t);
      const z=Math.round(camera.position.z+aim.z*t);
      const block=blockAt(x,y,z);
      if(block) return {block,previous,t};
      previous={x,y,z};
    }
    return null;
  }

  function intersectsBlock(pos,block) {
    return Math.abs(pos.x-block.x)<0.78 && Math.abs(pos.z-block.z)<0.78 &&
      pos.y < block.y+0.5-0.0001 && pos.y+1.72 > block.y-0.5+0.0001;
  }

  function collides(pos) {
    for(let x=Math.floor(pos.x-0.8);x<=Math.ceil(pos.x+0.8);x++) {
      for(let z=Math.floor(pos.z-0.8);z<=Math.ceil(pos.z+0.8);z++) {
        for(let y=Math.floor(pos.y-0.5);y<=Math.ceil(pos.y+2.25);y++) {
          const block=blockAt(x,y,z);
          if(block && intersectsBlock(pos,block)) return true;
        }
      }
    }
    return false;
  }

  function action(kind) {
    if(!active) return;
    if(kind==='pause') { pause(); return; }
    if(kind==='jump') {
      if(grounded) { vertical=6.1; grounded=false; }
      return;
    }
    if(swing>0.08) return;
    const hit=trace(5.4);
    if(kind==='place' || slot>=3) {
      if(slot<3) { notify('Select planks or stone first'); return; }
      if(!hit?.previous) return;
      const pos=hit.previous;
      if(pos.y>15 || intersectsBlock(player,pos) || pandas.some(p=>p.hits>0 && intersectsBlock(p.body.position,pos))) return;
      if(slot===3 ? planks===0 : stones===0) { notify('Out of blocks'); return; }
      setBlock(pos.x,pos.y,pos.z,slot===3?'plank':'stone');
      if(slot===3) planks--; else stones--;
      rebuildTerrain();
      updateHUD();
      swing=0.23;
      beep(160);
      return;
    }
    swing=0.28;
    if(slot===1) {
      if(!hit || hit.block.y<=-2) return;
      const {x,y,z,type}=hit.block;
      blocks.delete(key(x,y,z));
      if(type==='stone') stones++; else planks++;
      rebuildTerrain();
      updateHUD();
      beep(115);
      return;
    }
    if(slot===2) { notify('Shield raised'); return; }
    const ray=new T.Ray(camera.position,aim);
    let closest=null;
    let distance=Math.min(hit?.t ?? Infinity,3.45);
    for(const p of pandas) {
      if(p.hits<=0) continue;
      const {x,y,z}=p.body.position;
      const bounds=new T.Box3(new T.Vector3(x-.76,y,z-.7),new T.Vector3(x+.76,y+2.03,z+.8));
      const contact=ray.intersectBox(bounds,new T.Vector3());
      if(!contact) continue;
      const range=contact.distanceTo(camera.position);
      if(range<distance) { closest=p; distance=range; }
    }
    if(!closest) { beep(190,0.045); return; }
    closest.hits--;
    closest.hurt=0.32;
    beep(245);
    if(closest.hits===0) {
      scene.remove(closest.body);
      updateHUD();
      if(pandas.every(p=>p.hits===0)) finish(true);
    }
  }

  function fire(p, distance) {
    const mesh=pineapple();
    mesh.position.copy(p.body.position).add(new T.Vector3(0,1.42,0));
    const flight=Math.max(0.55,distance/8.2);
    const velocity=new T.Vector3(player.x,player.y+1.1,player.z).sub(mesh.position).multiplyScalar(1/flight);
    velocity.y+=4.25*flight;
    scene.add(mesh);
    throws.push({mesh,velocity,age:0});
    p.held.visible=false;
    if(distance<10) beep(420,0.06);
  }

  function movePlayer(dt) {
    const moveX=(Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')))+joyX;
    const moveZ=(Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp')))+joyY;
    const norm=Math.max(1,Math.hypot(moveX,moveZ));
    const speed=4.7*dt/norm;
    const dx=(Math.cos(yaw)*moveX+Math.sin(yaw)*moveZ)*speed;
    const dz=(-Math.sin(yaw)*moveX+Math.cos(yaw)*moveZ)*speed;
    const next=player.clone();
    next.x+=dx;
    if(Math.abs(next.x)<26 && !collides(next)) player.x=next.x;
    next.copy(player);
    next.z+=dz;
    if(next.z>-36 && next.z<15 && !collides(next)) player.z=next.z;
    vertical-=16*dt;
    next.copy(player);
    next.y+=vertical*dt;
    if(collides(next)) {
      if(vertical<0) {
        grounded=true;
        player.y=Math.round(next.y-0.5)+0.5;
      }
      vertical=0;
    } else {
      grounded=false;
      player.y=next.y;
    }
    if(player.y<-4) finish(false);
  }

  function updatePandas(dt) {
    for(const p of pandas) {
      if(p.hits<=0) continue;
      const dx=player.x-p.body.position.x;
      const dz=player.z-p.body.position.z;
      const distance=Math.hypot(dx,dz);
      p.body.rotation.y=Math.atan2(dx,dz);
      p.hurt=Math.max(0,p.hurt-dt);
      p.head.rotation.z=Math.sin(elapsed*3+p.next)*0.045+p.hurt*0.8;
      p.body.scale.setScalar(1+p.hurt*0.25);
      if(distance>3.25 && distance<15) {
        const step=dt*0.94/distance;
        const x=p.body.position.x+dx*step;
        const z=p.body.position.z+dz*step;
        const bx=Math.round(x), bz=Math.round(z);
        const base=Math.round(p.body.position.y-0.5);
        const obstacle=blockAt(bx,base+1,bz);
        const canClimb=obstacle?.type==='grass' && !blockAt(bx,base+2,bz);
        if(!obstacle || canClimb) {
          if(canClimb) p.body.position.y+=1;
          else if(!blockAt(bx,base,bz) && blockAt(bx,base-1,bz)) p.body.position.y-=1;
          p.body.position.x=x;
          p.body.position.z=z;
        }
      }
      if(distance<16 && elapsed>=p.next) {
        fire(p,distance);
        p.next=elapsed+3.6+random()*1.7;
      }
      if(p.next-elapsed<1.25) p.held.visible=true;
    }
  }

  function updateThrows(dt) {
    for(let i=throws.length-1;i>=0;i--) {
      const p=throws[i];
      p.mesh.position.addScaledVector(p.velocity,dt);
      p.velocity.y-=8.5*dt;
      p.mesh.rotation.x+=dt*6;
      p.mesh.rotation.z+=dt*4;
      p.age+=dt;
      const {x,y,z}=p.mesh.position;
      const hit=Math.abs(x-player.x)<0.52 && Math.abs(z-player.z)<0.52 && y>player.y-0.1 && y<player.y+1.84;
      const impact=blockAt(Math.round(x),Math.round(y),Math.round(z));
      if(impact || hit || p.age>6) {
        scene.remove(p.mesh);
        throws.splice(i,1);
      }
      if(!hit || impact || elapsed-lastHit<0.55) continue;
      const facing=new T.Vector2(-Math.sin(yaw),-Math.cos(yaw));
      const incoming=new T.Vector2(-p.velocity.x,-p.velocity.z).normalize();
      if(slot===2 && facing.dot(incoming)>0.28) {
        notify('Pineapple blocked!');
        swing=0.26;
        beep(320);
      } else {
        lastHit=elapsed;
        health--;
        updateHUD();
        $('flash').style.opacity=1;
        setTimeout(()=>{$('flash').style.opacity=0;},85);
        beep(85,0.18);
        if(health===0) { finish(false); return; }
      }
    }
  }

  function setActive(value) {
    active=value;
    redraw=true;
    $('overlay').hidden=value;
    $('crosshair').hidden=!value;
    $('touch').hidden=!value || !touchMode;
    if(!value) {
      keys.clear();
      endLook();
      resetStick();
      mouseLook=false;
      if(document.pointerLockElement===canvas) document.exitPointerLock();
    }
  }

  function lockPointer() {
    if(touchMode || !canvas.requestPointerLock || document.pointerLockElement===canvas) return;
    try { canvas.requestPointerLock()?.catch(()=>{}); } catch { /* Drag to look when pointer lock is unavailable. */ }
  }

  function pause() {
    if(!active) return;
    $('overlay-title').textContent='Game paused';
    $('overlay-copy').textContent='Your grove will be here when you get back.';
    $('play').lastElementChild.textContent='RESUME GAME';
    setActive(false);
  }

  function finish(won) {
    ended=true;
    $('overlay-title').textContent=won?'Grove defended!':'Panda pileup!';
    $('overlay-copy').textContent=won?'You defeated all three pandas.':'The pandas took over the grove.';
    $('play').lastElementChild.textContent='PLAY AGAIN';
    setActive(false);
  }

  $('play').onclick=()=>{
    if(ended) reset();
    if(!begun) scene.remove(previewFruit);
    begun=true;
    setActive(true);
    positionCamera();
    lockPointer();
  };
  $('help').onclick=()=>{pause();$('instructions').showModal();};
  $('fullscreen').onclick=async()=>{
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else if(document.querySelector('.game-shell').requestFullscreen) await document.querySelector('.game-shell').requestFullscreen();
      else notify('Fullscreen is unavailable on this device');
    } catch { notify('Fullscreen is unavailable on this device'); }
  };
  $('sound').onclick=()=>{
    sound=!sound;
    if(sound) {
      audio??=new AudioContext();
      audio.resume();
      beep(440);
    }
    $('sound').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');
    $('sound').setAttribute('aria-pressed',sound);
    $('sound').textContent=sound?'♪':'♫';
  };
  slots.forEach((button,i)=>{
    button.onclick=()=>{ select(i); if(active) lockPointer(); };
  });

  document.addEventListener('keydown',(event)=>{
    if(!active) return;
    const code=event.code;
    if(/^(Digit[1-5]|Arrow|Space|Key[WASD])/.test(code)) event.preventDefault();
    keys.add(code);
    if(event.repeat) return;
    if(code==='Space') action('jump');
    if(code==='Escape') pause();
    if(/^Digit[1-5]$/.test(code)) select(Number(code.at(-1))-1);
  });
  document.addEventListener('keyup',(event)=>keys.delete(event.code));
  window.addEventListener('blur',()=>{keys.clear(); if(active && !touchMode) pause();});
  document.addEventListener('pointerlockchange',()=>{
    if(document.pointerLockElement===canvas) {
      mouseLook=true;
      firstLockedMove=true;
    }
    else if(mouseLook) { mouseLook=false; pause(); }
  });
  function look(dx,dy,rate) {
    yaw-=dx*rate;
    pitch=T.MathUtils.clamp(pitch-dy*rate,-1.48,1.48);
    positionCamera();
  }
  document.addEventListener('mousemove',(event)=>{
    if(!active || !mouseLook) return;
    const {movementX:x,movementY:y}=event;
    // Some browsers report the pointer's recentering as the first movement.
    if(firstLockedMove && (x || y)) {
      firstLockedMove=false;
      if(Math.hypot(x,y)>240) return;
    }
    look(x,y,0.0025);
  });
  canvas.addEventListener('contextmenu',(event)=>event.preventDefault());
  let drag=null;
  function endLook() { drag=null; }
  canvas.addEventListener('pointerdown',(event)=>{
    if(!active) return;
    if(event.pointerType==='touch' || (event.button===0 && document.pointerLockElement!==canvas)) {
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:0,touch:event.pointerType==='touch'};
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if(event.button===2) action('place');
    else if(event.button===0) action('act');
  });
  canvas.addEventListener('pointermove',(event)=>{
    if(!active || drag?.id!==event.pointerId) return;
    const dx=event.clientX-drag.x, dy=event.clientY-drag.y;
    drag.x=event.clientX;
    drag.y=event.clientY;
    drag.moved+=Math.abs(dx)+Math.abs(dy);
    look(dx,dy,drag.touch?0.0055:0.004);
  });
  canvas.addEventListener('pointerup',(event)=>{
    if(drag?.id!==event.pointerId) return;
    if(!drag.touch && drag.moved<4) action('act');
    endLook();
  });
  canvas.addEventListener('pointercancel',endLook);
  let stickId=null;
  const stick=$('stick');
  function moveStick(event) {
    const rect=stick.getBoundingClientRect();
    const x=event.clientX-rect.left-rect.width/2;
    const y=event.clientY-rect.top-rect.height/2;
    const radius=28;
    const length=Math.max(radius,Math.hypot(x,y));
    joyX=x/length; joyY=y/length;
    $('knob').style.transform=`translate(${joyX*radius}px,${joyY*radius}px)`;
  }
  function resetStick() {
    stickId=null;
    joyX=joyY=0;
    $('knob').style.transform='';
  }
  stick.onpointerdown=(event)=>{
    if(stickId!==null) return;
    stickId=event.pointerId;
    stick.setPointerCapture(stickId);
    moveStick(event);
  };
  stick.onpointermove=(event)=>{if(event.pointerId===stickId) moveStick(event);};
  stick.onpointerup=stick.onpointercancel=(event)=>{if(event.pointerId===stickId) resetStick();};
  for(const button of $('touch').querySelectorAll('button')) button.onclick=()=>action(button.dataset.action);

  reset();
  let last=performance.now();
  renderer.setAnimationLoop((time)=>{
    const frameSeconds=Math.max(0,(time-last)/1000);
    last=time;
    if(!active && !redraw) return;
    if(active) {
      const duration=Math.min(frameSeconds,0.18);
      const steps=Math.max(1,Math.ceil(duration/0.036));
      const dt=duration/steps;
      for(let i=0;i<steps && active;i++) {
        elapsed+=dt;
        movePlayer(dt);
        if(active) {
          updatePandas(dt);
          updateThrows(dt);
        }
      }
      positionCamera();
    }
    tool.visible=active;
    swing=Math.max(0,swing-frameSeconds);
    tool.rotation.set(-swing*3,0,slot===2?0.15:0.38+swing);
    tool.position.y=-0.39-Math.sin(swing*9)*0.1;
    const hit=active && slot!==2 ? trace(5.4) : null;
    target.visible=!!hit && slot!==0;
    if(hit) target.position.set(hit.block.x,hit.block.y,hit.block.z);
    renderer.render(scene,camera);
    redraw=false;
  });
}
