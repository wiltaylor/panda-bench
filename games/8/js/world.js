'use strict';
/* PandaCraft — block types, world data, generation, raycast, voxel collision */

const B = { AIR:0, GRASS:1, DIRT:2, STONE:3, LOG:4, LEAVES:5, SAND:6, WATER:7, PLANK:8, COBBLE:9, GLASS:10 };

const BLOCKS = [];
BLOCKS[B.GRASS]  = { name:'Grass',        top:T.GRASS_TOP, bottom:T.DIRT,    side:T.GRASS_SIDE, solid:true,  opaque:true,  hard:0.45, drop:B.DIRT };
BLOCKS[B.DIRT]   = { name:'Dirt',         all:T.DIRT,      solid:true,  opaque:true,  hard:0.35, drop:B.DIRT };
BLOCKS[B.STONE]  = { name:'Stone',        all:T.STONE,     solid:true,  opaque:true,  hard:1.1,  drop:B.COBBLE };
BLOCKS[B.LOG]    = { name:'Oak Log',      top:T.LOG_TOP, bottom:T.LOG_TOP, side:T.LOG_SIDE, solid:true,  opaque:true,  hard:0.7,  drop:B.LOG };
BLOCKS[B.LEAVES] = { name:'Leaves',       all:T.LEAVES,    solid:true,  opaque:false, cutout:true, hard:0.06, drop:0 };
BLOCKS[B.SAND]   = { name:'Sand',         all:T.SAND,      solid:true,  opaque:true,  hard:0.3,  drop:B.SAND };
BLOCKS[B.WATER]  = { name:'Water',        all:T.WATER,     solid:false, opaque:false, liquid:true, hard:Infinity, drop:0 };
BLOCKS[B.PLANK]  = { name:'Planks',       all:T.PLANK,     solid:true,  opaque:true,  hard:0.55, drop:B.PLANK };
BLOCKS[B.COBBLE] = { name:'Cobblestone',  all:T.COBBLE,    solid:true,  opaque:true,  hard:0.9,  drop:B.COBBLE };
BLOCKS[B.GLASS]  = { name:'Glass',        all:T.GLASS,     solid:true,  opaque:false, cutout:true, hard:0.15, drop:B.GLASS };

function bd(id){ return BLOCKS[id] || null; }
function faceTile(def, sel){ return def.all !== undefined ? def.all : def[sel]; }

const W = {
  SX: 128, SY: 64, SZ: 128, SEA: 20,
  data: null, seed: 1,
  idx(x, y, z){ return (y*this.SZ + z)*this.SX + x; },
  inB(x, y, z){ return x >= 0 && y >= 0 && z >= 0 && x < this.SX && y < this.SY && z < this.SZ; },
  get(x, y, z){ return this.inB(x, y, z) ? this.data[this.idx(x, y, z)] : B.AIR; },
  setRaw(x, y, z, id){ if(this.inB(x, y, z)) this.data[this.idx(x, y, z)] = id; },
  set(x, y, z, id){
    if(!this.inB(x, y, z)) return;
    this.data[this.idx(x, y, z)] = id;
    if(typeof Renderer !== 'undefined') Renderer.touchBlock(x, y, z);
  },
  solidAt(x, y, z){ const d = bd(this.get(x, y, z)); return !!(d && d.solid); },
  opaqueAt(x, y, z){ const d = bd(this.get(x, y, z)); return !!(d && d.opaque); },
  waterAt(x, y, z){ return this.get(x, y, z) === B.WATER; },
  surfaceY(x, z){
    for(let y = this.SY-1; y >= 0; y--){
      const id = this.get(x, y, z);
      if(id !== B.AIR) return (id === B.WATER) ? -1 : y;
    }
    return -1;
  }
};

function generateWorld(seed){
  W.seed = seed;
  W.data = new Uint8Array(W.SX * W.SY * W.SZ);
  const n1 = makeNoise2(seed), n2 = makeNoise2(seed ^ 0x9e3779b9);
  const SL = W.SEA;
  for(let x = 0; x < W.SX; x++){
    for(let z = 0; z < W.SZ; z++){
      const h = Math.max(6, Math.min(W.SY - 12, Math.floor(
        12 + fbm2(n1, x*0.013, z*0.013, 4)*30 + fbm2(n2, x*0.06, z*0.06, 2)*4 - 6
      )));
      for(let y = 0; y <= h; y++){
        let id;
        if(y < h - 3) id = B.STONE;
        else if(y < h) id = B.DIRT;
        else id = (h <= SL + 1) ? B.SAND : B.GRASS;
        W.setRaw(x, y, z, id);
      }
      for(let y = h + 1; y <= SL; y++) W.setRaw(x, y, z, B.WATER);
    }
  }
  // trees
  const rnd = mulberry32(seed + 99);
  for(let x = 3; x < W.SX - 3; x++){
    for(let z = 3; z < W.SZ - 3; z++){
      if(rnd() >= 0.006) continue;
      const y = W.surfaceY(x, z);
      if(y < 2 || W.get(x, y, z) !== B.GRASS) continue;
      const th = 4 + ((rnd()*3)|0);
      for(let i = 1; i <= th; i++) W.setRaw(x, y + i, z, B.LOG);
      const topY = y + th;
      for(let dy = -2; dy <= 1; dy++){
        const r = dy < 1 ? 2 : 1;
        for(let dx = -r; dx <= r; dx++){
          for(let dz = -r; dz <= r; dz++){
            if(dx === 0 && dz === 0 && dy <= 0) continue;
            if(Math.abs(dx) === r && Math.abs(dz) === r && rnd() < 0.6) continue;
            if(W.get(x + dx, topY + dy, z + dz) === B.AIR) W.setRaw(x + dx, topY + dy, z + dz, B.LEAVES);
          }
        }
      }
    }
  }
}

function findSpawn(){
  const cx = W.SX >> 1, cz = W.SZ >> 1;
  for(let r = 0; r < 50; r += 2){
    for(let i = 0; i < 12; i++){
      const a = Math.random()*Math.PI*2;
      const x = clamp(Math.round(cx + Math.cos(a)*r), 2, W.SX - 3);
      const z = clamp(Math.round(cz + Math.sin(a)*r), 2, W.SZ - 3);
      const y = W.surfaceY(x, z);
      if(y < 2) continue;
      const g0 = W.get(x, y, z);
      if(g0 !== B.GRASS && g0 !== B.SAND && g0 !== B.STONE) continue;
      if(W.solidAt(x, y + 1, z) || W.solidAt(x, y + 2, z)) continue;
      return [x + 0.5, y + 1.01, z + 0.5];
    }
  }
  return [cx + 0.5, W.SY - 10, cz + 0.5];
}

/* ---------- raycast ---------- */
function raycastWorld(ox, oy, oz, dx, dy, dz, maxDist){
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
  const tdx = Math.abs(dx) < 1e-9 ? Infinity : Math.abs(1/dx);
  const tdy = Math.abs(dy) < 1e-9 ? Infinity : Math.abs(1/dy);
  const tdz = Math.abs(dz) < 1e-9 ? Infinity : Math.abs(1/dz);
  let tmx = tdx === Infinity ? Infinity : (stepX > 0 ? (x + 1 - ox) : (ox - x)) * tdx;
  let tmy = tdy === Infinity ? Infinity : (stepY > 0 ? (y + 1 - oy) : (oy - y)) * tdy;
  let tmz = tdz === Infinity ? Infinity : (stepZ > 0 ? (z + 1 - oz) : (oz - z)) * tdz;
  let fx = 0, fy = 0, fz = 0, t = 0;
  for(let i = 0; i < 400; i++){
    const id = W.get(x, y, z);
    if(id !== B.AIR && id !== B.WATER){
      return { x, y, z, id, fx, fy, fz, dist: t };
    }
    if(tmx <= tmy && tmx <= tmz){ t = tmx; tmx += tdx; x += stepX; fx = -stepX; fy = 0; fz = 0; }
    else if(tmy <= tmz){ t = tmy; tmy += tdy; y += stepY; fx = 0; fy = -stepY; fz = 0; }
    else { t = tmz; tmz += tdz; z += stepZ; fx = 0; fy = 0; fz = -stepZ; }
    if(t > maxDist) return null;
    if(y < 0) return null;
  }
  return null;
}

/* ray vs AABB (slab). returns entry t (>=0) or -1 */
function rayAABB(ox, oy, oz, dx, dy, dz, minx, miny, minz, maxx, maxy, maxz, maxDist){
  let t0 = 0, t1 = maxDist;
  const axes = [[ox, dx, minx, maxx], [oy, dy, miny, maxy], [oz, dz, minz, maxz]];
  for(const ax of axes){
    const o = ax[0], d = ax[1], lo = ax[2], hi = ax[3];
    if(Math.abs(d) < 1e-9){
      if(o < lo || o > hi) return -1;
    } else {
      let a = (lo - o)/d, b = (hi - o)/d;
      if(a > b){ const tt = a; a = b; b = tt; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      if(t0 > t1) return -1;
    }
  }
  return t0;
}

/* ---------- voxel collision ---------- */
function moveAxis(e, delta, axis){
  if(delta === 0) return false;
  const p = e.pos, EPS = 0.001, hw = e.w/2;
  p[axis] += delta;
  const x0 = Math.floor(p[0] - hw), x1 = Math.floor(p[0] + hw - 1e-6);
  const y0 = Math.floor(p[1]),      y1 = Math.floor(p[1] + e.h - 1e-6);
  const z0 = Math.floor(p[2] - hw), z1 = Math.floor(p[2] + hw - 1e-6);
  for(let y = y0; y <= y1; y++){
    for(let z = z0; z <= z1; z++){
      for(let x = x0; x <= x1; x++){
        if(!W.solidAt(x, y, z)) continue;
        if(axis === 0){
          p[0] = delta > 0 ? x - hw - EPS : x + 1 + hw + EPS;
          e.vel[0] = 0;
        } else if(axis === 2){
          p[2] = delta > 0 ? z - hw - EPS : z + 1 + hw + EPS;
          e.vel[2] = 0;
        } else {
          if(delta > 0) p[1] = y - e.h - EPS;
          else { p[1] = y + 1 + EPS; e.onGround = true; }
          e.vel[1] = 0;
        }
        if(axis !== 1) e.blockedH = true;
        return true;
      }
    }
  }
  return false;
}

function moveEntity(e, dt){
  e.onGround = false; e.blockedH = false;
  const maxV = Math.max(Math.abs(e.vel[0]), Math.abs(e.vel[1]), Math.abs(e.vel[2]));
  const steps = clamp(Math.ceil(maxV*dt/0.4), 1, 8);
  const sdt = dt/steps;
  for(let s = 0; s < steps; s++){
    moveAxis(e, e.vel[0]*sdt, 0);
    moveAxis(e, e.vel[2]*sdt, 2);
    moveAxis(e, e.vel[1]*sdt, 1);
  }
  const m = e.w/2 + 0.02;
  e.pos[0] = clamp(e.pos[0], m, W.SX - m);
  e.pos[2] = clamp(e.pos[2], m, W.SZ - m);
  if(e.pos[1] < 0){ e.pos[1] = 0; e.vel[1] = 0; e.onGround = true; }
}

function entityInWater(e){
  const x = Math.floor(e.pos[0]), z = Math.floor(e.pos[2]);
  return W.waterAt(x, Math.floor(e.pos[1] + 0.3), z) || W.waterAt(x, Math.floor(e.pos[1] + e.h*0.8), z);
}
