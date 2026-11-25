/* Pineapple Panda Siege: a small voxel game on raw WebGL. Classic script, opens from file://. */
(function () {
'use strict';

// ---------- constants
const SX = 64, SY = 32, SZ = 64, CS = 16;          // world size in blocks; chunk size in x and z
const WCX = SX / CS, WCZ = SZ / CS;
const GRAVITY = 28, MAX_FALL = -55, JUMP_V = 8.6, WALK = 4.6;
const PINE_G = 14, PANDA_HP = 4, MAX_PANDAS = 7, PLAYER_HP = 20;
const REACH = 6, SENS = 0.0055;

const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, LOG = 4, PLANKS = 5, COBBLE = 6, LEAVES = 7;
const ITEM_SWORD = 10, ITEM_SLING = 11, ITEM_SHIELD = 12;
const HOTBAR = [GRASS, DIRT, STONE, PLANKS, COBBLE, LOG, ITEM_SWORD, ITEM_SLING, ITEM_SHIELD];
const ITEM_NAME = { 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Log', 5: 'Planks', 6: 'Cobble',
  10: 'Sword', 11: 'Sling', 12: 'Shield' };
const ITEM_SWATCH = { 10: '#c9d1d9', 11: '#8b5a2b', 12: '#a0692b' };

function rep(c) { return [c, c, c, c, c, c]; }
// Face colours in the order +x, -x, +y, -y, +z, -z
const BLOCK_COLORS = {
  1: [[0.45, 0.32, 0.19], [0.45, 0.32, 0.19], [0.36, 0.72, 0.28], [0.5, 0.36, 0.22], [0.45, 0.32, 0.19], [0.45, 0.32, 0.19]],
  2: rep([0.5, 0.36, 0.22]),
  3: rep([0.52, 0.52, 0.54]),
  4: [[0.42, 0.29, 0.15], [0.42, 0.29, 0.15], [0.72, 0.56, 0.33], [0.72, 0.56, 0.33], [0.42, 0.29, 0.15], [0.42, 0.29, 0.15]],
  5: rep([0.78, 0.6, 0.38]),
  6: rep([0.46, 0.46, 0.47]),
  7: rep([0.2, 0.55, 0.2]),
};
const SWATCH_RGB = { 1: '#5fb546', 2: '#805c38', 3: '#858589', 4: '#b08a50', 5: '#c79960', 6: '#757578', 7: '#338c33' };

// Faces: shade factor and the four corners as signs on the local axes (x, y, z)
const FACES = [
  { shade: 0.85, c: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
  { shade: 0.7, c: [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]] },
  { shade: 1.0, c: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]] },
  { shade: 0.5, c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { shade: 0.78, c: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { shade: 0.62, c: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
];
const AX = [1, 0, 0], AY = [0, 1, 0], AZ = [0, 0, 1];

// ---------- DOM
const $ = (id) => document.getElementById(id);
const canvas = $('c');
const gl = canvas.getContext('webgl', { antialias: true }) || canvas.getContext('experimental-webgl');
if (!gl) {
  document.body.innerHTML = '<p style="padding:20px;font-family:sans-serif">This game needs WebGL, which this browser does not offer.</p>';
  return;
}
const IS_TOUCH = (navigator.maxTouchPoints > 0) || matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) $('touch').classList.remove('hidden');

// ---------- small math helpers
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function hash2(a, b) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function perspective(fovy, asp, n, f) {
  const t = 1 / Math.tan(fovy / 2);
  return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
}
function lookAt(e, c, u) {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
  l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1,
  ]);
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---------- WebGL setup
function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER,
  'attribute vec3 aPos; attribute vec4 aCol; uniform mat4 uVP; uniform vec3 uEye;' +
  'varying vec4 vCol; varying float vFog;' +
  'void main(){ gl_Position = uVP*vec4(aPos,1.0); vCol = aCol;' +
  ' vFog = clamp((distance(aPos,uEye)-40.0)/40.0, 0.0, 1.0); }'));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER,
  'precision mediump float; varying vec4 vCol; varying float vFog; uniform vec3 uFog;' +
  'void main(){ gl_FragColor = vec4(mix(vCol.rgb, uFog, vFog), vCol.a); }'));
gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
const LOC = {
  pos: gl.getAttribLocation(prog, 'aPos'), col: gl.getAttribLocation(prog, 'aCol'),
  vp: gl.getUniformLocation(prog, 'uVP'), eye: gl.getUniformLocation(prog, 'uEye'),
  fog: gl.getUniformLocation(prog, 'uFog'),
};
const SKY = [0.55, 0.75, 0.95];
gl.clearColor(SKY[0], SKY[1], SKY[2], 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.uniform3f(LOC.fog, SKY[0], SKY[1], SKY[2]);
gl.enableVertexAttribArray(LOC.pos);
gl.enableVertexAttribArray(LOC.col);
const dynBuf = gl.createBuffer();

// ---------- world
const blocks = new Uint8Array(SX * SY * SZ);
const idx = (x, y, z) => (y * SZ + z) * SX + x;
function getBlock(x, y, z) {
  if (x < 0 || x >= SX || z < 0 || z >= SZ || y < 0 || y >= SY) return AIR;
  return blocks[idx(x, y, z)];
}
// Collision view: outside the world counts as solid, so nothing leaves the map.
function solid(x, y, z) {
  if (x < 0 || x >= SX || z < 0 || z >= SZ || y < 0) return true;
  if (y >= SY) return false;
  return blocks[idx(x, y, z)] !== AIR;
}
function setRaw(x, y, z, id) {
  if (x < 0 || x >= SX || z < 0 || z >= SZ || y < 0 || y >= SY) return;
  blocks[idx(x, y, z)] = id;
}
const SEED = Math.random() * 1000;
function heightAt(x, z) {
  const h = 14 + (vnoise(x / 10 + SEED, z / 10 - SEED) - 0.5) * 14 + (vnoise(x / 4, z / 4 + SEED) - 0.5) * 3;
  return clamp(Math.floor(h), 6, SY - 9);
}
function surfaceY(x, z) {
  for (let y = SY - 1; y >= 0; y--) if (solid(x, y, z)) return y + 1;
  return 0;
}
function generate() {
  blocks.fill(AIR);
  const H = new Int32Array(SX * SZ);
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    const h = heightAt(x, z);
    H[z * SX + x] = h;
    for (let y = 0; y < h; y++) setRaw(x, y, z, y === h - 1 ? GRASS : (y >= h - 4 ? DIRT : STONE));
  }
  for (let i = 0; i < 46; i++) {
    const x = 3 + Math.floor(Math.random() * (SX - 6)), z = 3 + Math.floor(Math.random() * (SZ - 6));
    if (Math.hypot(x - 32, z - 32) < 6) continue;
    const base = H[z * SX + x];
    const trunk = 4 + Math.floor(Math.random() * 2);
    for (let y = 0; y < trunk; y++) setRaw(x, base + y, z, LOG);
    const top = base + trunk;
    for (let ly = top - 2; ly <= top + 1; ly++) {
      const r = ly >= top + 1 ? 1 : 2;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        const cx = x + dx, cz = z + dz;
        if (cx < 0 || cx >= SX || cz < 0 || cz >= SZ) continue;
        if (blocks[idx(cx, ly, cz)] === AIR) setRaw(cx, ly, cz, LEAVES);
      }
    }
  }
}

// ---------- meshing
const chunks = [];
for (let cz = 0; cz < WCZ; cz++) for (let cx = 0; cx < WCX; cx++) {
  chunks.push({ cx, cz, buf: gl.createBuffer(), count: 0, dirty: true });
}
function markDirty(x, z) {
  const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const ncx = cx + dx, ncz = cz + dz;
    if (ncx < 0 || ncz < 0 || ncx >= WCX || ncz >= WCZ) continue;
    chunks[ncz * WCX + ncx].dirty = true;
  }
}
function setBlock(x, y, z, id) {
  blocks[idx(x, y, z)] = id;
  markDirty(x, z);
}
// Appends the 6 faces (2 triangles each) of an oriented box to out.
// Vertex format: x, y, z, r, g, b, a.
function emitBox(out, c, ax, ay, az, h, cols, alpha, mask, jitter) {
  for (let f = 0; f < 6; f++) {
    if (mask && !mask[f]) continue;
    const F = FACES[f], col = cols[f], s = F.shade * (jitter || 1);
    const r = col[0] * s, g = col[1] * s, b = col[2] * s;
    const P = F.c.map((k) => [
      c[0] + ax[0] * k[0] * h[0] + ay[0] * k[1] * h[1] + az[0] * k[2] * h[2],
      c[1] + ax[1] * k[0] * h[0] + ay[1] * k[1] * h[1] + az[1] * k[2] * h[2],
      c[2] + ax[2] * k[0] * h[0] + ay[2] * k[1] * h[1] + az[2] * k[2] * h[2],
    ]);
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const p = P[i];
      out.push(p[0], p[1], p[2], r, g, b, alpha);
    }
  }
}
function buildChunk(c) {
  const out = [];
  const x0 = c.cx * CS, z0 = c.cz * CS;
  for (let y = 0; y < SY; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
    const id = getBlock(x, y, z);
    if (id === AIR) continue;
    const mask = [
      getBlock(x + 1, y, z) === AIR, getBlock(x - 1, y, z) === AIR,
      getBlock(x, y + 1, z) === AIR, getBlock(x, y - 1, z) === AIR,
      getBlock(x, y, z + 1) === AIR, getBlock(x, y, z - 1) === AIR,
    ];
    if (!mask.some(Boolean)) continue;
    const jitter = 0.93 + 0.14 * hash2(x * 73 + y * 31, z * 17 + 7);
    emitBox(out, [x + 0.5, y + 0.5, z + 0.5], AX, AY, AZ, [0.5, 0.5, 0.5], BLOCK_COLORS[id], 1, mask, jitter);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, c.buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.STATIC_DRAW);
  c.count = out.length / 7;
  c.dirty = false;
}

// ---------- physics
function collidesBox(x, y, z, w, h) {
  const x0 = Math.floor(x - w / 2), x1 = Math.floor(x + w / 2 - 1e-4);
  const y0 = Math.floor(y), y1 = Math.floor(y + h - 1e-4);
  const z0 = Math.floor(z - w / 2), z1 = Math.floor(z + w / 2 - 1e-4);
  for (let yy = y0; yy <= y1; yy++) for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) {
    if (solid(xx, yy, zz)) return true;
  }
  return false;
}
// Moves one axis in small steps. Returns false when a block stops the move.
function moveAxis(e, axis, d) {
  if (d === 0) return true;
  const n = Math.max(1, Math.ceil(Math.abs(d) / 0.04)), s = d / n;
  for (let i = 0; i < n; i++) {
    e[axis] += s;
    if (collidesBox(e.x, e.y, e.z, e.w, e.h)) { e[axis] -= s; return false; }
  }
  return true;
}
// Applies velocity to an entity with gravity already added. Sets onGround and returns blocked flags.
function moveEntity(e, dt) {
  e.onGround = false;
  const bx = !moveAxis(e, 'x', e.vx * dt);
  const bz = !moveAxis(e, 'z', e.vz * dt);
  if (!moveAxis(e, 'y', e.vy * dt)) {
    if (e.vy < 0) e.onGround = true;
    e.vy = 0;
  }
  return { bx, bz };
}
function boxOverlapsCell(e, x, y, z) {
  return e.x - e.w / 2 < x + 1 && e.x + e.w / 2 > x && e.y < y + 1 && e.y + e.h > y &&
    e.z - e.w / 2 < z + 1 && e.z + e.w / 2 > z;
}
// Amanatides-Woo voxel walk. Returns the first solid block and the face normal it was entered through.
function raycast(ox, oy, oz, dx, dy, dz, maxd) {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? 1 / Math.abs(dx) : Infinity;
  const tdy = dy !== 0 ? 1 / Math.abs(dy) : Infinity;
  const tdz = dz !== 0 ? 1 / Math.abs(dz) : Infinity;
  let tmx = dx !== 0 ? (dx > 0 ? x + 1 - ox : ox - x) * tdx : Infinity;
  let tmy = dy !== 0 ? (dy > 0 ? y + 1 - oy : oy - y) * tdy : Infinity;
  let tmz = dz !== 0 ? (dz > 0 ? z + 1 - oz : oz - z) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  for (let guard = 0; guard < 200; guard++) {
    if (tmx < tmy && tmx < tmz) { t = tmx; tmx += tdx; x += sx; nx = -sx; ny = 0; nz = 0; }
    else if (tmy < tmz) { t = tmy; tmy += tdy; y += sy; ny = -sy; nx = 0; nz = 0; }
    else { t = tmz; tmz += tdz; z += sz; nz = -sz; nx = 0; ny = 0; }
    if (t > maxd) break;
    if (getBlock(x, y, z) !== AIR) return { x, y, z, nx, ny, nz };
  }
  return null;
}

// ---------- game state
const state = { started: false, sel: 0, score: 0, pandaTimer: 0 };
let P, pandas = [], shots = [], target = null;
const input = { primary: false, secondary: false, shieldKey: false, jump: false, mf: 0, ms: 0 };
const keys = {};
const mouse = { primary: false, secondary: false };
const touch = { act: false, use: false, shield: false, jump: false, joyX: 0, joyY: 0 };
const look = { id: -1, x: 0, y: 0 };

function makePlayer() {
  const x = 32.5, z = 32.5;
  return {
    x, y: surfaceY(32, 32) + 0.01, z, vx: 0, vy: 0, vz: 0, w: 0.6, h: 1.8, onGround: false,
    yaw: 0, pitch: 0, hp: PLAYER_HP, hurt: 0, regenT: 0, actCool: 0, useCool: 0, swing: 0,
    dead: false, shield: false,
  };
}
function spawnPanda() {
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 8;
    const x = clamp(P.x + Math.cos(a) * d, 2.5, SX - 2.5), z = clamp(P.z + Math.sin(a) * d, 2.5, SZ - 2.5);
    const y = surfaceY(Math.floor(x), Math.floor(z));
    if (y <= 0) continue;
    pandas.push({
      x, y, z, vx: 0, vy: 0, vz: 0, w: 0.7, h: 1.5, onGround: false, yaw: 0,
      hp: PANDA_HP, cool: 1 + Math.random() * 2, melee: 0, walk: 0, moving: false,
    });
    return;
  }
}
function resetGame() {
  generate();
  for (let i = 0; i < chunks.length; i++) chunks[i].dirty = true;
  P = makePlayer();
  pandas = []; shots = []; state.score = 0; state.pandaTimer = 0; state.sel = 0;
  for (let i = 0; i < 3; i++) spawnPanda();
}

// ---------- damage and combat
function damagePlayer(dmg) {
  if (P.dead) return;
  P.hp -= dmg;
  P.hurt = 0.35;
  P.regenT = 5;
  if (P.hp <= 0) {
    P.hp = 0;
    P.dead = true;
    $('deadScore').textContent = 'Pandas defeated: ' + state.score;
    $('dead').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  }
}
// True when the projectile or attack comes from in front of the player and the shield is up.
function shieldBlocks(x, z) {
  if (!P.shield) return false;
  const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz);
  if (d < 1e-4) return true;
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  return (dx * fx + dz * fz) / d > 0.2;
}
function throwPineapple(p) {
  const sx = p.x, sy = p.y + 1.3, sz = p.z;
  const tx = P.x + (Math.random() - 0.5) * 2.2, ty = P.y + 0.9 + (Math.random() - 0.5) * 0.8;
  const tz = P.z + (Math.random() - 0.5) * 2.2;
  const t = Math.max(0.6, Math.hypot(tx - sx, tz - sz) / 16);
  shots.push({
    kind: 'pine', owner: 'panda', dmg: 2, g: PINE_G, life: 6,
    x: sx, y: sy, z: sz,
    vx: (tx - sx) / t, vy: (ty - sy) / t + 0.5 * PINE_G * t, vz: (tz - sz) / t,
  });
}
function knock(e, fromX, fromZ, power) {
  const dx = e.x - fromX, dz = e.z - fromZ, d = Math.hypot(dx, dz) || 1;
  e.vx += dx / d * power; e.vz += dz / d * power; e.vy = Math.max(e.vy, 4);
}
function killPanda(i) {
  pandas.splice(i, 1);
  state.score++;
}

// ---------- update
function readInput() {
  input.primary = mouse.primary || touch.act;
  input.secondary = mouse.secondary || touch.use;
  input.shieldKey = !!keys.KeyF || touch.shield;
  input.jump = !!keys.Space || touch.jump;
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - touch.joyY;
  const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touch.joyX;
  const l = Math.hypot(f, s);
  input.mf = l > 1 ? f / l : f;
  input.ms = l > 1 ? s / l : s;
}
function updatePlayer(dt) {
  const yaw = P.yaw;
  const dirX = -Math.sin(yaw) * input.mf + Math.cos(yaw) * input.ms;
  const dirZ = -Math.cos(yaw) * input.mf - Math.sin(yaw) * input.ms;
  P.vx = dirX * WALK; P.vz = dirZ * WALK;
  if (input.jump && P.onGround) P.vy = JUMP_V;
  P.vy = Math.max(MAX_FALL, P.vy - GRAVITY * dt);
  const moving = Math.abs(dirX) + Math.abs(dirZ) > 0.01;
  const blk = moveEntity(P, dt);
  if ((blk.bx || blk.bz) && P.onGround && moving) P.vy = JUMP_V; // step up one block
  P.swing = Math.max(0, P.swing - dt);
  P.hurt = Math.max(0, P.hurt - dt);
  P.regenT -= dt;
  if (P.regenT <= 0 && P.hp < PLAYER_HP) P.hp = Math.min(PLAYER_HP, P.hp + dt * 1.0);
  P.actCool -= dt; P.useCool -= dt;
}
function eyePos() { return [P.x, P.y + 1.62, P.z]; }
function forwardVec() {
  const cp = Math.cos(P.pitch);
  return [-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp];
}
function place(item) {
  if (!target) return;
  P.useCool = 0.25;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  if (x < 0 || x >= SX || z < 0 || z >= SZ || y < 0 || y >= SY) return;
  if (blocks[idx(x, y, z)] !== AIR || boxOverlapsCell(P, x, y, z)) return;
  setBlock(x, y, z, item);
}
function primary(item, eye, fwd) {
  if (item < 10) {
    P.actCool = 0.22;
    if (target) setBlock(target.x, target.y, target.z, AIR);
  } else if (item === ITEM_SWORD) {
    P.actCool = 0.4; P.swing = 0.25;
    for (let i = pandas.length - 1; i >= 0; i--) {
      const p = pandas[i];
      const vx = p.x - eye[0], vy = p.y + 0.8 - eye[1], vz = p.z - eye[2];
      const d = Math.hypot(vx, vy, vz);
      if (d < 3.2 && (vx * fwd[0] + vy * fwd[1] + vz * fwd[2]) / d > 0.5) {
        p.hp -= 2;
        knock(p, P.x, P.z, 5);
        if (p.hp <= 0) killPanda(i);
      }
    }
  } else if (item === ITEM_SLING) {
    P.actCool = 0.6; P.swing = 0.2;
    shots.push({
      kind: 'pebble', owner: 'player', dmg: 1, g: 8, life: 3,
      x: eye[0] + fwd[0] * 0.6, y: eye[1] + fwd[1] * 0.6 - 0.1, z: eye[2] + fwd[2] * 0.6,
      vx: fwd[0] * 24, vy: fwd[1] * 24 + 2, vz: fwd[2] * 24,
    });
  } else {
    P.actCool = 0.2;
  }
}
function updatePandas(dt) {
  for (let i = pandas.length - 1; i >= 0; i--) {
    const p = pandas[i];
    p.cool -= dt; p.melee -= dt;
    const dx = P.x - p.x, dz = P.z - p.z, dist = Math.hypot(dx, dz) || 0.001;
    p.yaw = Math.atan2(-dx, -dz);
    let dirX = 0, dirZ = 0, speed = 0;
    if (dist > 7) { dirX = dx / dist; dirZ = dz / dist; speed = 2.4; }
    else if (dist < 5) { dirX = -dx / dist; dirZ = -dz / dist; speed = 1.6; }
    else { dirX = -dz / dist * 0.6; dirZ = dx / dist * 0.6; speed = 1.0; }
    if (dist < 2.2 && p.melee <= 0 && !P.dead) {
      if (!shieldBlocks(p.x, p.z)) damagePlayer(2);
      p.melee = 1.4;
    }
    p.vx = dirX * speed; p.vz = dirZ * speed;
    p.moving = speed > 0;
    p.vy = Math.max(MAX_FALL, p.vy - GRAVITY * dt);
    const blk = moveEntity(p, dt);
    if ((blk.bx || blk.bz) && p.onGround && p.moving) p.vy = JUMP_V;
    if (p.moving) p.walk += dt * 9;
    if (dist <= 18 && dist >= 2.5 && p.cool <= 0) {
      throwPineapple(p);
      p.cool = 2.8 + Math.random() * 2.2;
    }
    if (dist > 70) pandas.splice(i, 1);
  }
}
function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt;
    s.vy -= s.g * dt;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    let gone = s.life <= 0 || solid(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z));
    if (!gone && s.owner === 'panda') {
      if (Math.hypot(s.x - P.x, s.y - (P.y + 0.9), s.z - P.z) < 0.6) {
        if (shieldBlocks(s.x, s.z)) { /* blocked by the shield */ }
        else damagePlayer(s.dmg);
        gone = true;
      }
    } else if (!gone) {
      for (let j = pandas.length - 1; j >= 0; j--) {
        const p = pandas[j];
        if (Math.hypot(s.x - p.x, s.y - (p.y + 0.75), s.z - p.z) < 0.7) {
          p.hp -= s.dmg;
          knock(p, s.x, s.z, 2);
          if (p.hp <= 0) killPanda(j);
          gone = true;
          break;
        }
      }
    }
    if (gone) shots.splice(i, 1);
  }
}
function spawnFromTimer(dt) {
  state.pandaTimer -= dt;
  if (state.pandaTimer <= 0 && pandas.length < MAX_PANDAS) {
    spawnPanda();
    state.pandaTimer = 2.5;
  }
}
function update(dt) {
  if (!state.started || P.dead) return;
  readInput();
  updatePlayer(dt);
  const eye = eyePos(), fwd = forwardVec();
  target = raycast(eye[0], eye[1], eye[2], fwd[0], fwd[1], fwd[2], REACH);
  const item = HOTBAR[state.sel];
  P.shield = input.shieldKey || (item === ITEM_SHIELD && input.secondary);
  if (input.primary && P.actCool <= 0) primary(item, eye, fwd);
  if (input.secondary && item < 10 && P.useCool <= 0) place(item);
  updatePandas(dt);
  updateShots(dt);
  spawnFromTimer(dt);
  // rebuild a few dirty chunks per frame
  let budget = 4;
  for (const c of chunks) {
    if (c.dirty && budget-- > 0) buildChunk(c);
  }
}

// ---------- rendering
function emitPanda(out, p) {
  const yaw = p.yaw;
  const F = [-Math.sin(yaw), 0, -Math.cos(yaw)], R = [Math.cos(yaw), 0, -Math.sin(yaw)], U = AY;
  const white = rep([0.96, 0.96, 0.95]), black = rep([0.12, 0.12, 0.13]);
  // point at (right a, up b, forward c) from the feet
  const q = (a, b, c) => [p.x + R[0] * a + F[0] * c, p.y + b, p.z + R[2] * a + F[2] * c];
  const sw = p.moving ? Math.sin(p.walk) * 0.2 : 0;
  emitBox(out, q(0, 0.75, 0), R, U, F, [0.26, 0.3, 0.22], white, 1);
  emitBox(out, q(0, 1.25, 0.2), R, U, F, [0.2, 0.19, 0.18], white, 1);
  emitBox(out, q(0.15, 1.45, 0.02), R, U, F, [0.07, 0.07, 0.04], black, 1);
  emitBox(out, q(-0.15, 1.45, 0.02), R, U, F, [0.07, 0.07, 0.04], black, 1);
  emitBox(out, q(0.1, 1.28, 0.385), R, U, F, [0.05, 0.06, 0.012], black, 1);
  emitBox(out, q(-0.1, 1.28, 0.385), R, U, F, [0.05, 0.06, 0.012], black, 1);
  emitBox(out, q(0.3, 0.9, 0), R, U, F, [0.07, 0.2, 0.09], black, 1);
  emitBox(out, q(-0.3, 0.9, 0), R, U, F, [0.07, 0.2, 0.09], black, 1);
  emitBox(out, q(0.15, 0.12, sw), R, U, F, [0.1, 0.12, 0.1], black, 1);
  emitBox(out, q(-0.15, 0.12, -sw), R, U, F, [0.1, 0.12, 0.1], black, 1);
}
function emitEntities(out) {
  if (target) {
    const black = rep([0, 0, 0]);
    emitBox(out, [target.x + 0.5, target.y + 0.5, target.z + 0.5], AX, AY, AZ, [0.508, 0.508, 0.508], black, 0.22);
  }
  for (const p of pandas) emitPanda(out, p);
  for (const s of shots) {
    if (s.kind === 'pine') {
      emitBox(out, [s.x, s.y, s.z], AX, AY, AZ, [0.13, 0.17, 0.13], rep([0.95, 0.78, 0.2]), 1);
      emitBox(out, [s.x, s.y + 0.2, s.z], AX, AY, AZ, [0.1, 0.05, 0.1], rep([0.2, 0.6, 0.2]), 1);
    } else {
      emitBox(out, [s.x, s.y, s.z], AX, AY, AZ, [0.08, 0.08, 0.08], rep([0.6, 0.6, 0.62]), 1);
    }
  }
}
function emitHeld(out) {
  const eye = eyePos(), F = forwardVec();
  const R = [Math.cos(P.yaw), 0, -Math.sin(P.yaw)];
  const U = cross(R, F);
  const sw = P.swing > 0 ? Math.sin(Math.PI * P.swing / 0.25) : 0;
  const at = (r, u, f) => [
    eye[0] + R[0] * r + U[0] * u + F[0] * f,
    eye[1] + R[1] * r + U[1] * u + F[1] * f,
    eye[2] + R[2] * r + U[2] * u + F[2] * f,
  ];
  const axes = [R, U, F];
  const item = HOTBAR[state.sel];
  const wood = rep([0.55, 0.36, 0.18]);
  if (item < 10) {
    const c = BLOCK_COLORS[item];
    emitBox(out, at(0.32 - sw * 0.05, -0.3 + sw * 0.05, 0.55), R, U, F, [0.13, 0.13, 0.13], c, 1);
  } else if (item === ITEM_SWORD) {
    const b = at(0.3 - sw * 0.1, -0.28 + sw * 0.15, 0.5);
    emitBox(out, b, R, U, F, [0.02, 0.02, 0.28], rep([0.8, 0.85, 0.9]), 1);
    emitBox(out, at(0.3 - sw * 0.1, -0.28 + sw * 0.15, 0.2), R, U, F, [0.03, 0.03, 0.09], rep([0.3, 0.2, 0.1]), 1);
    emitBox(out, at(0.3 - sw * 0.1, -0.28 + sw * 0.15, 0.27), R, U, F, [0.1, 0.02, 0.02], rep([0.6, 0.5, 0.2]), 1);
  } else if (item === ITEM_SLING) {
    const o = at(0.3, -0.3, 0.5);
    emitBox(out, o, axes[0], axes[1], axes[2], [0.03, 0.03, 0.12], wood, 1);
    emitBox(out, at(0.3 + 0.07, -0.3 + 0.12, 0.5), R, U, F, [0.025, 0.08, 0.025], wood, 1);
    emitBox(out, at(0.3 - 0.07, -0.3 + 0.12, 0.5), R, U, F, [0.025, 0.08, 0.025], wood, 1);
  } else if (item === ITEM_SHIELD) {
    const up = P.shield;
    const c = up ? at(-0.02, -0.02, 0.5) : at(0.36, -0.36, 0.5);
    emitBox(out, c, R, U, F, [up ? 0.26 : 0.16, up ? 0.34 : 0.22, 0.03], wood, 1);
    emitBox(out, c, R, U, F, [up ? 0.3 : 0.19, up ? 0.38 : 0.25, 0.02], rep([0.7, 0.7, 0.72]), 1);
  }
}
function drawBuffer(buf, count) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(LOC.pos, 3, gl.FLOAT, false, 28, 0);
  gl.vertexAttribPointer(LOC.col, 4, gl.FLOAT, false, 28, 12);
  gl.drawArrays(gl.TRIANGLES, 0, count);
}
function drawDynamic(arr) {
  if (!arr.length) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(LOC.pos, 3, gl.FLOAT, false, 28, 0);
  gl.vertexAttribPointer(LOC.col, 4, gl.FLOAT, false, 28, 12);
  gl.drawArrays(gl.TRIANGLES, 0, arr.length / 7);
}
function render() {
  const w = canvas.width, h = canvas.height;
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const eye = eyePos(), F = forwardVec();
  const view = lookAt(eye, [eye[0] + F[0], eye[1] + F[1], eye[2] + F[2]], [0, 1, 0]);
  const proj = perspective(70 * Math.PI / 180, w / h, 0.05, 200);
  const vp = mul4(proj, view);
  gl.uniformMatrix4fv(LOC.vp, false, vp);
  gl.uniform3f(LOC.eye, eye[0], eye[1], eye[2]);
  for (const c of chunks) if (c.count) drawBuffer(c.buf, c.count);
  const ents = [];
  emitEntities(ents);
  drawDynamic(ents);
  // held items are drawn on top of the world
  gl.clear(gl.DEPTH_BUFFER_BIT);
  const held = [];
  emitHeld(held);
  drawDynamic(held);
}

// ---------- HUD
const heartsEl = $('hearts'), scoreEl = $('score'), flashEl = $('flash');
const hotbarEl = $('hotbar');
let heartsKey = '';
const slotEls = [];
HOTBAR.forEach((id, i) => {
  const b = document.createElement('button');
  b.className = 'slot';
  const sw = document.createElement('div');
  sw.className = 'swatch';
  sw.style.background = id < 10 ? SWATCH_RGB[id] : ITEM_SWATCH[id];
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = String(i + 1);
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = ITEM_NAME[id];
  b.append(sw, num, label);
  b.addEventListener('pointerdown', (e) => { e.stopPropagation(); state.sel = i; });
  hotbarEl.appendChild(b);
  slotEls.push(b);
});
function updateHUD() {
  slotEls.forEach((b, i) => b.classList.toggle('sel', i === state.sel));
  const hp = P ? P.hp : PLAYER_HP;
  const key = Math.ceil(hp * 2) + '|' + (state.score);
  if (key !== heartsKey) {
    heartsKey = key;
    let html = '';
    for (let i = 0; i < 10; i++) {
      const v = hp - i * 2;
      const cls = v >= 2 ? 'full' : v >= 1 ? 'half' : 'empty';
      html += '<span class="' + cls + '">♥</span>';
    }
    heartsEl.innerHTML = html;
    scoreEl.textContent = 'Pandas defeated: ' + state.score;
  }
  flashEl.style.background = 'rgba(255,0,0,' + (P ? Math.min(0.45, P.hurt * 1.2) : 0).toFixed(3) + ')';
}

// ---------- input
function setSize() {
  const dpr = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener('resize', setSize);
setSize();

function isLocked() { return document.pointerLockElement === canvas; }
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (/^Digit[1-9]$/.test(e.code)) state.sel = parseInt(e.code.slice(5), 10) - 1;
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.primary = mouse.secondary = false; });
window.addEventListener('wheel', (e) => {
  state.sel = (state.sel + (e.deltaY > 0 ? 1 : -1) + HOTBAR.length) % HOTBAR.length;
}, { passive: true });
window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || !state.started) return;
  if (e.button === 0) mouse.primary = true;
  if (e.button === 2) mouse.secondary = true;
  if (!isLocked() && !IS_TOUCH) canvas.requestPointerLock && canvas.requestPointerLock();
});
window.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (e.button === 0) mouse.primary = false;
  if (e.button === 2) mouse.secondary = false;
});
window.addEventListener('pointermove', (e) => {
  if (!state.started || !P || P.dead) return;
  let dx = 0, dy = 0;
  if (isLocked()) { if (performance.now() >= lockSettleUntil) { dx = e.movementX; dy = e.movementY; } }
  else if (e.pointerType === 'mouse' && (e.buttons & 4)) { dx = e.movementX; dy = e.movementY; }
  else if (e.pointerType === 'touch' && e.pointerId === look.id) {
    dx = e.clientX - look.x; dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY;
  }
  if (dx || dy) {
    P.yaw -= dx * SENS;
    P.pitch = clamp(P.pitch - dy * SENS, -1.5, 1.5);
  }
});
let lockSettleUntil = 0;
document.addEventListener('pointerlockchange', () => {
  if (isLocked()) lockSettleUntil = performance.now() + 250; // ignore the movement that came with the click
  else if (state.started && P && !P.dead && !IS_TOUCH) pauseGame();
});

// touch look: a drag that starts on the open area
$('touchLook').addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
});
const endLook = (e) => { if (e.pointerId === look.id) look.id = -1; };
window.addEventListener('pointerup', endLook);
window.addEventListener('pointercancel', endLook);

// joystick
const joy = $('joy'), knob = $('knob');
let joyId = -1, joyCx = 0, joyCy = 0;
const JOY_R = 50;
function joyUpdate(e) {
  const dx = e.clientX - joyCx, dy = e.clientY - joyCy;
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / JOY_R);
  touch.joyX = dx / d * k; touch.joyY = dy / d * k;
  knob.style.transform = 'translate(' + (dx / d * k * JOY_R) + 'px,' + (dy / d * k * JOY_R) + 'px)';
}
joy.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  joyId = e.pointerId;
  const r = joy.getBoundingClientRect();
  joyCx = r.left + r.width / 2; joyCy = r.top + r.height / 2;
  joyUpdate(e);
});
window.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyUpdate(e); });
const joyEnd = (e) => {
  if (e.pointerId !== joyId) return;
  joyId = -1; touch.joyX = 0; touch.joyY = 0; knob.style.transform = 'translate(0px,0px)';
};
window.addEventListener('pointerup', joyEnd);
window.addEventListener('pointercancel', joyEnd);

function holdButton(id, key) {
  const el = $(id);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    touch[key] = true;
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  const up = () => { touch[key] = false; };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
}
holdButton('bAct', 'act');
holdButton('bUse', 'use');
holdButton('bShield', 'shield');
holdButton('bJump', 'jump');

// ---------- menu and flow
function startGame() {
  state.started = true;
  $('menu').classList.add('hidden');
  if (!IS_TOUCH && canvas.requestPointerLock) {
    try { canvas.requestPointerLock(); } catch (_) { /* ignore */ }
  }
}
function pauseGame() {
  state.started = false;
  $('menu').querySelector('#startBtn').textContent = 'Resume';
  $('menu').classList.remove('hidden');
}
$('startBtn').addEventListener('click', startGame);
$('respawnBtn').addEventListener('click', () => {
  $('dead').classList.add('hidden');
  resetGame();
  startGame();
});

// ---------- main loop
resetGame();
window.__pps = { get player() { return P; }, get target() { return target; }, get pandas() { return pandas; }, get shots() { return shots; },
  state, blocks, setBlock, markDirty, idx, HOTBAR, surfaceY, spawnPanda, startGame };
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  updateHUD();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
