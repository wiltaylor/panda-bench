'use strict';
/* PandaCraft — shared math, noise, audio, atlas tile ids */

const T = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, LOG_SIDE: 4, LOG_TOP: 5,
  LEAVES: 6, SAND: 7, WATER: 8, PLANK: 9, COBBLE: 10, GLASS: 11,
  WHITE: 12, PINEAPPLE: 13,
};
const ATLAS_COLS = 4;   // 4x4 tiles of 16px -> 64x64 atlas
const ATLAS_TILE = 16;

function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t){ return a + (b - a) * t; }

function mulberry32(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- mat4, column-major ---------- */
const MUL_TMP = new Float32Array(16);
const Mat = {
  create(){ const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  ident(o){ o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  mul(o, a, b){ // o = a * b
    for(let c = 0; c < 4; c++){
      const b0 = b[c*4], b1 = b[c*4+1], b2 = b[c*4+2], b3 = b[c*4+3];
      for(let r = 0; r < 4; r++){
        MUL_TMP[c*4+r] = a[r]*b0 + a[4+r]*b1 + a[8+r]*b2 + a[12+r]*b3;
      }
    }
    o.set(MUL_TMP); return o;
  },
  persp(o, fovy, aspect, near, far){
    const f = 1/Math.tan(fovy/2), nf = 1/(near - far);
    o.fill(0);
    o[0] = f/aspect; o[5] = f; o[10] = (far+near)*nf; o[11] = -1; o[14] = 2*far*near*nf;
    return o;
  }
};
function mMul(a, b){ return Mat.mul(Mat.create(), a, b); }
function mT(x, y, z){ const m = Mat.create(); m[12] = x; m[13] = y; m[14] = z; return m; }
function mS(x, y, z){ const m = Mat.create(); m[0] = x; m[5] = y; m[10] = z; return m; }
function mRX(a){
  const m = Mat.create(), c = Math.cos(a), s = Math.sin(a);
  m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m;
}
function mRY(a){
  const m = Mat.create(), c = Math.cos(a), s = Math.sin(a);
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m;
}
const IDENT4 = Mat.create();

/* FPS camera view matrix: view = Rx(-pitch) * Ry(-yaw) * T(-eye) */
function viewMatrix(out, ex, ey, ez, yaw, pitch){
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  out[0] = cy;      out[1] = sp*sy; out[2] = cp*sy; out[3] = 0;
  out[4] = 0;       out[5] = cp;    out[6] = -sp;   out[7] = 0;
  out[8] = -sy;     out[9] = sp*cy; out[10] = cp*cy;out[11] = 0;
  out[12] = -(cy*ex - sy*ez);
  out[13] = -(sp*sy*ex + cp*ey + sp*cy*ez);
  out[14] = -(cp*sy*ex - sp*ey + cp*cy*ez);
  out[15] = 1;
  return out;
}
function lookDir(yaw, pitch){
  const cp = Math.cos(pitch);
  return [-Math.sin(yaw)*cp, Math.sin(pitch), -Math.cos(yaw)*cp];
}

/* ---------- value noise + fbm ---------- */
function makeNoise2(seed){
  const rnd = mulberry32(seed);
  const p = [];
  for(let i = 0; i < 256; i++) p.push(i);
  for(let i = 255; i > 0; i--){ const j = (rnd()*(i+1))|0; const t = p[i]; p[i] = p[j]; p[j] = t; }
  const perm = new Uint8Array(512);
  for(let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function hash(x, y){ return perm[(perm[x & 255] + y) & 255] / 255; }
  function noise(x, y){
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf);
    const a = hash(xi, yi), b = hash(xi+1, yi), c = hash(xi, yi+1), d = hash(xi+1, yi+1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  return noise;
}
function fbm2(noise, x, y, oct){
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for(let i = 0; i < oct; i++){
    sum += amp * noise(x*freq, y*freq);
    norm += amp; amp *= 0.5; freq *= 2;
  }
  return sum / norm;
}

/* ---------- tiny procedural sound effects ---------- */
const Sfx = {
  ctx: null, master: null, noiseBuf: null,
  ensure(){
    if(this.ctx){ if(this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for(let i = 0; i < len; i++) d[i] = Math.random()*2 - 1;
    } catch(e){ this.ctx = null; }
  },
  tone(freq, endFreq, dur, vol, type){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, fStart, fEnd, type){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass';
    f.frequency.setValueAtTime(fStart, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(10, fEnd), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.02);
  },
  play(n){
    if(!this.ctx) return;
    switch(n){
      case 'place':  this.tone(190, 120, 0.09, 0.5, 'square'); break;
      case 'break':  this.noise(0.14, 0.55, 900, 150); break;
      case 'dig':    this.noise(0.05, 0.16, 700, 300); break;
      case 'throw':  this.noise(0.18, 0.35, 400, 2400, 'bandpass'); break;
      case 'swing':  this.noise(0.09, 0.2, 300, 1400, 'bandpass'); break;
      case 'hit':    this.tone(160, 70, 0.12, 0.6, 'triangle'); break;
      case 'splat':  this.noise(0.16, 0.5, 1200, 200); break;
      case 'hurt':   this.tone(220, 90, 0.25, 0.5, 'sawtooth'); this.noise(0.15, 0.3, 500, 120); break;
      case 'pickup': this.tone(520, 880, 0.12, 0.3, 'sine'); this.tone(780, 1240, 0.1, 0.18, 'sine'); break;
      case 'squeak': this.tone(700, 240, 0.28, 0.45, 'sawtooth'); break;
      case 'denied': this.tone(140, 90, 0.12, 0.35, 'square'); break;
      case 'jump':   this.noise(0.06, 0.1, 300, 600); break;
    }
  }
};

const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
