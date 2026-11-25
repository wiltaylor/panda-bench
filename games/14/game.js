"use strict";
(() => {
  // src/types.ts
  var BLOCK_INFO = {
    [0 /* Air */]: {
      id: 0 /* Air */,
      name: "Air",
      solid: false,
      opaque: false,
      transparent: true,
      breakable: false,
      hardness: 0,
      pickaxeSpeed: 1,
      tiles: { top: 0, bottom: 0, side: 0 },
      particleColor: [1, 1, 1],
      dropSlotBlock: null
    },
    [1 /* Grass */]: {
      id: 1 /* Grass */,
      name: "Grass Block",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.45,
      pickaxeSpeed: 2.2,
      tiles: { top: 0, bottom: 2, side: 1 },
      particleColor: [0.36, 0.68, 0.25],
      dropSlotBlock: 2 /* Dirt */
    },
    [2 /* Dirt */]: {
      id: 2 /* Dirt */,
      name: "Dirt",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.4,
      pickaxeSpeed: 2.2,
      tiles: { top: 2, bottom: 2, side: 2 },
      particleColor: [0.54, 0.37, 0.23],
      dropSlotBlock: 2 /* Dirt */
    },
    [3 /* Stone */]: {
      id: 3 /* Stone */,
      name: "Stone",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 1,
      pickaxeSpeed: 3.6,
      tiles: { top: 3, bottom: 3, side: 3 },
      particleColor: [0.53, 0.54, 0.56],
      dropSlotBlock: 4 /* Cobblestone */
    },
    [4 /* Cobblestone */]: {
      id: 4 /* Cobblestone */,
      name: "Cobblestone",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.9,
      pickaxeSpeed: 3.5,
      tiles: { top: 4, bottom: 4, side: 4 },
      particleColor: [0.48, 0.49, 0.5],
      dropSlotBlock: 4 /* Cobblestone */
    },
    [5 /* OakLog */]: {
      id: 5 /* OakLog */,
      name: "Oak Log",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.65,
      pickaxeSpeed: 2.5,
      tiles: { top: 6, bottom: 6, side: 5 },
      particleColor: [0.44, 0.31, 0.18],
      dropSlotBlock: 6 /* OakPlanks */
    },
    [6 /* OakPlanks */]: {
      id: 6 /* OakPlanks */,
      name: "Oak Planks",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.55,
      pickaxeSpeed: 2.6,
      tiles: { top: 7, bottom: 7, side: 7 },
      particleColor: [0.71, 0.55, 0.34],
      dropSlotBlock: 6 /* OakPlanks */
    },
    [7 /* OakLeaves */]: {
      id: 7 /* OakLeaves */,
      name: "Oak Leaves",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.22,
      pickaxeSpeed: 1.8,
      tiles: { top: 8, bottom: 8, side: 8 },
      particleColor: [0.24, 0.55, 0.19],
      dropSlotBlock: 8 /* Bamboo */
    },
    [8 /* Bamboo */]: {
      id: 8 /* Bamboo */,
      name: "Bamboo",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.3,
      pickaxeSpeed: 2,
      tiles: { top: 10, bottom: 10, side: 9 },
      particleColor: [0.43, 0.72, 0.23],
      dropSlotBlock: 8 /* Bamboo */
    },
    [9 /* Sand */]: {
      id: 9 /* Sand */,
      name: "Sand",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.35,
      pickaxeSpeed: 2,
      tiles: { top: 11, bottom: 11, side: 11 },
      particleColor: [0.85, 0.8, 0.61],
      dropSlotBlock: 2 /* Dirt */
    },
    [10 /* Water */]: {
      id: 10 /* Water */,
      name: "Water",
      solid: false,
      opaque: false,
      transparent: true,
      breakable: false,
      hardness: 0,
      pickaxeSpeed: 1,
      tiles: { top: 12, bottom: 12, side: 12 },
      particleColor: [0.2, 0.55, 0.85],
      dropSlotBlock: null
    },
    [11 /* Brick */]: {
      id: 11 /* Brick */,
      name: "Brick",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: true,
      hardness: 0.95,
      pickaxeSpeed: 3.6,
      tiles: { top: 13, bottom: 13, side: 13 },
      particleColor: [0.68, 0.31, 0.25],
      dropSlotBlock: 11 /* Brick */
    },
    [12 /* Bedrock */]: {
      id: 12 /* Bedrock */,
      name: "Bedrock",
      solid: true,
      opaque: true,
      transparent: false,
      breakable: false,
      hardness: 999,
      pickaxeSpeed: 1,
      tiles: { top: 14, bottom: 14, side: 14 },
      particleColor: [0.22, 0.22, 0.24],
      dropSlotBlock: null
    }
  };
  function createInitialHotbar() {
    return [
      { id: "sword", name: "Iron Sword", shortHint: "Slash pandas & bat pineapples back", kind: "sword", count: -1 },
      { id: "shield", name: "Oak Shield", shortHint: "Hold to block & reflect pineapples", kind: "shield", count: -1 },
      { id: "pickaxe", name: "Stone Pickaxe", shortHint: "Mines blocks 3x faster", kind: "pickaxe", count: -1 },
      { id: "bow", name: "Bamboo Bow", shortHint: "Shoot arrows at pandas", kind: "bow", count: -1 },
      { id: "cobble", name: "Cobblestone", shortHint: "Place sturdy fort walls", kind: "block", blockId: 4 /* Cobblestone */, count: 32 },
      { id: "planks", name: "Oak Planks", shortHint: "Place wood structures", kind: "block", blockId: 6 /* OakPlanks */, count: 32 },
      { id: "dirt", name: "Dirt", shortHint: "Place earth cover", kind: "block", blockId: 2 /* Dirt */, count: 24 },
      { id: "bamboo", name: "Bamboo Block", shortHint: "Place bamboo barricade", kind: "block", blockId: 8 /* Bamboo */, count: 24 },
      { id: "brick", name: "Brick", shortHint: "Place reinforced brick", kind: "block", blockId: 11 /* Brick */, count: 24 }
    ];
  }

  // src/math.ts
  function createMat4() {
    const m = new Float32Array(16);
    m[0] = 1;
    m[5] = 1;
    m[10] = 1;
    m[15] = 1;
    return m;
  }
  function identityMat4(out) {
    out.fill(0);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  function perspectiveMat4(out, fovRad, aspect, near, far) {
    const f = 1 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  }
  function multiplyMat4(out, a, b) {
    const r = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        r[col * 4 + row] = a[0 * 4 + row] * b[col * 4 + 0] + a[1 * 4 + row] * b[col * 4 + 1] + a[2 * 4 + row] * b[col * 4 + 2] + a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    out.set(r);
    return out;
  }
  function translateMat4(out, a, x, y, z) {
    const t = createMat4();
    t[12] = x;
    t[13] = y;
    t[14] = z;
    return multiplyMat4(out, a, t);
  }
  function scaleMat4(out, a, x, y, z) {
    const s = createMat4();
    s[0] = x;
    s[5] = y;
    s[10] = z;
    return multiplyMat4(out, a, s);
  }
  function rotateXMat4(out, a, rad) {
    const r = createMat4();
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    r[5] = c;
    r[6] = s;
    r[9] = -s;
    r[10] = c;
    return multiplyMat4(out, a, r);
  }
  function rotateYMat4(out, a, rad) {
    const r = createMat4();
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    r[0] = c;
    r[2] = -s;
    r[8] = s;
    r[10] = c;
    return multiplyMat4(out, a, r);
  }
  function rotateZMat4(out, a, rad) {
    const r = createMat4();
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    r[0] = c;
    r[1] = s;
    r[4] = -s;
    r[5] = c;
    return multiplyMat4(out, a, r);
  }
  function cameraViewMat4(out, x, y, z, yaw, pitch) {
    identityMat4(out);
    rotateXMat4(out, out, -pitch);
    rotateYMat4(out, out, -yaw);
    translateMat4(out, out, -x, -y, -z);
    return out;
  }
  function forwardFromAngles(yaw, pitch) {
    const cp = Math.cos(pitch);
    return {
      x: -Math.sin(yaw) * cp,
      y: Math.sin(pitch),
      z: -Math.cos(yaw) * cp
    };
  }
  function rayIntersectsAABB(ox, oy, oz, dx, dy, dz, minX, minY, minZ, maxX, maxY, maxZ, maxDist) {
    let tmin = 0;
    let tmax = maxDist;
    const axes = [
      [ox, dx, minX, maxX],
      [oy, dy, minY, maxY],
      [oz, dz, minZ, maxZ]
    ];
    for (const [o, d, lo, hi] of axes) {
      if (Math.abs(d) < 1e-8) {
        if (o < lo || o > hi) return null;
      } else {
        let t1 = (lo - o) / d;
        let t2 = (hi - o) / d;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
        }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin >= 0 && tmin <= maxDist ? tmin : null;
  }
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // src/world.ts
  var WORLD_X = 64;
  var WORLD_Y = 32;
  var WORLD_Z = 64;
  var CHUNK_SIZE = 16;
  var CHUNKS_X = WORLD_X / CHUNK_SIZE;
  var CHUNKS_Z = WORLD_Z / CHUNK_SIZE;
  var WATER_LEVEL = 7;
  var VoxelWorld = class {
    constructor(seed = 1337) {
      this.dirtyChunks = /* @__PURE__ */ new Set();
      this.blocks = new Uint8Array(WORLD_X * WORLD_Y * WORLD_Z);
      this.generate(seed);
    }
    index(x, y, z) {
      return (y * WORLD_Z + z) * WORLD_X + x;
    }
    inBounds(x, y, z) {
      return x >= 0 && x < WORLD_X && y >= 0 && y < WORLD_Y && z >= 0 && z < WORLD_Z;
    }
    getBlock(x, y, z) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const iz = Math.floor(z);
      if (!this.inBounds(ix, iy, iz)) {
        return iy < 0 ? 12 /* Bedrock */ : 0 /* Air */;
      }
      return this.blocks[this.index(ix, iy, iz)];
    }
    isSolid(x, y, z) {
      return BLOCK_INFO[this.getBlock(x, y, z)].solid;
    }
    isOpaque(x, y, z) {
      return BLOCK_INFO[this.getBlock(x, y, z)].opaque;
    }
    chunkKey(cx, cz) {
      return cz * CHUNKS_X + cx;
    }
    markChunkDirty(cx, cz) {
      if (cx >= 0 && cx < CHUNKS_X && cz >= 0 && cz < CHUNKS_Z) {
        this.dirtyChunks.add(this.chunkKey(cx, cz));
      }
    }
    markAllDirty() {
      for (let cz = 0; cz < CHUNKS_Z; cz++) {
        for (let cx = 0; cx < CHUNKS_X; cx++) {
          this.dirtyChunks.add(this.chunkKey(cx, cz));
        }
      }
    }
    setBlock(x, y, z, id, trackDirty = true) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const iz = Math.floor(z);
      if (!this.inBounds(ix, iy, iz)) return false;
      const idx = this.index(ix, iy, iz);
      if (this.blocks[idx] === id) return false;
      this.blocks[idx] = id;
      if (trackDirty) {
        const cx = Math.floor(ix / CHUNK_SIZE);
        const cz = Math.floor(iz / CHUNK_SIZE);
        this.markChunkDirty(cx, cz);
        const lx = ix - cx * CHUNK_SIZE;
        const lz = iz - cz * CHUNK_SIZE;
        if (lx === 0) this.markChunkDirty(cx - 1, cz);
        if (lx === CHUNK_SIZE - 1) this.markChunkDirty(cx + 1, cz);
        if (lz === 0) this.markChunkDirty(cx, cz - 1);
        if (lz === CHUNK_SIZE - 1) this.markChunkDirty(cx, cz + 1);
      }
      return true;
    }
    getSurfaceHeight(x, z) {
      const ix = Math.max(0, Math.min(WORLD_X - 1, Math.floor(x)));
      const iz = Math.max(0, Math.min(WORLD_Z - 1, Math.floor(z)));
      for (let y = WORLD_Y - 1; y >= 0; y--) {
        if (this.isSolid(ix, y, iz)) return y + 1;
      }
      return 1;
    }
    generate(seed) {
      const rand = mulberry32(seed);
      const grid = new Float32Array(17 * 17);
      for (let i = 0; i < grid.length; i++) grid[i] = rand();
      const sampleNoise = (nx, nz) => {
        const gx = (nx % 16 + 16) % 16;
        const gz = (nz % 16 + 16) % 16;
        const x0 = Math.floor(gx);
        const z0 = Math.floor(gz);
        const fx = gx - x0;
        const fz = gz - z0;
        const sx = fx * fx * (3 - 2 * fx);
        const sz = fz * fz * (3 - 2 * fz);
        const x1 = (x0 + 1) % 16;
        const z1 = (z0 + 1) % 16;
        const v00 = grid[z0 * 17 + x0];
        const v10 = grid[z0 * 17 + x1];
        const v01 = grid[z1 * 17 + x0];
        const v11 = grid[z1 * 17 + x1];
        const a = v00 + (v10 - v00) * sx;
        const b = v01 + (v11 - v01) * sx;
        return a + (b - a) * sz;
      };
      const heightAt = (x, z) => {
        const n1 = sampleNoise(x * 0.08, z * 0.08);
        const n2 = sampleNoise(x * 0.18 + 5.2, z * 0.18 + 1.7);
        let h = 10.2 + (n1 - 0.5) * 6.5 + (n2 - 0.5) * 2.2;
        const dx = x - 32;
        const dz = z - 32;
        const distCenter = Math.sqrt(dx * dx + dz * dz);
        if (distCenter < 11) {
          const t = 1 - distCenter / 11;
          h = h * (1 - t) + 10 * t;
        }
        const pdx = x - 43;
        const pdz = z - 22;
        const pDist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pDist < 8.5) {
          const pt = 1 - pDist / 8.5;
          h -= pt * 6.2;
        }
        const edgeDist = Math.min(x, z, WORLD_X - 1 - x, WORLD_Z - 1 - z);
        if (edgeDist < 7) {
          h += (7 - edgeDist) * 0.85;
        }
        return Math.max(3, Math.min(WORLD_Y - 10, Math.round(h)));
      };
      for (let z = 0; z < WORLD_Z; z++) {
        for (let x = 0; x < WORLD_X; x++) {
          const h = heightAt(x, z);
          this.setBlock(x, 0, z, 12 /* Bedrock */, false);
          for (let y = 1; y <= h; y++) {
            let block = 3 /* Stone */;
            if (y === h) {
              if (h <= WATER_LEVEL + 1) {
                block = 9 /* Sand */;
              } else if (h >= 15) {
                block = 3 /* Stone */;
              } else {
                block = 1 /* Grass */;
              }
            } else if (y >= h - 2) {
              block = h <= WATER_LEVEL + 1 ? 9 /* Sand */ : 2 /* Dirt */;
            }
            this.setBlock(x, y, z, block, false);
          }
          for (let y = h + 1; y <= WATER_LEVEL; y++) {
            this.setBlock(x, y, z, 10 /* Water */, false);
          }
        }
      }
      const bx = 27;
      const bz = 29;
      const baseH = this.getSurfaceHeight(bx, bz);
      for (let dx = 0; dx < 3; dx++) {
        this.setBlock(bx + dx, baseH, bz, 4 /* Cobblestone */, false);
        this.setBlock(bx + dx, baseH + 1, bz, dx === 1 ? 0 /* Air */ : 6 /* OakPlanks */, false);
      }
      this.setBlock(bx, baseH, bz + 1, 4 /* Cobblestone */, false);
      this.setBlock(bx, baseH + 1, bz + 1, 6 /* OakPlanks */, false);
      const treeSpots = [
        [18, 22],
        [22, 16],
        [14, 34],
        [20, 46],
        [36, 48],
        [48, 42],
        [50, 14],
        [15, 14],
        [46, 33],
        [31, 14]
      ];
      for (const [tx, tz] of treeSpots) {
        const ty = this.getSurfaceHeight(tx, tz);
        if (this.getBlock(tx, ty - 1, tz) !== 1 /* Grass */) continue;
        const trunkH = 4 + Math.floor(rand() * 2);
        for (let y = 0; y < trunkH; y++) {
          this.setBlock(tx, ty + y, tz, 5 /* OakLog */, false);
        }
        for (let dy = trunkH - 2; dy <= trunkH + 1; dy++) {
          const radius = dy === trunkH + 1 ? 1 : 2;
          for (let dz = -radius; dz <= radius; dz++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (Math.abs(dx) === radius && Math.abs(dz) === radius && dy >= trunkH) continue;
              if (dx === 0 && dz === 0 && dy < trunkH) continue;
              const px = tx + dx;
              const py = ty + dy;
              const pz = tz + dz;
              if (this.getBlock(px, py, pz) === 0 /* Air */) {
                this.setBlock(px, py, pz, 7 /* OakLeaves */, false);
              }
            }
          }
        }
      }
      const groveCenters = [
        [32, 18],
        [22, 23],
        [42, 34],
        [25, 42],
        [44, 15],
        [17, 41]
      ];
      for (const [gx, gz] of groveCenters) {
        for (let i = 0; i < 11; i++) {
          const bxPos = gx + Math.floor((rand() - 0.5) * 9);
          const bzPos = gz + Math.floor((rand() - 0.5) * 9);
          if (Math.hypot(bxPos - 32, bzPos - 32) < 6) continue;
          const by = this.getSurfaceHeight(bxPos, bzPos);
          if (this.getBlock(bxPos, by - 1, bzPos) !== 1 /* Grass */) continue;
          if (this.getBlock(bxPos, by, bzPos) !== 0 /* Air */) continue;
          const stalkH = 3 + Math.floor(rand() * 4);
          for (let y = 0; y < stalkH; y++) {
            this.setBlock(bxPos, by + y, bzPos, 8 /* Bamboo */, false);
          }
        }
      }
      this.markAllDirty();
    }
    /**
     * 3D Amanatides & Woo DDA voxel raycast.
     */
    raycast(ox, oy, oz, dx, dy, dz, maxDist) {
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-8) return null;
      dx /= len;
      dy /= len;
      dz /= len;
      let x = Math.floor(ox);
      let y = Math.floor(oy);
      let z = Math.floor(oz);
      const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;
      const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
      const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
      const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity;
      let tMaxX = stepX > 0 ? (x + 1 - ox) * tDeltaX : stepX < 0 ? (ox - x) * tDeltaX : Infinity;
      let tMaxY = stepY > 0 ? (y + 1 - oy) * tDeltaY : stepY < 0 ? (oy - y) * tDeltaY : Infinity;
      let tMaxZ = stepZ > 0 ? (z + 1 - oz) * tDeltaZ : stepZ < 0 ? (oz - z) * tDeltaZ : Infinity;
      let nx = 0;
      let ny = 0;
      let nz = 0;
      let dist = 0;
      for (let i = 0; i < 128; i++) {
        if (dist > maxDist) return null;
        const b = this.getBlock(x, y, z);
        if (b !== 0 /* Air */ && b !== 10 /* Water */) {
          return { x, y, z, nx, ny, nz, dist, block: b };
        }
        if (tMaxX < tMaxY && tMaxX < tMaxZ) {
          dist = tMaxX;
          tMaxX += tDeltaX;
          x += stepX;
          nx = -stepX;
          ny = 0;
          nz = 0;
        } else if (tMaxY < tMaxZ) {
          dist = tMaxY;
          tMaxY += tDeltaY;
          y += stepY;
          nx = 0;
          ny = -stepY;
          nz = 0;
        } else {
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          z += stepZ;
          nx = 0;
          ny = 0;
          nz = -stepZ;
        }
      }
      return null;
    }
  };

  // src/textures.ts
  var ATLAS_TILES_PER_ROW = 16;
  var TILE_SIZE = 16;
  var ATLAS_SIZE = ATLAS_TILES_PER_ROW * TILE_SIZE;
  function tileOrigin(index) {
    const col = index % ATLAS_TILES_PER_ROW;
    const row = Math.floor(index / ATLAS_TILES_PER_ROW);
    return [col * TILE_SIZE, row * TILE_SIZE];
  }
  function tileUV(index) {
    const col = index % ATLAS_TILES_PER_ROW;
    const row = Math.floor(index / ATLAS_TILES_PER_ROW);
    const pad = 15e-4;
    const u0 = col / ATLAS_TILES_PER_ROW + pad;
    const v0 = row / ATLAS_TILES_PER_ROW + pad;
    const u1 = (col + 1) / ATLAS_TILES_PER_ROW - pad;
    const v1 = (row + 1) / ATLAS_TILES_PER_ROW - pad;
    return [u0, v0, u1, v1];
  }
  function rgb(r, g, b, a = 1) {
    const cr = Math.max(0, Math.min(255, Math.round(r)));
    const cg = Math.max(0, Math.min(255, Math.round(g)));
    const cb = Math.max(0, Math.min(255, Math.round(b)));
    return a < 1 ? `rgba(${cr},${cg},${cb},${a})` : `rgb(${cr},${cg},${cb})`;
  }
  function paintTile(ctx, tileIndex, painter) {
    const [ox, oy] = tileOrigin(tileIndex);
    const rand = mulberry32(tileIndex * 9973 + 42);
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        ctx.fillStyle = painter(x, y, rand);
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
  function buildTextureAtlas() {
    const canvas = document.createElement("canvas");
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
    paintTile(ctx, 0, (_x, _y, rand) => {
      const n = (rand() - 0.5) * 30;
      const lush = rand() > 0.72 ? 12 : 0;
      return rgb(92 + n, 174 + n + lush, 62 + n * 0.6);
    });
    const overhang = [3, 4, 3, 5, 4, 3, 4, 6, 4, 3, 5, 4, 3, 4, 5, 3];
    paintTile(ctx, 1, (x, y, rand) => {
      const n = (rand() - 0.5) * 26;
      if (y < overhang[x]) {
        const dark = y === overhang[x] - 1 ? -16 : 0;
        return rgb(88 + n + dark, 168 + n + dark, 58 + n * 0.5);
      }
      const pebble = rand() > 0.9 ? -22 : 0;
      return rgb(134 + n + pebble, 94 + n * 0.8 + pebble, 60 + n * 0.6 + pebble);
    });
    paintTile(ctx, 2, (_x, _y, rand) => {
      const n = (rand() - 0.5) * 28;
      const speck = rand() > 0.88 ? -25 : rand() > 0.94 ? 18 : 0;
      return rgb(134 + n + speck, 93 + n * 0.8 + speck, 58 + n * 0.6 + speck);
    });
    paintTile(ctx, 3, (x, y, rand) => {
      const band = (y + Math.floor(x / 5)) % 4 === 0 ? -10 : 0;
      const n = (rand() - 0.5) * 24 + band;
      return rgb(132 + n, 134 + n, 138 + n);
    });
    paintTile(ctx, 4, (x, y, rand) => {
      const mortar = y === 0 || y === 5 || y === 11 || y < 5 && (x === 0 || x === 8) || y >= 5 && y < 11 && (x === 4 || x === 12) || y >= 11 && (x === 2 || x === 9 || x === 15);
      const n = (rand() - 0.5) * 22;
      if (mortar) return rgb(74 + n * 0.5, 76 + n * 0.5, 80 + n * 0.5);
      const hl = y === 1 || y === 6 || y === 12 ? 18 : 0;
      return rgb(124 + n + hl, 126 + n + hl, 130 + n + hl);
    });
    paintTile(ctx, 5, (x, y, rand) => {
      const groove = x % 4 === 0 || (x + Math.floor(y / 6)) % 5 === 0 ? -24 : 0;
      const n = (rand() - 0.5) * 18 + groove;
      return rgb(108 + n, 76 + n * 0.8, 44 + n * 0.6);
    });
    paintTile(ctx, 6, (x, y, rand) => {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      const n = (rand() - 0.5) * 14;
      if (d > 6.4) return rgb(96 + n, 66 + n * 0.8, 38 + n * 0.6);
      const ring = Math.floor(d) % 2 === 0 ? -12 : 10;
      return rgb(168 + ring + n, 134 + ring + n, 86 + ring + n * 0.7);
    });
    paintTile(ctx, 7, (x, y, rand) => {
      const seamY = y % 4 === 0;
      const row = Math.floor(y / 4);
      const seamX = row % 2 === 0 && x === 8 || row % 2 === 1 && x === 3;
      const n = (rand() - 0.5) * 16;
      if (seamY || seamX) return rgb(118 + n * 0.5, 88 + n * 0.5, 48 + n * 0.4);
      const grain = (x + row * 3) % 6 === 0 ? -9 : 5;
      return rgb(184 + n + grain, 146 + n + grain, 90 + n * 0.7 + grain);
    });
    paintTile(ctx, 8, (x, y, rand) => {
      const darkCluster = (x + y) % 3 === 0 && rand() > 0.4 || rand() > 0.78;
      const n = (rand() - 0.5) * 22;
      if (darkCluster) return rgb(42 + n, 108 + n, 36 + n);
      return rgb(68 + n, 148 + n, 52 + n);
    });
    paintTile(ctx, 9, (x, y, rand) => {
      const node = y === 4 || y === 12;
      const ridge = y === 5 || y === 13;
      const stalkEdge = x === 0 || x === 5 || x === 10 || x === 15;
      const n = (rand() - 0.5) * 14;
      if (node) return rgb(155 + n, 185 + n, 88 + n);
      if (ridge) return rgb(72 + n, 126 + n, 38 + n);
      if (stalkEdge) return rgb(68 + n, 122 + n, 36 + n);
      const shine = x === 2 || x === 7 || x === 12 ? 22 : 0;
      return rgb(112 + n + shine, 178 + n + shine, 60 + n + shine * 0.6);
    });
    paintTile(ctx, 10, (x, y, rand) => {
      const lx = x % 5 - 2;
      const ly = y % 5 - 2;
      const d = Math.sqrt(lx * lx + ly * ly);
      const n = (rand() - 0.5) * 12;
      if (d < 1.1) return rgb(172 + n, 198 + n, 108 + n);
      if (d < 2.2) return rgb(104 + n, 168 + n, 54 + n);
      return rgb(66 + n, 118 + n, 34 + n);
    });
    paintTile(ctx, 11, (_x, _y, rand) => {
      const n = (rand() - 0.5) * 20;
      const sparkle = rand() > 0.9 ? 16 : rand() > 0.85 ? -14 : 0;
      return rgb(222 + n + sparkle, 208 + n + sparkle, 156 + n + sparkle * 0.7);
    });
    paintTile(ctx, 12, (x, y, rand) => {
      const wave = (x + y * 2) % 7 === 0 ? 26 : 0;
      const n = (rand() - 0.5) * 14;
      return rgb(48 + n + wave, 134 + n + wave, 214 + n + wave * 0.5);
    });
    paintTile(ctx, 13, (x, y, rand) => {
      const mortarY = y % 4 === 0;
      const row = Math.floor(y / 4);
      const offset = row % 2 * 4;
      const mortarX = (x + offset) % 8 === 0;
      const n = (rand() - 0.5) * 16;
      if (mortarY || mortarX) return rgb(198 + n * 0.4, 192 + n * 0.4, 182 + n * 0.4);
      const shade = y % 4 === 3 ? -14 : 0;
      return rgb(174 + n + shade, 76 + n * 0.7 + shade, 60 + n * 0.6 + shade);
    });
    paintTile(ctx, 14, (_x, _y, rand) => {
      const v = rand() > 0.55 ? 42 + rand() * 30 : 78 + rand() * 36;
      return rgb(v, v, v + 4);
    });
    paintTile(ctx, 15, (x, y, rand) => {
      const d1 = (x + y) % 5 === 0;
      const d2 = (x - y + 16) % 5 === 0;
      const eye = (x + y) % 5 === 2 && (x - y + 16) % 5 === 2;
      const n = (rand() - 0.5) * 16;
      if (eye) return rgb(138 + n, 82 + n, 18);
      if (d1 || d2) return rgb(186 + n, 126 + n, 24);
      return rgb(244 + n, 198 + n, 44);
    });
    return canvas;
  }
  function renderIsometricBlockIcon(atlas, blockId) {
    const c = document.createElement("canvas");
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const meta = BLOCK_INFO[blockId];
    const [tx, ty] = tileOrigin(meta.tiles.top);
    const [sx, sy] = tileOrigin(meta.tiles.side);
    ctx.save();
    ctx.translate(24, 6);
    ctx.transform(1, 0.5, -1, 0.5, 0, 0);
    ctx.drawImage(atlas, tx, ty, TILE_SIZE, TILE_SIZE, 0, 0, 17, 17);
    ctx.restore();
    ctx.save();
    ctx.translate(7, 14.5);
    ctx.transform(1, 0.5, 0, 1.12, 0, 0);
    ctx.drawImage(atlas, sx, sy, TILE_SIZE, TILE_SIZE, 0, 0, 17, 17);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, 0, 17, 17);
    ctx.restore();
    ctx.save();
    ctx.translate(24, 23);
    ctx.transform(1, -0.5, 0, 1.12, 0, 0);
    ctx.drawImage(atlas, sx, sy, TILE_SIZE, TILE_SIZE, 0, 0, 17, 17);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(0, 0, 17, 17);
    ctx.restore();
    return c.toDataURL();
  }
  function renderToolIcon(kind) {
    const c = document.createElement("canvas");
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const px = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * 3, y * 3, w * 3, h * 3);
    };
    if (kind === "sword") {
      for (let i = 0; i < 8; i++) {
        px(13 - i, 2 + i, 2, 2, "#d8e4ec");
        px(12 - i, 2 + i, 1, 1, "#ffffff");
        px(14 - i, 3 + i, 1, 1, "#8ea0ad");
      }
      px(4, 9, 5, 2, "#6b4c2e");
      px(5, 10, 4, 2, "#b08642");
      px(3, 12, 2, 2, "#6e4522");
      px(2, 13, 2, 2, "#4a2d15");
      px(1, 14, 2, 2, "#9aa5ad");
    } else if (kind === "shield") {
      px(3, 2, 10, 12, "#7d8a94");
      px(4, 3, 8, 10, "#a87842");
      px(4, 5, 8, 1, "#825a2f");
      px(4, 8, 8, 1, "#825a2f");
      px(4, 11, 8, 1, "#825a2f");
      px(7, 4, 2, 8, "#5ea83a");
      px(6, 7, 4, 2, "#c8d6df");
      px(4, 13, 8, 1, "#58626b");
      px(5, 14, 6, 1, "#58626b");
    } else if (kind === "pickaxe") {
      for (let i = 0; i < 9; i++) {
        px(2 + i, 13 - i, 2, 2, "#7c5128");
        px(2 + i, 13 - i, 1, 1, "#a06c38");
      }
      px(5, 2, 7, 2, "#8b9298");
      px(6, 2, 5, 1, "#bcc4ca");
      px(11, 3, 2, 3, "#7e858b");
      px(12, 5, 2, 4, "#676e74");
      px(4, 3, 2, 2, "#676e74");
    } else if (kind === "bow") {
      px(4, 3, 2, 2, "#6cb03a");
      px(6, 2, 3, 2, "#7bc444");
      px(9, 3, 2, 2, "#6cb03a");
      px(11, 5, 2, 3, "#5da030");
      px(11, 8, 2, 2, "#6cb03a");
      px(9, 10, 2, 2, "#5da030");
      px(6, 11, 3, 2, "#7bc444");
      px(4, 10, 2, 2, "#5da030");
      for (let i = 0; i < 7; i++) {
        px(4, 4 + i, 1, 1, "#e8e4d4");
      }
      for (let i = 0; i < 9; i++) {
        px(3 + i, 12 - i, 1, 1, "#a5713c");
      }
      px(11, 3, 2, 2, "#d5dde3");
      px(2, 12, 2, 2, "#ffffff");
    }
    return c.toDataURL();
  }
  function buildTextureBundle(slots) {
    const atlasCanvas = buildTextureAtlas();
    const slotIcons = {};
    for (const slot of slots) {
      if (slot.kind === "block" && slot.blockId !== void 0) {
        slotIcons[slot.id] = renderIsometricBlockIcon(atlasCanvas, slot.blockId);
      } else {
        slotIcons[slot.id] = renderToolIcon(slot.kind);
      }
    }
    return { atlasCanvas, slotIcons };
  }

  // src/mesher.ts
  var FACES = [
    {
      // +Y (Top)
      dir: [0, 1, 0],
      corners: [
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 0],
        [0, 1, 0]
      ],
      uvs: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      shade: 1,
      tileKey: "top",
      aoAxes: [
        [1, 0, 0],
        [0, 0, 1]
      ]
    },
    {
      // -Y (Bottom)
      dir: [0, -1, 0],
      corners: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 1]
      ],
      uvs: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      shade: 0.56,
      tileKey: "bottom",
      aoAxes: [
        [1, 0, 0],
        [0, 0, 1]
      ]
    },
    {
      // +X (East)
      dir: [1, 0, 0],
      corners: [
        [1, 0, 1],
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1]
      ],
      uvs: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      shade: 0.78,
      tileKey: "side",
      aoAxes: [
        [0, 1, 0],
        [0, 0, 1]
      ]
    },
    {
      // -X (West)
      dir: [-1, 0, 0],
      corners: [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0]
      ],
      uvs: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      shade: 0.74,
      tileKey: "side",
      aoAxes: [
        [0, 1, 0],
        [0, 0, 1]
      ]
    },
    {
      // +Z (South)
      dir: [0, 0, 1],
      corners: [
        [0, 0, 1],
        [1, 0, 1],
        [1, 1, 1],
        [0, 1, 1]
      ],
      uvs: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      shade: 0.87,
      tileKey: "side",
      aoAxes: [
        [1, 0, 0],
        [0, 1, 0]
      ]
    },
    {
      // -Z (North)
      dir: [0, 0, -1],
      corners: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0]
      ],
      uvs: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      shade: 0.84,
      tileKey: "side",
      aoAxes: [
        [1, 0, 0],
        [0, 1, 0]
      ]
    }
  ];
  function computeVertexAO(world, bx, by, bz, dir, corner, uAxis, vAxis) {
    const nx = bx + dir[0];
    const ny = by + dir[1];
    const nz = bz + dir[2];
    const su = corner[0] * uAxis[0] + corner[1] * uAxis[1] + corner[2] * uAxis[2] > 0.5 ? 1 : -1;
    const sv = corner[0] * vAxis[0] + corner[1] * vAxis[1] + corner[2] * vAxis[2] > 0.5 ? 1 : -1;
    const s1 = world.isOpaque(nx + uAxis[0] * su, ny + uAxis[1] * su, nz + uAxis[2] * su) ? 1 : 0;
    const s2 = world.isOpaque(nx + vAxis[0] * sv, ny + vAxis[1] * sv, nz + vAxis[2] * sv) ? 1 : 0;
    if (s1 && s2) return 0.52;
    const c = world.isOpaque(
      nx + uAxis[0] * su + vAxis[0] * sv,
      ny + uAxis[1] * su + vAxis[1] * sv,
      nz + uAxis[2] * su + vAxis[2] * sv
    ) ? 1 : 0;
    return 1 - (s1 + s2 + c) * 0.15;
  }
  function buildChunkMesh(world, cx, cz) {
    const opaqueVerts = [];
    const waterVerts = [];
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    for (let y = 0; y < WORLD_Y; y++) {
      for (let dz = 0; dz < CHUNK_SIZE; dz++) {
        const z = startZ + dz;
        for (let dx = 0; dx < CHUNK_SIZE; dx++) {
          const x = startX + dx;
          const block = world.getBlock(x, y, z);
          if (block === 0 /* Air */) continue;
          const meta = BLOCK_INFO[block];
          const isWater = block === 10 /* Water */;
          const target = isWater ? waterVerts : opaqueVerts;
          for (const face of FACES) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            const neighbor = world.getBlock(nx, ny, nz);
            if (isWater) {
              if (neighbor === 10 /* Water */ || BLOCK_INFO[neighbor].opaque) continue;
            } else {
              if (BLOCK_INFO[neighbor].opaque) continue;
            }
            const tileIdx = meta.tiles[face.tileKey];
            const [u0, v0, u1, v1] = tileUV(tileIdx);
            const aos = [1, 1, 1, 1];
            if (!isWater) {
              for (let c = 0; c < 4; c++) {
                aos[c] = computeVertexAO(world, x, y, z, face.dir, face.corners[c], face.aoAxes[0], face.aoAxes[1]);
              }
            }
            const pushVert = (ci) => {
              const corner = face.corners[ci];
              const uv = face.uvs[ci];
              const yOff = isWater && corner[1] === 1 && world.getBlock(x, y + 1, z) !== 10 /* Water */ ? -0.14 : 0;
              const light = face.shade * aos[ci];
              target.push(
                x + corner[0],
                y + corner[1] + yOff,
                z + corner[2],
                uv[0] === 0 ? u0 : u1,
                uv[1] === 0 ? v0 : v1,
                light,
                light,
                light
              );
            };
            if (aos[0] + aos[2] > aos[1] + aos[3]) {
              pushVert(0);
              pushVert(1);
              pushVert(2);
              pushVert(0);
              pushVert(2);
              pushVert(3);
            } else {
              pushVert(1);
              pushVert(2);
              pushVert(3);
              pushVert(1);
              pushVert(3);
              pushVert(0);
            }
          }
        }
      }
    }
    return {
      opaque: new Float32Array(opaqueVerts),
      water: new Float32Array(waterVerts)
    };
  }

  // src/renderer.ts
  var TEX_VERT_SRC = `
attribute vec3 aPos;
attribute vec2 aUV;
attribute vec3 aColor;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

varying vec2 vUV;
varying vec3 vColor;
varying float vDist;

void main() {
  vec4 worldPos = uModel * vec4(aPos, 1.0);
  vec4 viewPos = uView * worldPos;
  gl_Position = uProj * viewPos;
  vUV = aUV;
  vColor = aColor;
  vDist = length(viewPos.xyz);
}
`;
  var TEX_FRAG_SRC = `
precision mediump float;

uniform sampler2D uTex;
uniform vec3 uFogColor;
uniform float uFogStart;
uniform float uFogEnd;
uniform float uAlpha;
uniform vec3 uTint;

varying vec2 vUV;
varying vec3 vColor;
varying float vDist;

void main() {
  vec4 texel = texture2D(uTex, vUV);
  vec3 col = texel.rgb * vColor * uTint;
  float fogFactor = clamp((vDist - uFogStart) / (uFogEnd - uFogStart), 0.0, 1.0);
  col = mix(col, uFogColor, fogFactor);
  gl_FragColor = vec4(col, texel.a * uAlpha);
}
`;
  var SOLID_VERT_SRC = `
attribute vec3 aPos;
attribute float aShade;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

varying float vShade;
varying float vDist;

void main() {
  vec4 viewPos = uView * uModel * vec4(aPos, 1.0);
  gl_Position = uProj * viewPos;
  vShade = aShade;
  vDist = length(viewPos.xyz);
}
`;
  var SOLID_FRAG_SRC = `
precision mediump float;

uniform vec4 uColor;
uniform vec3 uFogColor;
uniform float uFogStart;
uniform float uFogEnd;
uniform float uUseFog;

varying float vShade;
varying float vDist;

void main() {
  vec3 col = uColor.rgb * vShade;
  if (uUseFog > 0.5) {
    float fogFactor = clamp((vDist - uFogStart) / (uFogEnd - uFogStart), 0.0, 1.0);
    col = mix(col, uFogColor, fogFactor);
  }
  gl_FragColor = vec4(col, uColor.a);
}
`;
  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error("Shader compile error: " + gl.getShaderInfoLog(s));
    }
    return s;
  }
  function linkProgram(gl, vsSrc, fsSrc) {
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
    }
    return prog;
  }
  function createLitUnitCubeData() {
    const faces = [
      // +Y top
      {
        shade: 1,
        verts: [
          [-0.5, 0.5, 0.5],
          [0.5, 0.5, 0.5],
          [0.5, 0.5, -0.5],
          [-0.5, 0.5, 0.5],
          [0.5, 0.5, -0.5],
          [-0.5, 0.5, -0.5]
        ]
      },
      // -Y bottom
      {
        shade: 0.55,
        verts: [
          [-0.5, -0.5, -0.5],
          [0.5, -0.5, -0.5],
          [0.5, -0.5, 0.5],
          [-0.5, -0.5, -0.5],
          [0.5, -0.5, 0.5],
          [-0.5, -0.5, 0.5]
        ]
      },
      // +X
      {
        shade: 0.82,
        verts: [
          [0.5, -0.5, 0.5],
          [0.5, -0.5, -0.5],
          [0.5, 0.5, -0.5],
          [0.5, -0.5, 0.5],
          [0.5, 0.5, -0.5],
          [0.5, 0.5, 0.5]
        ]
      },
      // -X
      {
        shade: 0.74,
        verts: [
          [-0.5, -0.5, -0.5],
          [-0.5, -0.5, 0.5],
          [-0.5, 0.5, 0.5],
          [-0.5, -0.5, -0.5],
          [-0.5, 0.5, 0.5],
          [-0.5, 0.5, -0.5]
        ]
      },
      // +Z
      {
        shade: 0.9,
        verts: [
          [-0.5, -0.5, 0.5],
          [0.5, -0.5, 0.5],
          [0.5, 0.5, 0.5],
          [-0.5, -0.5, 0.5],
          [0.5, 0.5, 0.5],
          [-0.5, 0.5, 0.5]
        ]
      },
      // -Z
      {
        shade: 0.86,
        verts: [
          [0.5, -0.5, -0.5],
          [-0.5, -0.5, -0.5],
          [-0.5, 0.5, -0.5],
          [0.5, -0.5, -0.5],
          [-0.5, 0.5, -0.5],
          [0.5, 0.5, -0.5]
        ]
      }
    ];
    const out = [];
    for (const f of faces) {
      for (const v of f.verts) {
        out.push(v[0], v[1], v[2], f.shade);
      }
    }
    return new Float32Array(out);
  }
  function createTexturedCubeData(topTile, bottomTile, sideTile) {
    const faces = [
      {
        tile: topTile,
        shade: 1,
        verts: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]],
        uvs: [[0, 1], [1, 1], [1, 0], [0, 1], [1, 0], [0, 0]]
      },
      {
        tile: bottomTile,
        shade: 0.58,
        verts: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]],
        uvs: [[0, 1], [1, 1], [1, 0], [0, 1], [1, 0], [0, 0]]
      },
      {
        tile: sideTile,
        shade: 0.8,
        verts: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, -0.5, 0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]],
        uvs: [[0, 1], [1, 1], [1, 0], [0, 1], [1, 0], [0, 0]]
      },
      {
        tile: sideTile,
        shade: 0.74,
        verts: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]],
        uvs: [[0, 1], [1, 1], [1, 0], [0, 1], [1, 0], [0, 0]]
      },
      {
        tile: sideTile,
        shade: 0.88,
        verts: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]],
        uvs: [[0, 1], [1, 1], [1, 0], [0, 1], [1, 0], [0, 0]]
      },
      {
        tile: sideTile,
        shade: 0.84,
        verts: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]],
        uvs: [[0, 1], [1, 1], [1, 0], [0, 1], [1, 0], [0, 0]]
      }
    ];
    const out = [];
    for (const f of faces) {
      const [u0, v0, u1, v1] = tileUV(f.tile);
      for (let i = 0; i < 6; i++) {
        const v = f.verts[i];
        const uv = f.uvs[i];
        out.push(v[0], v[1], v[2], uv[0] ? u1 : u0, uv[1] ? v1 : v0, f.shade, f.shade, f.shade);
      }
    }
    return new Float32Array(out);
  }
  function createWireframeBoxData() {
    const s = 0.504;
    const pts = [
      [-s, -s, -s],
      [s, -s, -s],
      [s, -s, -s],
      [s, -s, s],
      [s, -s, s],
      [-s, -s, s],
      [-s, -s, s],
      [-s, -s, -s],
      [-s, s, -s],
      [s, s, -s],
      [s, s, -s],
      [s, s, s],
      [s, s, s],
      [-s, s, s],
      [-s, s, s],
      [-s, s, -s],
      [-s, -s, -s],
      [-s, s, -s],
      [s, -s, -s],
      [s, s, -s],
      [s, -s, s],
      [s, s, s],
      [-s, -s, s],
      [-s, s, s]
    ];
    const out = [];
    for (const p of pts) out.push(p[0], p[1], p[2], 1);
    return new Float32Array(out);
  }
  var VoxelRenderer = class {
    constructor(canvas, atlasCanvas) {
      this.canvas = canvas;
      this.chunks = [];
      this.blockCubeBuffers = /* @__PURE__ */ new Map();
      this.projMat = createMat4();
      this.viewMat = createMat4();
      this.vmProjMat = createMat4();
      this.identMat = createMat4();
      this.tmpMat = createMat4();
      const gl = canvas.getContext("webgl2", { antialias: true, alpha: false }) || canvas.getContext("webgl", { antialias: true, alpha: false });
      if (!gl) {
        throw new Error("WebGL is not supported in this browser.");
      }
      this.gl = gl;
      this.texProg = linkProgram(gl, TEX_VERT_SRC, TEX_FRAG_SRC);
      this.solidProg = linkProgram(gl, SOLID_VERT_SRC, SOLID_FRAG_SRC);
      this.texLocs = {
        aPos: gl.getAttribLocation(this.texProg, "aPos"),
        aUV: gl.getAttribLocation(this.texProg, "aUV"),
        aColor: gl.getAttribLocation(this.texProg, "aColor"),
        uProj: gl.getUniformLocation(this.texProg, "uProj"),
        uView: gl.getUniformLocation(this.texProg, "uView"),
        uModel: gl.getUniformLocation(this.texProg, "uModel"),
        uTex: gl.getUniformLocation(this.texProg, "uTex"),
        uFogColor: gl.getUniformLocation(this.texProg, "uFogColor"),
        uFogStart: gl.getUniformLocation(this.texProg, "uFogStart"),
        uFogEnd: gl.getUniformLocation(this.texProg, "uFogEnd"),
        uAlpha: gl.getUniformLocation(this.texProg, "uAlpha"),
        uTint: gl.getUniformLocation(this.texProg, "uTint")
      };
      this.solidLocs = {
        aPos: gl.getAttribLocation(this.solidProg, "aPos"),
        aShade: gl.getAttribLocation(this.solidProg, "aShade"),
        uProj: gl.getUniformLocation(this.solidProg, "uProj"),
        uView: gl.getUniformLocation(this.solidProg, "uView"),
        uModel: gl.getUniformLocation(this.solidProg, "uModel"),
        uColor: gl.getUniformLocation(this.solidProg, "uColor"),
        uFogColor: gl.getUniformLocation(this.solidProg, "uFogColor"),
        uFogStart: gl.getUniformLocation(this.solidProg, "uFogStart"),
        uFogEnd: gl.getUniformLocation(this.solidProg, "uFogEnd"),
        uUseFog: gl.getUniformLocation(this.solidProg, "uUseFog")
      };
      this.atlasTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.litCubeBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.litCubeBuf);
      gl.bufferData(gl.ARRAY_BUFFER, createLitUnitCubeData(), gl.STATIC_DRAW);
      this.wireBoxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.wireBoxBuf);
      gl.bufferData(gl.ARRAY_BUFFER, createWireframeBoxData(), gl.STATIC_DRAW);
      this.pineappleBodyBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pineappleBodyBuf);
      gl.bufferData(gl.ARRAY_BUFFER, createTexturedCubeData(15, 15, 15), gl.STATIC_DRAW);
      for (let i = 0; i < CHUNKS_X * CHUNKS_Z; i++) {
        this.chunks.push({ opaqueBuf: null, opaqueCount: 0, waterBuf: null, waterCount: 0 });
      }
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
    }
    getBlockCubeBuffer(blockId) {
      let buf = this.blockCubeBuffers.get(blockId);
      if (!buf) {
        const meta = BLOCK_INFO[blockId];
        buf = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          createTexturedCubeData(meta.tiles.top, meta.tiles.bottom, meta.tiles.side),
          this.gl.STATIC_DRAW
        );
        this.blockCubeBuffers.set(blockId, buf);
      }
      return buf;
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    syncDirtyChunks(world) {
      if (world.dirtyChunks.size === 0) return;
      const gl = this.gl;
      for (const key of world.dirtyChunks) {
        const cx = key % CHUNKS_X;
        const cz = Math.floor(key / CHUNKS_X);
        const mesh = buildChunkMesh(world, cx, cz);
        const slot = this.chunks[key];
        if (!slot.opaqueBuf) slot.opaqueBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, slot.opaqueBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.opaque, gl.STATIC_DRAW);
        slot.opaqueCount = mesh.opaque.length / 8;
        if (!slot.waterBuf) slot.waterBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, slot.waterBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.water, gl.STATIC_DRAW);
        slot.waterCount = mesh.water.length / 8;
      }
      world.dirtyChunks.clear();
    }
    beginTextured(proj, view, fogColor, fogStart, fogEnd) {
      const gl = this.gl;
      gl.useProgram(this.texProg);
      gl.uniformMatrix4fv(this.texLocs.uProj, false, proj);
      gl.uniformMatrix4fv(this.texLocs.uView, false, view);
      gl.uniform3f(this.texLocs.uFogColor, fogColor[0], fogColor[1], fogColor[2]);
      gl.uniform1f(this.texLocs.uFogStart, fogStart);
      gl.uniform1f(this.texLocs.uFogEnd, fogEnd);
      gl.uniform1f(this.texLocs.uAlpha, 1);
      gl.uniform3f(this.texLocs.uTint, 1, 1, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
      gl.uniform1i(this.texLocs.uTex, 0);
    }
    bindTexBuffer(buf) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const stride = 8 * 4;
      gl.enableVertexAttribArray(this.texLocs.aPos);
      gl.vertexAttribPointer(this.texLocs.aPos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(this.texLocs.aUV);
      gl.vertexAttribPointer(this.texLocs.aUV, 2, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(this.texLocs.aColor);
      gl.vertexAttribPointer(this.texLocs.aColor, 3, gl.FLOAT, false, stride, 5 * 4);
    }
    beginSolid(proj, view, fogColor, fogStart, fogEnd, useFog = true) {
      const gl = this.gl;
      gl.useProgram(this.solidProg);
      gl.uniformMatrix4fv(this.solidLocs.uProj, false, proj);
      gl.uniformMatrix4fv(this.solidLocs.uView, false, view);
      gl.uniform3f(this.solidLocs.uFogColor, fogColor[0], fogColor[1], fogColor[2]);
      gl.uniform1f(this.solidLocs.uFogStart, fogStart);
      gl.uniform1f(this.solidLocs.uFogEnd, fogEnd);
      gl.uniform1f(this.solidLocs.uUseFog, useFog ? 1 : 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.litCubeBuf);
      gl.enableVertexAttribArray(this.solidLocs.aPos);
      gl.vertexAttribPointer(this.solidLocs.aPos, 3, gl.FLOAT, false, 4 * 4, 0);
      gl.enableVertexAttribArray(this.solidLocs.aShade);
      gl.vertexAttribPointer(this.solidLocs.aShade, 1, gl.FLOAT, false, 4 * 4, 3 * 4);
    }
    drawBox(parentMat, ox, oy, oz, sx, sy, sz, r, g, b, a = 1) {
      const gl = this.gl;
      const m = this.tmpMat;
      m.set(parentMat);
      translateMat4(m, m, ox, oy, oz);
      scaleMat4(m, m, sx, sy, sz);
      gl.uniformMatrix4fv(this.solidLocs.uModel, false, m);
      gl.uniform4f(this.solidLocs.uColor, r, g, b, a);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
    drawPanda(p, time) {
      const root = createMat4();
      translateMat4(root, root, p.x, p.y, p.z);
      rotateYMat4(root, root, p.yaw);
      const hurt = p.hurtTimer > 0;
      const tint = (r, g, b) => hurt ? [Math.min(1, r * 0.45 + 0.65), g * 0.3, b * 0.3] : [r, g, b];
      const white = tint(0.95, 0.95, 0.92);
      const black = tint(0.14, 0.14, 0.17);
      const cream = tint(0.86, 0.85, 0.8);
      const walkSwing = Math.sin(p.walkPhase) * 0.55;
      const isWindup = p.state === "windup";
      const windupRaise = isWindup ? -2.25 + Math.sin(time * 24) * 0.14 : walkSwing;
      const bodyBob = Math.abs(Math.sin(p.walkPhase)) * 0.05;
      this.drawBox(root, 0, 0.72 + bodyBob, 0.08, 0.84, 0.68, 1.06, ...white);
      this.drawBox(root, 0, 0.73 + bodyBob, -0.22, 0.88, 0.7, 0.34, ...black);
      this.drawBox(root, 0, 0.7 + bodyBob, 0.66, 0.24, 0.22, 0.16, ...white);
      const drawLeg = (lx, ly, lz, rotX) => {
        const legM = createMat4();
        legM.set(root);
        translateMat4(legM, legM, lx, ly + bodyBob, lz);
        rotateXMat4(legM, legM, rotX);
        this.drawBox(legM, 0, -0.24, 0, 0.28, 0.52, 0.28, ...black);
      };
      drawLeg(-0.32, 0.52, -0.28, isWindup ? windupRaise : walkSwing);
      drawLeg(0.32, 0.52, -0.28, isWindup ? windupRaise : -walkSwing);
      drawLeg(-0.3, 0.48, 0.38, -walkSwing);
      drawLeg(0.3, 0.48, 0.38, walkSwing);
      const headM = createMat4();
      headM.set(root);
      translateMat4(headM, headM, 0, 1.02 + bodyBob, -0.64);
      if (isWindup) {
        rotateXMat4(headM, headM, 0.2);
      }
      this.drawBox(headM, 0, 0, 0, 0.72, 0.6, 0.58, ...white);
      this.drawBox(headM, -0.32, 0.34, 0.04, 0.22, 0.22, 0.15, ...black);
      this.drawBox(headM, 0.32, 0.34, 0.04, 0.22, 0.22, 0.15, ...black);
      this.drawBox(headM, 0, -0.1, -0.34, 0.36, 0.24, 0.18, ...cream);
      this.drawBox(headM, 0, -0.04, -0.44, 0.15, 0.09, 0.06, ...black);
      this.drawBox(headM, -0.18, 0.05, -0.3, 0.2, 0.17, 0.05, ...black);
      this.drawBox(headM, 0.18, 0.05, -0.3, 0.2, 0.17, 0.05, ...black);
      const eyeCol = isWindup ? [1, 0.78, 0.2] : [0.95, 0.98, 1];
      this.drawBox(headM, -0.15, 0.07, -0.33, 0.06, 0.06, 0.03, ...eyeCol);
      this.drawBox(headM, 0.15, 0.07, -0.33, 0.06, 0.06, 0.03, ...eyeCol);
      if (isWindup) {
        const pineM = createMat4();
        pineM.set(root);
        translateMat4(pineM, pineM, 0, 1.72 + Math.sin(time * 22) * 0.06, -0.25);
        rotateYMat4(pineM, pineM, time * 5);
        this.drawBox(pineM, 0, 0, 0, 0.38, 0.44, 0.38, 0.95, 0.76, 0.15);
        this.drawBox(pineM, 0, 0.32, 0, 0.14, 0.24, 0.14, 0.22, 0.72, 0.2);
        this.drawBox(pineM, -0.12, 0.29, 0, 0.12, 0.18, 0.1, 0.28, 0.78, 0.22);
        this.drawBox(pineM, 0.12, 0.29, 0, 0.12, 0.18, 0.1, 0.28, 0.78, 0.22);
        this.drawBox(pineM, 0, 0.29, -0.12, 0.1, 0.18, 0.12, 0.25, 0.75, 0.21);
        this.drawBox(pineM, 0, 0.29, 0.12, 0.1, 0.18, 0.12, 0.25, 0.75, 0.21);
      }
      if (p.hp < p.maxHp) {
        const ratio = Math.max(0, p.hp / p.maxHp);
        const barY = isWindup ? 2.25 : 1.72;
        this.drawBox(root, 0, barY, 0, 0.96, 0.11, 0.06, 0.15, 0.12, 0.12);
        if (ratio > 0) {
          const w = 0.9 * ratio;
          this.drawBox(root, -0.45 + w * 0.5, barY, -0.01, w, 0.08, 0.07, 0.92, 0.22, 0.2);
        }
      }
    }
    drawPineappleCrowns(pineapples) {
      for (const p of pineapples) {
        const m = createMat4();
        translateMat4(m, m, p.x, p.y, p.z);
        rotateYMat4(m, m, p.spin * 1.3);
        rotateXMat4(m, m, p.spin);
        const green = p.reflected ? [0.45, 1, 0.4] : [0.22, 0.74, 0.2];
        this.drawBox(m, 0, 0.33, 0, 0.13, 0.26, 0.13, ...green);
        this.drawBox(m, -0.12, 0.29, 0, 0.13, 0.18, 0.09, ...green);
        this.drawBox(m, 0.12, 0.29, 0, 0.13, 0.18, 0.09, ...green);
        this.drawBox(m, 0, 0.29, -0.12, 0.09, 0.18, 0.13, ...green);
        this.drawBox(m, 0, 0.29, 0.12, 0.09, 0.18, 0.13, ...green);
      }
    }
    drawArrows(arrows) {
      for (const a of arrows) {
        const yaw = Math.atan2(-a.vx, -a.vz);
        const horiz = Math.hypot(a.vx, a.vz);
        const pitch = Math.atan2(a.vy, horiz);
        const m = createMat4();
        translateMat4(m, m, a.x, a.y, a.z);
        rotateYMat4(m, m, yaw);
        rotateXMat4(m, m, pitch);
        this.drawBox(m, 0, 0, 0, 0.06, 0.06, 0.72, 0.65, 0.44, 0.22);
        this.drawBox(m, 0, 0, -0.38, 0.1, 0.1, 0.14, 0.82, 0.85, 0.88);
        this.drawBox(m, 0, 0, 0.34, 0.16, 0.03, 0.16, 0.96, 0.96, 0.96);
        this.drawBox(m, 0, 0, 0.34, 0.03, 0.16, 0.16, 0.96, 0.96, 0.96);
      }
    }
    drawSkyDecor(state) {
      const t = state.time;
      const sunM = createMat4();
      translateMat4(sunM, sunM, state.camX + 42, state.camY + 46, state.camZ - 58);
      this.drawBox(sunM, 0, 0, 0, 10, 10, 10, 1, 0.96, 0.72);
      const cloudCoords = [
        [12, 29, 10, 10],
        [42, 30, 18, 12],
        [24, 31, 44, 14],
        [52, 29.5, 48, 9],
        [6, 30.5, 36, 11],
        [34, 30, 30, 8]
      ];
      for (const [cx, cy, cz, w] of cloudCoords) {
        const driftX = (cx + t * 0.55) % 84 - 10;
        const cm = createMat4();
        translateMat4(cm, cm, driftX, cy, cz);
        this.drawBox(cm, 0, 0, 0, w, 1.4, w * 0.6, 0.97, 0.98, 1, 0.92);
      }
    }
    drawViewmodel(state, aspect) {
      const gl = this.gl;
      gl.clear(gl.DEPTH_BUFFER_BIT);
      perspectiveMat4(this.vmProjMat, 65 * Math.PI / 180, aspect, 0.05, 12);
      identityMat4(this.identMat);
      const bobX = Math.cos(state.walkBob) * 0.03;
      const bobY = Math.abs(Math.sin(state.walkBob)) * 0.035;
      const swing = Math.sin(state.swingAnim * Math.PI);
      const slot = state.activeSlot;
      if (slot.kind === "block" && slot.blockId !== void 0) {
        this.beginTextured(this.vmProjMat, this.identMat, [0, 0, 0], 100, 200);
        const buf = this.getBlockCubeBuffer(slot.blockId);
        this.bindTexBuffer(buf);
        const m = createMat4();
        translateMat4(m, m, 0.58 + bobX - swing * 0.25, -0.46 - bobY + swing * 0.14, -1.05 - swing * 0.2);
        rotateYMat4(m, m, -0.55 - swing * 0.5);
        rotateXMat4(m, m, 0.15 - swing * 0.7);
        scaleMat4(m, m, 0.38, 0.38, 0.38);
        gl.uniformMatrix4fv(this.texLocs.uModel, false, m);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        return;
      }
      this.beginSolid(this.vmProjMat, this.identMat, [0, 0, 0], 100, 200, false);
      if (slot.kind === "sword") {
        const m = createMat4();
        translateMat4(m, m, 0.54 + bobX - swing * 0.45, -0.44 - bobY + swing * 0.12, -0.96 - swing * 0.18);
        rotateZMat4(m, m, 0.18 + swing * 1.15);
        rotateYMat4(m, m, -0.35 - swing * 0.45);
        rotateXMat4(m, m, -0.25 - swing * 0.85);
        this.drawBox(m, 0, -0.18, 0, 0.06, 0.22, 0.06, 0.42, 0.26, 0.12);
        this.drawBox(m, 0, -0.31, 0, 0.085, 0.06, 0.085, 0.62, 0.66, 0.7);
        this.drawBox(m, 0, -0.05, 0, 0.26, 0.065, 0.08, 0.74, 0.58, 0.28);
        this.drawBox(m, 0, 0.3, 0, 0.1, 0.64, 0.04, 0.84, 0.9, 0.95);
        this.drawBox(m, 0, 0.3, 0, 0.04, 0.6, 0.052, 0.64, 0.72, 0.78);
        this.drawBox(m, 0, 0.65, 0, 0.065, 0.09, 0.036, 0.92, 0.96, 1);
      } else if (slot.kind === "shield") {
        const raise = state.shieldRaise;
        const recoil = state.shieldRecoil;
        const m = createMat4();
        const tx = 0.52 * (1 - raise) + 0.06 * raise + bobX * (1 - raise * 0.7);
        const ty = -0.42 * (1 - raise) - 0.14 * raise - bobY * (1 - raise * 0.7);
        const tz = -0.92 + raise * 0.24 - recoil * 0.12;
        translateMat4(m, m, tx, ty, tz);
        rotateYMat4(m, m, -0.42 * (1 - raise) - 0.05 * raise);
        rotateXMat4(m, m, 0.08 * (1 - raise) - recoil * 0.18);
        this.drawBox(m, 0, 0, 0, 0.54, 0.68, 0.065, 0.56, 0.61, 0.66);
        this.drawBox(m, 0, 0, 0.012, 0.44, 0.58, 0.06, 0.68, 0.49, 0.27);
        this.drawBox(m, 0, 0, 0.036, 0.08, 0.38, 0.03, 0.38, 0.68, 0.24);
        this.drawBox(m, 0, 0.04, 0.04, 0.2, 0.08, 0.03, 0.8, 0.86, 0.9);
      } else if (slot.kind === "pickaxe") {
        const m = createMat4();
        translateMat4(m, m, 0.54 + bobX - swing * 0.18, -0.42 - bobY - swing * 0.14, -0.96 - swing * 0.15);
        rotateYMat4(m, m, -0.35);
        rotateXMat4(m, m, -0.15 - swing * 1.15);
        this.drawBox(m, 0, 0.08, 0, 0.06, 0.66, 0.06, 0.52, 0.34, 0.16);
        this.drawBox(m, 0, 0.36, -0.02, 0.12, 0.12, 0.44, 0.58, 0.6, 0.64);
        this.drawBox(m, 0, 0.31, -0.26, 0.09, 0.1, 0.16, 0.48, 0.5, 0.54);
        this.drawBox(m, 0, 0.31, 0.22, 0.09, 0.1, 0.14, 0.48, 0.5, 0.54);
      } else if (slot.kind === "bow") {
        const pull = state.bowCharge;
        const m = createMat4();
        translateMat4(m, m, 0.48 + bobX - pull * 0.12, -0.36 - bobY + pull * 0.06, -0.92 + pull * 0.08);
        rotateYMat4(m, m, -0.25 + pull * 0.12);
        rotateZMat4(m, m, 0.12);
        this.drawBox(m, 0, 0.26, -0.06, 0.06, 0.26, 0.06, 0.46, 0.74, 0.24);
        this.drawBox(m, 0, 0.42, 0.04, 0.055, 0.14, 0.1, 0.38, 0.66, 0.2);
        this.drawBox(m, 0, -0.02, -0.1, 0.065, 0.24, 0.065, 0.56, 0.42, 0.22);
        this.drawBox(m, 0, -0.26, -0.04, 0.06, 0.24, 0.06, 0.46, 0.74, 0.24);
        this.drawBox(m, 0, -0.4, 0.05, 0.055, 0.14, 0.1, 0.38, 0.66, 0.2);
        this.drawBox(m, 0, 0.02, 0.08 + pull * 0.12, 0.015, 0.78, 0.015, 0.92, 0.9, 0.84);
        this.drawBox(m, 0, 0.02, -0.14 + pull * 0.16, 0.035, 0.035, 0.64, 0.68, 0.48, 0.24);
        this.drawBox(m, 0, 0.02, -0.46 + pull * 0.16, 0.07, 0.07, 0.1, 0.84, 0.88, 0.92);
      }
    }
    render(state) {
      this.resize();
      this.syncDirtyChunks(state.world);
      const gl = this.gl;
      const aspect = this.canvas.width / Math.max(1, this.canvas.height);
      perspectiveMat4(this.projMat, 70 * Math.PI / 180, aspect, 0.1, 130);
      cameraViewMat4(this.viewMat, state.camX, state.camY, state.camZ, state.yaw, state.pitch);
      const fogColor = state.underwater ? [0.12, 0.36, 0.62] : [0.58, 0.82, 0.98];
      const fogStart = state.underwater ? 4 : 38;
      const fogEnd = state.underwater ? 22 : 84;
      gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      this.beginTextured(this.projMat, this.viewMat, fogColor, fogStart, fogEnd);
      identityMat4(this.identMat);
      gl.uniformMatrix4fv(this.texLocs.uModel, false, this.identMat);
      for (const chunk of this.chunks) {
        if (chunk.opaqueBuf && chunk.opaqueCount > 0) {
          this.bindTexBuffer(chunk.opaqueBuf);
          gl.drawArrays(gl.TRIANGLES, 0, chunk.opaqueCount);
        }
      }
      if (state.pineapples.length > 0) {
        this.bindTexBuffer(this.pineappleBodyBuf);
        for (const p of state.pineapples) {
          const m = createMat4();
          translateMat4(m, m, p.x, p.y, p.z);
          rotateYMat4(m, m, p.spin * 1.3);
          rotateXMat4(m, m, p.spin);
          scaleMat4(m, m, 0.38, 0.46, 0.38);
          gl.uniformMatrix4fv(this.texLocs.uModel, false, m);
          if (p.reflected) {
            gl.uniform3f(this.texLocs.uTint, 1.35, 1.28, 0.85);
          } else {
            gl.uniform3f(this.texLocs.uTint, 1, 1, 1);
          }
          gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
        gl.uniform3f(this.texLocs.uTint, 1, 1, 1);
      }
      this.beginSolid(this.projMat, this.viewMat, fogColor, fogStart, fogEnd, false);
      this.drawSkyDecor(state);
      this.beginSolid(this.projMat, this.viewMat, fogColor, fogStart, fogEnd, true);
      for (const panda of state.pandas) {
        this.drawPanda(panda, state.time);
      }
      this.drawPineappleCrowns(state.pineapples);
      this.drawArrows(state.arrows);
      for (const pt of state.particles) {
        const m = createMat4();
        translateMat4(m, m, pt.x, pt.y, pt.z);
        const s = pt.size * (1 - pt.age / pt.maxAge * 0.5);
        scaleMat4(m, m, s, s, s);
        gl.uniformMatrix4fv(this.solidLocs.uModel, false, m);
        gl.uniform4f(this.solidLocs.uColor, pt.r, pt.g, pt.b, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      this.beginTextured(this.projMat, this.viewMat, fogColor, fogStart, fogEnd);
      gl.uniformMatrix4fv(this.texLocs.uModel, false, this.identMat);
      gl.uniform1f(this.texLocs.uAlpha, 0.72);
      for (const chunk of this.chunks) {
        if (chunk.waterBuf && chunk.waterCount > 0) {
          this.bindTexBuffer(chunk.waterBuf);
          gl.drawArrays(gl.TRIANGLES, 0, chunk.waterCount);
        }
      }
      gl.depthMask(true);
      if (state.targetBlock) {
        const tb = state.targetBlock;
        this.beginSolid(this.projMat, this.viewMat, fogColor, fogStart, fogEnd, false);
        const m = createMat4();
        translateMat4(m, m, tb.x + 0.5, tb.y + 0.5, tb.z + 0.5);
        if (state.miningProgress > 0.01) {
          const shellM = createMat4();
          shellM.set(m);
          scaleMat4(shellM, shellM, 1.012, 1.012, 1.012);
          gl.uniformMatrix4fv(this.solidLocs.uModel, false, shellM);
          gl.uniform4f(this.solidLocs.uColor, 0.06, 0.06, 0.06, Math.min(0.62, state.miningProgress * 0.62));
          gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.wireBoxBuf);
        gl.vertexAttribPointer(this.solidLocs.aPos, 3, gl.FLOAT, false, 4 * 4, 0);
        gl.vertexAttribPointer(this.solidLocs.aShade, 1, gl.FLOAT, false, 4 * 4, 3 * 4);
        gl.uniformMatrix4fv(this.solidLocs.uModel, false, m);
        gl.uniform4f(this.solidLocs.uColor, 0.08, 0.08, 0.08, 0.85);
        gl.drawArrays(gl.LINES, 0, 24);
      }
      gl.disable(gl.BLEND);
      this.drawViewmodel(state, aspect);
    }
  };

  // src/entities.ts
  var GRAVITY = 22;
  var PINEAPPLE_GRAVITY = 15;
  var ARROW_GRAVITY = 11.5;
  var EntityManager = class {
    constructor() {
      this.pandas = [];
      this.pineapples = [];
      this.arrows = [];
      this.particles = [];
      this.nextId = 1;
      this.respawnTimer = 0;
      this.graceTimer = 1.6;
      this.targetPandaCount = 6;
    }
    reset(world) {
      this.pandas = [];
      this.pineapples = [];
      this.arrows = [];
      this.particles = [];
      this.respawnTimer = 0;
      this.graceTimer = 1.6;
      const initialSpots = [
        [32.5, 22.5],
        [25.5, 25.5],
        [39.5, 26.5],
        [29.5, 16.5],
        [38.5, 17.5],
        [21.5, 34.5]
      ];
      for (const [px, pz] of initialSpots) {
        this.spawnPandaAt(world, px, pz);
      }
    }
    spawnPandaAt(world, x, z) {
      const cx = clamp(x, 6, WORLD_X - 6);
      const cz = clamp(z, 6, WORLD_Z - 6);
      const y = world.getSurfaceHeight(cx, cz);
      const p = {
        id: this.nextId++,
        x: cx,
        y,
        z: cz,
        vx: 0,
        vy: 0,
        vz: 0,
        yaw: Math.random() * Math.PI * 2,
        hp: 100,
        maxHp: 100,
        onGround: true,
        state: "wander",
        stateTimer: 0.6 + Math.random() * 1.4,
        throwCooldown: 1.5 + Math.random() * 2.4,
        walkPhase: Math.random() * Math.PI * 2,
        hurtTimer: 0,
        wanderYaw: Math.random() * Math.PI * 2
      };
      this.pandas.push(p);
      return p;
    }
    spawnPandaAwayFrom(world, px, pz) {
      const groves = [
        [32, 16],
        [20, 22],
        [44, 34],
        [24, 45],
        [46, 16],
        [16, 42],
        [48, 28]
      ];
      let best = groves[Math.floor(Math.random() * groves.length)];
      for (let tries = 0; tries < 8; tries++) {
        const cand = groves[Math.floor(Math.random() * groves.length)];
        const gx = cand[0] + (Math.random() - 0.5) * 6;
        const gz = cand[1] + (Math.random() - 0.5) * 6;
        if (Math.hypot(gx - px, gz - pz) >= 13) {
          best = [gx, gz];
          break;
        }
      }
      this.spawnPandaAt(world, best[0], best[1]);
    }
    spawnBlockParticles(x, y, z, blockId, count = 12) {
      const [r, g, b] = BLOCK_INFO[blockId].particleColor;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x + 0.15 + Math.random() * 0.7,
          y: y + 0.15 + Math.random() * 0.7,
          z: z + 0.15 + Math.random() * 0.7,
          vx: (Math.random() - 0.5) * 4.5,
          vy: 1.8 + Math.random() * 3.5,
          vz: (Math.random() - 0.5) * 4.5,
          r: clamp(r + (Math.random() - 0.5) * 0.12, 0, 1),
          g: clamp(g + (Math.random() - 0.5) * 0.12, 0, 1),
          b: clamp(b + (Math.random() - 0.5) * 0.12, 0, 1),
          size: 0.11 + Math.random() * 0.08,
          age: 0,
          maxAge: 0.45 + Math.random() * 0.35
        });
      }
    }
    spawnBurstParticles(x, y, z, palette, count = 14, speed = 5.5) {
      for (let i = 0; i < count; i++) {
        const col = palette[i % palette.length];
        this.particles.push({
          x: x + (Math.random() - 0.5) * 0.4,
          y: y + (Math.random() - 0.5) * 0.4,
          z: z + (Math.random() - 0.5) * 0.4,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: 1.5 + Math.random() * speed,
          vz: (Math.random() - 0.5) * speed * 2,
          r: col[0],
          g: col[1],
          b: col[2],
          size: 0.12 + Math.random() * 0.09,
          age: 0,
          maxAge: 0.45 + Math.random() * 0.4
        });
      }
    }
    spawnArrow(x, y, z, dx, dy, dz, speed = 29) {
      this.arrows.push({
        id: this.nextId++,
        x,
        y,
        z,
        vx: dx * speed,
        vy: dy * speed + 1.4,
        vz: dz * speed,
        age: 0
      });
    }
    pandaCollides(world, x, y, z) {
      const hw = 0.46;
      const h = 1.42;
      const minX = Math.floor(x - hw);
      const maxX = Math.floor(x + hw);
      const minY = Math.floor(y);
      const maxY = Math.floor(y + h);
      const minZ = Math.floor(z - hw);
      const maxZ = Math.floor(z + hw);
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          for (let bx = minX; bx <= maxX; bx++) {
            if (world.isSolid(bx, by, bz)) return true;
          }
        }
      }
      return false;
    }
    movePanda(world, p, dt) {
      p.vy -= GRAVITY * dt;
      const nx = p.x + p.vx * dt;
      if (!this.pandaCollides(world, nx, p.y + 0.05, p.z)) {
        p.x = clamp(nx, 2, WORLD_X - 2);
      } else if (p.onGround && !this.pandaCollides(world, nx, p.y + 1.15, p.z)) {
        p.vy = 7.4;
        p.onGround = false;
      } else {
        p.vx = 0;
      }
      const nz = p.z + p.vz * dt;
      if (!this.pandaCollides(world, p.x, p.y + 0.05, nz)) {
        p.z = clamp(nz, 2, WORLD_Z - 2);
      } else if (p.onGround && !this.pandaCollides(world, p.x, p.y + 1.15, nz)) {
        p.vy = 7.4;
        p.onGround = false;
      } else {
        p.vz = 0;
      }
      const ny = p.y + p.vy * dt;
      if (!this.pandaCollides(world, p.x, ny, p.z)) {
        p.y = ny;
        p.onGround = false;
      } else {
        if (p.vy < 0) {
          p.y = Math.floor(p.y);
          while (this.pandaCollides(world, p.x, p.y, p.z) && p.y < 30) {
            p.y += 1;
          }
          p.onGround = true;
        }
        p.vy = 0;
      }
      if (world.getBlock(p.x, p.y + 0.2, p.z) === 10 /* Water */) {
        p.vy = Math.max(p.vy, 2.2);
      }
    }
    throwPineappleFrom(panda, targetX, targetY, targetZ) {
      const startX = panda.x;
      const startY = panda.y + 1.65;
      const startZ = panda.z;
      const jitterX = (Math.random() - 0.5) * 0.9;
      const jitterZ = (Math.random() - 0.5) * 0.9;
      const dx = targetX + jitterX - startX;
      const dy = targetY - startY;
      const dz = targetZ + jitterZ - startZ;
      const horizDist = Math.hypot(dx, dz);
      const flightTime = clamp(horizDist / 12.8, 0.45, 1.45);
      const vx = dx / flightTime;
      const vz = dz / flightTime;
      const vy = (dy + 0.5 * PINEAPPLE_GRAVITY * flightTime * flightTime) / flightTime;
      this.pineapples.push({
        id: this.nextId++,
        x: startX,
        y: startY,
        z: startZ,
        vx,
        vy,
        vz,
        spin: 0,
        age: 0,
        reflected: false,
        ownerPandaId: panda.id
      });
    }
    damagePanda(panda, damage, knockX, knockZ, byReflection, events) {
      panda.hp -= damage;
      panda.hurtTimer = 0.24;
      panda.vx = knockX;
      panda.vz = knockZ;
      panda.vy = Math.max(panda.vy, 5.2);
      panda.onGround = false;
      if (panda.hp <= 0) {
        this.spawnBurstParticles(
          panda.x,
          panda.y + 0.9,
          panda.z,
          [
            [0.96, 0.96, 0.94],
            [0.16, 0.16, 0.19],
            [0.45, 0.85, 0.3],
            [1, 0.85, 0.2]
          ],
          20,
          6
        );
        this.pandas = this.pandas.filter((p) => p.id !== panda.id);
        events.onPandaDefeat(panda, byReflection);
        return true;
      } else {
        this.spawnBurstParticles(panda.x, panda.y + 1, panda.z, [[0.95, 0.95, 0.95], [0.95, 0.28, 0.24]], 7, 3.8);
        events.onPandaHurt();
        return false;
      }
    }
    /**
     * Checks sword slash / melee hit against incoming pineapples (deflection!) and pandas.
     */
    tryMeleeAttack(ox, oy, oz, fx, fy, fz, damage, canDeflect, events) {
      let deflectedPineapple = false;
      if (canDeflect) {
        for (const pine of this.pineapples) {
          if (pine.reflected) continue;
          const dx = pine.x - ox;
          const dy = pine.y - oy;
          const dz = pine.z - oz;
          const dist = Math.hypot(dx, dy, dz);
          if (dist <= 4.1) {
            const dot = (dx * fx + dy * fy + dz * fz) / Math.max(1e-3, dist);
            if (dot > 0.28 || dist < 1.8) {
              this.reflectPineapple(pine, fx, fy, fz);
              deflectedPineapple = true;
            }
          }
        }
      }
      let hitPanda = false;
      let closestDist = 3.9;
      let bestPanda = null;
      for (const p of this.pandas) {
        const t = rayIntersectsAABB(
          ox,
          oy,
          oz,
          fx,
          fy,
          fz,
          p.x - 0.65,
          p.y,
          p.z - 0.65,
          p.x + 0.65,
          p.y + 1.65,
          p.z + 0.65,
          closestDist
        );
        if (t !== null && t < closestDist) {
          closestDist = t;
          bestPanda = p;
        }
      }
      if (bestPanda) {
        const kLen = Math.hypot(fx, fz) || 1;
        this.damagePanda(bestPanda, damage, fx / kLen * 8.5, fz / kLen * 8.5, false, events);
        hitPanda = true;
      }
      return { deflectedPineapple, hitPanda };
    }
    reflectPineapple(pine, aimX, aimY, aimZ) {
      pine.reflected = true;
      pine.age = 0;
      const owner = this.pandas.find((p) => p.id === pine.ownerPandaId);
      let tx = aimX;
      let ty = aimY + 0.14;
      let tz = aimZ;
      if (owner) {
        const odx = owner.x - pine.x;
        const ody = owner.y + 0.9 - pine.y;
        const odz = owner.z - pine.z;
        const olen = Math.hypot(odx, ody, odz) || 1;
        const dot = (odx * aimX + ody * aimY + odz * aimZ) / olen;
        if (dot > 0.35) {
          tx = odx / olen;
          ty = ody / olen + 0.12;
          tz = odz / olen;
        }
      }
      const len = Math.hypot(tx, ty, tz) || 1;
      const speed = 22;
      pine.vx = tx / len * speed;
      pine.vy = ty / len * speed;
      pine.vz = tz / len * speed;
      this.spawnBurstParticles(pine.x, pine.y, pine.z, [[1, 0.95, 0.45], [1, 1, 1]], 10, 4.5);
    }
    update(dt, world, playerX, playerY, playerZ, playerAlive, events) {
      if (this.graceTimer > 0) this.graceTimer -= dt;
      if (this.pandas.length < this.targetPandaCount) {
        this.respawnTimer += dt;
        if (this.respawnTimer >= 3.8) {
          this.respawnTimer = 0;
          this.spawnPandaAwayFrom(world, playerX, playerZ);
        }
      }
      for (const p of this.pandas) {
        if (p.hurtTimer > 0) p.hurtTimer = Math.max(0, p.hurtTimer - dt);
        if (p.throwCooldown > 0) p.throwCooldown = Math.max(0, p.throwCooldown - dt);
        const dx = playerX - p.x;
        const dz = playerZ - p.z;
        const dist = Math.hypot(dx, dz);
        const yawToPlayer = Math.atan2(-dx, -dz);
        if (p.hurtTimer > 0.08) {
          p.vx *= Math.max(0, 1 - dt * 5);
          p.vz *= Math.max(0, 1 - dt * 5);
          this.movePanda(world, p, dt);
          continue;
        }
        if (!playerAlive || dist > 28) {
          p.state = "wander";
        }
        if (p.state === "windup") {
          p.yaw = yawToPlayer;
          p.vx *= 0.7;
          p.vz *= 0.7;
          p.stateTimer -= dt;
          if (p.stateTimer <= 0) {
            this.throwPineappleFrom(p, playerX, playerY + 1.1, playerZ);
            events.onPandaThrow();
            p.state = "cooldown";
            p.stateTimer = 0.7;
            p.throwCooldown = 2.4 + Math.random() * 1.4;
          }
        } else if (p.state === "cooldown") {
          p.yaw = yawToPlayer;
          p.vx *= 0.8;
          p.vz *= 0.8;
          p.stateTimer -= dt;
          if (p.stateTimer <= 0) {
            p.state = "chase";
          }
        } else if (playerAlive && dist < 26) {
          p.state = "chase";
          p.yaw = yawToPlayer;
          const speed = 2.65;
          if (dist > 11.5) {
            p.vx = dx / dist * speed;
            p.vz = dz / dist * speed;
            p.walkPhase += dt * 7.5;
          } else if (dist < 5.5) {
            p.vx = -dx / dist * speed * 0.7;
            p.vz = -dz / dist * speed * 0.7;
            p.walkPhase += dt * 6;
          } else {
            const strafeSign = p.id % 2 === 0 ? 1 : -1;
            p.vx = -dz / dist * speed * 0.55 * strafeSign;
            p.vz = dx / dist * speed * 0.55 * strafeSign;
            p.walkPhase += dt * 5;
          }
          if (this.graceTimer <= 0 && p.throwCooldown <= 0 && dist >= 4.2 && dist <= 22) {
            p.state = "windup";
            p.stateTimer = 0.68;
          }
        } else {
          p.stateTimer -= dt;
          if (p.stateTimer <= 0) {
            p.wanderYaw = Math.random() * Math.PI * 2;
            p.stateTimer = 1.6 + Math.random() * 2.5;
          }
          p.yaw = p.wanderYaw;
          p.vx = -Math.sin(p.wanderYaw) * 1.5;
          p.vz = -Math.cos(p.wanderYaw) * 1.5;
          p.walkPhase += dt * 4.5;
        }
        this.movePanda(world, p, dt);
      }
      const survivingPineapples = [];
      for (const pine of this.pineapples) {
        pine.age += dt;
        if (pine.age > 5) continue;
        pine.vy -= PINEAPPLE_GRAVITY * dt;
        pine.x += pine.vx * dt;
        pine.y += pine.vy * dt;
        pine.z += pine.vz * dt;
        pine.spin += dt * (pine.reflected ? 16 : 9);
        if (world.isSolid(pine.x, pine.y, pine.z)) {
          this.spawnBurstParticles(
            pine.x,
            pine.y,
            pine.z,
            [
              [0.98, 0.82, 0.16],
              [0.9, 0.66, 0.12],
              [0.24, 0.76, 0.2]
            ],
            14,
            5
          );
          events.onPineappleSplat(pine.x, pine.y, pine.z);
          continue;
        }
        if (pine.reflected) {
          let hit = false;
          for (const panda of this.pandas) {
            if (Math.abs(pine.x - panda.x) < 0.78 && pine.y >= panda.y && pine.y <= panda.y + 1.65 && Math.abs(pine.z - panda.z) < 0.78) {
              const spd = Math.hypot(pine.vx, pine.vz) || 1;
              this.damagePanda(panda, 65, pine.vx / spd * 10, pine.vz / spd * 10, true, events);
              this.spawnBurstParticles(
                pine.x,
                pine.y,
                pine.z,
                [
                  [1, 0.88, 0.2],
                  [0.35, 0.9, 0.25],
                  [1, 1, 1]
                ],
                18,
                6.5
              );
              events.onPineappleSplat(pine.x, pine.y, pine.z);
              hit = true;
              break;
            }
          }
          if (hit) continue;
        } else if (playerAlive) {
          if (Math.abs(pine.x - playerX) < 0.62 && pine.y >= playerY && pine.y <= playerY + 1.85 && Math.abs(pine.z - playerZ) < 0.62) {
            events.onPineappleHitPlayer(pine);
            if (pine.reflected) {
              survivingPineapples.push(pine);
            } else {
              this.spawnBurstParticles(
                pine.x,
                pine.y,
                pine.z,
                [
                  [0.98, 0.82, 0.16],
                  [0.24, 0.76, 0.2]
                ],
                12,
                4.6
              );
            }
            continue;
          }
        }
        survivingPineapples.push(pine);
      }
      this.pineapples = survivingPineapples;
      const survivingArrows = [];
      for (const a of this.arrows) {
        a.age += dt;
        if (a.age > 3.5) continue;
        a.vy -= ARROW_GRAVITY * dt;
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.z += a.vz * dt;
        if (world.isSolid(a.x, a.y, a.z)) {
          this.spawnBurstParticles(a.x, a.y, a.z, [[0.72, 0.56, 0.34], [0.85, 0.85, 0.85]], 6, 3);
          continue;
        }
        let hitPanda = false;
        for (const panda of this.pandas) {
          if (Math.abs(a.x - panda.x) < 0.65 && a.y >= panda.y && a.y <= panda.y + 1.62 && Math.abs(a.z - panda.z) < 0.65) {
            const spd = Math.hypot(a.vx, a.vz) || 1;
            this.damagePanda(panda, 36, a.vx / spd * 7.5, a.vz / spd * 7.5, false, events);
            hitPanda = true;
            break;
          }
        }
        if (!hitPanda) survivingArrows.push(a);
      }
      this.arrows = survivingArrows;
      const survivingParticles = [];
      for (const pt of this.particles) {
        pt.age += dt;
        if (pt.age >= pt.maxAge) continue;
        pt.vy -= 16 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.z += pt.vz * dt;
        survivingParticles.push(pt);
      }
      this.particles = survivingParticles;
    }
  };

  // src/controls.ts
  var InputController = class {
    constructor(canvas, joyBase, joyKnob, btnPrimary, btnSecondary, btnJump, callbacks = {}) {
      this.canvas = canvas;
      this.joyBase = joyBase;
      this.joyKnob = joyKnob;
      this.btnPrimary = btnPrimary;
      this.btnSecondary = btnSecondary;
      this.btnJump = btnJump;
      this.keys = /* @__PURE__ */ new Set();
      this.mousePrimary = false;
      this.mouseSecondary = false;
      this.touchPrimary = false;
      this.touchSecondary = false;
      this.touchJump = false;
      this.primaryEdge = false;
      this.secondaryEdge = false;
      this.lookDX = 0;
      this.lookDY = 0;
      this.pendingSlot = null;
      this.scrollDelta = 0;
      // Virtual joystick state
      this.joyTouchId = null;
      this.joyMoveX = 0;
      this.joyMoveZ = 0;
      // Touch look drag state
      this.lookTouchId = null;
      this.lookLastX = 0;
      this.lookLastY = 0;
      // Fallback mouse drag look when pointer lock is not active
      this.mouseDragActive = false;
      this.mouseDragMoved = false;
      this.mouseLastX = 0;
      this.mouseLastY = 0;
      this.pointerLocked = false;
      this.touchModeEnabled = false;
      this.active = false;
      this.ignoreLockMoves = 0;
      this.onPauseRequest = callbacks.onPauseRequest;
      this.onUserGesture = callbacks.onUserGesture;
      this.touchModeEnabled = this.detectTouchDevice();
      this.bindEvents();
    }
    detectTouchDevice() {
      const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      const hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
      return coarse || hasTouch || window.innerWidth <= 860;
    }
    requestPointerLock() {
      if (this.touchModeEnabled) return;
      if (document.pointerLockElement !== this.canvas && typeof this.canvas.requestPointerLock === "function") {
        try {
          const res = this.canvas.requestPointerLock();
          if (res && typeof res.catch === "function") {
            res.catch(() => {
            });
          }
        } catch {
        }
      }
    }
    exitPointerLock() {
      if (document.pointerLockElement && typeof document.exitPointerLock === "function") {
        document.exitPointerLock();
      }
    }
    selectSlot(index) {
      if (index >= 0 && index <= 8) {
        this.pendingSlot = index;
      }
    }
    clearHeld() {
      this.keys.clear();
      this.mousePrimary = false;
      this.mouseSecondary = false;
      this.touchPrimary = false;
      this.touchSecondary = false;
      this.touchJump = false;
      this.joyMoveX = 0;
      this.joyMoveZ = 0;
      this.joyTouchId = null;
      this.lookTouchId = null;
      this.joyKnob.style.transform = "translate(0px, 0px)";
    }
    bindEvents() {
      window.addEventListener("keydown", (e) => {
        if (e.code === "Escape") {
          if (this.active) {
            this.onPauseRequest?.();
          }
          return;
        }
        if (!this.active) return;
        this.onUserGesture?.();
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
          e.preventDefault();
        }
        this.keys.add(e.code);
        if (e.code.startsWith("Digit")) {
          const num = parseInt(e.code.slice(5), 10);
          if (num >= 1 && num <= 9) {
            this.pendingSlot = num - 1;
          }
        }
        if ((e.code === "KeyE" || e.code === "KeyF") && !e.repeat) {
          this.secondaryEdge = true;
        }
      });
      window.addEventListener("keyup", (e) => {
        this.keys.delete(e.code);
      });
      window.addEventListener("blur", () => {
        this.clearHeld();
      });
      document.addEventListener("pointerlockchange", () => {
        const wasLocked = this.pointerLocked;
        this.pointerLocked = document.pointerLockElement === this.canvas;
        if (this.pointerLocked && !wasLocked) {
          this.ignoreLockMoves = 2;
        }
        if (wasLocked && !this.pointerLocked && this.active && !this.touchModeEnabled) {
          this.clearHeld();
          this.onPauseRequest?.();
        }
      });
      this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      this.canvas.addEventListener("mousedown", (e) => {
        if (!this.active) return;
        this.onUserGesture?.();
        if (this.pointerLocked) {
          if (e.button === 0) {
            this.mousePrimary = true;
            this.primaryEdge = true;
          } else if (e.button === 2) {
            this.mouseSecondary = true;
            this.secondaryEdge = true;
          }
        } else {
          this.mouseDragActive = true;
          this.mouseDragMoved = false;
          this.mouseLastX = e.clientX;
          this.mouseLastY = e.clientY;
          if (e.button === 0) {
            this.mousePrimary = true;
            this.primaryEdge = true;
          } else if (e.button === 2) {
            this.mouseSecondary = true;
            this.secondaryEdge = true;
          }
        }
      });
      window.addEventListener("mouseup", (e) => {
        if (e.button === 0) this.mousePrimary = false;
        if (e.button === 2) this.mouseSecondary = false;
        if (this.mouseDragActive && !this.mouseDragMoved && this.active && !this.touchModeEnabled) {
          this.requestPointerLock();
        }
        this.mouseDragActive = false;
      });
      window.addEventListener("mousemove", (e) => {
        if (!this.active) return;
        if (this.pointerLocked) {
          if (this.ignoreLockMoves > 0) {
            this.ignoreLockMoves--;
            return;
          }
          if (Math.abs(e.movementX) > 280 || Math.abs(e.movementY) > 280) return;
          this.lookDX += Math.max(-120, Math.min(120, e.movementX));
          this.lookDY += Math.max(-120, Math.min(120, e.movementY));
        } else if (this.mouseDragActive) {
          const dx = e.clientX - this.mouseLastX;
          const dy = e.clientY - this.mouseLastY;
          this.mouseLastX = e.clientX;
          this.mouseLastY = e.clientY;
          if (Math.abs(dx) + Math.abs(dy) > 2) {
            this.mouseDragMoved = true;
          }
          this.lookDX += dx * 1.4;
          this.lookDY += dy * 1.4;
        }
      });
      window.addEventListener(
        "wheel",
        (e) => {
          if (!this.active) return;
          if (Math.abs(e.deltaY) > 1) {
            this.scrollDelta += Math.sign(e.deltaY);
          }
        },
        { passive: true }
      );
      const updateJoy = (clientX, clientY) => {
        const rect = this.joyBase.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxR = rect.width * 0.38;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > maxR) {
          dx = dx / dist * maxR;
          dy = dy / dist * maxR;
        }
        this.joyKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
        this.joyMoveX = dx / maxR;
        this.joyMoveZ = -dy / maxR;
      };
      this.joyBase.addEventListener(
        "touchstart",
        (e) => {
          if (!this.active) return;
          e.preventDefault();
          this.onUserGesture?.();
          if (this.joyTouchId === null && e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            this.joyTouchId = t.identifier;
            updateJoy(t.clientX, t.clientY);
          }
        },
        { passive: false }
      );
      this.joyBase.addEventListener(
        "touchmove",
        (e) => {
          if (this.joyTouchId === null) return;
          e.preventDefault();
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === this.joyTouchId) {
              updateJoy(t.clientX, t.clientY);
              break;
            }
          }
        },
        { passive: false }
      );
      const endJoy = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joyTouchId) {
            this.joyTouchId = null;
            this.joyMoveX = 0;
            this.joyMoveZ = 0;
            this.joyKnob.style.transform = "translate(0px, 0px)";
            break;
          }
        }
      };
      this.joyBase.addEventListener("touchend", endJoy);
      this.joyBase.addEventListener("touchcancel", endJoy);
      let joyMouseDown = false;
      this.joyBase.addEventListener("mousedown", (e) => {
        if (!this.active) return;
        e.stopPropagation();
        e.preventDefault();
        this.onUserGesture?.();
        joyMouseDown = true;
        updateJoy(e.clientX, e.clientY);
      });
      window.addEventListener("mousemove", (e) => {
        if (joyMouseDown) updateJoy(e.clientX, e.clientY);
      });
      window.addEventListener("mouseup", () => {
        if (joyMouseDown) {
          joyMouseDown = false;
          this.joyMoveX = 0;
          this.joyMoveZ = 0;
          this.joyKnob.style.transform = "translate(0px, 0px)";
        }
      });
      this.canvas.addEventListener(
        "touchstart",
        (e) => {
          if (!this.active) return;
          e.preventDefault();
          this.onUserGesture?.();
          if (this.lookTouchId === null && e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            this.lookTouchId = t.identifier;
            this.lookLastX = t.clientX;
            this.lookLastY = t.clientY;
          }
        },
        { passive: false }
      );
      this.canvas.addEventListener(
        "touchmove",
        (e) => {
          if (!this.active || this.lookTouchId === null) return;
          e.preventDefault();
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === this.lookTouchId) {
              const dx = t.clientX - this.lookLastX;
              const dy = t.clientY - this.lookLastY;
              this.lookLastX = t.clientX;
              this.lookLastY = t.clientY;
              this.lookDX += dx * 2.1;
              this.lookDY += dy * 2.1;
              break;
            }
          }
        },
        { passive: false }
      );
      const endLook = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.lookTouchId) {
            this.lookTouchId = null;
            break;
          }
        }
      };
      this.canvas.addEventListener("touchend", endLook);
      this.canvas.addEventListener("touchcancel", endLook);
      const bindHoldButton = (el, onDown, onUp) => {
        el.addEventListener(
          "touchstart",
          (e) => {
            if (!this.active) return;
            e.preventDefault();
            e.stopPropagation();
            this.onUserGesture?.();
            el.classList.add("pressed");
            onDown();
          },
          { passive: false }
        );
        const releaseTouch = (e) => {
          e.preventDefault();
          el.classList.remove("pressed");
          onUp();
        };
        el.addEventListener("touchend", releaseTouch, { passive: false });
        el.addEventListener("touchcancel", releaseTouch, { passive: false });
        el.addEventListener("mousedown", (e) => {
          if (!this.active) return;
          e.preventDefault();
          e.stopPropagation();
          this.onUserGesture?.();
          el.classList.add("pressed");
          onDown();
        });
        const releaseMouse = () => {
          el.classList.remove("pressed");
          onUp();
        };
        el.addEventListener("mouseup", releaseMouse);
        el.addEventListener("mouseleave", releaseMouse);
      };
      bindHoldButton(
        this.btnPrimary,
        () => {
          this.touchPrimary = true;
          this.primaryEdge = true;
        },
        () => {
          this.touchPrimary = false;
        }
      );
      bindHoldButton(
        this.btnSecondary,
        () => {
          this.touchSecondary = true;
          this.secondaryEdge = true;
        },
        () => {
          this.touchSecondary = false;
        }
      );
      bindHoldButton(
        this.btnJump,
        () => {
          this.touchJump = true;
        },
        () => {
          this.touchJump = false;
        }
      );
    }
    sample() {
      let forward = 0;
      let right = 0;
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) forward += 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) forward -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) right += 1;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) right -= 1;
      if (Math.abs(this.joyMoveZ) > 0.12) forward = Math.max(-1, Math.min(1, forward + this.joyMoveZ));
      if (Math.abs(this.joyMoveX) > 0.12) right = Math.max(-1, Math.min(1, right + this.joyMoveX));
      const joyMag = Math.hypot(this.joyMoveX, this.joyMoveZ);
      const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || joyMag > 0.88;
      const jump = this.keys.has("Space") || this.touchJump;
      const snap = {
        moveForward: forward,
        moveRight: right,
        sprint,
        jump,
        primaryHeld: this.mousePrimary || this.touchPrimary,
        secondaryHeld: this.mouseSecondary || this.touchSecondary || this.keys.has("KeyE") || this.keys.has("KeyF"),
        primaryJustPressed: this.primaryEdge,
        secondaryJustPressed: this.secondaryEdge,
        lookDeltaX: this.lookDX,
        lookDeltaY: this.lookDY,
        slotSelect: this.pendingSlot,
        slotScrollDelta: this.scrollDelta
      };
      this.primaryEdge = false;
      this.secondaryEdge = false;
      this.lookDX = 0;
      this.lookDY = 0;
      this.pendingSlot = null;
      this.scrollDelta = 0;
      return snap;
    }
  };

  // src/audio.ts
  var SoundFX = class {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }
    ensureContext() {
      if (this.muted) return null;
      if (!this.ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        try {
          this.ctx = new Ctor();
        } catch {
          return null;
        }
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
      return this.ctx;
    }
    unlock() {
      this.ensureContext();
    }
    playTone(freqStart, freqEnd, duration, type = "square", gainPeak = 0.12) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      gain.gain.setValueAtTime(gainPeak, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }
    playNoise(duration, filterFreq, gainPeak = 0.12) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buf = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(filterFreq, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainPeak, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    }
    playBreak() {
      this.playNoise(0.11, 520, 0.16);
      this.playTone(170, 68, 0.09, "triangle", 0.12);
    }
    playPlace() {
      this.playTone(230, 320, 0.07, "triangle", 0.12);
      this.playNoise(0.045, 900, 0.06);
    }
    playMineTick() {
      this.playNoise(0.04, 700, 0.05);
    }
    playSwing() {
      this.playNoise(0.09, 1300, 0.09);
      this.playTone(360, 140, 0.08, "sine", 0.06);
    }
    playBowShoot() {
      this.playTone(460, 190, 0.11, "triangle", 0.11);
      this.playNoise(0.06, 2200, 0.07);
    }
    playShieldBlock() {
      this.playTone(290, 150, 0.1, "square", 0.13);
      this.playTone(620, 880, 0.11, "triangle", 0.1);
    }
    playDeflect() {
      this.playTone(540, 1180, 0.14, "triangle", 0.16);
      this.playTone(810, 1420, 0.12, "sine", 0.1);
    }
    playPandaThrow() {
      this.playTone(220, 390, 0.1, "sine", 0.08);
    }
    playPandaHurt() {
      this.playTone(320, 160, 0.12, "sawtooth", 0.1);
    }
    playPandaDefeat() {
      this.playTone(440, 660, 0.12, "triangle", 0.13);
      setTimeout(() => this.playTone(660, 880, 0.16, "triangle", 0.13), 85);
    }
    playPineappleSplat() {
      this.playNoise(0.12, 650, 0.12);
      this.playTone(180, 75, 0.1, "sine", 0.09);
    }
    playPlayerHurt() {
      this.playTone(165, 65, 0.18, "sawtooth", 0.16);
      this.playNoise(0.1, 360, 0.11);
    }
    playJump() {
      this.playTone(170, 290, 0.08, "sine", 0.06);
    }
  };

  // src/game.ts
  var PLAYER_HALF_W = 0.32;
  var PLAYER_HEIGHT = 1.75;
  var PLAYER_EYE_H = 1.56;
  var MAX_REACH = 5.4;
  var PandaCraftGame = class {
    constructor(ui) {
      this.ui = ui;
      // Player state
      this.px = 32.5;
      this.py = 12;
      this.pz = 35.5;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.yaw = 0;
      // 0 looks toward -Z (North across valley toward bamboo & pandas)
      this.pitch = -0.05;
      this.onGround = false;
      this.hp = 20;
      this.maxHp = 20;
      this.selectedSlot = 0;
      this.walkBob = 0;
      // Combat & Mining state
      this.swingAnim = 0;
      this.attackCooldown = 0;
      this.bowCooldown = 0;
      this.bowCharge = 0;
      this.shieldRaise = 0;
      this.shieldRecoil = 0;
      this.shieldActive = false;
      this.targetBlock = null;
      this.miningKey = "";
      this.miningProgress = 0;
      this.mineTickTimer = 0;
      this.placeCooldown = 0;
      // Game lifecycle
      this.mode = "start";
      this.time = 0;
      this.damageFlash = 0;
      this.shieldFlash = 0;
      this.toastTimer = 0;
      this.stats = {
        pandasDefeated: 0,
        pineapplesBlocked: 0,
        pineapplesDeflected: 0,
        blocksBroken: 0,
        blocksPlaced: 0
      };
      this.lastFrameMs = 0;
      this.rafId = 0;
      this.slotElements = [];
      this.hotbar = createInitialHotbar();
      const textures = buildTextureBundle(this.hotbar);
      this.slotIcons = textures.slotIcons;
      this.world = new VoxelWorld(1337);
      this.entities = new EntityManager();
      this.entities.reset(this.world);
      this.renderer = new VoxelRenderer(ui.canvas, textures.atlasCanvas);
      this.sfx = new SoundFX();
      this.input = new InputController(
        ui.canvas,
        ui.joyBase,
        ui.joyKnob,
        ui.btnPrimary,
        ui.btnSecondary,
        ui.btnJump,
        {
          onPauseRequest: () => {
            if (this.mode === "playing") this.setMode("paused");
          },
          onUserGesture: () => this.sfx.unlock()
        }
      );
      this.resetPlayerPosition();
      this.buildHotbarUI();
      this.bindUIButtons();
      this.syncTouchUIVisibility();
      this.updateHUD();
    }
    resetPlayerPosition() {
      this.px = 32.5;
      this.pz = 35.5;
      this.py = this.world.getSurfaceHeight(this.px, this.pz) + 0.05;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.yaw = 0;
      this.pitch = -0.05;
      this.hp = this.maxHp;
      this.shieldRaise = 0;
      this.shieldActive = false;
    }
    buildHotbarUI() {
      this.ui.hotbarEl.innerHTML = "";
      this.slotElements = [];
      this.hotbar.forEach((slot, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "hotbar-slot";
        btn.dataset.slotIndex = String(idx);
        btn.title = `${slot.name} (${idx + 1}) - ${slot.shortHint}`;
        const num = document.createElement("span");
        num.className = "slot-num";
        num.textContent = String(idx + 1);
        const img = document.createElement("img");
        img.className = "slot-icon";
        img.src = this.slotIcons[slot.id];
        img.alt = slot.name;
        img.draggable = false;
        const count = document.createElement("span");
        count.className = "slot-count";
        count.textContent = slot.count >= 0 ? String(slot.count) : "";
        btn.appendChild(num);
        btn.appendChild(img);
        btn.appendChild(count);
        const pick = (e) => {
          e.stopPropagation();
          this.sfx.unlock();
          this.selectSlot(idx);
        };
        btn.addEventListener("click", pick);
        btn.addEventListener(
          "touchstart",
          (e) => {
            e.preventDefault();
            pick(e);
          },
          { passive: false }
        );
        this.ui.hotbarEl.appendChild(btn);
        this.slotElements.push(btn);
      });
      this.refreshHotbarUI();
    }
    bindUIButtons() {
      const startOrResume = () => {
        this.sfx.unlock();
        this.setMode("playing");
        this.input.requestPointerLock();
      };
      this.ui.btnPlay.addEventListener("click", startOrResume);
      this.ui.btnResume.addEventListener("click", startOrResume);
      this.ui.btnRestartPause.addEventListener("click", () => {
        this.sfx.unlock();
        this.fullReset();
        this.setMode("playing");
        this.input.requestPointerLock();
      });
      this.ui.btnRespawn.addEventListener("click", () => {
        this.sfx.unlock();
        this.respawnPlayer();
        this.setMode("playing");
        this.input.requestPointerLock();
      });
      this.ui.btnTouchToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.input.touchModeEnabled = !this.input.touchModeEnabled;
        if (this.input.touchModeEnabled) {
          this.input.exitPointerLock();
        }
        this.syncTouchUIVisibility();
      });
      this.ui.btnMuteToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.sfx.muted = !this.sfx.muted;
        this.ui.btnMuteToggle.textContent = this.sfx.muted ? "Sound: Off" : "Sound: On";
      });
      this.ui.btnPause.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.mode === "playing") {
          this.input.exitPointerLock();
          this.setMode("paused");
        } else if (this.mode === "paused") {
          startOrResume();
        }
      });
    }
    syncTouchUIVisibility() {
      const on = this.input.touchModeEnabled;
      this.ui.touchControlsEl.classList.toggle("visible", on);
      this.ui.btnTouchToggle.textContent = on ? "Touch: On" : "Touch: Off";
      this.ui.btnTouchToggle.classList.toggle("active-pill", on);
    }
    setMode(newMode) {
      this.mode = newMode;
      this.input.active = newMode === "playing";
      if (newMode !== "playing") {
        this.input.clearHeld();
      }
      this.ui.startOverlay.classList.toggle("hidden", newMode !== "start");
      this.ui.pauseOverlay.classList.toggle("hidden", newMode !== "paused");
      this.ui.deathOverlay.classList.toggle("hidden", newMode !== "dead");
      if (newMode === "dead") {
        this.input.exitPointerLock();
        this.ui.deathStatsEl.textContent = `Pandas Defeated: ${this.stats.pandasDefeated}  |  Pineapples Blocked: ${this.stats.pineapplesBlocked}  |  Deflected: ${this.stats.pineapplesDeflected}  |  Blocks Placed: ${this.stats.blocksPlaced}`;
      }
    }
    respawnPlayer() {
      this.resetPlayerPosition();
      this.entities.pineapples = [];
      for (const s of this.hotbar) {
        if (s.kind === "block" && s.count < 16) s.count = 16;
      }
      this.refreshHotbarUI();
      this.updateHUD();
      this.showToast("Respawned! Grab your Shield or Sword!");
    }
    fullReset() {
      this.world = new VoxelWorld(1337);
      this.entities.reset(this.world);
      this.hotbar = createInitialHotbar();
      this.selectedSlot = 0;
      this.stats = {
        pandasDefeated: 0,
        pineapplesBlocked: 0,
        pineapplesDeflected: 0,
        blocksBroken: 0,
        blocksPlaced: 0
      };
      this.resetPlayerPosition();
      this.refreshHotbarUI();
      this.updateHUD();
    }
    selectSlot(idx) {
      const clamped = (idx % this.hotbar.length + this.hotbar.length) % this.hotbar.length;
      if (this.selectedSlot !== clamped) {
        this.selectedSlot = clamped;
        this.miningProgress = 0;
        this.miningKey = "";
        this.bowCharge = 0;
        this.refreshHotbarUI();
      }
    }
    refreshHotbarUI() {
      const active = this.hotbar[this.selectedSlot];
      this.slotElements.forEach((el, idx) => {
        el.classList.toggle("selected", idx === this.selectedSlot);
        const countEl = el.querySelector(".slot-count");
        const slot = this.hotbar[idx];
        countEl.textContent = slot.count >= 0 ? String(slot.count) : "";
        el.classList.toggle("empty-slot", slot.count === 0);
      });
      this.ui.slotLabelEl.textContent = `${active.name} \u2014 ${active.shortHint}`;
      if (active.kind === "sword") {
        this.ui.btnPrimaryLabel.textContent = "SLASH";
        this.ui.btnSecondaryLabel.textContent = "DEFLECT";
      } else if (active.kind === "shield") {
        this.ui.btnPrimaryLabel.textContent = "BLOCK";
        this.ui.btnSecondaryLabel.textContent = "BLOCK";
      } else if (active.kind === "pickaxe") {
        this.ui.btnPrimaryLabel.textContent = "MINE";
        this.ui.btnSecondaryLabel.textContent = "MINE";
      } else if (active.kind === "bow") {
        this.ui.btnPrimaryLabel.textContent = "SHOOT";
        this.ui.btnSecondaryLabel.textContent = "SHOOT";
      } else {
        this.ui.btnPrimaryLabel.textContent = "BREAK";
        this.ui.btnSecondaryLabel.textContent = "PLACE";
      }
    }
    showToast(message) {
      this.ui.toastEl.textContent = message;
      this.ui.toastEl.classList.add("show");
      this.toastTimer = 2.1;
    }
    updateHUD() {
      let heartsHtml = "";
      for (let i = 0; i < 10; i++) {
        const heartHp = this.hp - i * 2;
        const cls = heartHp >= 2 ? "heart full" : heartHp === 1 ? "heart half" : "heart empty";
        heartsHtml += `<span class="${cls}" aria-hidden="true"></span>`;
      }
      this.ui.heartsEl.innerHTML = heartsHtml;
      this.ui.heartsEl.setAttribute("aria-label", `Health ${this.hp} of ${this.maxHp}`);
      this.ui.pandasCountEl.textContent = String(this.entities.pandas.length);
      this.ui.defeatedEl.textContent = String(this.stats.pandasDefeated);
      this.ui.blockedEl.textContent = String(this.stats.pineapplesBlocked + this.stats.pineapplesDeflected);
      this.ui.shieldBadgeEl.classList.toggle("visible", this.shieldActive);
    }
    playerCollides(x, y, z) {
      const minX = Math.floor(x - PLAYER_HALF_W);
      const maxX = Math.floor(x + PLAYER_HALF_W);
      const minY = Math.floor(y);
      const maxY = Math.floor(y + PLAYER_HEIGHT);
      const minZ = Math.floor(z - PLAYER_HALF_W);
      const maxZ = Math.floor(z + PLAYER_HALF_W);
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          for (let bx = minX; bx <= maxX; bx++) {
            if (this.world.isSolid(bx, by, bz)) return true;
          }
        }
      }
      return false;
    }
    addBlockToInventory(blockId) {
      if (blockId === null) return;
      const slot = this.hotbar.find((s) => s.kind === "block" && s.blockId === blockId);
      if (slot) {
        slot.count = Math.min(99, slot.count + 1);
        this.refreshHotbarUI();
      }
    }
    tryPlaceBlock() {
      const active = this.hotbar[this.selectedSlot];
      if (active.kind !== "block" || active.blockId === void 0 || active.count <= 0) return false;
      if (!this.targetBlock) return false;
      const tx = this.targetBlock.x + this.targetBlock.nx;
      const ty = this.targetBlock.y + this.targetBlock.ny;
      const tz = this.targetBlock.z + this.targetBlock.nz;
      if (!this.world.inBounds(tx, ty, tz)) return false;
      const existing = this.world.getBlock(tx, ty, tz);
      if (existing !== 0 /* Air */ && existing !== 10 /* Water */) return false;
      const overlapsPlayer = tx + 1 > this.px - PLAYER_HALF_W && tx < this.px + PLAYER_HALF_W && ty + 1 > this.py && ty < this.py + PLAYER_HEIGHT && tz + 1 > this.pz - PLAYER_HALF_W && tz < this.pz + PLAYER_HALF_W;
      if (overlapsPlayer) return false;
      for (const p of this.entities.pandas) {
        if (tx + 1 > p.x - 0.45 && tx < p.x + 0.45 && ty + 1 > p.y && ty < p.y + 1.45 && tz + 1 > p.z - 0.45 && tz < p.z + 0.45) {
          return false;
        }
      }
      if (this.world.setBlock(tx, ty, tz, active.blockId)) {
        active.count -= 1;
        this.stats.blocksPlaced += 1;
        this.swingAnim = 1;
        this.placeCooldown = 0.2;
        this.sfx.playPlace();
        this.refreshHotbarUI();
        return true;
      }
      return false;
    }
    breakTargetBlock() {
      if (!this.targetBlock) return false;
      const { x, y, z, block } = this.targetBlock;
      const meta = BLOCK_INFO[block];
      if (!meta.breakable) return false;
      if (this.world.setBlock(x, y, z, 0 /* Air */)) {
        this.stats.blocksBroken += 1;
        this.entities.spawnBlockParticles(x, y, z, block, 14);
        this.addBlockToInventory(meta.dropSlotBlock);
        this.sfx.playBreak();
        this.miningProgress = 0;
        this.miningKey = "";
        this.swingAnim = 1;
        return true;
      }
      return false;
    }
    entityEvents() {
      return {
        onPandaThrow: () => {
          this.sfx.playPandaThrow();
        },
        onPandaHurt: () => {
          this.sfx.playPandaHurt();
        },
        onPandaDefeat: (_panda, byReflection) => {
          this.stats.pandasDefeated += 1;
          this.hp = Math.min(this.maxHp, this.hp + 2);
          const rewardSlot = this.hotbar[4 + this.stats.pandasDefeated % 2];
          if (rewardSlot) rewardSlot.count = Math.min(99, rewardSlot.count + 4);
          this.sfx.playPandaDefeat();
          this.refreshHotbarUI();
          this.updateHUD();
          this.showToast(
            byReflection ? "HOME RUN! Reflected pineapple KO! +1 Heart" : "Panda defeated! +1 Heart & +4 Blocks"
          );
        },
        onPineappleSplat: () => {
          this.sfx.playPineappleSplat();
        },
        onPineappleHitPlayer: (pine) => {
          const fwd = forwardFromAngles(this.yaw, this.pitch);
          const toPineX = pine.x - this.px;
          const toPineY = pine.y - (this.py + PLAYER_EYE_H);
          const toPineZ = pine.z - this.pz;
          const len = Math.hypot(toPineX, toPineY, toPineZ) || 1;
          const dot = (toPineX * fwd.x + toPineY * fwd.y + toPineZ * fwd.z) / len;
          if (this.shieldActive && dot > -0.2) {
            this.stats.pineapplesBlocked += 1;
            this.shieldRecoil = 1;
            this.shieldFlash = 0.45;
            this.entities.reflectPineapple(pine, fwd.x, fwd.y, fwd.z);
            this.sfx.playShieldBlock();
            this.updateHUD();
            this.showToast("SHIELD BLOCKED & REFLECTED!");
            return;
          }
          this.hp = Math.max(0, this.hp - 3);
          this.damageFlash = 0.65;
          const hLen = Math.hypot(pine.vx, pine.vz) || 1;
          this.vx += pine.vx / hLen * 5.2;
          this.vz += pine.vz / hLen * 5.2;
          this.vy = Math.max(this.vy, 3.6);
          this.sfx.playPlayerHurt();
          this.updateHUD();
          if (this.hp <= 0) {
            this.setMode("dead");
          }
        }
      };
    }
    step(dt) {
      this.time += dt;
      if (this.damageFlash > 0) {
        this.damageFlash = Math.max(0, this.damageFlash - dt * 1.9);
        this.ui.damageFlashEl.style.opacity = String(this.damageFlash * 0.65);
      }
      if (this.shieldFlash > 0) {
        this.shieldFlash = Math.max(0, this.shieldFlash - dt * 2.2);
        this.ui.shieldFlashEl.style.opacity = String(this.shieldFlash * 0.55);
      }
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) {
          this.ui.toastEl.classList.remove("show");
        }
      }
      if (this.swingAnim > 0) this.swingAnim = Math.max(0, this.swingAnim - dt * 4.5);
      if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      if (this.bowCooldown > 0) this.bowCooldown = Math.max(0, this.bowCooldown - dt);
      if (this.placeCooldown > 0) this.placeCooldown = Math.max(0, this.placeCooldown - dt);
      if (this.shieldRecoil > 0) this.shieldRecoil = Math.max(0, this.shieldRecoil - dt * 5.5);
      if (this.mode !== "playing") {
        if (this.mode === "start") {
          this.yaw = Math.sin(this.time * 0.18) * 0.22;
        }
        return;
      }
      const inp = this.input.sample();
      if (inp.slotSelect !== null) {
        this.selectSlot(inp.slotSelect);
      } else if (inp.slotScrollDelta !== 0) {
        this.selectSlot(this.selectedSlot + inp.slotScrollDelta);
      }
      const sensitivity = 26e-4;
      this.yaw -= inp.lookDeltaX * sensitivity;
      this.pitch = clamp(this.pitch - inp.lookDeltaY * sensitivity, -Math.PI * 0.48, Math.PI * 0.48);
      const inWater = this.world.getBlock(this.px, this.py + 0.5, this.pz) === 10 /* Water */;
      const baseSpeed = this.shieldActive ? 3.2 : inp.sprint ? 7.4 : 5.1;
      const moveSpeed = inWater ? baseSpeed * 0.62 : baseSpeed;
      const sinY = Math.sin(this.yaw);
      const cosY = Math.cos(this.yaw);
      const wishX = -sinY * inp.moveForward + cosY * inp.moveRight;
      const wishZ = -cosY * inp.moveForward - sinY * inp.moveRight;
      const wishLen = Math.hypot(wishX, wishZ);
      const normX = wishLen > 1 ? wishX / wishLen : wishX;
      const normZ = wishLen > 1 ? wishZ / wishLen : wishZ;
      const accel = this.onGround ? 18 : 8;
      this.vx += (normX * moveSpeed - this.vx) * Math.min(1, accel * dt);
      this.vz += (normZ * moveSpeed - this.vz) * Math.min(1, accel * dt);
      if (inWater) {
        this.vy -= GRAVITY * 0.35 * dt;
        if (inp.jump) this.vy = 4.2;
        this.vy = clamp(this.vy, -4.5, 5);
      } else {
        this.vy -= GRAVITY * dt;
        if (inp.jump && this.onGround) {
          this.vy = 8.4;
          this.onGround = false;
          this.sfx.playJump();
        }
      }
      const nextX = clamp(this.px + this.vx * dt, 1.4, WORLD_X - 1.4);
      if (!this.playerCollides(nextX, this.py + 0.05, this.pz)) {
        this.px = nextX;
      } else {
        this.vx = 0;
      }
      const nextZ = clamp(this.pz + this.vz * dt, 1.4, WORLD_Z - 1.4);
      if (!this.playerCollides(this.px, this.py + 0.05, nextZ)) {
        this.pz = nextZ;
      } else {
        this.vz = 0;
      }
      const nextY = this.py + this.vy * dt;
      if (!this.playerCollides(this.px, nextY, this.pz)) {
        this.py = clamp(nextY, 1, WORLD_Y - 2);
        this.onGround = false;
      } else {
        if (this.vy < 0) {
          this.py = Math.floor(this.py);
          while (this.playerCollides(this.px, this.py, this.pz) && this.py < WORLD_Y - 2) {
            this.py += 1;
          }
          this.onGround = true;
        }
        this.vy = 0;
      }
      const horizSpeed = Math.hypot(this.vx, this.vz);
      if (this.onGround && horizSpeed > 0.4) {
        this.walkBob += dt * horizSpeed * 1.9;
      }
      const eyeY = this.py + PLAYER_EYE_H;
      const fwd = forwardFromAngles(this.yaw, this.pitch);
      this.targetBlock = this.world.raycast(this.px, eyeY, this.pz, fwd.x, fwd.y, fwd.z, MAX_REACH);
      const active = this.hotbar[this.selectedSlot];
      const events = this.entityEvents();
      const wantShield = active.kind === "shield" && (inp.primaryHeld || inp.secondaryHeld);
      this.shieldActive = wantShield;
      this.shieldRaise += ((wantShield ? 1 : 0) - this.shieldRaise) * Math.min(1, dt * 14);
      this.ui.shieldBadgeEl.classList.toggle("visible", this.shieldActive);
      if (active.kind === "sword") {
        if ((inp.primaryJustPressed || inp.secondaryJustPressed || inp.primaryHeld && this.attackCooldown <= 0) && this.attackCooldown <= 0) {
          this.attackCooldown = 0.3;
          this.swingAnim = 1;
          const res = this.entities.tryMeleeAttack(
            this.px,
            eyeY,
            this.pz,
            fwd.x,
            fwd.y,
            fwd.z,
            36,
            true,
            events
          );
          if (res.deflectedPineapple) {
            this.stats.pineapplesDeflected += 1;
            this.shieldFlash = 0.45;
            this.sfx.playDeflect();
            this.updateHUD();
            this.showToast("PINEAPPLE BATTED BACK!");
          } else if (!res.hitPanda) {
            this.sfx.playSwing();
          }
        }
      } else if (active.kind === "bow") {
        if (inp.primaryHeld || inp.secondaryHeld) {
          this.bowCharge = Math.min(1, this.bowCharge + dt * 2.4);
        }
        if ((inp.primaryJustPressed || inp.secondaryJustPressed) && this.bowCooldown <= 0) {
          this.bowCooldown = 0.34;
          this.bowCharge = 0.85;
          this.entities.spawnArrow(
            this.px + fwd.x * 0.5,
            eyeY - 0.08 + fwd.y * 0.5,
            this.pz + fwd.z * 0.5,
            fwd.x,
            fwd.y,
            fwd.z,
            29
          );
          this.sfx.playBowShoot();
        } else if (!inp.primaryHeld && !inp.secondaryHeld) {
          this.bowCharge = Math.max(0, this.bowCharge - dt * 5);
        }
      } else if (active.kind === "block") {
        if ((inp.secondaryJustPressed || inp.secondaryHeld && this.placeCooldown <= 0) && this.placeCooldown <= 0) {
          this.tryPlaceBlock();
        }
      }
      const canMineNow = active.kind === "pickaxe" || active.kind === "block" || active.kind === "sword" && inp.primaryHeld && this.targetBlock !== null;
      const miningPressed = active.kind === "pickaxe" ? inp.primaryHeld || inp.secondaryHeld : inp.primaryHeld;
      if (canMineNow && miningPressed && this.targetBlock) {
        const { x, y, z, block } = this.targetBlock;
        const meta = BLOCK_INFO[block];
        if (meta.breakable) {
          const key = `${x},${y},${z}`;
          if (key !== this.miningKey) {
            this.miningKey = key;
            this.miningProgress = 0;
          }
          const speedMult = active.kind === "pickaxe" ? meta.pickaxeSpeed : 1;
          this.miningProgress += dt * speedMult / Math.max(0.08, meta.hardness);
          this.mineTickTimer += dt;
          if (this.mineTickTimer >= 0.16) {
            this.mineTickTimer = 0;
            this.swingAnim = 0.85;
            this.sfx.playMineTick();
          }
          if (this.miningProgress >= 1) {
            this.breakTargetBlock();
          }
        } else {
          this.miningProgress = 0;
        }
      } else {
        if ((active.kind === "pickaxe" || active.kind === "block") && inp.primaryJustPressed && this.attackCooldown <= 0) {
          const dmg = active.kind === "pickaxe" ? 24 : 15;
          const res = this.entities.tryMeleeAttack(
            this.px,
            eyeY,
            this.pz,
            fwd.x,
            fwd.y,
            fwd.z,
            dmg,
            false,
            events
          );
          if (res.hitPanda) {
            this.attackCooldown = 0.35;
            this.swingAnim = 1;
          }
        }
        this.miningProgress = Math.max(0, this.miningProgress - dt * 3.5);
        if (this.miningProgress <= 0) this.miningKey = "";
      }
      if (this.miningProgress > 0.02) {
        this.ui.miningRingEl.style.opacity = "1";
        const pct = Math.min(100, Math.round(this.miningProgress * 100));
        this.ui.miningRingEl.style.background = `conic-gradient(#ffd54f ${pct}%, rgba(255,255,255,0.18) 0%)`;
      } else {
        this.ui.miningRingEl.style.opacity = "0";
      }
      this.ui.crosshairEl.classList.toggle("targeting", this.targetBlock !== null);
      this.entities.update(dt, this.world, this.px, this.py, this.pz, this.hp > 0, events);
      this.ui.pandasCountEl.textContent = String(this.entities.pandas.length);
    }
    renderFrame() {
      const eyeY = this.py + PLAYER_EYE_H;
      const underwater = this.world.getBlock(this.px, eyeY, this.pz) === 10 /* Water */;
      this.renderer.render({
        camX: this.px,
        camY: eyeY,
        camZ: this.pz,
        yaw: this.yaw,
        pitch: this.pitch,
        time: this.time,
        world: this.world,
        pandas: this.entities.pandas,
        pineapples: this.entities.pineapples,
        arrows: this.entities.arrows,
        particles: this.entities.particles,
        targetBlock: this.mode === "playing" ? this.targetBlock : null,
        miningProgress: this.miningProgress,
        activeSlot: this.hotbar[this.selectedSlot],
        swingAnim: this.swingAnim,
        shieldRaise: this.shieldRaise,
        shieldRecoil: this.shieldRecoil,
        bowCharge: this.bowCharge,
        walkBob: this.walkBob,
        underwater
      });
    }
    start() {
      this.lastFrameMs = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, Math.max(1e-3, (now - this.lastFrameMs) / 1e3));
        this.lastFrameMs = now;
        this.step(dt);
        this.renderFrame();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }
    stop() {
      cancelAnimationFrame(this.rafId);
    }
  };

  // src/main.ts
  function getEl(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing required element #${id}`);
    return el;
  }
  function bootstrap() {
    const ui = {
      canvas: getEl("game-canvas"),
      heartsEl: getEl("hearts"),
      pandasCountEl: getEl("stat-pandas"),
      defeatedEl: getEl("stat-defeated"),
      blockedEl: getEl("stat-blocked"),
      hotbarEl: getEl("hotbar"),
      slotLabelEl: getEl("slot-label"),
      toastEl: getEl("toast"),
      damageFlashEl: getEl("damage-flash"),
      shieldFlashEl: getEl("shield-flash"),
      crosshairEl: getEl("crosshair"),
      miningRingEl: getEl("mining-ring"),
      shieldBadgeEl: getEl("shield-badge"),
      startOverlay: getEl("start-overlay"),
      pauseOverlay: getEl("pause-overlay"),
      deathOverlay: getEl("death-overlay"),
      deathStatsEl: getEl("death-stats"),
      touchControlsEl: getEl("touch-controls"),
      joyBase: getEl("joy-base"),
      joyKnob: getEl("joy-knob"),
      btnPrimary: getEl("btn-primary"),
      btnSecondary: getEl("btn-secondary"),
      btnJump: getEl("btn-jump"),
      btnPrimaryLabel: getEl("btn-primary-label"),
      btnSecondaryLabel: getEl("btn-secondary-label"),
      btnPlay: getEl("btn-play"),
      btnResume: getEl("btn-resume"),
      btnRestartPause: getEl("btn-restart-pause"),
      btnRespawn: getEl("btn-respawn"),
      btnTouchToggle: getEl("btn-touch-toggle"),
      btnMuteToggle: getEl("btn-mute-toggle"),
      btnPause: getEl("btn-pause")
    };
    try {
      const game = new PandaCraftGame(ui);
      game.start();
      window.__GAME__ = game;
    } catch (err) {
      const fallback = document.getElementById("webgl-error");
      if (fallback) {
        fallback.textContent = `Could not start 3D renderer: ${err instanceof Error ? err.message : String(err)}`;
        fallback.classList.remove("hidden");
      }
      throw err;
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
//# sourceMappingURL=game.js.map
