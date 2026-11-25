'use strict';
/* PandaCraft — player: movement, health, mining / placing / throwing, inventory */

const player = {
  pos: [64, 40, 64], vel: [0, 0, 0], yaw: 0, pitch: 0,
  w: 0.6, h: 1.8, eye: 1.62,
  onGround: false, blockedH: false, inWater: false, dead: false,
  hp: 20, maxHp: 20,
  hurtCd: 0, sinceHurt: 99, regenAcc: 0,
  sel: 0, score: 0,
  walkT: 0, swingT: 1,
};

const HOTBAR = [
  { kind: 'sword',     name: 'Iron Sword', count: Infinity },
  { kind: 'pineapple', name: 'Pineapple',  count: 5 },
  { kind: 'block', id: B.DIRT,   name: 'Dirt',    count: 10 },
  { kind: 'block', id: B.STONE,  name: 'Stone',   count: 10 },
  { kind: 'block', id: B.LOG,    name: 'Oak Log', count: 6 },
  { kind: 'block', id: B.PLANK,  name: 'Planks',  count: 24 },
  { kind: 'block', id: B.COBBLE, name: 'Cobble',  count: 10 },
  { kind: 'block', id: B.GLASS,  name: 'Glass',   count: 10 },
  { kind: 'block', id: B.SAND,   name: 'Sand',    count: 10 },
];

function addItem(kind, id, n){
  if(kind === 'pineapple'){ HOTBAR[1].count += n; ui.invDirty = true; return true; }
  for(const e of HOTBAR){
    if(e.kind === 'block' && e.id === id){ e.count += n; ui.invDirty = true; return true; }
  }
  return false;
}

function playerEye(){ return [player.pos[0], player.pos[1] + player.eye, player.pos[2]]; }
player.swing = function(){ if(player.swingT >= 0.35) player.swingT = 0; };

player.hurt = function(n, srcPos){
  const p = player;
  if(p.dead || p.hurtCd > 0 || game.state !== 'playing') return;
  p.hp -= n;
  p.hurtCd = 0.6;
  p.sinceHurt = 0;
  ui.heartsDirty = true;
  ui.damageFlash();
  Sfx.play('hurt');
  if(srcPos){
    const dx = p.pos[0] - srcPos[0], dz = p.pos[2] - srcPos[2];
    const d = Math.hypot(dx, dz) || 1;
    p.vel[0] += dx/d*6; p.vel[2] += dz/d*6;
    p.vel[1] = Math.max(p.vel[1], 4.5);
  }
  if(p.hp <= 0){ p.hp = 0; p.dead = true; game.playerDied(); }
};

function playerUpdate(dt, g){
  const p = player;
  if(p.dead) return;
  let mx = input.move.x, mz = input.move.z;
  const len = Math.hypot(mx, mz);
  if(len > 1){ mx /= len; mz /= len; }
  const sneaking = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
  let speed = sneaking ? 1.6 : 4.4;
  if(p.inWater) speed = Math.min(speed, 2.6);
  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  const tx = (-sy*mz + cy*mx)*speed;
  const tz = (-cy*mz - sy*mx)*speed;
  const acc = p.onGround ? 12 : 4;
  p.vel[0] += (tx - p.vel[0])*Math.min(1, acc*dt);
  p.vel[2] += (tz - p.vel[2])*Math.min(1, acc*dt);

  p.inWater = entityInWater(p);
  if(p.inWater){
    p.vel[1] -= 8*dt;
    p.vel[1] *= Math.max(0, 1 - dt*1.5);
    if(p.vel[1] < -3) p.vel[1] = -3;
    if(input.jump) p.vel[1] = Math.min(p.vel[1] + 30*dt, 3.0);
  } else {
    p.vel[1] -= 26*dt;
    if(p.vel[1] < -50) p.vel[1] = -50;
    if(input.jump && p.onGround){ p.vel[1] = 8.4; Sfx.play('jump'); }
  }
  const prevVy = p.vel[1];
  const wasGround = p.onGround;
  moveEntity(p, dt);
  if(p.onGround && !wasGround && prevVy < -14 && !p.inWater){
    const dmg = Math.floor((-prevVy - 14)*0.7);
    if(dmg > 0) p.hurt(dmg, null);
  }
  if(IS_TOUCH && p.blockedH && p.onGround && len > 0.3 && !p.inWater) p.vel[1] = 8.0; // auto-jump
  p.walkT += Math.hypot(p.vel[0], p.vel[2])*dt*1.6;
  if(p.swingT < 1) p.swingT += dt/0.22;

  p.sinceHurt += dt;
  if(p.hurtCd > 0) p.hurtCd -= dt;
  if(p.sinceHurt > 8 && p.hp < p.maxHp){
    p.regenAcc += dt;
    if(p.regenAcc >= 1.2){
      p.regenAcc = 0;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      ui.heartsDirty = true;
    }
  }
}

/* ---------- targeting, mining, placing, throwing, attacking ---------- */
const mining = { x: 0, y: 0, z: 0, active: false, prog: 0, need: 1 };

function updateTargeting(g){
  const eye = playerEye();
  const dir = lookDir(p_recLook().yaw, p_recLook().pitch);
  g.look = { ox: eye[0], oy: eye[1], oz: eye[2], dx: dir[0], dy: dir[1], dz: dir[2] };
  g.selBlock = raycastWorld(eye[0], eye[1], eye[2], dir[0], dir[1], dir[2], 5.5);
}
function p_recLook(){ return player; }

function updateMining(dt, g){
  if(!input.breaking || player.dead){
    mining.active = false;
    return;
  }
  const hit = g.selBlock;
  if(!hit){ mining.active = false; return; }
  if(!mining.active || mining.x !== hit.x || mining.y !== hit.y || mining.z !== hit.z){
    mining.active = true;
    mining.x = hit.x; mining.y = hit.y; mining.z = hit.z;
    mining.need = bd(hit.id).hard;
    mining.prog = 0;
  }
  mining.prog += dt;
  if(Math.random() < dt*8) Sfx.play('dig');
  if(player.swingT >= 1) player.swing();
  if(mining.prog >= mining.need){
    breakBlock(hit.x, hit.y, hit.z, g);
    mining.active = false;
  }
}

function breakBlock(x, y, z, g){
  const id = W.get(x, y, z);
  const def = bd(id);
  if(!def || def.liquid) return;
  W.set(x, y, z, B.AIR);
  const col = Renderer.avgColor[faceTile(def, 'side')] || [0.5, 0.5, 0.5];
  spawnParticles(x + 0.5, y + 0.5, z + 0.5, 10, col, 0.09);
  Sfx.play('break');
  if(def.drop) addItem('block', def.drop, 1);
  else if(id === B.LEAVES && Math.random() < 0.07){
    addItem('pineapple', null, 1);
    ui.toast('A pineapple fell out of the leaves!');
  }
}

function boxIntersectsEntity(bx, by, bz, e){
  const hw = e.w/2;
  return bx + 1 > e.pos[0] - hw && bx < e.pos[0] + hw &&
         by + 1 > e.pos[1] && by < e.pos[1] + e.h &&
         bz + 1 > e.pos[2] - hw && bz < e.pos[2] + hw;
}

function tryUse(g){
  if(player.dead || g.state !== 'playing'){ g.lastUseResult = 'not-playing'; return; }
  const e = HOTBAR[player.sel];
  player.swing();
  if(e.kind === 'sword'){ g.lastUseResult = 'sword-swing'; Sfx.play('swing'); return; }
  if(e.kind === 'pineapple'){
    if(e.count <= 0){ g.lastUseResult = 'no-pineapple'; ui.toast('No pineapples — collect the ones they miss!'); Sfx.play('denied'); return; }
    e.count--;
    ui.invDirty = true;
    const dir = lookDir(player.yaw, player.pitch);
    const eye = playerEye();
    projectileSpawn(
      eye[0] + dir[0]*0.4, eye[1] + dir[1]*0.4 - 0.1, eye[2] + dir[2]*0.4,
      dir[0]*22, dir[1]*22 + 1.5, dir[2]*22, 'player'
    );
    g.lastUseResult = 'thrown';
    Sfx.play('throw');
    return;
  }
  // place a block
  if(e.count <= 0){ g.lastUseResult = 'empty-slot'; ui.toast('Out of ' + e.name); Sfx.play('denied'); return; }
  const hit = g.selBlock;
  if(!hit || (hit.fx === 0 && hit.fy === 0 && hit.fz === 0)){ g.lastUseResult = 'no-target'; return; }
  const tx = hit.x + hit.fx, ty = hit.y + hit.fy, tz = hit.z + hit.fz;
  if(!W.inB(tx, ty, tz)){ g.lastUseResult = 'out-of-world'; return; }
  const cur = W.get(tx, ty, tz);
  if(cur !== B.AIR && cur !== B.WATER){ g.lastUseResult = 'occupied'; return; }
  if(boxIntersectsEntity(tx, ty, tz, player)){ g.lastUseResult = 'in-player'; return; }
  for(const pd of g.pandas) if(!pd.dead && boxIntersectsEntity(tx, ty, tz, pd)){ g.lastUseResult = 'in-panda'; return; }
  e.count--;
  ui.invDirty = true;
  W.set(tx, ty, tz, e.id);
  g.lastUseResult = 'placed ' + e.name + ' at ' + tx + ',' + ty + ',' + tz;
  Sfx.play('place');
}

function tryAttack(g){
  if(player.dead || g.state !== 'playing') return;
  player.swing();
  const lk = g.look;
  if(!lk) return;
  let best = null, bestT = 1e9, bestKind = null;
  for(const pr of Projectiles){
    const t = rayAABB(lk.ox, lk.oy, lk.oz, lk.dx, lk.dy, lk.dz,
      pr.pos[0] - 0.25, pr.pos[1] - 0.25, pr.pos[2] - 0.25,
      pr.pos[0] + 0.25, pr.pos[1] + 0.25, pr.pos[2] + 0.25, 3.4);
    if(t >= 0 && t < bestT){ bestT = t; best = pr; bestKind = 'proj'; }
  }
  for(const pd of g.pandas){
    if(pd.dead) continue;
    const t = rayAABB(lk.ox, lk.oy, lk.oz, lk.dx, lk.dy, lk.dz,
      pd.pos[0] - 0.65, pd.pos[1] - 0.1, pd.pos[2] - 0.65,
      pd.pos[0] + 0.65, pd.pos[1] + 1.5, pd.pos[2] + 0.65, 3.4);
    if(t >= 0 && t < bestT){ bestT = t; best = pd; bestKind = 'panda'; }
  }
  const bhit = raycastWorld(lk.ox, lk.oy, lk.oz, lk.dx, lk.dy, lk.dz, Math.min(bestT, 3.4));
  if(best && (!bhit || bhit.dist >= bestT)){
    if(bestKind === 'panda'){
      const dx = best.pos[0] - lk.ox, dz = best.pos[2] - lk.oz;
      const d = Math.hypot(dx, dz) || 1;
      best.hurt(4, dx/d*5, dz/d*5, g);
    } else {
      spawnParticles(best.pos[0], best.pos[1], best.pos[2], 6, [0.92, 0.72, 0.2], 0.08);
      Projectiles.splice(Projectiles.indexOf(best), 1);
      Sfx.play('splat');
      ui.toast('Pineapple deflected!');
    }
  } else {
    Sfx.play('swing');
  }
}

function pickBlock(){
  const hit = game.selBlock;
  if(!hit) return;
  const def = bd(hit.id);
  const want = def.drop || hit.id;
  for(let i = 0; i < 9; i++){
    const e = HOTBAR[i];
    if(e.kind === 'block' && e.id === want){ player.sel = i; ui.slotDirty = true; return; }
  }
  ui.toast(def.name + ' is not placeable');
}
