'use strict';
/* PandaCraft — pandas, pineapple projectiles, pickups, particles */

const Projectiles = [];
const pickups = [];
const particles = [];

function spawnParticles(x, y, z, n, color, size){
  for(let i = 0; i < n; i++){
    particles.push({
      pos: [x + (Math.random() - 0.5)*0.3, y + (Math.random() - 0.5)*0.3, z + (Math.random() - 0.5)*0.3],
      vel: [(Math.random() - 0.5)*4, Math.random()*4 + 1, (Math.random() - 0.5)*4],
      life: 0.4 + Math.random()*0.4,
      size: size*(0.7 + Math.random()*0.6),
      color
    });
  }
}

function updateParticles(dt){
  for(let i = particles.length - 1; i >= 0; i--){
    const pt = particles[i];
    pt.life -= dt;
    if(pt.life <= 0){ particles.splice(i, 1); continue; }
    pt.vel[1] -= 18*dt;
    const nx = pt.pos[0] + pt.vel[0]*dt, ny = pt.pos[1] + pt.vel[1]*dt, nz = pt.pos[2] + pt.vel[2]*dt;
    if(W.solidAt(Math.floor(nx), Math.floor(ny), Math.floor(nz))){
      pt.vel[1] = Math.abs(pt.vel[1])*0.3;
      pt.vel[0] *= 0.6; pt.vel[2] *= 0.6;
      if(pt.vel[1] < 0.5){ pt.vel[0] = 0; pt.vel[2] = 0; pt.vel[1] = 0; }
    } else {
      pt.pos[0] = nx; pt.pos[1] = ny; pt.pos[2] = nz;
    }
  }
}

function drawParticles(R){
  for(const pt of particles){
    const m = mMul(mT(pt.pos[0], pt.pos[1], pt.pos[2]), mS(pt.size, pt.size, pt.size));
    R.drawMesh(R.meshes.unit, m, [pt.color[0], pt.color[1], pt.color[2], 1], false);
  }
}

function makePickup(x, y, z){
  return { pos: [x, y, z], vel: [0, 0, 0], w: 0.25, h: 0.25, age: 0, onGround: false, blockedH: false, inWater: false };
}

function updatePickups(dt, g){
  const p = g.player;
  for(let i = pickups.length - 1; i >= 0; i--){
    const pk = pickups[i];
    pk.age += dt;
    pk.vel[1] -= 24*dt;
    if(pk.vel[1] < -20) pk.vel[1] = -20;
    if(W.waterAt(Math.floor(pk.pos[0]), Math.floor(pk.pos[1]), Math.floor(pk.pos[2]))){
      pk.vel[1] = Math.min(pk.vel[1] + 40*dt, 1.0);
    }
    pk.vel[0] *= Math.max(0, 1 - dt*4);
    pk.vel[2] *= Math.max(0, 1 - dt*4);
    moveEntity(pk, dt);
    if(!p.dead){
      const dx = p.pos[0] - pk.pos[0], dy = (p.pos[1] + 0.9) - pk.pos[1], dz = p.pos[2] - pk.pos[2];
      const d = Math.hypot(dx, dy, dz);
      if(d < 1.4){
        if(d > 0.4){
          pk.pos[0] += dx/d*dt*4; pk.pos[1] += dy/d*dt*4; pk.pos[2] += dz/d*dt*4;
        }
        if(d < 0.6){
          addItem('pineapple', null, 1);
          Sfx.play('pickup');
          ui.toast('+1 Pineapple');
          pickups.splice(i, 1);
          continue;
        }
      }
    }
    if(pk.age > 120) pickups.splice(i, 1);
  }
}

function drawPineapple(R, pos, s, spin){
  let m = mT(pos[0], pos[1], pos[2]);
  m = mMul(m, mRY(spin));
  const m2 = mMul(m, mS(0.3*s, 0.38*s, 0.3*s));
  R.drawMesh(R.meshes.pine, m2, [1, 1, 1, 1], true);
  const m3 = mMul(m, mMul(mT(0, 0.24*s, 0), mS(s, s, s)));
  R.drawMesh(R.meshes.crown, m3, [0.3, 0.62, 0.25, 1], false);
}

function projectileSpawn(x, y, z, vx, vy, vz, owner){
  Projectiles.push({ pos: [x, y, z], vel: [vx, vy, vz], owner, life: 8, spin: Math.random()*6 });
}

function splat(pr, g, pickupChance){
  spawnParticles(pr.pos[0], pr.pos[1], pr.pos[2], 8, [0.92, 0.72, 0.2], 0.09);
  Sfx.play('splat');
  const chance = (pickupChance === undefined) ? 1 : pickupChance;
  if(Math.random() < chance) pickups.push(makePickup(pr.pos[0], pr.pos[1] + 0.2, pr.pos[2]));
}

function updateProjectiles(dt, g){
  for(let i = Projectiles.length - 1; i >= 0; i--){
    const pr = Projectiles[i];
    pr.life -= dt; pr.spin += dt*10;
    let remove = pr.life <= 0;
    const sub = 3;
    for(let s = 0; s < sub && !remove; s++){
      const sdt = dt/sub;
      pr.vel[1] -= 20*sdt;
      const nx = pr.pos[0] + pr.vel[0]*sdt;
      const ny = pr.pos[1] + pr.vel[1]*sdt;
      const nz = pr.pos[2] + pr.vel[2]*sdt;
      if(W.waterAt(Math.floor(nx), Math.floor(ny), Math.floor(nz))){
        pr.vel[1] = Math.min(pr.vel[1] + 30*sdt, 1.5);
      }
      if(W.solidAt(Math.floor(nx), Math.floor(ny), Math.floor(nz))){
        splat(pr, g, pr.owner === 'player' ? 1 : 0.55);
        remove = true;
        break;
      }
      pr.pos[0] = nx; pr.pos[1] = ny; pr.pos[2] = nz;
      if(pr.owner === 'panda'){
        const p = g.player;
        if(!p.dead && Math.abs(nx - p.pos[0]) < 0.55 && Math.abs(nz - p.pos[2]) < 0.55 && ny > p.pos[1] - 0.2 && ny < p.pos[1] + 2.0){
          p.hurt(4, pr.pos);
          splat(pr, g, 0.5);
          remove = true;
        }
      } else {
        for(const pd of g.pandas){
          if(pd.dead) continue;
          if(Math.abs(nx - pd.pos[0]) < 0.8 && Math.abs(nz - pd.pos[2]) < 0.8 && ny > pd.pos[1] - 0.3 && ny < pd.pos[1] + 1.6){
            pd.hurt(8, pr.vel[0]*0.25, pr.vel[2]*0.25, g);
            splat(pr, g, 1);
            remove = true;
            break;
          }
        }
      }
    }
    if(remove) Projectiles.splice(i, 1);
  }
}

/* ---------- pandas ---------- */
function ballisticVel(from, to, speed, g){
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const hd = Math.hypot(dx, dz);
  const t = Math.max(0.25, hd/speed);
  return [dx/t, dy/t + 0.5*g*t, dz/t];
}

function hasLOS(a, b){
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const d = Math.hypot(dx, dy, dz);
  if(d < 0.001) return true;
  return !raycastWorld(a[0], a[1], a[2], dx/d, dy/d, dz/d, d);
}

function spawnPanda(g, minD, maxD){
  const p = g.player.pos;
  for(let t = 0; t < 30; t++){
    const a = Math.random()*Math.PI*2;
    const r = minD + Math.random()*(maxD - minD);
    const x = Math.floor(p[0] + Math.cos(a)*r);
    const z = Math.floor(p[2] + Math.sin(a)*r);
    if(x < 2 || z < 2 || x > W.SX - 3 || z > W.SZ - 3) continue;
    const y = W.surfaceY(x, z);
    if(y < 0 || y > W.SY - 4) continue;
    const ground = W.get(x, y, z);
    if(ground === B.WATER || ground === B.LEAVES) continue;
    if(W.solidAt(x, y + 1, z) || W.solidAt(x, y + 2, z)) continue;
    g.pandas.push(new Panda(x + 0.5, y + 1.05, z + 0.5));
    return true;
  }
  return false;
}

function Panda(x, y, z){
  this.pos = [x, y, z]; this.vel = [0, 0, 0];
  this.w = 0.9; this.h = 1.15;
  this.yaw = Math.random()*Math.PI*2;
  this.hp = 12; this.maxHp = 12;
  this.throwCd = 1.5 + Math.random()*2;
  this.windup = -1;
  this.hurtT = 0; this.legPhase = Math.random()*10;
  this.wanderT = 0; this.moving = false;
  this.onGround = false; this.blockedH = false; this.inWater = false;
  this.dead = false;
}

Panda.prototype.update = function(dt, g){
  const p = g.player;
  const dx = p.pos[0] - this.pos[0], dz = p.pos[2] - this.pos[2];
  const dist = Math.hypot(dx, dz, p.pos[1] - this.pos[1]);
  const hd = Math.hypot(dx, dz);
  let speed = 0;

  if(g.state === 'playing' && !p.dead){
    if(this.windup >= 0){
      this.windup -= dt;
      if(hd > 0.01) this.yaw = Math.atan2(-dx, -dz);
      if(this.windup <= 0){ this.throwFruit(g); this.windup = -1; }
    } else if(dist < 26 && hd > 0.01){
      this.yaw = Math.atan2(-dx, -dz);
      speed = hd > 9 ? 1.9 : 0;
      this.throwCd -= dt;
      if(hd < 14 && this.throwCd <= 0){
        const eye = [this.pos[0], this.pos[1] + 1.0, this.pos[2]];
        const tgt = [p.pos[0], p.pos[1] + 1.2, p.pos[2]];
        if(hasLOS(eye, tgt)) this.windup = 0.55;
      }
    } else {
      this.wanderT -= dt;
      if(this.wanderT <= 0){
        this.wanderT = 2 + Math.random()*4;
        this.moving = Math.random() < 0.6;
        if(this.moving) this.yaw = Math.random()*Math.PI*2;
      }
      if(this.moving) speed = 0.7;
    }
  }

  if(speed > 0){
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    this.vel[0] += (fx*speed - this.vel[0])*Math.min(1, dt*8);
    this.vel[2] += (fz*speed - this.vel[2])*Math.min(1, dt*8);
  } else {
    this.vel[0] *= Math.max(0, 1 - dt*8);
    this.vel[2] *= Math.max(0, 1 - dt*8);
  }
  this.inWater = entityInWater(this);
  if(this.inWater){
    this.vel[1] -= 6*dt;
    this.vel[1] += 16*dt;
    this.vel[1] = clamp(this.vel[1], -1.5, 1.5);
  } else {
    this.vel[1] -= 24*dt;
    if(this.vel[1] < -40) this.vel[1] = -40;
  }
  moveEntity(this, dt);
  if(this.blockedH && this.onGround && speed > 0) this.vel[1] = 7.6; // hop up ledges
  this.legPhase += Math.hypot(this.vel[0], this.vel[2])*dt*4;
  if(this.hurtT > 0) this.hurtT -= dt;
  if(dist < 1.1 && hd > 0.001){
    const push = (1.1 - hd)*4*dt;
    this.pos[0] -= dx/hd*push;
    this.pos[2] -= dz/hd*push;
  }
};

Panda.prototype.throwFruit = function(g){
  const p = g.player;
  const from = [this.pos[0], this.pos[1] + 1.05, this.pos[2]];
  const tgt = [
    p.pos[0] + p.vel[0]*0.35 + (Math.random()*2 - 1)*1.3,
    p.pos[1] + 1.0 + (Math.random()*2 - 1)*0.5,
    p.pos[2] + p.vel[2]*0.35 + (Math.random()*2 - 1)*1.3
  ];
  const v = ballisticVel(from, tgt, 15, 20);
  projectileSpawn(from[0], from[1], from[2], v[0], v[1], v[2], 'panda');
  Sfx.play('throw');
  this.throwCd = Math.max(1.5, 2.6 + Math.random()*2 - p.score*0.06);
};

Panda.prototype.hurt = function(dmg, kx, kz, g){
  if(this.dead) return;
  this.hp -= dmg;
  this.hurtT = 0.3;
  this.vel[0] += kx; this.vel[2] += kz;
  this.vel[1] = Math.max(this.vel[1], 4);
  Sfx.play('hit');
  spawnParticles(this.pos[0], this.pos[1] + 0.7, this.pos[2], 6, [0.9, 0.2, 0.2], 0.1);
  if(this.hp <= 0){
    this.dead = true;
    g.player.score++;
    ui.setScore(g.player.score);
    Sfx.play('squeak');
    spawnParticles(this.pos[0], this.pos[1] + 0.6, this.pos[2], 16, [0.95, 0.95, 0.95], 0.14);
    spawnParticles(this.pos[0], this.pos[1] + 0.6, this.pos[2], 10, [0.12, 0.12, 0.13], 0.12);
    const n = 1 + ((Math.random()*2)|0);
    for(let i = 0; i < n; i++){
      pickups.push(makePickup(this.pos[0] + (Math.random() - 0.5), this.pos[1] + 0.5, this.pos[2] + (Math.random() - 0.5)));
    }
    ui.toast('Panda defeated! It dropped pineapples.');
  }
};

Panda.prototype.draw = function(){
  const R = Renderer;
  const base = mMul(mT(this.pos[0], this.pos[1], this.pos[2]), mRY(this.yaw));
  const flash = this.hurtT > 0;
  const wt = flash ? [1, 0.35, 0.35, 1] : [0.96, 0.96, 0.97, 1];
  const bt = flash ? [1, 0.25, 0.25, 1] : [0.13, 0.13, 0.14, 1];
  const box = (center, size, tint) => {
    R.drawBox(mMul(base, mMul(mT(center[0], center[1], center[2]), mS(size[0], size[1], size[2]))), tint);
  };
  const leg = (x, z, sw) => {
    let m = mMul(base, mT(x, 0.62, z));
    m = mMul(m, mRX(sw));
    m = mMul(m, mT(0, -0.28, 0));
    m = mMul(m, mS(0.24, 0.58, 0.26));
    R.drawBox(m, bt);
  };
  box([0, 0.66, 0], [0.72, 0.62, 1.05], wt);          // body
  box([0, 1.08, -0.62], [0.58, 0.48, 0.42], wt);      // head
  box([-0.2, 1.42, -0.66], [0.16, 0.16, 0.12], bt);   // ears
  box([0.2, 1.42, -0.66], [0.16, 0.16, 0.12], bt);
  box([-0.15, 1.14, -0.845], [0.16, 0.2, 0.03], bt);  // eye patches
  box([0.15, 1.14, -0.845], [0.16, 0.2, 0.03], bt);
  box([-0.15, 1.16, -0.865], [0.06, 0.07, 0.02], [1, 1, 1, 1]); // eyes
  box([0.15, 1.16, -0.865], [0.06, 0.07, 0.02], [1, 1, 1, 1]);
  box([0, 0.97, -0.845], [0.12, 0.09, 0.04], bt);     // nose
  const sw = Math.sin(this.legPhase*3)*0.55;
  leg(-0.26, 0.36, sw);
  leg(0.26, 0.36, -sw);
  leg(-0.26, -0.36, -sw);
  leg(0.26, -0.36, sw);
};
