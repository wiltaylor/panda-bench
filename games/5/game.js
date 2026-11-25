(() => {
'use strict';

// ---------------------------------------------------------------- helpers
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function rng32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const SEED = (Math.random() * 1e9) | 0;
const rand = rng32(SEED);

const M4 = {
  ident() { const o = new Float32Array(16); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  },
  persp(fov, asp, n, f) {
    const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
  },
  trans(x, y, z) { const o = M4.ident(); o[12] = x; o[13] = y; o[14] = z; return o; },
  scale(x, y, z) { const o = M4.ident(); o[0] = x; o[5] = y; o[10] = z; return o; },
  rotX(a) { const o = M4.ident(), c = Math.cos(a), s = Math.sin(a); o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o; },
  rotY(a) { const o = M4.ident(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o; },
  rotZ(a) { const o = M4.ident(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o; },
  chain(...ms) { let o = ms[0]; for (let i = 1; i < ms.length; i++) o = M4.mul(o, ms[i]); return o; }
};

// ---------------------------------------------------------------- world
const W = 128, H = 64, D = 128, CS = 16;
const world = new Uint8Array(W * H * D);
const bi = (x, y, z) => (y * D + z) * W + x;
function getB(x, y, z) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return 0;
  return world[bi(x, y, z)];
}
function solidAt(x, y, z) {
  if (y < 0 || x < 0 || z < 0 || x >= W || z >= D) return true;
  if (y >= H) return false;
  return world[bi(x, y, z)] !== 0;
}

const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, LOG = 5, LEAVES = 6, PLANKS = 7, BRICK = 8, GLASS = 9, BAMBOO = 10, CORE = 11;
// tex: [top, bottom, side] tile indexes. hard: seconds to break by hand. drop: block gained.
const BLOCKS = [
  null,
  { name: 'Grass', tex: [0, 2, 1], hard: 0.6, drop: DIRT, col: [0.42, 0.72, 0.3] },
  { name: 'Dirt', tex: [2, 2, 2], hard: 0.6, drop: DIRT, col: [0.5, 0.36, 0.24] },
  { name: 'Stone', tex: [3, 3, 3], hard: 2.0, drop: STONE, col: [0.55, 0.56, 0.6] },
  { name: 'Sand', tex: [4, 4, 4], hard: 0.5, drop: GLASS, col: [0.88, 0.8, 0.56] },
  { name: 'Log', tex: [6, 6, 5], hard: 1.2, drop: PLANKS, col: [0.42, 0.3, 0.2] },
  { name: 'Leaves', tex: [7, 7, 7], hard: 0.25, drop: 0, clear: true, col: [0.25, 0.55, 0.25] },
  { name: 'Planks', tex: [8, 8, 8], hard: 1.0, drop: PLANKS, col: [0.75, 0.58, 0.36] },
  { name: 'Brick', tex: [9, 9, 9], hard: 2.2, drop: BRICK, col: [0.7, 0.35, 0.28] },
  { name: 'Glass', tex: [10, 10, 10], hard: 0.35, drop: GLASS, clear: true, col: [0.8, 0.92, 0.96] },
  { name: 'Bamboo', tex: [13, 13, 11], hard: 0.8, drop: PLANKS, col: [0.5, 0.7, 0.3] },
  { name: 'Corestone', tex: [12, 12, 12], hard: Infinity, drop: 0, col: [0.2, 0.2, 0.25] }
];
const opaque = id => id !== 0 && !BLOCKS[id].clear;

// value noise
function hash2(x, z) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + SEED | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  let fx = x - xi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
function fbm(x, z) {
  let s = 0, a = 0.5, t = 0;
  for (let i = 0; i < 4; i++) { s += vnoise(x, z) * a; t += a; a *= 0.5; x *= 2.03; z *= 2.03; }
  return s / t;
}
function topY(x, z) {
  for (let y = H - 1; y >= 0; y--) if (getB(x, y, z)) return y;
  return 0;
}
function setIfAir(x, y, z, id) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (!world[bi(x, y, z)]) world[bi(x, y, z)] = id;
}
const SPAWN = { x: W / 2 + 0.5, y: 0, z: D / 2 + 0.5 };
function genWorld() {
  const hm = new Int32Array(W * D);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    let h = Math.floor(15 + fbm(x / 46, z / 46) * 24);
    // flatten a little around the spawn point
    const dd = Math.hypot(x - W / 2, z - D / 2);
    if (dd < 10) h = Math.round(h + (27 - h) * (1 - dd / 10) * 0.8);
    hm[z * W + x] = h;
    const sandy = h <= 24;
    for (let y = 0; y <= h; y++) {
      let id = STONE;
      if (y === 0) id = CORE;
      else if (y === h) id = sandy ? SAND : GRASS;
      else if (y >= h - 3) id = sandy ? SAND : DIRT;
      world[bi(x, y, z)] = id;
    }
  }
  const nearSpawn = (x, z) => Math.hypot(x - W / 2, z - D / 2) < 5;
  // trees
  for (let i = 0; i < 260; i++) {
    const x = 3 + Math.floor(rand() * (W - 6)), z = 3 + Math.floor(rand() * (D - 6));
    const h = hm[z * W + x];
    if (world[bi(x, h, z)] !== GRASS || nearSpawn(x, z)) continue;
    let ok = true;
    for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2; dx++)
      if (getB(x + dx, hm[(z + dz) * W + x + dx] + 1, z + dz) === LOG) { ok = false; break; }
    if (!ok) continue;
    const th = 4 + Math.floor(rand() * 3), top = h + th;
    for (let ly = top - 2; ly <= top + 1; ly++) {
      const r = ly >= top ? 1 : 2;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && (r === 1 ? ly > top : rand() < 0.6)) continue;
        setIfAir(x + dx, ly, z + dz, LEAVES);
      }
    }
    for (let y = h + 1; y <= top; y++) world[bi(x, y, z)] = LOG;
  }
  // bamboo groves
  for (let i = 0; i < 46; i++) {
    const cx = 5 + Math.floor(rand() * (W - 10)), cz = 5 + Math.floor(rand() * (D - 10));
    const n = 4 + Math.floor(rand() * 6);
    for (let k = 0; k < n; k++) {
      const x = cx + Math.floor(rand() * 7) - 3, z = cz + Math.floor(rand() * 7) - 3;
      const h = hm[z * W + x];
      if (world[bi(x, h, z)] !== GRASS || getB(x, h + 1, z) || nearSpawn(x, z)) continue;
      const bh = 3 + Math.floor(rand() * 5);
      for (let y = h + 1; y <= h + bh; y++) setIfAir(x, y, z, BAMBOO);
    }
  }
  SPAWN.y = topY(W >> 1, D >> 1) + 1.01;
}

// ---------------------------------------------------------------- GL setup
const canvas = $('c');
const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl');
if (!gl) { $('err').textContent = 'This browser does not support WebGL, which the game needs.'; $('go').style.display = 'none'; return; }

function mkProg(vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const progW = mkProg(`
attribute vec3 aPos; attribute vec2 aUV; attribute float aL;
uniform mat4 uMVP; varying vec2 vUV; varying float vL; varying float vD;
void main(){ gl_Position=uMVP*vec4(aPos,1.0); vUV=aUV; vL=aL; vD=gl_Position.w; }`, `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uSky; uniform vec2 uFog;
varying vec2 vUV; varying float vL; varying float vD;
void main(){ vec4 c=texture2D(uTex,vUV); if(c.a<0.5) discard;
  float f=smoothstep(uFog.x,uFog.y,vD); gl_FragColor=vec4(mix(c.rgb*vL,uSky,f),1.0); }`);
const progB = mkProg(`
attribute vec3 aPos; attribute vec3 aN;
uniform mat4 uMVP; uniform mat4 uM; varying float vL; varying float vD;
void main(){ gl_Position=uMVP*vec4(aPos,1.0); vec3 n=normalize((uM*vec4(aN,0.0)).xyz);
  vL=0.68+0.32*dot(n,normalize(vec3(0.35,1.0,0.2))); vD=gl_Position.w; }`, `
precision mediump float;
uniform vec4 uColor; uniform vec3 uSky; uniform vec2 uFog; varying float vL; varying float vD;
void main(){ float f=smoothstep(uFog.x,uFog.y,vD); gl_FragColor=vec4(mix(uColor.rgb*vL,uSky,f),uColor.a); }`);
const locW = { pos: gl.getAttribLocation(progW, 'aPos'), uv: gl.getAttribLocation(progW, 'aUV'), l: gl.getAttribLocation(progW, 'aL'),
  mvp: gl.getUniformLocation(progW, 'uMVP'), sky: gl.getUniformLocation(progW, 'uSky'), fog: gl.getUniformLocation(progW, 'uFog') };
const locB = { pos: gl.getAttribLocation(progB, 'aPos'), n: gl.getAttribLocation(progB, 'aN'),
  mvp: gl.getUniformLocation(progB, 'uMVP'), m: gl.getUniformLocation(progB, 'uM'), color: gl.getUniformLocation(progB, 'uColor'),
  sky: gl.getUniformLocation(progB, 'uSky'), fog: gl.getUniformLocation(progB, 'uFog') };
const SKY = [0.62, 0.83, 0.93];
const FOG = [48, 92];

// ---------------------------------------------------------------- texture atlas (all drawn here, no image files)
const TS = 16, AT = 8;
const atlas = document.createElement('canvas'); atlas.width = atlas.height = TS * AT;
(function drawAtlas() {
  const ctx = atlas.getContext('2d'), r = rng32(12345);
  const img = ctx.createImageData(TS * AT, TS * AT), d = img.data;
  function tile(n, fn) {
    const ox = (n % AT) * TS, oy = Math.floor(n / AT) * TS;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const c = fn(x, y), i = ((oy + y) * TS * AT + ox + x) * 4;
      d[i] = clamp(c[0], 0, 255); d[i + 1] = clamp(c[1], 0, 255); d[i + 2] = clamp(c[2], 0, 255); d[i + 3] = c.length > 3 ? c[3] : 255;
    }
  }
  const sh = (c, k) => [c[0] + k, c[1] + k, c[2] + k];
  const grass = () => sh([104, 178, 78], (r() - 0.5) * 34);
  const dirt = () => { const k = (r() - 0.5) * 30; return r() < 0.08 ? [96, 70, 50] : sh([134, 96, 64], k); };
  tile(0, grass);
  tile(2, dirt);
  tile(1, (x, y) => (y < 3 + ((x * 7 + 3) % 5 === 0 ? 2 : (x % 3 === 0 ? 1 : 0))) ? grass() : dirt());
  tile(3, (x, y) => { const k = (r() - 0.5) * 22; const crack = ((x + y * 3) % 11 === 0 && r() < 0.7); return crack ? [104, 106, 116] : sh([142, 144, 154], k); });
  tile(4, () => sh([226, 206, 146], (r() - 0.5) * 20));
  tile(5, (x) => sh(x % 4 === 0 ? [84, 60, 40] : [112, 80, 52], (r() - 0.5) * 16));
  tile(6, (x, y) => { const q = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); return sh(q > 6.6 ? [92, 66, 44] : (Math.floor(q) % 2 ? [176, 138, 90] : [198, 160, 108]), (r() - 0.5) * 10); });
  tile(7, () => r() < 0.2 ? [0, 0, 0, 0] : sh([58, 136, 62], (r() - 0.5) * 44));
  tile(8, (x, y) => { const row = Math.floor(y / 4); const edge = y % 4 === 3 || (x + row * 5) % 16 === 0; return sh(edge ? [150, 112, 66] : [196, 152, 96], (r() - 0.5) * 12); });
  tile(9, (x, y) => { const row = Math.floor(y / 4); const mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7; return mortar ? sh([206, 200, 188], (r() - 0.5) * 10) : sh([178, 84, 66], (r() - 0.5) * 24); });
  tile(10, (x, y) => { if (x === 0 || y === 0 || x === 15 || y === 15) return [214, 236, 244]; if ((x + y === 9 || x + y === 10) && x > 2 && x < 8) return [240, 250, 255]; return [0, 0, 0, 0]; });
  tile(11, (x, y) => { const k = (r() - 0.5) * 12; if (y % 8 === 7) return sh([92, 132, 56], k); const s = (x % 8); return sh(s === 0 ? [96, 140, 60] : s < 3 ? [168, 208, 98] : [136, 184, 78], k); });
  tile(12, (x, y) => sh(((x ^ y) & 3) === 0 ? [70, 62, 92] : [44, 42, 58], (r() - 0.5) * 14));
  tile(13, (x, y) => { const q = Math.hypot((x % 8) - 3.5, (y % 8) - 3.5); return sh(q < 1.5 ? [214, 232, 150] : q < 3.6 ? [136, 184, 78] : [96, 140, 60], (r() - 0.5) * 10); });
  ctx.putImageData(img, 0, 0);
})();
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// ---------------------------------------------------------------- chunk meshing
const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], sh: 0.8, t: 2 },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], sh: 0.8, t: 2 },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], sh: 1.0, t: 0 },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], sh: 0.5, t: 1 },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], sh: 0.66, t: 2 },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], sh: 0.66, t: 2 }
];
const CORN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const UVE = 0.02;
function tileUV(t, tu, tv) {
  return [((t % AT) + UVE + tu * (1 - 2 * UVE)) / AT, (Math.floor(t / AT) + UVE + tv * (1 - 2 * UVE)) / AT];
}
const NCX = W / CS, NCZ = D / CS;
const chunks = [];
for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) chunks.push({ cx, cz, buf: gl.createBuffer(), count: 0, dirty: true });
const vtx = [];
function buildChunk(ch) {
  vtx.length = 0;
  const x0 = ch.cx * CS, z0 = ch.cz * CS;
  const ao = [0, 0, 0, 0], px = [0, 0, 0, 0], py = [0, 0, 0, 0], pz = [0, 0, 0, 0], uu = [0, 0, 0, 0], vv = [0, 0, 0, 0];
  for (let y = 0; y < H; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
    const id = world[bi(x, y, z)];
    if (!id) continue;
    const B = BLOCKS[id];
    for (let f = 0; f < 6; f++) {
      const F = FACES[f], n = F.n, u = F.u, v = F.v;
      const nb = getB(x + n[0], y + n[1], z + n[2]);
      if (opaque(nb) || nb === id) continue;
      const t = B.tex[F.t];
      for (let c = 0; c < 4; c++) {
        const su = CORN[c][0], sv = CORN[c][1];
        const ax = x + n[0], ay = y + n[1], az = z + n[2];
        const s1 = opaque(getB(ax + su * u[0], ay + su * u[1], az + su * u[2])) ? 1 : 0;
        const s2 = opaque(getB(ax + sv * v[0], ay + sv * v[1], az + sv * v[2])) ? 1 : 0;
        const cc = opaque(getB(ax + su * u[0] + sv * v[0], ay + su * u[1] + sv * v[1], az + su * u[2] + sv * v[2])) ? 1 : 0;
        ao[c] = (s1 && s2) ? 0 : 3 - s1 - s2 - cc;
        px[c] = x + 0.5 + 0.5 * (n[0] + su * u[0] + sv * v[0]);
        py[c] = y + 0.5 + 0.5 * (n[1] + su * u[1] + sv * v[1]);
        pz[c] = z + 0.5 + 0.5 * (n[2] + su * u[2] + sv * v[2]);
        const uv = tileUV(t, (su + 1) / 2, 1 - (sv + 1) / 2);
        uu[c] = uv[0]; vv[c] = uv[1];
      }
      const order = (ao[0] + ao[2] >= ao[1] + ao[3]) ? [0, 1, 2, 0, 2, 3] : [1, 2, 3, 1, 3, 0];
      for (let k = 0; k < 6; k++) {
        const c = order[k];
        vtx.push(px[c], py[c], pz[c], uu[c], vv[c], F.sh * (0.52 + 0.16 * ao[c]));
      }
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, ch.buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vtx), gl.DYNAMIC_DRAW);
  ch.count = vtx.length / 6;
  ch.dirty = false;
}
function markDirty(x, z) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const cx = Math.floor((x + dx) / CS), cz = Math.floor((z + dz) / CS);
    if (cx >= 0 && cz >= 0 && cx < NCX && cz < NCZ) chunks[cz * NCX + cx].dirty = true;
  }
}
function setB(x, y, z, id) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  world[bi(x, y, z)] = id; markDirty(x, z);
}

// ---------------------------------------------------------------- box + line geometry
const boxBuf = gl.createBuffer();
(function () {
  const a = [];
  for (const F of FACES) for (const c of [0, 1, 2, 0, 2, 3]) {
    const su = CORN[c][0], sv = CORN[c][1];
    for (let i = 0; i < 3; i++) a.push(0.5 * (F.n[i] + su * F.u[i] + sv * F.v[i]));
    a.push(F.n[0], F.n[1], F.n[2]);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, boxBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW);
})();
const lineBuf = gl.createBuffer();
(function () {
  const a = [], h = 0.5;
  for (const s of [-h, h]) for (const t of [-h, h]) { a.push(-h, s, t, h, s, t); a.push(s, -h, t, s, h, t); a.push(s, t, -h, s, t, h); }
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW);
})();
const handBuf = gl.createBuffer();
let handBlockId = -1;
function buildHandBlock(id) {
  const a = [], B = BLOCKS[id];
  for (const F of FACES) for (const c of [0, 1, 2, 0, 2, 3]) {
    const su = CORN[c][0], sv = CORN[c][1];
    for (let i = 0; i < 3; i++) a.push(0.5 * (F.n[i] + su * F.u[i] + sv * F.v[i]));
    const uv = tileUV(B.tex[F.t], (su + 1) / 2, 1 - (sv + 1) / 2);
    a.push(uv[0], uv[1], F.sh);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, handBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.DYNAMIC_DRAW);
  handBlockId = id;
}

let VP = M4.ident();
function useBoxProg(fogOn) {
  gl.useProgram(progB);
  gl.bindBuffer(gl.ARRAY_BUFFER, boxBuf);
  gl.enableVertexAttribArray(locB.pos); gl.enableVertexAttribArray(locB.n);
  gl.vertexAttribPointer(locB.pos, 3, gl.FLOAT, false, 24, 0);
  gl.vertexAttribPointer(locB.n, 3, gl.FLOAT, false, 24, 12);
  gl.uniform3fv(locB.sky, SKY);
  gl.uniform2f(locB.fog, fogOn ? FOG[0] : 1e5, fogOn ? FOG[1] : 2e5);
}
function drawBox(base, cx, cy, cz, sx, sy, sz, col, alpha) {
  const m = M4.mul(base, M4.mul(M4.trans(cx, cy, cz), M4.scale(sx, sy, sz)));
  gl.uniformMatrix4fv(locB.m, false, m);
  gl.uniformMatrix4fv(locB.mvp, false, M4.mul(VP, m));
  gl.uniform4f(locB.color, col[0], col[1], col[2], alpha === undefined ? 1 : alpha);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// ---------------------------------------------------------------- physics
function collides(e) {
  const x0 = Math.floor(e.x - e.w), x1 = Math.floor(e.x + e.w), y0 = Math.floor(e.y), y1 = Math.floor(e.y + e.h),
    z0 = Math.floor(e.z - e.w), z1 = Math.floor(e.z + e.w);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (solidAt(x, y, z)) return true;
  return false;
}
const EPS = 1e-4;
function moveEnt(e, dt) {
  e.hitWall = false;
  let d = e.vy * dt; e.y += d;
  const wasGround = e.onGround; e.onGround = false;
  if (collides(e)) {
    if (d > 0) e.y = Math.floor(e.y + e.h) - e.h - EPS; else { e.y = Math.floor(e.y) + 1 + EPS; e.onGround = true; }
    e.vy = 0;
  }
  d = e.vx * dt; e.x += d;
  if (collides(e)) { e.x = d > 0 ? Math.floor(e.x + e.w) - e.w - EPS : Math.floor(e.x - e.w) + 1 + e.w + EPS; e.vx = 0; e.hitWall = true; }
  d = e.vz * dt; e.z += d;
  if (collides(e)) { e.z = d > 0 ? Math.floor(e.z + e.w) - e.w - EPS : Math.floor(e.z - e.w) + 1 + e.w + EPS; e.vz = 0; e.hitWall = true; }
  void wasGround;
}
function raycast(ox, oy, oz, dx, dy, dz, max) {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = Math.abs(1 / dx), tdy = Math.abs(1 / dy), tdz = Math.abs(1 / dz);
  let tmx = dx > 0 ? (x + 1 - ox) / dx : dx < 0 ? (x - ox) / dx : Infinity;
  let tmy = dy > 0 ? (y + 1 - oy) / dy : dy < 0 ? (y - oy) / dy : Infinity;
  let tmz = dz > 0 ? (z + 1 - oz) / dz : dz < 0 ? (z - oz) / dz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  while (t <= max) {
    const b = getB(x, y, z);
    if (b) return { x, y, z, nx, ny, nz, t, b };
    if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
    else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
    else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
  }
  return null;
}
function rayBox(ox, oy, oz, dx, dy, dz, e, pad) {
  let t0 = 0, t1 = Infinity;
  const mins = [e.x - e.w - pad, e.y - pad, e.z - e.w - pad], maxs = [e.x + e.w + pad, e.y + e.h + pad, e.z + e.w + pad];
  const o = [ox, oy, oz], dd = [dx, dy, dz];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dd[i]) < 1e-9) { if (o[i] < mins[i] || o[i] > maxs[i]) return -1; continue; }
    let a = (mins[i] - o[i]) / dd[i], b = (maxs[i] - o[i]) / dd[i];
    if (a > b) { const s = a; a = b; b = s; }
    if (a > t0) t0 = a; if (b < t1) t1 = b;
    if (t0 > t1) return -1;
  }
  return t0;
}

// ---------------------------------------------------------------- sound
let ac = null;
function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
}
function snd(f, d, type, vol, slide) {
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(vol || 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- game state
const player = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, w: 0.3, h: 1.8, onGround: false, hitWall: false, yaw: 0, pitch: -0.1, hp: 20, lastHurt: -99, regenT: 0 };
const EYE = 1.62;
const hotbar = [
  { tool: 'sword', name: 'Sword' }, { tool: 'pick', name: 'Pickaxe' }, { tool: 'shield', name: 'Shield' }, { tool: 'sling', name: 'Slingshot' },
  { block: PLANKS, count: 48 }, { block: STONE, count: 32 }, { block: DIRT, count: 16 }, { block: BRICK, count: 24 }, { block: GLASS, count: 16 }
];
let sel = 0;
let state = 'menu'; // menu | play | paused | dead
let touchMode = false, locked = false, lockFallback = false;
let elapsed = 0, score = 0, spawnT = 5;
const pandas = [], shots = [], parts = [];
const input = { f: 0, r: 0, jump: false, run: false, primary: false, secondary: false, priTap: false, secTap: false, jumpTap: false };
const keys = {};
let mine = { x: 0, y: -1, z: 0, p: 0 }, swing = 0, swingCd = 0, placeCd = 0, slingCd = 0, shieldUp = false, shieldAnim = 0, hurtFlash = 0;
let target = null, targetPanda = null;

function lookDir() {
  const cp = Math.cos(player.pitch);
  return [-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp];
}
function resetPlayer() {
  player.x = SPAWN.x; player.z = SPAWN.z; player.y = topY(Math.floor(SPAWN.x), Math.floor(SPAWN.z)) + 1.01;
  player.vx = player.vy = player.vz = 0; player.hp = 20; player.pitch = -0.1;
}
let toastT = 0;
function toast(s) { const t = $('toast'); t.textContent = s; t.style.opacity = 1; toastT = 2.2; }
function burst(x, y, z, col, n, sp) {
  for (let i = 0; i < n && parts.length < 240; i++)
    parts.push({ x, y, z, vx: (Math.random() - 0.5) * sp, vy: Math.random() * sp, vz: (Math.random() - 0.5) * sp, life: 0.5 + Math.random() * 0.4, col, s: 0.06 + Math.random() * 0.07 });
}
function hurtPlayer(n) {
  if (state !== 'play') return;
  player.hp -= n; player.lastHurt = elapsed; hurtFlash = 1;
  snd(160, 0.25, 'sawtooth', 0.09, -90);
  if (player.hp <= 0) {
    player.hp = 0; state = 'dead';
    input.primary = input.secondary = false;
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    showOverlay('The pandas got you!', 'You defeated ' + score + ' panda' + (score === 1 ? '' : 's') + '. Your buildings are still standing.', 'RESPAWN');
  }
}

// ---------------------------------------------------------------- pandas & projectiles
const PG = 18; // projectile gravity
function ballistic(ox, oy, oz, tx, ty, tz, speed) {
  const dx = tx - ox, dy = ty - oy, dz = tz - oz, dist = Math.hypot(dx, dz);
  const t = clamp(dist / speed, 0.45, 2.4);
  return [dx / t, dy / t + 0.5 * PG * t, dz / t];
}
function spawnPanda() {
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2, r = 17 + Math.random() * 11;
    const x = Math.floor(player.x + Math.cos(a) * r), z = Math.floor(player.z + Math.sin(a) * r);
    if (x < 2 || z < 2 || x > W - 3 || z > D - 3) continue;
    const y = topY(x, z) + 1.01;
    if (y + 3 >= H) continue;
    pandas.push({ x: x + 0.5, y, z: z + 0.5, vx: 0, vy: 0, vz: 0, w: 0.45, h: 1.9, onGround: false, hitWall: false, yaw: a, hp: 8, walk: 0, throwT: 1.5 + Math.random() * 2, flash: 0, arm: 0, kx: 0, kz: 0, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 2 });
    return;
  }
}
function damagePanda(p, dmg, kx, kz) {
  p.hp -= dmg; p.flash = 0.25; p.kx = kx; p.kz = kz; p.vy = 4.5;
  snd(520, 0.12, 'square', 0.06, -200);
  burst(p.x, p.y + 1.2, p.z, [1, 1, 1], 5, 3);
  if (p.hp <= 0) {
    pandas.splice(pandas.indexOf(p), 1);
    score++; player.hp = Math.min(20, player.hp + 2);
    burst(p.x, p.y + 1, p.z, [0.1, 0.1, 0.1], 10, 5); burst(p.x, p.y + 1, p.z, [1, 1, 1], 10, 5);
    snd(330, 0.3, 'triangle', 0.09, 400);
    toast('Panda defeated! +2 health');
  }
}
function updatePandas(dt) {
  spawnT -= dt;
  const cap = Math.min(2 + Math.floor(elapsed / 40), 8);
  if (spawnT <= 0) { spawnT = 6; if (pandas.length < cap) spawnPanda(); }
  for (let i = pandas.length - 1; i >= 0; i--) {
    const p = pandas[i];
    const dx = player.x - p.x, dz = player.z - p.z, dist = Math.hypot(dx, dz) || 1;
    if (dist > 60) { pandas.splice(i, 1); continue; }
    p.yaw = Math.atan2(-dx, -dz);
    let mx = 0, mz = 0;
    if (dist > 12) { mx = dx / dist; mz = dz / dist; }
    else if (dist < 5) { mx = -dx / dist; mz = -dz / dist; }
    else { p.strafeT -= dt; if (p.strafeT < 0) { p.strafeT = 1.5 + Math.random() * 2.5; p.strafe = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? 1 : -1); } mx = -dz / dist * p.strafe * 0.5; mz = dx / dist * p.strafe * 0.5; }
    const sp = 2.3;
    p.vx = mx * sp + p.kx; p.vz = mz * sp + p.kz;
    p.kx *= Math.pow(0.02, dt); p.kz *= Math.pow(0.02, dt);
    p.vy = Math.max(p.vy - 28 * dt, -40);
    const moving = Math.hypot(mx, mz) > 0.1;
    moveEnt(p, dt);
    if (p.hitWall && p.onGround && moving) p.vy = 8.6;
    if (moving) p.walk += dt * 8; else p.walk *= 0.9;
    if (p.flash > 0) p.flash -= dt;
    // throwing
    if (dist < 26) {
      p.throwT -= dt;
      if (p.throwT <= 0) {
        p.throwT = 2.2 + Math.random() * 1.8; p.arm = 0.35;
        const ox = p.x, oy = p.y + 2.05, oz = p.z;
        const tt = dist / 13;
        const tx = player.x + player.vx * tt * 0.5 + (Math.random() - 0.5) * 1.3, tz = player.z + player.vz * tt * 0.5 + (Math.random() - 0.5) * 1.3;
        const v = ballistic(ox, oy, oz, tx, player.y + 1.1, tz, 13);
        shots.push({ kind: 'pine', x: ox, y: oy, z: oz, vx: v[0], vy: v[1], vz: v[2], life: 6, owner: p, friendly: false, spin: Math.random() * 6 });
        snd(300, 0.15, 'triangle', 0.04, 250);
      }
    }
    if (p.arm > 0) p.arm -= dt;
  }
}
function inBox(s, e, pad) {
  return s.x > e.x - e.w - pad && s.x < e.x + e.w + pad && s.z > e.z - e.w - pad && s.z < e.z + e.w + pad && s.y > e.y - pad && s.y < e.y + e.h + pad;
}
const PINE_COL = [0.9, 0.66, 0.16], LEAF_COL = [0.2, 0.55, 0.2];
function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    let dead = false;
    const steps = 3, h = dt / steps;
    for (let k = 0; k < steps && !dead; k++) {
      s.vy -= (s.kind === 'pine' ? PG : 12) * h;
      s.x += s.vx * h; s.y += s.vy * h; s.z += s.vz * h;
      if (solidAt(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z))) {
        dead = true;
        if (s.kind === 'pine') { burst(s.x - s.vx * h, s.y - s.vy * h, s.z - s.vz * h, PINE_COL, 7, 4); snd(120, 0.12, 'sawtooth', 0.03, -60); }
        else burst(s.x - s.vx * h, s.y - s.vy * h, s.z - s.vz * h, [0.6, 0.6, 0.6], 3, 2);
        break;
      }
      if (!s.friendly) {
        if (inBox(s, player, 0.22)) {
          const hv = Math.hypot(s.vx, s.vz) || 1;
          const facing = (-Math.sin(player.yaw)) * (-s.vx / hv) + (-Math.cos(player.yaw)) * (-s.vz / hv);
          if (shieldUp && facing > 0.15) {
            // bounce it back at the thrower
            s.friendly = true; s.life = 5;
            const o = s.owner && pandas.indexOf(s.owner) >= 0 ? s.owner : null;
            if (o) { const v = ballistic(s.x, s.y, s.z, o.x, o.y + 1, o.z, 17); s.vx = v[0]; s.vy = v[1]; s.vz = v[2]; }
            else { s.vx = -s.vx; s.vz = -s.vz; s.vy = 5; }
            snd(700, 0.12, 'square', 0.07, 300); swing = 1;
          } else {
            dead = true; hurtPlayer(3); burst(s.x, s.y, s.z, PINE_COL, 8, 4);
          }
        }
      } else {
        for (const p of pandas) if (inBox(s, p, 0.2)) {
          const hv = Math.hypot(s.vx, s.vz) || 1;
          damagePanda(p, s.kind === 'pine' ? 5 : 2, s.vx / hv * 5, s.vz / hv * 5);
          if (s.kind === 'pine') burst(s.x, s.y, s.z, PINE_COL, 8, 4);
          dead = true; break;
        }
      }
    }
    s.spin += dt * 9; s.life -= dt;
    if (dead || s.life <= 0) shots.splice(i, 1);
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i];
    q.vy -= 20 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.life -= dt;
    if (q.life <= 0 || solidAt(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z))) parts.splice(i, 1);
  }
}

// ---------------------------------------------------------------- player update
function giveBlock(id) {
  if (!id) return;
  for (const it of hotbar) if (it.block === id) { it.count = Math.min(999, it.count + 1); refreshHotbar(); return; }
}
function updateTarget() {
  const d = lookDir(), ox = player.x, oy = player.y + EYE, oz = player.z;
  target = raycast(ox, oy, oz, d[0], d[1], d[2], 6);
  targetPanda = null;
  let best = Math.min(4.6, target ? target.t : 99);
  for (const p of pandas) { const t = rayBox(ox, oy, oz, d[0], d[1], d[2], p, 0.12); if (t >= 0 && t < best) { best = t; targetPanda = p; } }
}
function boxFree(bx, by, bz) {
  const hit = e => bx + 1 > e.x - e.w && bx < e.x + e.w && bz + 1 > e.z - e.w && bz < e.z + e.w && by + 1 > e.y && by < e.y + e.h;
  if (hit(player)) return false;
  for (const p of pandas) if (hit(p)) return false;
  return true;
}
function updatePlayer(dt) {
  // read keyboard
  if (!touchMode || keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
    input.f = ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
    input.r = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
  } else { input.f = joy.f; input.r = joy.r; }
  const jump = keys.Space || input.jump || input.jumpTap;
  const item = hotbar[sel];
  const primary = input.primary || input.priTap, secondary = input.secondary || input.secTap;
  input.priTap = input.secTap = input.jumpTap = false;
  shieldUp = item.tool === 'shield' && (primary || secondary);
  shieldAnim += ((shieldUp ? 1 : 0) - shieldAnim) * Math.min(1, dt * 14);

  let f = input.f, r = input.r; const len = Math.hypot(f, r); if (len > 1) { f /= len; r /= len; }
  let sp = (keys.ShiftLeft || keys.ShiftRight || input.run) ? 6.6 : 4.6; if (shieldUp) sp *= 0.6;
  const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
  const wx = (-sy * f + cy * r) * sp, wz = (-cy * f - sy * r) * sp;
  const steps = Math.max(1, Math.ceil(dt * 60)), h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const k = Math.min(1, (player.onGround ? 14 : 5) * h);
    player.vx += (wx - player.vx) * k; player.vz += (wz - player.vz) * k;
    player.vy = Math.max(player.vy - 28 * h, -40);
    if (jump && player.onGround) { player.vy = 8.6; player.onGround = false; }
    moveEnt(player, h);
    if (touchMode && player.hitWall && player.onGround && len > 0.3) player.vy = 8.6;
  }
  // slow regeneration
  if (elapsed - player.lastHurt > 6 && player.hp < 20) { player.regenT += dt; if (player.regenT > 3) { player.regenT = 0; player.hp++; } }

  updateTarget();
  swingCd -= dt; placeCd -= dt; slingCd -= dt;
  if (swing > 0) swing = Math.max(0, swing - dt * 4);
  let mining = false;
  if (item.tool === 'sling') {
    if ((primary || secondary) && slingCd <= 0) {
      slingCd = 0.45; swing = 1;
      const d = lookDir();
      shots.push({ kind: 'peb', x: player.x + d[0] * 0.4, y: player.y + EYE - 0.1 + d[1] * 0.4, z: player.z + d[2] * 0.4, vx: d[0] * 34, vy: d[1] * 34 + 1.2, vz: d[2] * 34, life: 3, friendly: true, spin: 0 });
      snd(900, 0.1, 'triangle', 0.05, -500);
    }
  } else if (!shieldUp) {
    if (primary) {
      if (targetPanda) {
        if (swingCd <= 0) {
          swingCd = 0.36; swing = 1;
          const dmg = item.tool === 'sword' ? 4 : item.tool === 'pick' ? 2 : 1;
          const d = lookDir(), hv = Math.hypot(d[0], d[2]) || 1;
          damagePanda(targetPanda, dmg, d[0] / hv * 7, d[2] / hv * 7);
        }
      } else if (target) {
        const B = BLOCKS[target.b];
        if (mine.x !== target.x || mine.y !== target.y || mine.z !== target.z) mine = { x: target.x, y: target.y, z: target.z, p: 0 };
        mining = true;
        if (swing <= 0) { swing = 1; if (B.hard !== Infinity) snd(140 + Math.random() * 40, 0.05, 'square', 0.025); }
        const mult = item.tool === 'pick' ? 4 : item.tool === 'sword' ? 1.3 : 1;
        mine.p += dt * mult / B.hard;
        if (mine.p >= 1) {
          setB(target.x, target.y, target.z, AIR);
          burst(target.x + 0.5, target.y + 0.5, target.z + 0.5, B.col, 9, 3.5);
          giveBlock(B.drop); snd(200, 0.1, 'square', 0.05, -100);
          mine.p = 0; mine.y = -1;
        }
      } else if (swingCd <= 0) { swingCd = 0.36; swing = 1; }
    }
    if (secondary && item.block && placeCd <= 0 && target) {
      const bx = target.x + target.nx, by = target.y + target.ny, bz = target.z + target.nz;
      if (item.count > 0 && by < H - 1 && bx >= 0 && bz >= 0 && bx < W && bz < D && !getB(bx, by, bz) && boxFree(bx, by, bz)) {
        setB(bx, by, bz, item.block); item.count--; refreshHotbar();
        placeCd = 0.24; swing = 1; snd(260, 0.07, 'square', 0.05, 80);
      } else if (item.count <= 0) { placeCd = 0.5; toast('No ' + BLOCKS[item.block].name + ' left - break blocks to collect more'); }
    }
  }
  if (!mining) { mine.p = 0; mine.y = -1; }
}

// ---------------------------------------------------------------- rendering
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, touchMode ? 1.5 : 2);
  const w = Math.max(1, Math.floor(canvas.clientWidth * dpr)), h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
const BLACK = [0.09, 0.09, 0.1], WHITE = [0.96, 0.96, 0.93], RED = [1, 0.35, 0.3];
function drawPanda(p) {
  const base = M4.mul(M4.trans(p.x, p.y, p.z), M4.rotY(p.yaw));
  const hurt = p.flash > 0, bk = hurt ? RED : BLACK, wh = hurt ? RED : WHITE;
  const sw = Math.sin(p.walk) * 0.6;
  for (const s of [-1, 1]) {
    const leg = M4.chain(base, M4.trans(s * 0.22, 0.42, 0), M4.rotX(s * sw));
    drawBox(leg, 0, -0.21, 0, 0.32, 0.42, 0.38, bk);
  }
  drawBox(base, 0, 0.82, 0, 0.92, 0.84, 0.62, wh);
  drawBox(base, 0, 1.12, 0, 0.94, 0.26, 0.64, bk); // shoulder band
  // arms: left swings, right throws
  const throwing = p.throwT < 0.55, armA = p.arm > 0 ? 0.9 : throwing ? 2.9 - p.throwT * 1.2 : -sw;
  const la = M4.chain(base, M4.trans(-0.58, 1.2, 0), M4.rotX(sw));
  drawBox(la, 0, -0.27, 0, 0.26, 0.62, 0.32, bk);
  const ra = M4.chain(base, M4.trans(0.58, 1.2, 0), M4.rotX(armA));
  drawBox(ra, 0, -0.27, 0, 0.26, 0.62, 0.32, bk);
  if (throwing && p.arm <= 0) drawPine(M4.chain(ra, M4.trans(0, -0.72, 0), M4.rotX(Math.PI)), 1);
  drawBox(base, 0, 1.54, 0, 0.74, 0.6, 0.64, wh);
  for (const s of [-1, 1]) {
    drawBox(base, s * 0.3, 1.9, 0.05, 0.22, 0.2, 0.16, bk);
    drawBox(base, s * 0.19, 1.6, -0.325, 0.2, 0.2, 0.03, bk);
    drawBox(base, s * 0.19, 1.61, -0.345, 0.07, 0.07, 0.02, wh);
  }
  drawBox(base, 0, 1.42, -0.33, 0.14, 0.09, 0.05, bk);
}
function drawPine(m, sc) {
  const b = M4.mul(m, M4.scale(sc, sc, sc));
  drawBox(b, 0, 0, 0, 0.3, 0.38, 0.3, PINE_COL);
  drawBox(b, 0, 0, 0, 0.32, 0.06, 0.32, [0.72, 0.48, 0.1]);
  drawBox(b, 0, 0.12, 0, 0.32, 0.05, 0.32, [0.72, 0.48, 0.1]);
  drawBox(b, 0, -0.12, 0, 0.32, 0.05, 0.32, [0.72, 0.48, 0.1]);
  drawBox(b, 0, 0.3, 0, 0.1, 0.24, 0.1, LEAF_COL);
  drawBox(b, 0.08, 0.26, 0, 0.06, 0.16, 0.06, LEAF_COL);
  drawBox(b, -0.08, 0.26, 0, 0.06, 0.16, 0.06, LEAF_COL);
  drawBox(b, 0, 0.26, 0.08, 0.06, 0.16, 0.06, LEAF_COL);
  drawBox(b, 0, 0.26, -0.08, 0.06, 0.16, 0.06, LEAF_COL);
}
const WOOD = [0.5, 0.34, 0.2], STEEL = [0.8, 0.83, 0.88], DARK = [0.3, 0.3, 0.34];
function drawHand(P) {
  const item = hotbar[sel];
  const sw = Math.sin(swing * Math.PI);
  VP = P;
  const asp = canvas.width / canvas.height, hx = Math.min(0.5, asp * 0.42);
  let base = M4.chain(M4.trans(hx - shieldAnim * (hx - 0.06), -0.4 + shieldAnim * 0.14, -0.95), M4.rotX(-sw * 0.9), M4.rotY(-0.25 + sw * 0.3), M4.scale(0.6, 0.6, 0.6));
  if (item.block) {
    if (handBlockId !== item.block) buildHandBlock(item.block);
    const m = M4.chain(base, M4.rotY(0.6), M4.rotX(0.15), M4.scale(0.36, 0.36, 0.36));
    gl.useProgram(progW);
    gl.bindBuffer(gl.ARRAY_BUFFER, handBuf);
    gl.vertexAttribPointer(locW.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locW.uv, 2, gl.FLOAT, false, 24, 12);
    gl.vertexAttribPointer(locW.l, 1, gl.FLOAT, false, 24, 20);
    gl.uniformMatrix4fv(locW.mvp, false, M4.mul(P, m));
    gl.uniform2f(locW.fog, 1e5, 2e5);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    return;
  }
  useBoxProg(false);
  if (item.tool === 'sword') {
    base = M4.chain(base, M4.rotX(-0.55), M4.rotZ(-0.15));
    drawBox(base, 0, -0.2, 0, 0.07, 0.24, 0.07, WOOD);
    drawBox(base, 0, -0.06, 0, 0.3, 0.06, 0.09, DARK);
    drawBox(base, 0, 0.36, 0, 0.1, 0.78, 0.03, STEEL);
  } else if (item.tool === 'pick') {
    base = M4.chain(base, M4.rotX(-0.5), M4.rotY(0.9));
    drawBox(base, 0, 0, 0, 0.07, 0.8, 0.07, WOOD);
    drawBox(base, 0, 0.38, 0, 0.42, 0.11, 0.09, STEEL);
    drawBox(base, 0.26, 0.34, 0, 0.14, 0.1, 0.08, STEEL);
    drawBox(base, -0.26, 0.34, 0, 0.14, 0.1, 0.08, STEEL);
  } else if (item.tool === 'shield') {
    base = M4.chain(base, M4.rotY(0.25 - shieldAnim * 0.1));
    drawBox(base, 0, 0, 0, 0.62, 0.76, 0.06, WOOD);
    drawBox(base, 0, 0, -0.005, 0.7, 0.1, 0.07, STEEL);
    drawBox(base, 0, 0, -0.005, 0.1, 0.84, 0.07, STEEL);
    drawBox(base, 0, 0, 0.03, 0.2, 0.2, 0.08, DARK);
  } else if (item.tool === 'sling') {
    base = M4.chain(base, M4.rotX(-0.2));
    drawBox(base, 0, -0.2, 0, 0.07, 0.36, 0.07, WOOD);
    drawBox(base, 0, 0, 0, 0.3, 0.07, 0.07, WOOD);
    drawBox(base, 0.13, 0.16, 0, 0.07, 0.3, 0.07, WOOD);
    drawBox(base, -0.13, 0.16, 0, 0.07, 0.3, 0.07, WOOD);
    drawBox(base, 0, 0.28, 0.06 + sw * 0.1, 0.24, 0.03, 0.03, DARK);
  }
}
function render() {
  resize();
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(SKY[0], SKY[1], SKY[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.disable(gl.BLEND);
  const asp = canvas.width / canvas.height;
  const P = M4.persp(asp < 1 ? 1.35 : 1.22, asp, 0.08, 220);
  const ex = player.x, ey = player.y + EYE, ez = player.z;
  const V = M4.chain(M4.rotX(-player.pitch), M4.rotY(-player.yaw), M4.trans(-ex, -ey, -ez));
  VP = M4.mul(P, V);
  const worldVP = VP;

  // world
  let built = 0;
  gl.useProgram(progW);
  gl.enableVertexAttribArray(locW.pos); gl.enableVertexAttribArray(locW.uv); gl.enableVertexAttribArray(locW.l);
  gl.uniformMatrix4fv(locW.mvp, false, VP);
  gl.uniform3fv(locW.sky, SKY); gl.uniform2f(locW.fog, FOG[0], FOG[1]);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const fd = lookDir();
  for (const ch of chunks) {
    if (ch.dirty && built < 6) { buildChunk(ch); built++; }
    if (!ch.count) continue;
    const cx = ch.cx * CS + 8 - ex, cz = ch.cz * CS + 8 - ez, cyy = 28 - ey;
    if (cx * fd[0] + cyy * fd[1] + cz * fd[2] < -40) continue;
    if (Math.hypot(cx, cz) > FOG[1] + 14) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, ch.buf);
    gl.vertexAttribPointer(locW.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locW.uv, 2, gl.FLOAT, false, 24, 12);
    gl.vertexAttribPointer(locW.l, 1, gl.FLOAT, false, 24, 20);
    gl.drawArrays(gl.TRIANGLES, 0, ch.count);
  }

  // entities
  useBoxProg(true);
  for (const p of pandas) drawPanda(p);
  for (const s of shots) {
    if (s.kind === 'pine') drawPine(M4.chain(M4.trans(s.x, s.y, s.z), M4.rotY(s.spin), M4.rotX(s.spin * 0.7)), 1.15);
    else drawBox(M4.trans(s.x, s.y, s.z), 0, 0, 0, 0.13, 0.13, 0.13, [0.45, 0.45, 0.5]);
  }
  for (const q of parts) drawBox(M4.trans(q.x, q.y, q.z), 0, 0, 0, q.s, q.s, q.s, q.col);

  // block highlight + breaking overlay
  if (target && !targetPanda && state === 'play') {
    const m = M4.trans(target.x + 0.5, target.y + 0.5, target.z + 0.5);
    if (mine.p > 0 && mine.y === target.y) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      drawBox(m, 0, 0, 0, 1.004, 1.004, 1.004, [0, 0, 0], 0.15 + mine.p * 0.5);
      const g = 1 - mine.p; // shrinking bright core shows progress
      drawBox(m, 0, 0, 0, 1.01 * g, 1.01 * g, 1.01 * g, [1, 1, 1], 0.0);
      gl.disable(gl.BLEND);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.disableVertexAttribArray(locB.n); gl.vertexAttrib3f(locB.n, 0, 1, 0);
    gl.vertexAttribPointer(locB.pos, 3, gl.FLOAT, false, 12, 0);
    const mm = M4.mul(m, M4.scale(1.006, 1.006, 1.006));
    gl.uniformMatrix4fv(locB.m, false, mm); gl.uniformMatrix4fv(locB.mvp, false, M4.mul(worldVP, mm));
    gl.uniform4f(locB.color, 0.05, 0.05, 0.05, 1);
    gl.drawArrays(gl.LINES, 0, 24);
  }

  // held item
  gl.clear(gl.DEPTH_BUFFER_BIT);
  drawHand(M4.persp(1.15, asp, 0.05, 10));
  VP = worldVP;
}

// ---------------------------------------------------------------- HUD
const slotEls = [];
function toolIcon(ctx, tool) {
  ctx.lineCap = 'round';
  const line = (x1, y1, x2, y2, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  if (tool === 'sword') { line(11, 21, 26, 6, 4, '#cfd6e2'); line(6, 26, 10, 22, 4, '#80562f'); line(7, 17, 15, 25, 3, '#4d4d57'); }
  else if (tool === 'pick') { line(7, 26, 22, 10, 3.5, '#80562f'); ctx.strokeStyle = '#cfd6e2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(14, 18, 14, -1.75, -0.2); ctx.stroke(); }
  else if (tool === 'shield') { ctx.fillStyle = '#80562f'; ctx.strokeStyle = '#cfd6e2'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(6, 5); ctx.lineTo(26, 5); ctx.lineTo(26, 16); ctx.quadraticCurveTo(26, 25, 16, 29); ctx.quadraticCurveTo(6, 25, 6, 16); ctx.closePath(); ctx.fill(); ctx.stroke(); line(16, 7, 16, 26, 2, '#cfd6e2'); }
  else if (tool === 'sling') { line(16, 28, 16, 17, 4, '#80562f'); line(16, 17, 8, 7, 3.5, '#80562f'); line(16, 17, 24, 7, 3.5, '#80562f'); line(8, 7, 16, 12, 1.5, '#222'); line(24, 7, 16, 12, 1.5, '#222'); ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(16, 12, 2.6, 0, 7); ctx.fill(); }
}
function buildHotbar() {
  const hb = $('hotbar');
  hotbar.forEach((it, i) => {
    const el = document.createElement('div'); el.className = 'slot';
    const cv = document.createElement('canvas'); cv.width = cv.height = 32;
    const ctx = cv.getContext('2d');
    if (it.block) { ctx.imageSmoothingEnabled = false; const t = BLOCKS[it.block].tex[2]; ctx.fillStyle = '#9fd3ee55'; ctx.fillRect(4, 4, 24, 24); ctx.drawImage(atlas, (t % AT) * TS, Math.floor(t / AT) * TS, TS, TS, 4, 4, 24, 24); }
    else toolIcon(ctx, it.tool);
    const num = document.createElement('i'); num.textContent = i + 1;
    const cnt = document.createElement('span');
    el.append(cv, num, cnt); hb.appendChild(el);
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (e.pointerType !== 'mouse') setTouchMode(); select(i); });
    slotEls.push({ el, cnt });
  });
  refreshHotbar();
}
function refreshHotbar() {
  hotbar.forEach((it, i) => { slotEls[i].el.classList.toggle('sel', i === sel); slotEls[i].cnt.textContent = it.block ? it.count : ''; });
}
let nameT = 0;
function select(i) {
  sel = (i + hotbar.length) % hotbar.length; refreshHotbar(); mine.p = 0;
  const it = hotbar[sel];
  $('itemname').textContent = it.block ? BLOCKS[it.block].name : it.name; $('itemname').style.opacity = 1; nameT = 2;
}
let hudHp = -1, hudScore = -1, hudN = -1;
function updateHud(dt) {
  if (player.hp !== hudHp) { hudHp = player.hp; $('hpfill').style.width = (player.hp * 5) + '%'; $('hplabel').textContent = 'Health ' + player.hp + ' / 20'; }
  if (score !== hudScore || pandas.length !== hudN) { hudScore = score; hudN = pandas.length; $('score').innerHTML = 'Pandas defeated: ' + score + '<br>Pandas nearby: ' + pandas.length; }
  if (hurtFlash > 0) { hurtFlash = Math.max(0, hurtFlash - dt * 2); } $('hurt').style.opacity = hurtFlash;
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  if (nameT > 0) { nameT -= dt; if (nameT <= 0) $('itemname').style.opacity = 0; }
}
function showOverlay(title, sub, btn) {
  $('panel').querySelector('h1').textContent = title; $('sub').textContent = sub; $('go').textContent = btn;
  $('overlay').style.display = 'flex';
}

// ---------------------------------------------------------------- input
function setTouchMode() {
  if (touchMode) return;
  touchMode = true; document.body.classList.add('touchmode');
  $('helpDesk').style.display = 'none'; $('helpTouch').style.display = '';
}
if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) setTouchMode();

function start() {
  initAudio();
  if (state === 'dead') { pandas.length = 0; shots.length = 0; score = 0; elapsed = 0; spawnT = 5; resetPlayer(); }
  state = 'play';
  $('overlay').style.display = 'none';
  if (!touchMode) {
    requestLock();
    // if the browser never grants the mouse lock, still let the mouse work
    setTimeout(() => { if (!locked && state === 'play') lockFallback = true; }, 700);
  }
}
function requestLock() {
  if (!canvas.requestPointerLock) { lockFallback = true; return; }
  try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { lockFallback = true; }); } catch (e) { lockFallback = true; }
}
let lastPType = 'mouse';
$('go').addEventListener('pointerdown', e => { lastPType = e.pointerType; if (e.pointerType === 'touch' || e.pointerType === 'pen') setTouchMode(); });
$('go').addEventListener('click', e => { e.preventDefault(); start(); });
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (locked) lockFallback = false;
  if (!locked && state === 'play' && !touchMode && !lockFallback) {
    state = 'paused'; input.primary = input.secondary = false;
    for (const k in keys) keys[k] = false;
    showOverlay('Paused', 'The pandas are waiting.', 'RESUME');
  }
});
document.addEventListener('pointerlockerror', () => { lockFallback = true; });
document.addEventListener('keydown', e => {
  if (state !== 'play') { if ((e.code === 'Enter') && state !== 'play') start(); return; }
  keys[e.code] = true;
  if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= hotbar.length) select(n - 1); }
  if (e.code === 'KeyQ') select(sel - 1);
  if (e.code === 'KeyE') select(sel + 1);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; input.primary = input.secondary = false; });
document.addEventListener('mousemove', e => {
  if (state !== 'play' || touchMode) return;
  if (!locked && !lockFallback) return;
  player.yaw -= (e.movementX || 0) * 0.0024;
  player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0024, -1.55, 1.55);
});
canvas.addEventListener('mousedown', e => {
  if (touchMode || state !== 'play') return;
  if (!locked && !lockFallback) { start(); return; }
  if (!locked) requestLock();
  if (e.button === 0) input.primary = input.priTap = true;
  if (e.button === 2) input.secondary = input.secTap = true;
  if (e.button === 1) { if (target) { const i = hotbar.findIndex(it => it.block === target.b); if (i >= 0) select(i); } e.preventDefault(); }
});
document.addEventListener('mouseup', e => {
  if (touchMode) return;
  if (e.button === 0) input.primary = false;
  if (e.button === 2) input.secondary = false;
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('wheel', e => { if (state === 'play') select(sel + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });

// touch: left part of the screen moves, the rest looks
const joy = { f: 0, r: 0, id: null, ox: 0, oy: 0 };
const looks = new Map();
const joyEl = $('joy'), knobEl = $('knob');
function placeJoy(x, y, kx, ky) {
  joyEl.style.left = (x - 60) + 'px'; joyEl.style.top = (y - 60) + 'px'; joyEl.style.bottom = 'auto';
  knobEl.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
}
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  e.preventDefault(); setTouchMode(); initAudio();
  if (state !== 'play') return;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  if (joy.id === null && e.clientX < window.innerWidth * 0.42 && e.clientY > window.innerHeight * 0.3) {
    joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.f = joy.r = 0; placeJoy(joy.ox, joy.oy, 0, 0);
  } else looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') return;
  e.preventDefault();
  if (e.pointerId === joy.id) {
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const R = 50, l = Math.hypot(dx, dy);
    if (l > R) { dx *= R / l; dy *= R / l; }
    joy.r = dx / R; joy.f = -dy / R; input.run = l > R * 1.6;
    placeJoy(joy.ox, joy.oy, dx, dy);
  } else if (looks.has(e.pointerId)) {
    const p = looks.get(e.pointerId);
    player.yaw -= (e.clientX - p.x) * 0.0058;
    player.pitch = clamp(player.pitch - (e.clientY - p.y) * 0.0058, -1.55, 1.55);
    p.x = e.clientX; p.y = e.clientY;
  }
});
function endTouch(e) {
  if (e.pointerType === 'mouse') return;
  if (e.pointerId === joy.id) { joy.id = null; joy.f = joy.r = 0; input.run = false; knobEl.style.transform = ''; joyEl.style.left = ''; joyEl.style.top = ''; joyEl.style.bottom = ''; }
  looks.delete(e.pointerId);
}
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
function holdButton(id, key, tap) {
  const el = $(id);
  const set = v => { input[key] = v; if (v && tap) input[tap] = true; el.classList.toggle('on', v); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); initAudio(); try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } set(true); });
  for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(n, e => { e.preventDefault(); set(false); });
}
holdButton('bHit', 'primary', 'priTap'); holdButton('bUse', 'secondary', 'secTap'); holdButton('bJump', 'jump', 'jumpTap');
for (const n of ['touchstart', 'touchmove', 'gesturestart', 'dblclick']) document.addEventListener(n, e => { if (e.target.closest && e.target.closest('#panel')) return; e.preventDefault(); }, { passive: false });

// ---------------------------------------------------------------- main loop
let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
  if (state === 'play') {
    elapsed += dt;
    updatePlayer(dt);
    const steps = Math.max(1, Math.ceil(dt * 60));
    for (let i = 0; i < steps; i++) updatePandas(dt / steps);
    updateShots(dt);
  } else if (state === 'menu') {
    player.yaw += dt * 0.08;
  }
  updateHud(dt);
  render();
}

try {
  genWorld();
  resetPlayer();
  buildHotbar();
  select(0);
  for (const ch of chunks) buildChunk(ch);
  requestAnimationFrame(frame);
} catch (err) {
  $('err').textContent = 'Could not start the game: ' + err.message;
  throw err;
}

// handle for automated checks
window.__game = { player, pandas, shots, hotbar, input, getB, setB, topY, spawnPanda, hurtPlayer, damagePanda,
  get state() { return state; }, get sel() { return sel; }, get target() { return target; }, get score() { return score; }, get touchMode() { return touchMode; }, get locked() { return locked; }, get lockFallback() { return lockFallback; }, select, start };
})();
