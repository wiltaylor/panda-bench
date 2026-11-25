'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl');
  if (!gl) {
    document.body.innerHTML = '<p style="color:#fff;padding:20px">WebGL is not available in this browser.</p>';
    return;
  }

  // ---------- random and noise ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20261124);
  function hash2(x, z, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, z, s) {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = hash2(xi, zi, s), b = hash2(xi + 1, zi, s), c = hash2(xi, zi + 1, s), d = hash2(xi + 1, zi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, z, s) {
    let sum = 0, amp = 1, f = 1, n = 0;
    for (let i = 0; i < 4; i++) { sum += vnoise(x * f, z * f, s + i * 17) * amp; n += amp; amp *= 0.5; f *= 2; }
    return sum / n;
  }

  // ---------- tiles and texture atlas ----------
  const T = {
    GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, LOG_SIDE: 4, LOG_TOP: 5, LEAVES: 6, PLANKS: 7,
    SAND: 8, GLASS: 9, BRICK: 10, COBBLE: 11, BEDROCK: 12, IRON: 13, DARK: 14, WHITE: 15,
    PANDA_WHITE: 16, PANDA_BLACK: 17, PANDA_FACE: 18, PINE_BODY: 19, PINE_TOP: 20, SHIELD: 21, STRING: 22,
    CRACK: 24,
  };
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = 256;
  const actx = atlas.getContext('2d');
  const img = actx.createImageData(256, 256);
  function paint(t, fn) {
    const ox = (t % 16) * 16, oy = Math.floor(t / 16) * 16;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const c = fn(x, y);
      const i = ((oy + y) * 256 + ox + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = c.length > 3 ? c[3] : 255;
    }
  }
  const jit = (c, a) => { const k = 1 + (rnd() - 0.5) * a; return [c[0] * k, c[1] * k, c[2] * k]; };
  const DIRT_C = [134, 96, 67];
  paint(T.GRASS_TOP, () => jit([95, 159, 53], 0.3));
  const fringe = []; for (let i = 0; i < 16; i++) fringe.push(3 + Math.floor(rnd() * 3));
  paint(T.GRASS_SIDE, (x, y) => (y < fringe[x] ? jit([95, 159, 53], 0.3) : jit(DIRT_C, 0.35)));
  paint(T.DIRT, () => jit(DIRT_C, 0.35));
  paint(T.STONE, () => (rnd() < 0.08 ? jit([95, 95, 95], 0.2) : jit([128, 128, 128], 0.22)));
  paint(T.LOG_SIDE, (x) => jit([102, 81, 51], 0.25).map((v) => v * (x % 4 === 0 ? 0.75 : 1)));
  paint(T.LOG_TOP, (x, y) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 6.6) return jit([102, 81, 51], 0.2);
    return jit(Math.floor(d) % 2 ? [176, 140, 88] : [150, 116, 70], 0.1);
  });
  paint(T.LEAVES, () => (rnd() < 0.2 ? [0, 0, 0, 0] : jit([58, 138, 40], 0.45)));
  paint(T.PLANKS, (x, y) => {
    const row = Math.floor(y / 4);
    if (y % 4 === 3 || x === (row % 2 ? 4 : 12)) return jit([120, 90, 52], 0.1);
    return jit([182, 142, 88], 0.12);
  });
  paint(T.SAND, () => jit([219, 207, 150], 0.12));
  paint(T.GLASS, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [205, 232, 240, 255];
    if ((x - y === 3 && x < 9) || (x - y === 5 && x < 8)) return [235, 248, 255, 255];
    return [0, 0, 0, 0];
  });
  paint(T.BRICK, (x, y) => {
    const row = Math.floor(y / 4);
    if (y % 4 === 3 || x % 8 === (row % 2 ? 0 : 4)) return jit([200, 196, 186], 0.08);
    return jit([158, 72, 52], 0.2);
  });
  paint(T.COBBLE, (x, y) => {
    const n = vnoise(x / 3.2, y / 3.2, 99);
    if (Math.abs(n - 0.5) < 0.06) return jit([70, 70, 70], 0.2);
    return jit(n > 0.5 ? [140, 140, 140] : [112, 112, 112], 0.25);
  });
  paint(T.BEDROCK, () => (rnd() < 0.5 ? jit([48, 48, 48], 0.2) : jit([105, 105, 105], 0.2)));
  paint(T.IRON, () => jit([214, 214, 220], 0.08));
  paint(T.DARK, () => jit([55, 42, 36], 0.2));
  paint(T.WHITE, () => [255, 255, 255]);
  paint(T.PANDA_WHITE, () => jit([240, 240, 234], 0.06));
  paint(T.PANDA_BLACK, () => jit([32, 32, 36], 0.25));
  paint(T.PANDA_FACE, (x, y) => {
    const W = jit([240, 240, 234], 0.06), K = [28, 28, 30];
    if ((x === 4 || x === 11) && y === 6) return [250, 250, 250];
    if ((x === 5 || x === 10) && y === 6) return [10, 10, 10];
    const e1 = ((x - 4.5) / 2.6) ** 2 + ((y - 6.5) / 3) ** 2, e2 = ((x - 10.5) / 2.6) ** 2 + ((y - 6.5) / 3) ** 2;
    if (e1 < 1 || e2 < 1) return K;
    if ((x === 7 || x === 8) && (y === 10 || y === 11)) return K;
    if (y === 12 && (x === 6 || x === 9)) return [90, 60, 60];
    return W;
  });
  paint(T.PINE_BODY, (x, y) => {
    if ((x + y) % 4 === 0 || (x - y + 16) % 4 === 0) return jit([150, 96, 22], 0.15);
    return jit([236, 186, 42], 0.15);
  });
  paint(T.PINE_TOP, (x, y) => ((x + y) % 3 === 0 ? jit([30, 110, 40], 0.2) : jit([62, 168, 60], 0.3)));
  paint(T.SHIELD, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return jit([150, 150, 158], 0.1);
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 3.2) return jit([200, 40, 40], 0.1);
    return jit(x % 5 === 0 ? [118, 82, 46] : [160, 112, 64], 0.12);
  });
  paint(T.STRING, () => [236, 236, 224]);
  // crack stages: random walks, each stage shows more pixels
  const crackPix = [];
  for (let w = 0; w < 6; w++) {
    let cx = 7 + Math.floor(rnd() * 3) - 1, cy = 7 + Math.floor(rnd() * 3) - 1;
    for (let s = 0; s < 9; s++) {
      crackPix.push([cx, cy]);
      cx = Math.max(0, Math.min(15, cx + Math.floor(rnd() * 3) - 1 + (w % 2 ? 1 : -1) * (s % 2)));
      cy = Math.max(0, Math.min(15, cy + Math.floor(rnd() * 3) - 1 + (w < 3 ? 1 : -1) * (s % 2)));
    }
  }
  for (let st = 0; st < 4; st++) {
    const set = new Set();
    for (let w = 0; w < 6; w++) for (let s = 0; s < Math.ceil(9 * (st + 1) / 4); s++) { const p = crackPix[w * 9 + s]; set.add(p[0] + p[1] * 16); }
    paint(T.CRACK + st, (x, y) => (set.has(x + y * 16) ? [25, 25, 25, 255] : [0, 0, 0, 0]));
  }
  actx.putImageData(img, 0, 0);

  // ---------- blocks ----------
  const B = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, LOG: 4, LEAVES: 5, PLANKS: 6, SAND: 7, GLASS: 8, BRICK: 9, COBBLE: 10, BEDROCK: 11 };
  const BLOCKS = [
    null,
    { name: 'Grass', top: T.GRASS_TOP, bottom: T.DIRT, side: T.GRASS_SIDE, hard: 0.6 },
    { name: 'Dirt', top: T.DIRT, bottom: T.DIRT, side: T.DIRT, hard: 0.5 },
    { name: 'Stone', top: T.STONE, bottom: T.STONE, side: T.STONE, hard: 1.5 },
    { name: 'Log', top: T.LOG_TOP, bottom: T.LOG_TOP, side: T.LOG_SIDE, hard: 1.0 },
    { name: 'Leaves', top: T.LEAVES, bottom: T.LEAVES, side: T.LEAVES, hard: 0.25 },
    { name: 'Planks', top: T.PLANKS, bottom: T.PLANKS, side: T.PLANKS, hard: 0.9 },
    { name: 'Sand', top: T.SAND, bottom: T.SAND, side: T.SAND, hard: 0.5 },
    { name: 'Glass', top: T.GLASS, bottom: T.GLASS, side: T.GLASS, hard: 0.35 },
    { name: 'Bricks', top: T.BRICK, bottom: T.BRICK, side: T.BRICK, hard: 1.6 },
    { name: 'Cobblestone', top: T.COBBLE, bottom: T.COBBLE, side: T.COBBLE, hard: 1.6 },
    { name: 'Bedrock', top: T.BEDROCK, bottom: T.BEDROCK, side: T.BEDROCK, hard: Infinity },
  ];
  const TRANS = []; TRANS[B.AIR] = true; TRANS[B.LEAVES] = true; TRANS[B.GLASS] = true;

  // ---------- world ----------
  const WX = 64, WZ = 64, WY = 40, CS = 16, NCX = WX / CS, NCZ = WZ / CS;
  const world = new Uint8Array(WX * WY * WZ);
  const idx = (x, y, z) => (y * WZ + z) * WX + x;
  function getB(x, y, z) {
    if (y < 0) return B.BEDROCK;
    if (x < 0 || z < 0 || x >= WX || z >= WZ || y >= WY) return 0;
    return world[idx(x, y, z)];
  }
  function solidAt(x, y, z) {
    if (y < 0) return true;
    if (x < 0 || z < 0 || x >= WX || z >= WZ) return true; // invisible wall at the world edge
    if (y >= WY) return false;
    return world[idx(x, y, z)] !== 0;
  }
  const chunks = [];
  for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) chunks.push({ cx, cz, dirty: true, mesh: null });
  function setB(x, y, z, id) {
    if (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0 || y >= WY) return;
    world[idx(x, y, z)] = id;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const cx = Math.floor((x + dx) / CS), cz = Math.floor((z + dz) / CS);
      if (cx >= 0 && cz >= 0 && cx < NCX && cz < NCZ) chunks[cz * NCX + cx].dirty = true;
    }
  }
  function topY(x, z) {
    for (let y = WY - 1; y >= 0; y--) if (world[idx(x, y, z)]) return y + 1;
    return 1;
  }
  function generate() {
    world.fill(0);
    const seed = 7;
    for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) {
      const h = Math.floor(9 + fbm(x / 26, z / 26, seed) * 16);
      for (let y = 0; y <= h; y++) {
        let id = B.STONE;
        if (y === 0) id = B.BEDROCK;
        else if (y >= h - 3) id = y === h ? (h <= 13 ? B.SAND : B.GRASS) : (h <= 13 ? B.SAND : B.DIRT);
        world[idx(x, y, z)] = id;
      }
    }
    const tr = mulberry32(99);
    for (let i = 0; i < 70; i++) {
      const x = 3 + Math.floor(tr() * (WX - 6)), z = 3 + Math.floor(tr() * (WZ - 6));
      if (Math.hypot(x - WX / 2, z - WZ / 2) < 5) continue;
      const y = topY(x, z);
      if (world[idx(x, y - 1, z)] !== B.GRASS || y + 7 >= WY) continue;
      const th = 4 + Math.floor(tr() * 2);
      for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        const ly = y + th - 1 + dy;
        const r = Math.abs(dx) + Math.abs(dz) + Math.max(0, dy) * 1.5;
        if (r <= 3 && !(Math.abs(dx) === 2 && Math.abs(dz) === 2) && tr() > 0.08 && getB(x + dx, ly, z + dz) === 0) world[idx(x + dx, ly, z + dz)] = B.LEAVES;
      }
      for (let dy = 0; dy < th; dy++) world[idx(x, y + dy, z)] = B.LOG;
    }
    for (const c of chunks) c.dirty = true;
  }

  // ---------- WebGL ----------
  const VS = `attribute vec3 aPos; attribute vec2 aUV; attribute float aShade;
uniform mat4 uVP; uniform mat4 uModel; uniform vec3 uEye;
varying vec2 vUV; varying float vShade; varying float vDist;
void main(){ vec4 wp = uModel * vec4(aPos, 1.0); gl_Position = uVP * wp; vUV = aUV; vShade = aShade; vDist = length(wp.xyz - uEye); }`;
  const FS = `precision mediump float;
uniform sampler2D uTex; uniform vec3 uTint; uniform vec3 uFog; uniform vec2 uFogRange;
varying vec2 vUV; varying float vShade; varying float vDist;
void main(){ vec4 c = texture2D(uTex, vUV); if (c.a < 0.5) discard;
  vec3 col = c.rgb * vShade * uTint;
  float f = clamp((vDist - uFogRange.x) / (uFogRange.y - uFogRange.x), 0.0, 1.0);
  gl_FragColor = vec4(mix(col, uFog, f), 1.0); }`;
  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const L = {
    pos: gl.getAttribLocation(prog, 'aPos'), uv: gl.getAttribLocation(prog, 'aUV'), shade: gl.getAttribLocation(prog, 'aShade'),
    vp: gl.getUniformLocation(prog, 'uVP'), model: gl.getUniformLocation(prog, 'uModel'), eye: gl.getUniformLocation(prog, 'uEye'),
    tint: gl.getUniformLocation(prog, 'uTint'), fog: gl.getUniformLocation(prog, 'uFog'), fogRange: gl.getUniformLocation(prog, 'uFogRange'),
    tex: gl.getUniformLocation(prog, 'uTex'),
  };
  gl.enableVertexAttribArray(L.pos); gl.enableVertexAttribArray(L.uv); gl.enableVertexAttribArray(L.shade);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(L.tex, 0);
  gl.enable(gl.DEPTH_TEST);
  const SKY = [0.62, 0.8, 0.98];
  gl.clearColor(SKY[0], SKY[1], SKY[2], 1);
  gl.uniform3f(L.fog, SKY[0], SKY[1], SKY[2]);

  // ---------- matrices (column-major) ----------
  const M = {
    ident() { const o = new Float32Array(16); o[0] = o[5] = o[10] = o[15] = 1; return o; },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
      return o;
    },
    chain(...ms) { let r = ms[0]; for (let i = 1; i < ms.length; i++) r = M.mul(r, ms[i]); return r; },
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
      o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = (2 * f * n) / (n - f);
      return o;
    },
    trans(x, y, z) { const o = M.ident(); o[12] = x; o[13] = y; o[14] = z; return o; },
    scale(x, y, z) { const o = M.ident(); o[0] = x; o[5] = y; o[10] = z; return o; },
    rotX(a) { const o = M.ident(), c = Math.cos(a), s = Math.sin(a); o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o; },
    rotY(a) { const o = M.ident(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o; },
    rotZ(a) { const o = M.ident(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o; },
  };
  const IDENT = M.ident();

  // ---------- meshes ----------
  const FACES = [
    { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
    { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
    { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
    { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
  ];
  const FACE_UV = [[0, 1], [0, 0], [1, 0], [1, 1]];
  const FACE_SHADE = [0.8, 0.8, 1.0, 0.55, 0.68, 0.68];
  const AO_SHADE = [0.5, 0.66, 0.82, 1.0];
  function uvt(t, u, v) {
    return [((t % 16) + 0.001 + u * 0.998) / 16, (Math.floor(t / 16) + 0.001 + v * 0.998) / 16];
  }
  function makeMesh(arr, mode) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    return { buf, count: arr.length / 6, mode: mode === undefined ? gl.TRIANGLES : mode };
  }
  function freeMesh(m) { if (m) gl.deleteBuffer(m.buf); }
  let curTint = '';
  function drawMesh(mesh, model, tint) {
    if (!mesh || !mesh.count) return;
    gl.uniformMatrix4fv(L.model, false, model);
    const t = tint || WHITE3;
    const key = t[0] + ',' + t[1] + ',' + t[2];
    if (key !== curTint) { gl.uniform3f(L.tint, t[0], t[1], t[2]); curTint = key; }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
    gl.vertexAttribPointer(L.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(L.uv, 2, gl.FLOAT, false, 24, 12);
    gl.vertexAttribPointer(L.shade, 1, gl.FLOAT, false, 24, 20);
    gl.drawArrays(mesh.mode, 0, mesh.count);
  }
  const WHITE3 = [1, 1, 1];
  const cubeCache = {};
  function cubeMesh(tiles) {
    const key = tiles.join(',');
    if (cubeCache[key]) return cubeCache[key];
    const a = [];
    for (let f = 0; f < 6; f++) {
      const F = FACES[f];
      const v = F.c.map((c, i) => [c[0] - 0.5, c[1] - 0.5, c[2] - 0.5, ...uvt(tiles[f], FACE_UV[i][0], FACE_UV[i][1]), FACE_SHADE[f]]);
      for (const i of [0, 1, 2, 0, 2, 3]) a.push(...v[i]);
    }
    return (cubeCache[key] = makeMesh(a));
  }
  const tileCube = (t) => cubeMesh([t, t, t, t, t, t]);
  const blockCube = (id) => { const b = BLOCKS[id]; return cubeMesh([b.side, b.side, b.top, b.bottom, b.side, b.side]); };
  const headMesh = cubeMesh([T.PANDA_WHITE, T.PANDA_WHITE, T.PANDA_WHITE, T.PANDA_WHITE, T.PANDA_WHITE, T.PANDA_FACE]);
  const outlineMesh = (() => {
    const a = [], uv = uvt(T.WHITE, 0.5, 0.5), e = 0.003;
    const P = (x, y, z) => a.push(x ? 1 + e : -e, y ? 1 + e : -e, z ? 1 + e : -e, uv[0], uv[1], 1);
    for (let i = 0; i < 4; i++) {
      const x = i & 1, z = i >> 1;
      P(x, 0, z); P(x, 1, z);
    }
    for (const y of [0, 1]) {
      P(0, y, 0); P(1, y, 0); P(1, y, 0); P(1, y, 1); P(1, y, 1); P(0, y, 1); P(0, y, 1); P(0, y, 0);
    }
    return makeMesh(a, gl.LINES);
  })();

  function occ(x, y, z) { const id = getB(x, y, z); return id && id !== B.GLASS ? 1 : 0; }
  function buildChunk(ch) {
    const a = [];
    const x0 = ch.cx * CS, z0 = ch.cz * CS;
    for (let y = 0; y < WY; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
      const id = world[idx(x, y, z)];
      if (!id) continue;
      const bd = BLOCKS[id];
      for (let f = 0; f < 6; f++) {
        const F = FACES[f], n = F.n;
        const nb = getB(x + n[0], y + n[1], z + n[2]);
        if (!(nb === 0 || (TRANS[nb] && (nb !== id || id === B.LEAVES)))) continue;
        if (y === 0 && f === 3) continue;
        const tile = f === 2 ? bd.top : f === 3 ? bd.bottom : bd.side;
        const na = n[0] ? 0 : n[1] ? 1 : 2, a1 = na === 0 ? 1 : 0, a2 = na === 2 ? 1 : 2;
        const px = x + n[0], py = y + n[1], pz = z + n[2];
        const ao = [], vs = [];
        for (let i = 0; i < 4; i++) {
          const c = F.c[i];
          const d1 = [0, 0, 0], d2 = [0, 0, 0];
          d1[a1] = c[a1] ? 1 : -1; d2[a2] = c[a2] ? 1 : -1;
          const s1 = occ(px + d1[0], py + d1[1], pz + d1[2]);
          const s2 = occ(px + d2[0], py + d2[1], pz + d2[2]);
          const cr = occ(px + d1[0] + d2[0], py + d1[1] + d2[1], pz + d1[2] + d2[2]);
          const v = s1 && s2 ? 0 : 3 - (s1 + s2 + cr);
          ao.push(v);
          const uv = uvt(tile, FACE_UV[i][0], FACE_UV[i][1]);
          vs.push([x + c[0], y + c[1], z + c[2], uv[0], uv[1], FACE_SHADE[f] * AO_SHADE[v]]);
        }
        const order = ao[0] + ao[2] < ao[1] + ao[3] ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
        for (const i of order) a.push(...vs[i]);
      }
    }
    freeMesh(ch.mesh);
    ch.mesh = makeMesh(a);
    ch.dirty = false;
  }

  // ---------- raycasting ----------
  function raycast(ox, oy, oz, dx, dy, dz, maxD) {
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const sx = Math.sign(dx), sy = Math.sign(dy), sz = Math.sign(dz);
    const tdx = dx ? Math.abs(1 / dx) : Infinity, tdy = dy ? Math.abs(1 / dy) : Infinity, tdz = dz ? Math.abs(1 / dz) : Infinity;
    let tmx = dx > 0 ? (x + 1 - ox) * tdx : dx < 0 ? (ox - x) * tdx : Infinity;
    let tmy = dy > 0 ? (y + 1 - oy) * tdy : dy < 0 ? (oy - y) * tdy : Infinity;
    let tmz = dz > 0 ? (z + 1 - oz) * tdz : dz < 0 ? (oz - z) * tdz : Infinity;
    let t = 0, nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < 200 && t <= maxD; i++) {
      if (y >= 0 && y < WY) {
        const id = getB(x, y, z);
        if (id) return { x, y, z, id, nx, ny, nz, t };
      }
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
  function rayAABB(o, d, mn, mx) {
    let tmin = 0, tmax = Infinity;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) { if (o[a] < mn[a] || o[a] > mx[a]) return null; continue; }
      let t1 = (mn[a] - o[a]) / d[a], t2 = (mx[a] - o[a]) / d[a];
      if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
    return tmin;
  }

  // ---------- physics ----------
  function boxHits(x, y, z, hw, h) {
    const x0 = Math.floor(x - hw), x1 = Math.floor(x + hw), y0 = Math.floor(y), y1 = Math.floor(y + h), z0 = Math.floor(z - hw), z1 = Math.floor(z + hw);
    for (let by = y0; by <= y1; by++) for (let bz = z0; bz <= z1; bz++) for (let bx = x0; bx <= x1; bx++) if (solidAt(bx, by, bz)) return true;
    return false;
  }
  function moveBox(e, hw, h, dt) {
    e.hitWall = false; e.onGround = false;
    const steps = Math.max(1, Math.ceil((Math.max(Math.abs(e.vx), Math.abs(e.vy), Math.abs(e.vz)) * dt) / 0.25));
    const sd = dt / steps;
    for (let s = 0; s < steps; s++) {
      let n = e.x + e.vx * sd;
      if (boxHits(n, e.y, e.z, hw, h)) { e.x = e.vx > 0 ? Math.floor(n + hw) - hw - 0.001 : Math.floor(n - hw) + 1 + hw + 0.001; e.vx = 0; e.hitWall = true; } else e.x = n;
      n = e.z + e.vz * sd;
      if (boxHits(e.x, e.y, n, hw, h)) { e.z = e.vz > 0 ? Math.floor(n + hw) - hw - 0.001 : Math.floor(n - hw) + 1 + hw + 0.001; e.vz = 0; e.hitWall = true; } else e.z = n;
      n = e.y + e.vy * sd;
      if (boxHits(e.x, n, e.z, hw, h)) {
        if (e.vy < 0) { e.y = Math.floor(n) + 1; e.onGround = true; } else e.y = Math.floor(n + h) - h - 0.001;
        e.vy = 0;
      } else e.y = n;
    }
  }
  const boxOverlap = (a0, a1, b0, b1) => a0[0] < b1[0] && a1[0] > b0[0] && a0[1] < b1[1] && a1[1] > b0[1] && a0[2] < b1[2] && a1[2] > b0[2];

  // ---------- game state ----------
  const PHW = 0.3, PH = 1.8, EYE = 1.62, GRAV = 28, PINE_G = 16, ARROW_G = 18;
  const P = { x: 32, y: 30, z: 32, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -0.1, onGround: false, hitWall: false, hp: 20, invul: 0, lastHurt: 0, kb: 0 };
  const ITEMS = [
    { name: 'Sword', kind: 'sword' },
    { name: 'Bow', kind: 'bow' },
    { name: 'Shield', kind: 'shield' },
    { name: 'Pickaxe', kind: 'pick' },
    { name: 'Planks', kind: 'block', block: B.PLANKS },
    { name: 'Cobblestone', kind: 'block', block: B.COBBLE },
    { name: 'Bricks', kind: 'block', block: B.BRICK },
    { name: 'Glass', kind: 'block', block: B.GLASS },
    { name: 'Dirt', kind: 'block', block: B.DIRT },
  ];
  let sel = 0, state = 'menu', touchMode = false;
  let pandas = [], pineapples = [], arrows = [], particles = [];
  let wave = 0, waveTimer = 3, toSpawn = 0, spawnTimer = 0, score = 0, time = 0;
  let best = 0;
  try { best = +localStorage.getItem('pandamonium-best') || 0; } catch (e) { /* storage blocked */ }
  let atkCd = 0, placeCd = 0, swing = 0, charge = 0, shieldUp = false, brk = null, target = null, walkPhase = 0, flash = 0;
  const keys = {};
  const act = { pDown: false, pEdge: false, sDown: false, sEdge: false, tap: false, jump: false };
  const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const look = { id: null, lx: 0, ly: 0, t0: 0, moved: 0 };

  const eye = () => [P.x, P.y + EYE, P.z];
  function fwd() { const cp = Math.cos(P.pitch); return [-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp]; }

  function resetGame() {
    generate();
    const sx = WX / 2 + 0.5, sz = WZ / 2 + 0.5;
    Object.assign(P, { x: sx, y: topY(Math.floor(sx), Math.floor(sz)), z: sz, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -0.1, hp: 20, invul: 0, lastHurt: 0, kb: 0 });
    pandas = []; pineapples = []; arrows = []; particles = [];
    wave = 0; waveTimer = 3; toSpawn = 0; score = 0; brk = null; charge = 0;
    hudDirty = true;
  }

  // ---------- particles ----------
  function burst(x, y, z, tiles, n, sp) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x + (rnd() - 0.5) * 0.6, y: y + (rnd() - 0.5) * 0.6, z: z + (rnd() - 0.5) * 0.6,
        vx: (rnd() - 0.5) * sp, vy: rnd() * sp * 0.8 + 1, vz: (rnd() - 0.5) * sp,
        life: 0.5 + rnd() * 0.6, tile: tiles[i % tiles.length], size: 0.08 + rnd() * 0.1,
      });
    }
    if (particles.length > 400) particles.splice(0, particles.length - 400);
  }

  // ---------- pandas ----------
  function spawnPanda() {
    for (let tries = 0; tries < 20; tries++) {
      const a = rnd() * Math.PI * 2, r = 16 + rnd() * 12;
      const x = Math.max(2, Math.min(WX - 3, P.x + Math.cos(a) * r)), z = Math.max(2, Math.min(WZ - 3, P.z + Math.sin(a) * r));
      if (Math.hypot(x - P.x, z - P.z) < 10) continue;
      const y = topY(Math.floor(x), Math.floor(z));
      if (y + 2 >= WY) continue;
      pandas.push({
        x: Math.floor(x) + 0.5, y, z: Math.floor(z) + 0.5, vx: 0, vy: 0, vz: 0, yaw: 0, hp: 8 + wave * 2, maxHp: 8 + wave * 2,
        cd: 1.5 + rnd() * 2, windup: 0, hurt: 0, kb: 0, onGround: false, hitWall: false, strafe: rnd() < 0.5 ? -1 : 1, phase: 0,
      });
      burst(x, y + 0.8, z, [T.PANDA_WHITE, T.PANDA_BLACK], 10, 3);
      return true;
    }
    return false;
  }
  function hurtPanda(p, dmg, kx, kz) {
    p.hp -= dmg; p.hurt = 0.3; p.kb = 0.35;
    p.vx = kx * 7; p.vz = kz * 7; p.vy = 4.5;
    burst(p.x, p.y + 1, p.z, [T.PANDA_WHITE, T.PANDA_BLACK], 4, 3);
    if (p.hp <= 0) {
      burst(p.x, p.y + 0.8, p.z, [T.PANDA_WHITE, T.PANDA_BLACK, T.PANDA_WHITE], 24, 5);
      pandas.splice(pandas.indexOf(p), 1);
      score++;
      if (score > best) { best = score; try { localStorage.setItem('pandamonium-best', String(best)); } catch (e) { /* ignore */ } }
      hudDirty = true;
    }
  }
  function lineOfSight(a, b) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]);
    const h = raycast(a[0], a[1], a[2], d[0] / len, d[1] / len, d[2] / len, len);
    return !h || h.t >= len - 0.5;
  }
  function throwPineapple(p) {
    const ox = p.x - Math.sin(p.yaw) * 0.5, oy = p.y + 1.75, oz = p.z - Math.cos(p.yaw) * 0.5;
    const err = 1.4 - Math.min(0.9, wave * 0.1);
    let tx = P.x + (rnd() - 0.5) * err, ty = P.y + 1.0, tz = P.z + (rnd() - 0.5) * err;
    let dh = Math.hypot(tx - ox, tz - oz);
    let t = Math.max(0.45, dh / 11);
    tx += P.vx * t * 0.8; tz += P.vz * t * 0.8; // lead the target
    dh = Math.hypot(tx - ox, tz - oz); t = Math.max(0.45, dh / 11);
    const vy = (ty - oy) / t + 0.5 * PINE_G * t;
    pineapples.push({ x: ox, y: oy, z: oz, vx: (tx - ox) / t, vy, vz: (tz - oz) / t, rot: 0, reflected: false, life: 8 });
  }
  function updatePandas(dt) {
    const speed = Math.min(3.6, 2.3 + wave * 0.12);
    for (const p of pandas.slice()) {
      const dx = P.x - p.x, dz = P.z - p.z, dist = Math.hypot(dx, dz) || 0.001;
      const ux = dx / dist, uz = dz / dist;
      let ty = Math.atan2(-dx, -dz), dy = ty - p.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      p.yaw += dy * Math.min(1, dt * 6);
      let mx = 0, mz = 0;
      if (p.windup > 0) { /* stand still while winding up */ }
      else if (dist > 11) { mx = ux; mz = uz; }
      else if (dist < 6) { mx = -ux; mz = -uz; }
      else { mx = -uz * p.strafe * 0.6; mz = ux * p.strafe * 0.6; if (rnd() < dt * 0.4) p.strafe *= -1; }
      for (const q of pandas) {
        if (q === p) continue;
        const sx = p.x - q.x, sz = p.z - q.z, sd = Math.hypot(sx, sz);
        if (sd < 1.4 && sd > 0.001) { mx += (sx / sd) * 0.8; mz += (sz / sd) * 0.8; }
      }
      if (p.kb > 0) p.kb -= dt;
      else {
        const k = Math.min(1, dt * 10);
        p.vx += (mx * speed - p.vx) * k; p.vz += (mz * speed - p.vz) * k;
      }
      p.vy = Math.max(-30, p.vy - GRAV * dt);
      const wasMoving = Math.abs(mx) + Math.abs(mz) > 0.1;
      moveBox(p, 0.45, 1.5, dt);
      if (p.hitWall && p.onGround && wasMoving) p.vy = 8.2;
      p.phase += Math.hypot(p.vx, p.vz) * dt * 3;
      if (p.hurt > 0) p.hurt -= dt;
      if (p.windup > 0) {
        p.windup -= dt;
        if (p.windup <= 0) throwPineapple(p);
      } else {
        p.cd -= dt;
        if (p.cd <= 0 && dist < 24) {
          const head = [p.x, p.y + 1.6, p.z];
          if (dist < 14 || lineOfSight(head, eye()) || rnd() < 0.5) p.windup = 0.6;
          p.cd = (2.4 + rnd() * 2.2) * Math.max(0.45, 1 - wave * 0.06);
        }
      }
      if (p.y < -5) pandas.splice(pandas.indexOf(p), 1);
    }
  }

  // ---------- player ----------
  function hurtPlayer(dmg, fromX, fromZ) {
    if (P.invul > 0) return;
    P.hp -= dmg; P.invul = 0.35; P.lastHurt = time; flash = 1; hudDirty = true;
    const dx = P.x - fromX, dz = P.z - fromZ, d = Math.hypot(dx, dz) || 1;
    P.vx += (dx / d) * 5; P.vz += (dz / d) * 5; P.vy = Math.max(P.vy, 4); P.kb = 0.25;
    if (P.hp <= 0) { P.hp = 0; die(); }
  }
  function updatePlayer(dt) {
    let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    let mz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    const item = ITEMS[sel];
    let speed = keys.ShiftLeft || keys.ShiftRight ? 6.2 : 4.4;
    if (shieldUp || charge > 0) speed = 2.4;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const wx = (fx * mz + rx * mx) * speed, wz = (fz * mz + rz * mx) * speed;
    if (P.kb > 0) P.kb -= dt;
    const k = Math.min(1, dt * (P.kb > 0 ? 1 : P.onGround ? 14 : 5));
    P.vx += (wx - P.vx) * k; P.vz += (wz - P.vz) * k;
    P.vy = Math.max(-40, P.vy - GRAV * dt);
    if ((keys.Space || act.jump) && P.onGround) P.vy = 8.6;
    moveBox(P, PHW, PH, dt);
    // auto-jump on touch devices when walking into a one-block step
    if (touchMode && P.hitWall && P.onGround && ml > 0.3) {
      const ax = Math.floor(P.x + fx * mz * 0.6 + rx * mx * 0.6), az = Math.floor(P.z + fz * mz * 0.6 + rz * mx * 0.6), ay = Math.floor(P.y);
      if (solidAt(ax, ay, az) && !solidAt(ax, ay + 1, az) && !solidAt(ax, ay + 2, az)) P.vy = 8.6;
    }
    if (P.onGround) walkPhase += Math.hypot(P.vx, P.vz) * dt * 2.2;
    if (P.invul > 0) P.invul -= dt;
    if (time - P.lastHurt > 4 && P.hp < 20) { P.hp = Math.min(20, P.hp + dt / 2.5); hudDirty = true; }
    void item;
  }

  function placeBlock(t, id) {
    const x = t.x + t.nx, y = t.y + t.ny, z = t.z + t.nz;
    if (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0 || y >= WY) return false;
    if (getB(x, y, z) !== 0) return false;
    const b0 = [x, y, z], b1 = [x + 1, y + 1, z + 1];
    if (boxOverlap([P.x - PHW, P.y, P.z - PHW], [P.x + PHW, P.y + PH, P.z + PHW], b0, b1)) return false;
    for (const p of pandas) if (boxOverlap([p.x - 0.45, p.y, p.z - 0.45], [p.x + 0.45, p.y + 1.5, p.z + 0.45], b0, b1)) return false;
    setB(x, y, z, id);
    swing = 1;
    return true;
  }
  function fireArrow(c) {
    const e = eye(), d = fwd(), sp = 14 + 26 * c;
    arrows.push({ x: e[0] + d[0] * 0.4, y: e[1] + d[1] * 0.4 - 0.05, z: e[2] + d[2] * 0.4, vx: d[0] * sp, vy: d[1] * sp, vz: d[2] * sp, dmg: 3 + 7 * c, stuck: 0, life: 6 });
  }

  function updateActions(dt) {
    const item = ITEMS[sel];
    atkCd -= dt; placeCd -= dt;
    if (swing > 0) swing = Math.max(0, swing - dt * 3.5);
    const e = eye(), d = fwd();
    target = raycast(e[0], e[1], e[2], d[0], d[1], d[2], 5.5);
    let pt = null, ptD = Infinity;
    for (const p of pandas) {
      const t = rayAABB(e, d, [p.x - 0.6, p.y, p.z - 0.6], [p.x + 0.6, p.y + 1.55, p.z + 0.6]);
      if (t !== null && t < ptD) { ptD = t; pt = p; }
    }
    const reach = item.kind === 'sword' ? 4.2 : 3.3;
    if (pt && (ptD > reach || (target && target.t < ptD))) pt = null;

    if (act.pDown || act.pEdge) {
      if (pt) {
        brk = null;
        if (atkCd <= 0 && (act.pEdge || item.kind === 'sword')) {
          const dmg = item.kind === 'sword' ? 5 : item.kind === 'pick' ? 2 : 1;
          const fl = Math.hypot(d[0], d[2]) || 1;
          hurtPanda(pt, dmg, d[0] / fl, d[2] / fl);
          swing = 1; atkCd = item.kind === 'sword' ? 0.4 : 0.35;
        }
      } else if (target && act.pDown && isFinite(BLOCKS[target.id].hard)) {
        if (!brk || brk.x !== target.x || brk.y !== target.y || brk.z !== target.z) brk = { x: target.x, y: target.y, z: target.z, prog: 0 };
        brk.prog += (dt * (item.kind === 'pick' ? 3.5 : 1)) / BLOCKS[target.id].hard;
        if (swing <= 0) swing = 1;
        if (brk.prog >= 1) {
          const b = BLOCKS[target.id];
          setB(target.x, target.y, target.z, 0);
          burst(target.x + 0.5, target.y + 0.5, target.z + 0.5, [b.side, b.top], 14, 3);
          brk = null;
        }
      } else {
        if (act.pEdge && swing <= 0) swing = 1;
        brk = null;
      }
    } else brk = null;

    shieldUp = item.kind === 'shield' && act.sDown;
    if (item.kind === 'block') {
      if (target && (act.sEdge || act.tap || (act.sDown && placeCd <= 0))) { if (placeBlock(target, item.block)) placeCd = 0.25; }
    }
    if (item.kind === 'bow') {
      if (act.sDown) charge = Math.min(1, charge + dt * 1.25);
      else if (charge > 0) { if (charge > 0.12) fireArrow(charge); charge = 0; }
    } else charge = 0;
    act.pEdge = false; act.sEdge = false; act.tap = false;
  }

  function updateProjectiles(dt) {
    const e = eye();
    for (let i = pineapples.length - 1; i >= 0; i--) {
      const q = pineapples[i];
      let gone = false;
      q.life -= dt; q.rot += dt * 8;
      const steps = 4, sd = dt / steps;
      for (let s = 0; s < steps && !gone; s++) {
        q.vy -= PINE_G * sd;
        q.x += q.vx * sd; q.y += q.vy * sd; q.z += q.vz * sd;
        const bx = Math.floor(q.x), by = Math.floor(q.y), bz = Math.floor(q.z);
        if (q.y < 0 || (by < WY && getB(bx, by, bz))) {
          if (getB(bx, by, bz) === B.GLASS) {
            setB(bx, by, bz, 0);
            burst(bx + 0.5, by + 0.5, bz + 0.5, [T.GLASS, T.WHITE], 10, 3);
          }
          burst(q.x, q.y, q.z, [T.PINE_BODY, T.PINE_TOP, T.PINE_BODY], 12, 4);
          gone = true; break;
        }
        if (!q.reflected) {
          if (q.x > P.x - PHW - 0.25 && q.x < P.x + PHW + 0.25 && q.z > P.z - PHW - 0.25 && q.z < P.z + PHW + 0.25 && q.y > P.y - 0.2 && q.y < P.y + PH + 0.2) {
            const hx = q.x - e[0], hz = q.z - e[2], hl = Math.hypot(hx, hz) || 1;
            const facing = (-Math.sin(P.yaw) * hx + -Math.cos(P.yaw) * hz) / hl;
            if (shieldUp && facing > 0.2) {
              q.reflected = true; q.vx = -q.vx * 0.9; q.vz = -q.vz * 0.9; q.vy = Math.abs(q.vy) * 0.3 + 4;
              q.x += q.vx * 0.03; q.z += q.vz * 0.03;
              showMsg('Blocked!', 0.6);
              burst(q.x, q.y, q.z, [T.PINE_BODY], 4, 2);
            } else {
              hurtPlayer(3, q.x - q.vx, q.z - q.vz);
              burst(q.x, q.y, q.z, [T.PINE_BODY, T.PINE_TOP, T.PINE_BODY], 14, 4);
              gone = true; break;
            }
          }
        } else {
          for (const p of pandas) {
            if (Math.abs(q.x - p.x) < 0.65 && Math.abs(q.z - p.z) < 0.65 && q.y > p.y && q.y < p.y + 1.6) {
              const vl = Math.hypot(q.vx, q.vz) || 1;
              hurtPanda(p, 6, q.vx / vl, q.vz / vl);
              burst(q.x, q.y, q.z, [T.PINE_BODY, T.PINE_TOP], 12, 4);
              gone = true; break;
            }
          }
        }
      }
      if (gone || q.life <= 0) pineapples.splice(i, 1);
    }
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      a.life -= dt;
      if (a.stuck) { if (a.life <= 0) arrows.splice(i, 1); continue; }
      let gone = false;
      const steps = 6, sd = dt / steps;
      for (let s = 0; s < steps && !gone; s++) {
        a.vy -= ARROW_G * sd;
        a.x += a.vx * sd; a.y += a.vy * sd; a.z += a.vz * sd;
        if (a.y < 0 || getB(Math.floor(a.x), Math.floor(a.y), Math.floor(a.z))) { a.stuck = 1; a.life = 4; break; }
        for (const p of pandas) {
          if (Math.abs(a.x - p.x) < 0.6 && Math.abs(a.z - p.z) < 0.6 && a.y > p.y && a.y < p.y + 1.6) {
            const vl = Math.hypot(a.vx, a.vz) || 1;
            hurtPanda(p, a.dmg, (a.vx / vl) * 0.6, (a.vz / vl) * 0.6);
            gone = true; break;
          }
        }
      }
      if (gone || a.life <= 0) arrows.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; p.vy -= 18 * dt;
      p.x += p.vx * dt; p.z += p.vz * dt;
      const ny = p.y + p.vy * dt;
      if (getB(Math.floor(p.x), Math.floor(ny), Math.floor(p.z))) { p.vy = 0; p.vx *= 0.8; p.vz *= 0.8; } else p.y = ny;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateWaves(dt) {
    if (pandas.length === 0 && toSpawn === 0) {
      waveTimer -= dt;
      if (waveTimer <= 0) {
        wave++;
        toSpawn = Math.min(2 + wave, 12);
        spawnTimer = 0;
        showMsg('Wave ' + wave + ': ' + toSpawn + ' pandas incoming!', 2.5);
        hudDirty = true;
      }
    }
    if (toSpawn > 0) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) { if (spawnPanda()) toSpawn--; spawnTimer = 1.2; hudDirty = true; if (toSpawn === 0) waveTimer = 5; }
    }
  }

  function update(dt) {
    time += dt;
    updatePlayer(dt);
    updateActions(dt);
    updatePandas(dt);
    updateProjectiles(dt);
    updateWaves(dt);
    if (flash > 0) flash = Math.max(0, flash - dt * 2.5);
  }

  // ---------- rendering ----------
  let vw = 0, vh = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, touchMode ? 1.5 : 2);
    const w = Math.floor(window.innerWidth * dpr), h = Math.floor(window.innerHeight * dpr);
    if (w !== vw || h !== vh) { vw = canvas.width = w; vh = canvas.height = h; }
  }
  const box = (base, cx, cy, cz, sx, sy, sz) => M.mul(base, M.mul(M.trans(cx, cy, cz), M.scale(sx, sy, sz)));
  function drawPanda(p) {
    const tint = p.hurt > 0 ? [1, 0.45, 0.45] : WHITE3;
    const base = M.mul(M.trans(p.x, p.y, p.z), M.rotY(p.yaw));
    const W = tileCube(T.PANDA_WHITE), K = tileCube(T.PANDA_BLACK);
    drawMesh(W, box(base, 0, 0.8, 0.2, 0.9, 0.7, 0.9), tint);
    drawMesh(K, box(base, 0, 0.8, -0.4, 0.92, 0.72, 0.3), tint);
    const sw = Math.sin(p.phase) * 0.6;
    for (const [lx, lz, s] of [[-0.28, -0.35, 1], [0.28, -0.35, -1], [-0.28, 0.42, -1], [0.28, 0.42, 1]]) {
      drawMesh(K, M.chain(base, M.trans(lx, 0.5, lz), M.rotX(sw * s), M.trans(0, -0.25, 0), M.scale(0.3, 0.5, 0.3)), tint);
    }
    const bob = p.windup > 0 ? -0.08 : 0;
    drawMesh(headMesh, box(base, 0, 1.12 + bob, -0.78, 0.7, 0.6, 0.55), tint);
    drawMesh(K, box(base, -0.25, 1.47 + bob, -0.72, 0.18, 0.16, 0.1), tint);
    drawMesh(K, box(base, 0.25, 1.47 + bob, -0.72, 0.18, 0.16, 0.1), tint);
    if (p.windup > 0) {
      // arms raised holding a pineapple
      drawMesh(K, M.chain(base, M.trans(-0.36, 1.05, -0.55), M.rotX(2.6), M.trans(0, -0.3, 0), M.scale(0.2, 0.6, 0.2)), tint);
      drawMesh(K, M.chain(base, M.trans(0.36, 1.05, -0.55), M.rotX(2.6), M.trans(0, -0.3, 0), M.scale(0.2, 0.6, 0.2)), tint);
      drawPineapple(M.mul(base, M.trans(0, 1.78, -0.35)), 0);
    }
    // health bar when damaged
    if (p.hp < p.maxHp) {
      const ang = Math.atan2(P.x - p.x, P.z - p.z);
      const hb = M.mul(M.trans(p.x, p.y + 1.9, p.z), M.rotY(ang));
      const f = Math.max(0, p.hp / p.maxHp);
      drawMesh(tileCube(T.WHITE), box(hb, 0, 0, 0, 0.8, 0.08, 0.02), [0.2, 0.2, 0.2]);
      drawMesh(tileCube(T.WHITE), box(hb, -0.4 + 0.4 * f, 0, 0.015, 0.8 * f, 0.08, 0.02), [0.9, 0.2, 0.2]);
    }
  }
  function drawPineapple(base, rot) {
    const m = M.chain(base, M.rotY(rot), M.rotX(rot * 0.6));
    drawMesh(tileCube(T.PINE_BODY), box(m, 0, 0, 0, 0.3, 0.38, 0.3));
    drawMesh(tileCube(T.PINE_TOP), box(m, 0, 0.27, 0, 0.16, 0.18, 0.16));
    drawMesh(tileCube(T.PINE_TOP), box(m, 0, 0.36, 0, 0.08, 0.12, 0.08));
  }
  function drawArrow(a) {
    const yaw = Math.atan2(-a.vx, -a.vz), pitch = Math.atan2(a.vy, Math.hypot(a.vx, a.vz));
    const m = M.chain(M.trans(a.x, a.y, a.z), M.rotY(yaw), M.rotX(pitch));
    drawMesh(tileCube(T.LOG_SIDE), box(m, 0, 0, 0.3, 0.04, 0.04, 0.6));
    drawMesh(tileCube(T.IRON), box(m, 0, 0, 0, 0.07, 0.07, 0.1));
    drawMesh(tileCube(T.WHITE), box(m, 0, 0, 0.58, 0.02, 0.12, 0.12));
  }
  function drawHeld() {
    const item = ITEMS[sel];
    const sp = Math.hypot(P.vx, P.vz) > 0.5 && P.onGround ? 1 : 0;
    const bx = Math.sin(walkPhase) * 0.025 * sp, by = -Math.abs(Math.cos(walkPhase)) * 0.025 * sp;
    const s = Math.sin(swing * Math.PI);
    let m = M.trans(0.42 + bx, -0.38 + by, -0.72);
    if (swing > 0) m = M.chain(m, M.trans(-0.12 * s, 0.06 * s, -0.12 * s), M.rotX(-1.0 * s), M.rotY(0.3 * s));
    if (item.kind === 'sword') {
      const mm = M.chain(m, M.rotZ(0.3), M.rotX(-0.55));
      drawMesh(tileCube(T.LOG_SIDE), box(mm, 0, -0.06, 0, 0.06, 0.2, 0.06));
      drawMesh(tileCube(T.DARK), box(mm, 0, 0.06, 0, 0.26, 0.05, 0.08));
      drawMesh(tileCube(T.IRON), box(mm, 0, 0.38, 0, 0.09, 0.6, 0.03));
    } else if (item.kind === 'pick') {
      const mm = M.chain(m, M.rotZ(0.3), M.rotX(-0.45));
      drawMesh(tileCube(T.LOG_SIDE), box(mm, 0, 0.15, 0, 0.055, 0.65, 0.055));
      drawMesh(tileCube(T.IRON), box(mm, 0, 0.45, 0, 0.52, 0.08, 0.08));
      drawMesh(tileCube(T.IRON), box(mm, -0.27, 0.41, 0, 0.08, 0.08, 0.07));
      drawMesh(tileCube(T.IRON), box(mm, 0.27, 0.41, 0, 0.08, 0.08, 0.07));
    } else if (item.kind === 'bow') {
      const pull = charge * 0.14;
      let mm = charge > 0 ? M.trans(0.1, -0.2, -0.6) : m;
      mm = M.chain(mm, M.rotY(charge > 0 ? 0.35 : 1.0), M.rotZ(charge > 0 ? -0.1 : 0.3), M.scale(0.75, 0.75, 0.75));
      drawMesh(tileCube(T.DARK), box(mm, 0, 0, 0, 0.05, 0.2, 0.05));
      drawMesh(tileCube(T.LOG_SIDE), M.chain(mm, M.trans(0, 0.09, 0), M.rotX(0.5), M.trans(0, 0.14, 0), M.scale(0.04, 0.3, 0.04)));
      drawMesh(tileCube(T.LOG_SIDE), M.chain(mm, M.trans(0, -0.09, 0), M.rotX(-0.5), M.trans(0, -0.14, 0), M.scale(0.04, 0.3, 0.04)));
      drawMesh(tileCube(T.STRING), M.chain(mm, M.trans(0, 0.165, 0.11), M.rotX(-Math.atan2(pull, 0.17)), M.trans(0, -0.09, 0), M.scale(0.012, 0.19, 0.012)));
      drawMesh(tileCube(T.STRING), M.chain(mm, M.trans(0, -0.165, 0.11), M.rotX(Math.atan2(pull, 0.17)), M.trans(0, 0.09, 0), M.scale(0.012, 0.19, 0.012)));
      if (charge > 0) {
        drawMesh(tileCube(T.LOG_SIDE), box(mm, 0, 0, -0.12 + pull, 0.025, 0.025, 0.5));
        drawMesh(tileCube(T.IRON), box(mm, 0, 0, -0.38 + pull, 0.05, 0.05, 0.07));
      }
    } else if (item.kind === 'shield') {
      const mm = shieldUp ? M.mul(M.trans(0.2, -0.3, -0.75), M.rotY(-0.2)) : M.chain(m, M.rotY(-0.5));
      drawMesh(tileCube(T.SHIELD), box(mm, 0, 0, 0, 0.36, 0.48, 0.05));
    } else {
      const mm = M.chain(m, M.trans(0, 0.05, 0), M.rotY(0.7), M.rotX(0.2));
      drawMesh(blockCube(item.block), box(mm, 0, 0, 0, 0.28, 0.28, 0.28));
    }
  }

  function render() {
    resize();
    gl.viewport(0, 0, vw, vh);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const proj = M.persp((70 * Math.PI) / 180, vw / vh, 0.05, 200);
    const e = eye();
    const view = M.chain(M.rotX(-P.pitch), M.rotY(-P.yaw), M.trans(-e[0], -e[1], -e[2]));
    gl.uniformMatrix4fv(L.vp, false, M.mul(proj, view));
    gl.uniform3f(L.eye, e[0], e[1], e[2]);
    gl.uniform2f(L.fogRange, 26, 52);
    let built = 0;
    for (const ch of chunks) if (ch.dirty && (built < 4 || !ch.mesh)) { buildChunk(ch); built++; }
    for (const ch of chunks) drawMesh(ch.mesh, IDENT);
    for (const p of pandas) drawPanda(p);
    for (const q of pineapples) drawPineapple(M.trans(q.x, q.y, q.z), q.rot);
    for (const a of arrows) drawArrow(a);
    for (const p of particles) drawMesh(tileCube(p.tile), M.mul(M.trans(p.x, p.y, p.z), M.scale(p.size, p.size, p.size)));
    if (target && state === 'play') {
      drawMesh(outlineMesh, M.trans(target.x, target.y, target.z), [0, 0, 0]);
      if (brk && brk.prog > 0) {
        const st = Math.min(3, Math.floor(brk.prog * 4));
        drawMesh(tileCube(T.CRACK + st), M.mul(M.trans(brk.x + 0.5, brk.y + 0.5, brk.z + 0.5), M.scale(1.004, 1.004, 1.004)));
      }
    }
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(L.vp, false, proj);
    gl.uniform3f(L.eye, 0, 0, 0);
    gl.uniform2f(L.fogRange, 1000, 2000);
    drawHeld();
    // HUD bits
    $('flash').style.opacity = flash.toFixed(2);
    const ch = $('charge');
    if (charge > 0) { ch.style.display = 'block'; $('chargefill').style.width = Math.round(charge * 100) + '%'; } else ch.style.display = 'none';
    if (hudDirty) updateHud();
  }

  // ---------- HUD ----------
  let hudDirty = true, lastHp = -1;
  function updateHud() {
    hudDirty = false;
    const hp = Math.ceil(P.hp);
    if (hp !== lastHp) {
      lastHp = hp;
      let h = '';
      for (let i = 0; i < 10; i++) {
        const v = hp - i * 2;
        h += '<span class="h ' + (v >= 2 ? 'full' : v === 1 ? 'half' : 'empty') + '">&#9829;</span>';
      }
      $('hearts').innerHTML = h;
    }
    $('wave').textContent = 'Wave ' + wave;
    $('alive').textContent = 'Pandas: ' + (pandas.length + toSpawn);
    $('score').textContent = 'Defeated: ' + score;
  }
  let msgTimer = null;
  function showMsg(t, dur) {
    const el = $('msg');
    el.textContent = t; el.style.opacity = 1;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => (el.style.opacity = 0), dur * 1000);
  }
  let nameTimer = null;
  function selectSlot(i) {
    sel = (i + ITEMS.length) % ITEMS.length;
    charge = 0; brk = null;
    document.querySelectorAll('.slot').forEach((s, j) => s.classList.toggle('sel', j === sel));
    const el = $('itemname');
    const hints = { sword: 'Sword: hit pandas', bow: 'Bow: hold Use to draw, release to shoot', shield: 'Shield: hold Use to block and bounce pineapples back', pick: 'Pickaxe: breaks blocks fast' };
    el.textContent = hints[ITEMS[sel].kind] || ITEMS[sel].name + ': Use to place';
    el.style.opacity = 1;
    clearTimeout(nameTimer);
    nameTimer = setTimeout(() => (el.style.opacity = 0), 1800);
  }
  function toolIcon(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d');
    x.lineCap = 'square';
    const line = (col, w, pts) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); };
    if (kind === 'sword') {
      line('#555', 6, [9, 23, 27, 5]); line('#dde', 4, [9, 23, 27, 5]); line('#fff', 1, [10, 21, 26, 5]);
      line('#3a2a20', 4, [5, 17, 15, 27]); line('#7a5530', 4, [4, 28, 9, 23]);
    } else if (kind === 'pick') {
      line('#7a5530', 4, [5, 28, 22, 10]);
      x.strokeStyle = '#555'; x.lineWidth = 6; x.beginPath(); x.moveTo(8, 8); x.quadraticCurveTo(20, 2, 28, 18); x.stroke();
      x.strokeStyle = '#dde'; x.lineWidth = 4; x.beginPath(); x.moveTo(8, 8); x.quadraticCurveTo(20, 2, 28, 18); x.stroke();
    } else if (kind === 'bow') {
      x.strokeStyle = '#5a3a1a'; x.lineWidth = 4; x.beginPath(); x.moveTo(6, 4); x.quadraticCurveTo(30, 4, 28, 28); x.stroke();
      line('#eee', 1, [6, 4, 28, 28]); line('#9a7a4a', 2, [6, 26, 24, 8]); line('#ccc', 3, [23, 9, 25, 7]);
    } else if (kind === 'shield') {
      x.fillStyle = '#9a9aa4'; x.beginPath(); x.moveTo(4, 4); x.lineTo(28, 4); x.lineTo(28, 16); x.quadraticCurveTo(28, 26, 16, 30); x.quadraticCurveTo(4, 26, 4, 16); x.closePath(); x.fill();
      x.fillStyle = '#a0703f'; x.beginPath(); x.moveTo(7, 7); x.lineTo(25, 7); x.lineTo(25, 16); x.quadraticCurveTo(25, 24, 16, 27); x.quadraticCurveTo(7, 24, 7, 16); x.closePath(); x.fill();
      x.fillStyle = '#c83030'; x.beginPath(); x.arc(16, 16, 5, 0, Math.PI * 2); x.fill();
    }
    return c.toDataURL();
  }
  function blockIcon(id) {
    const b = BLOCKS[id], c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const face = (t, m, dark) => {
      x.setTransform(...m);
      x.drawImage(atlas, (t % 16) * 16, Math.floor(t / 16) * 16, 16, 16, 0, 0, 16, 16);
      if (dark) { x.fillStyle = 'rgba(0,0,0,' + dark + ')'; x.fillRect(0, 0, 16, 16); }
    };
    face(b.top, [1, 0.5, -1, 0.5, 16, 0], 0);
    face(b.side, [1, 0.5, 0, 1, 0, 8], 0.2);
    face(b.side, [1, -0.5, 0, 1, 16, 16], 0.38);
    return c.toDataURL();
  }
  function buildHotbar() {
    const hb = $('hotbar');
    ITEMS.forEach((it, i) => {
      const s = document.createElement('div');
      s.className = 'slot';
      s.innerHTML = '<span class="k">' + (i + 1) + '</span><img alt="' + it.name + '" title="' + it.name + '" src="' + (it.kind === 'block' ? blockIcon(it.block) : toolIcon(it.kind)) + '">';
      const pick = (e) => { e.preventDefault(); e.stopPropagation(); selectSlot(i); };
      s.addEventListener('touchstart', pick, { passive: false });
      s.addEventListener('mousedown', pick);
      hb.appendChild(s);
    });
  }

  // ---------- overlays and game flow ----------
  const overlay = $('overlay'), panel = $('panel');
  function showOverlay(html, btn, cb) {
    panel.innerHTML = html + '<button id="ovbtn">' + btn + '</button>';
    overlay.classList.remove('hidden');
    const b = $('ovbtn');
    const go = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'touchend') enableTouch(); cb(); };
    b.addEventListener('click', go);
    b.addEventListener('touchend', go, { passive: false });
  }
  function hideOverlay() { overlay.classList.add('hidden'); }
  function clearInput() {
    for (const k in keys) keys[k] = false;
    act.pDown = act.sDown = act.jump = false; act.pEdge = act.sEdge = act.tap = false;
    joy.id = null; joy.x = joy.y = 0; look.id = null; $('joy').style.display = 'none';
    document.querySelectorAll('.tbtn').forEach((b) => b.classList.remove('on'));
  }
  function lockPointer() {
    if (touchMode) return;
    try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { lockFailed = true; }); } catch (e) { lockFailed = true; }
  }
  let lockFailed = false;
  function play() { hideOverlay(); clearInput(); state = 'play'; lockPointer(); last = performance.now(); }
  function pause() {
    if (state !== 'play') return;
    state = 'pause'; clearInput();
    showOverlay('<h1>Paused</h1><p>The pandas are waiting, pineapples in paw.</p>', 'Resume', play);
  }
  function die() {
    state = 'dead'; clearInput();
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    showOverlay('<h1>Pineappled!</h1><p>You reached wave ' + wave + ' and defeated ' + score + ' panda' + (score === 1 ? '' : 's') + '.</p><p>Best: ' + best + '</p>', 'Play again', () => { resetGame(); play(); });
  }
  const HELP = `<h1>Pandamonium: Block Siege</h1>
<p>A blocky world, and a gang of pandas who throw pineapples. Build walls, dig in, and fight back. Each wave brings more pandas.</p>
<table>
<tr><td>Move</td><td>W A S D or arrows. Shift to run. Space to jump.</td></tr>
<tr><td>Look</td><td>Mouse (click the game to capture it, Esc to release).</td></tr>
<tr><td>Left mouse</td><td>Hit pandas. Hold to break blocks (the pickaxe is fastest).</td></tr>
<tr><td>Right mouse</td><td>Place blocks. Hold with the bow to draw, release to shoot. Hold with the shield to block.</td></tr>
<tr><td>1-9, wheel</td><td>Choose an item in the hotbar.</td></tr>
<tr><td>Touch</td><td>Left side: move stick. Right side: drag to look, tap to place. Buttons: Hit (hold to break), Use (place, draw bow, raise shield), Jump. Tap the hotbar to choose an item.</td></tr>
</table>
<p>Tip: a raised shield bounces pineapples back at the pandas. Glass does not stop a pineapple.</p>`;

  // ---------- input ----------
  function enableTouch() {
    if (touchMode) return;
    touchMode = true;
    document.body.classList.add('touch');
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
  }
  window.addEventListener('keydown', (e) => {
    if (state !== 'play') return;
    keys[e.code] = true;
    if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 9) selectSlot(n - 1); }
    if (e.code === 'KeyP') pause();
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { clearInput(); });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mousedown', (e) => {
    if (touchMode || state !== 'play') return;
    if (!document.pointerLockElement && !lockFailed) { lockPointer(); return; }
    if (e.button === 0) { act.pDown = true; act.pEdge = true; }
    if (e.button === 2) { act.sDown = true; act.sEdge = true; }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) act.pDown = false;
    if (e.button === 2) act.sDown = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (state !== 'play' || touchMode) return;
    if (document.pointerLockElement === canvas || (lockFailed && e.buttons)) {
      P.yaw -= e.movementX * 0.0024;
      P.pitch = Math.max(-1.55, Math.min(1.55, P.pitch - e.movementY * 0.0024));
    }
  });
  window.addEventListener('wheel', (e) => { if (state === 'play') selectSlot(sel + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && state === 'play' && !touchMode && !lockFailed) pause(); });
  document.addEventListener('pointerlockerror', () => { lockFailed = true; });

  const joyEl = $('joy'), knob = $('knob');
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    enableTouch();
    if (state !== 'play') return;
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.42 && joy.id === null) {
        joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY; joy.x = joy.y = 0;
        joyEl.style.display = 'block'; joyEl.style.left = t.clientX + 'px'; joyEl.style.top = t.clientY + 'px';
        knob.style.transform = '';
      } else if (look.id === null) {
        look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY; look.t0 = performance.now(); look.moved = 0;
      }
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) {
        let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
        const d = Math.hypot(dx, dy), R = 50;
        if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
        joy.x = dx / R; joy.y = dy / R;
        knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      } else if (t.identifier === look.id) {
        const dx = t.clientX - look.lx, dy = t.clientY - look.ly;
        look.lx = t.clientX; look.ly = t.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
        P.yaw -= dx * 0.0065;
        P.pitch = Math.max(-1.55, Math.min(1.55, P.pitch - dy * 0.0065));
      }
    }
  }, { passive: false });
  const touchEnd = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; joyEl.style.display = 'none'; }
      else if (t.identifier === look.id) {
        if (look.moved < 12 && performance.now() - look.t0 < 300 && state === 'play') act.tap = true;
        look.id = null;
      }
    }
  };
  canvas.addEventListener('touchend', touchEnd, { passive: false });
  canvas.addEventListener('touchcancel', touchEnd, { passive: false });
  function bindBtn(id, down, up) {
    const el = $(id);
    const d = (e) => { e.preventDefault(); e.stopPropagation(); enableTouch(); el.classList.add('on'); if (state === 'play') down(); };
    const u = (e) => { e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); up(); };
    el.addEventListener('touchstart', d, { passive: false });
    el.addEventListener('touchend', u, { passive: false });
    el.addEventListener('touchcancel', u, { passive: false });
    el.addEventListener('mousedown', d);
    el.addEventListener('mouseup', u);
    el.addEventListener('mouseleave', (e) => { if (el.classList.contains('on')) u(e); });
  }
  bindBtn('bHit', () => { act.pDown = true; act.pEdge = true; }, () => { act.pDown = false; });
  bindBtn('bUse', () => { act.sDown = true; act.sEdge = true; }, () => { act.sDown = false; });
  bindBtn('bJump', () => { act.jump = true; }, () => { act.jump = false; });
  bindBtn('bPause', () => pause(), () => {});
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) enableTouch();

  // ---------- main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (state === 'play') update(dt);
    else if (state === 'menu') { P.yaw += dt * 0.08; }
    render();
    requestAnimationFrame(frame);
  }
  buildHotbar();
  resetGame();
  selectSlot(0);
  updateHud();
  showOverlay(HELP, 'Start', play);
  requestAnimationFrame(frame);

  // test hook
  window.__game = {
    get state() { return state; }, P, act, keys, get pandas() { return pandas; }, get pineapples() { return pineapples; },
    get arrows() { return arrows; }, get score() { return score; }, get wave() { return wave; }, get target() { return target; },
    getB, setB, selectSlot, spawnPanda, update, throwPineapple, play, ITEMS, B,
    set shield(v) { act.sDown = v; },
  };
})();
