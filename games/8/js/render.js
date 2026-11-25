'use strict';
/* PandaCraft — WebGL1 renderer: procedural texture atlas, chunk meshes, entities */

const VSH = `
attribute vec3 aPos;
attribute vec2 aUV;
attribute float aLight;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform vec3 uCam;
varying vec2 vUV;
varying float vLight;
varying float vDist;
void main(){
  vec4 wp = uModel * vec4(aPos, 1.0);
  gl_Position = uProj * uView * wp;
  vUV = aUV;
  vLight = aLight;
  vDist = distance(wp.xyz, uCam);
}`;

const FSH = `
precision mediump float;
varying vec2 vUV;
varying float vLight;
varying float vDist;
uniform sampler2D uTex;
uniform vec3 uFogCol;
uniform vec2 uFog;
uniform vec4 uTint;
uniform float uCutout;
void main(){
  vec4 c = texture2D(uTex, vUV);
  if(uCutout > 0.5 && c.a < 0.5) discard;
  c.rgb *= uTint.rgb * vLight;
  float f = clamp((vDist - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  gl_FragColor = vec4(mix(c.rgb, uFogCol, f), c.a * uTint.a);
}`;

/* face tables: outward-CCW corners [x,y,z,u,v]; sel picks top/bottom/side tile */
const FACES = [
  { d:[0,1,0],  shade:1.0,  sel:'top',    c:[[0,1,1,0,1],[1,1,1,1,1],[1,1,0,1,0],[0,1,0,0,0]] },
  { d:[0,-1,0], shade:0.5,  sel:'bottom', c:[[0,0,0,0,0],[1,0,0,1,0],[1,0,1,1,1],[0,0,1,0,1]] },
  { d:[1,0,0],  shade:0.65, sel:'side',   c:[[1,0,1,0,1],[1,0,0,1,1],[1,1,0,1,0],[1,1,1,0,0]] },
  { d:[-1,0,0], shade:0.65, sel:'side',   c:[[0,0,0,0,1],[0,0,1,1,1],[0,1,1,1,0],[0,1,0,0,0]] },
  { d:[0,0,1],  shade:0.82, sel:'side',   c:[[0,0,1,0,1],[1,0,1,1,1],[1,1,1,1,0],[0,1,1,0,0]] },
  { d:[0,0,-1], shade:0.82, sel:'side',   c:[[1,0,0,0,1],[0,0,0,1,1],[0,1,0,1,0],[1,1,0,0,0]] },
];

const Renderer = {
  gl: null, canvas: null, prog: null, tex: null,
  u: {}, a: {},
  chunks: [], avgColor: [], atlasCanvas: null,
  meshes: {}, blockCubes: {},
  sky: [0.63, 0.85, 0.98],
  onEntities: null, onHeld: null,

  init(canvas){
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
            || canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
    if(!gl) throw new Error('WebGL is not supported in this browser.');
    this.gl = gl;
    this.makeAtlas();
    this.buildProgram();
    this.buildStatic();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  },

  /* ---- procedural 16px tiles painted into a 64x64 atlas ---- */
  makeAtlas(){
    const S = ATLAS_TILE, C = ATLAS_COLS;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S*C;
    const g = cv.getContext('2d');
    const rnd = mulberry32(1234);
    const pos = t => [(t % C)*S, Math.floor(t/C)*S];
    const fill = (t, fn) => {
      const [ox, oy] = pos(t);
      for(let y = 0; y < S; y++){
        for(let x = 0; x < S; x++){
          const c = fn(x, y);
          if(!c) continue;
          g.fillStyle = 'rgba(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ',' + ((c[3] === undefined ? 255 : c[3])/255) + ')';
          g.fillRect(ox + x, oy + y, 1, 1);
        }
      }
    };
    const vr = (r, gg, b, amt) => { const d = (rnd()*2 - 1)*amt; return [r+d, gg+d, b+d]; };

    fill(T.GRASS_TOP, () => vr(104, 168, 70, 15));
    fill(T.DIRT, () => vr(134, 96, 67, 13));
    fill(T.GRASS_SIDE, (x, y) => (y < 3 || (y === 3 && rnd() < 0.5)) ? vr(104, 168, 70, 15) : vr(134, 96, 67, 13));
    fill(T.STONE, (x, y) => {
      const n = (Math.sin((x*7 + y*13)*0.7) + 1)/2;
      return vr(116 + n*18, 116 + n*18, 120 + n*18, 8);
    });
    fill(T.LOG_SIDE, (x) => {
      const st = (x % 4 === 0 || x % 7 === 3) ? -22 : 0;
      return vr(107 + st, 76 + st, 43 + st*0.7, 8);
    });
    fill(T.LOG_TOP, (x, y) => {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      const ring = ((d|0) % 2 === 0) ? 8 : -18;
      return vr(160 + ring, 124 + ring, 78 + ring*0.7, 6);
    });
    fill(T.LEAVES, () => (rnd() < 0.14) ? [0, 0, 0, 0] : vr(56, 110, 34, 17));
    fill(T.SAND, () => vr(216, 203, 145, 10));
    fill(T.WATER, (x, y) => {
      const w = Math.sin((x + y*2)*0.9)*6;
      return vr(52 + w, 108 + w, 196 + w, 6);
    });
    fill(T.PLANK, (x, y) => {
      const row = (y/4)|0;
      const sep = (y % 4 === 3) ? -28 : 0;
      const off = (row % 2)*8;
      const nail = ((x + off) % 8 === 0 && y % 4 === 1) ? -30 : 0;
      return vr(176 + sep + nail, 138 + sep + nail, 82 + (sep + nail)*0.7, 7);
    });
    fill(T.COBBLE, (x, y) => {
      const gx = x % 8, gy = (y + (((x/8)|0) % 2)*4) % 8;
      const v = (gx === 0 || gy === 0) ? 62 : 100 + ((gx*gy) % 5)*7;
      return vr(v, v, v + 4, 7);
    });
    fill(T.GLASS, (x, y) => {
      if(x === 0 || y === 0 || x === 15 || y === 15) return [212, 236, 240, 255];
      if((x + y) === 10 || (x + y) === 11 || (x - y) === 6) return [238, 250, 253, 210];
      return [0, 0, 0, 0];
    });
    fill(T.WHITE, () => [255, 255, 255, 255]);
    fill(T.PINEAPPLE, (x, y) => {
      const dia = ((x + y) % 6 === 0) || (((x - y) + 16) % 6 === 0);
      return dia ? vr(150, 104, 34, 10) : vr(232, 178, 44, 11);
    });
    this.atlasCanvas = cv;

    // average tile colors for break particles
    const id = g.getImageData(0, 0, cv.width, cv.height).data;
    for(let t = 0; t < C*C; t++){
      const [ox, oy] = pos(t);
      let r = 0, gg = 0, b = 0, n = 0;
      for(let y = 0; y < S; y++){
        for(let x = 0; x < S; x++){
          const i = ((oy + y)*cv.width + ox + x)*4;
          if(id[i+3] < 128) continue;
          r += id[i]; gg += id[i+1]; b += id[i+2]; n++;
        }
      }
      this.avgColor[t] = n ? [r/n/255, gg/n/255, b/n/255] : [1, 1, 1];
    }

    const gl = this.gl;
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  },

  tileUV(t, u, v){
    const col = t % ATLAS_COLS, row = Math.floor(t/ATLAS_COLS);
    const s = 1/ATLAS_COLS, eps = 0.02;
    return [(col + eps + u*(1 - 2*eps))*s, (row + eps + v*(1 - 2*eps))*s];
  },

  buildProgram(){
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VSH));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FSH));
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    this.prog = p;
    this.u.uProj = gl.getUniformLocation(p, 'uProj');
    this.u.uView = gl.getUniformLocation(p, 'uView');
    this.u.uModel = gl.getUniformLocation(p, 'uModel');
    this.u.uCam = gl.getUniformLocation(p, 'uCam');
    this.u.uFogCol = gl.getUniformLocation(p, 'uFogCol');
    this.u.uFog = gl.getUniformLocation(p, 'uFog');
    this.u.uTint = gl.getUniformLocation(p, 'uTint');
    this.u.uCutout = gl.getUniformLocation(p, 'uCutout');
    this.u.uTex = gl.getUniformLocation(p, 'uTex');
    this.a.aPos = gl.getAttribLocation(p, 'aPos');
    this.a.aUV = gl.getAttribLocation(p, 'aUV');
    this.a.aLight = gl.getAttribLocation(p, 'aLight');
  },

  boxInto(V, I, cx, cy, cz, sx, sy, sz, tile){
    for(const f of FACES){
      if(V.length/6 + 4 > 65500) return;
      const base = V.length/6;
      const t2 = (tile === undefined) ? T.WHITE : tile;
      for(const c of f.c){
        const uv = this.tileUV(t2, c[3], c[4]);
        V.push(cx + (c[0] - 0.5)*sx, cy + (c[1] - 0.5)*sy, cz + (c[2] - 0.5)*sz, uv[0], uv[1], f.shade);
      }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  },

  uploadMesh(V, I, mode){
    const gl = this.gl;
    const m = { vb: gl.createBuffer(), ib: gl.createBuffer(), n: I.length, mode: mode || gl.TRIANGLES };
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(I), gl.STATIC_DRAW);
    return m;
  },

  buildStatic(){
    const gl = this.gl;
    // unit box (white tiles, per-face shading) — entities / particles / sword parts
    {
      const V = [], I = [];
      this.boxInto(V, I, 0, 0, 0, 1, 1, 1, T.WHITE);
      this.meshes.unit = this.uploadMesh(V, I);
    }
    // pineapple body (textured unit cube) + crown of leaves
    {
      const V = [], I = [];
      this.boxInto(V, I, 0, 0, 0, 1, 1, 1, T.PINEAPPLE);
      this.meshes.pine = this.uploadMesh(V, I);
      const V2 = [], I2 = [];
      this.boxInto(V2, I2, 0, 0.28, 0, 0.36, 0.24, 0.07);
      this.boxInto(V2, I2, 0, 0.28, 0, 0.07, 0.24, 0.36);
      this.meshes.crown = this.uploadMesh(V2, I2);
    }
    // selection wireframe (lines)
    {
      const V = [], I = [];
      const e = [
        [0,0,0,1,0,0],[1,0,0,1,0,1],[1,0,1,0,0,1],[0,0,1,0,0,0],
        [0,1,0,1,1,0],[1,1,0,1,1,1],[1,1,1,0,1,1],[0,1,1,0,1,0],
        [0,0,0,0,1,0],[1,0,0,1,1,0],[1,0,1,1,1,1],[0,0,1,0,1,1],
      ];
      for(const ed of e){
        for(let k = 0; k < 2; k++){
          const uv = this.tileUV(T.WHITE, 0.5, 0.5);
          V.push(ed[k*3], ed[k*3+1], ed[k*3+2], uv[0], uv[1], 1);
          I.push(V.length/6 - 1);
        }
      }
      this.meshes.sel = this.uploadMesh(V, I, gl.LINES);
    }
  },

  getBlockCube(id){
    if(this.blockCubes[id]) return this.blockCubes[id];
    const def = bd(id);
    const V = [], I = [];
    for(const f of FACES){
      const tile = faceTile(def, f.sel);
      const base = V.length/6;
      for(const c of f.c){
        const uv = this.tileUV(tile, c[3], c[4]);
        V.push(c[0] - 0.5, c[1] - 0.5, c[2] - 0.5, uv[0], uv[1], f.shade);
      }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return this.blockCubes[id] = this.uploadMesh(V, I);
  },

  /* ---- chunk meshing with per-vertex AO ---- */
  vertexAO(x, y, z, f, c){
    const d = f.d;
    const ax = d[0] !== 0 ? [1, 2] : (d[1] !== 0 ? [0, 2] : [0, 1]);
    const s1 = c[ax[0]] === 1 ? 1 : -1;
    const s2 = c[ax[1]] === 1 ? 1 : -1;
    const bx = x + d[0], by = y + d[1], bz = z + d[2];
    const o1 = [0, 0, 0], o2 = [0, 0, 0];
    o1[ax[0]] = s1; o2[ax[1]] = s2;
    const side1 = W.opaqueAt(bx + o1[0], by + o1[1], bz + o1[2]) ? 1 : 0;
    const side2 = W.opaqueAt(bx + o2[0], by + o2[1], bz + o2[2]) ? 1 : 0;
    const corner = W.opaqueAt(bx + o1[0] + o2[0], by + o1[1] + o2[1], bz + o1[2] + o2[2]) ? 1 : 0;
    return (side1 && side2) ? 0 : 3 - (side1 + side2 + corner);
  },

  buildChunk(cx, cz){
    const opqV = [], opqI = [], watV = [], watI = [];
    const x0 = cx*16, z0 = cz*16;
    for(let y = 0; y < W.SY; y++){
      for(let z = z0; z < z0 + 16; z++){
        for(let x = x0; x < x0 + 16; x++){
          const id = W.data[W.idx(x, y, z)];
          if(id === B.AIR) continue;
          const def = bd(id);
          const isWater = !!def.liquid;
          const V = isWater ? watV : opqV, I = isWater ? watI : opqI;
          for(const f of FACES){
            const nid = W.get(x + f.d[0], y + f.d[1], z + f.d[2]);
            const nd = bd(nid);
            let show;
            if(isWater) show = nid !== B.WATER && !(nd && nd.opaque);
            else show = !(nd && nd.opaque);
            if(!show) continue;
            if(V.length/6 + 4 > 65000) continue;
            const tile = faceTile(def, f.sel);
            const base = V.length/6;
            const ao = [];
            const lowerTop = isWater && W.get(x, y + 1, z) !== B.WATER;
            for(let ci = 0; ci < 4; ci++){
              const c = f.c[ci];
              let light = f.shade;
              if(!isWater){
                const a = this.vertexAO(x, y, z, f, c);
                light *= 0.55 + 0.15*a;
                ao.push(a);
              } else ao.push(3);
              let vy = y + c[1];
              if(lowerTop && c[1] === 1) vy = y + 0.875;
              const uv = this.tileUV(tile, c[3], c[4]);
              V.push(x + c[0], vy, z + c[2], uv[0], uv[1], light);
            }
            if(ao[0] + ao[2] >= ao[1] + ao[3]) I.push(base, base + 1, base + 2, base, base + 2, base + 3);
            else I.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
          }
        }
      }
    }
    const N = W.SX/16;
    let rec = this.chunks[cz*N + cx];
    if(!rec) rec = this.chunks[cz*N + cx] = { cx, cz, o: null, w: null };
    rec.o = this.uploadChunk(rec.o, opqV, opqI);
    rec.w = this.uploadChunk(rec.w, watV, watI);
  },

  uploadChunk(rec, V, I){
    const gl = this.gl;
    if(!I.length){
      if(rec){ gl.deleteBuffer(rec.vb); gl.deleteBuffer(rec.ib); }
      return null;
    }
    rec = rec || { vb: null, ib: null, n: 0 };
    if(!rec.vb) rec.vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rec.vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);
    if(!rec.ib) rec.ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rec.ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(I), gl.STATIC_DRAW);
    rec.n = I.length;
    return rec;
  },

  buildAllChunks(){
    const N = W.SX/16;
    for(let cz = 0; cz < N; cz++)
      for(let cx = 0; cx < N; cx++)
        this.buildChunk(cx, cz);
  },

  touchBlock(x, y, z){
    const N = W.SX/16;
    const cx = x >> 4, cz = z >> 4;
    const set = new Set([cz*N + cx]);
    if((x & 15) === 0 && cx > 0) set.add(cz*N + cx - 1);
    if((x & 15) === 15 && cx < N - 1) set.add(cz*N + cx + 1);
    if((z & 15) === 0 && cz > 0) set.add((cz - 1)*N + cx);
    if((z & 15) === 15 && cz < N - 1) set.add((cz + 1)*N + cx);
    for(const k of set) this.buildChunk(k % N, Math.floor(k/N));
  },

  /* ---- drawing ---- */
  drawMesh(mesh, model, tint, cutout){
    if(!mesh || !mesh.n) return;
    const gl = this.gl;
    gl.uniformMatrix4fv(this.u.uModel, false, model);
    gl.uniform4fv(this.u.uTint, tint);
    gl.uniform1f(this.u.uCutout, cutout ? 1 : 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vb);
    gl.vertexAttribPointer(this.a.aPos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(this.a.aUV, 2, gl.FLOAT, false, 24, 12);
    gl.vertexAttribPointer(this.a.aLight, 1, gl.FLOAT, false, 24, 20);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
    gl.drawElements(mesh.mode || gl.TRIANGLES, mesh.n, gl.UNSIGNED_SHORT, 0);
  },

  drawBox(model, tint){
    this.drawMesh(this.meshes.unit, model, tint, false);
  },

  frame(cam){
    const gl = this.gl;
    if(!gl) return;
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2);
    const wpx = Math.round(c.clientWidth*dpr), hpx = Math.round(c.clientHeight*dpr);
    if(wpx > 0 && (c.width !== wpx || c.height !== hpx)){ c.width = wpx; c.height = hpx; }
    gl.viewport(0, 0, c.width, c.height);
    gl.clearColor(this.sky[0], this.sky[1], this.sky[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = Mat.create();
    Mat.persp(proj, cam.fov*Math.PI/180, Math.max(1, c.width)/Math.max(1, c.height), 0.06, 400);
    const view = Mat.create();
    viewMatrix(view, cam.pos[0], cam.pos[1], cam.pos[2], cam.yaw, cam.pitch);

    gl.useProgram(this.prog);
    gl.enableVertexAttribArray(this.a.aPos);
    gl.enableVertexAttribArray(this.a.aUV);
    gl.enableVertexAttribArray(this.a.aLight);
    gl.uniformMatrix4fv(this.u.uProj, false, proj);
    gl.uniformMatrix4fv(this.u.uView, false, view);
    gl.uniform3fv(this.u.uCam, cam.pos);
    gl.uniform3fv(this.u.uFogCol, this.sky);
    gl.uniform2f(this.u.uFog, 70, 170);
    gl.uniform1i(this.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    const WHITE4 = [1, 1, 1, 1];
    const fwd = lookDir(cam.yaw, cam.pitch);
    const N = W.SX/16;
    for(const rec of this.chunks){
      if(!rec || !rec.o) continue;
      const dx = rec.cx*16 + 8 - cam.pos[0], dz = rec.cz*16 + 8 - cam.pos[2];
      if(dx*fwd[0] + dz*fwd[2] < -24) continue;
      this.drawMesh(rec.o, IDENT4, WHITE4, true);
    }

    if(this.onEntities) this.onEntities(this);

    // water pass (translucent, both sides, no depth write)
    gl.uniform1f(this.u.uCutout, 0);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    for(const rec of this.chunks){
      if(!rec || !rec.w) continue;
      const dx = rec.cx*16 + 8 - cam.pos[0], dz = rec.cz*16 + 8 - cam.pos[2];
      if(dx*fwd[0] + dz*fwd[2] < -24) continue;
      this.drawMesh(rec.w, IDENT4, [1, 1, 1, 0.72], false);
    }
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);

    // held item: camera space, always on top
    if(this.onHeld && (game.state === 'playing' || game.state === 'paused')){
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(this.u.uView, false, IDENT4);
      gl.uniform3f(this.u.uCam, 0, 0, 0);
      this.onHeld(this);
      gl.uniformMatrix4fv(this.u.uView, false, view);
      gl.uniform3fv(this.u.uCam, cam.pos);
    }
  }
};
