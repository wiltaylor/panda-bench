import { hash2, fbm, smoothstep } from "./hash.js";
import {
  AIR,
  BEDROCK,
  COAL,
  COBBLE,
  DIRT,
  FLOWER_B,
  FLOWER_R,
  FLOWER_Y,
  GRASS,
  LEAVES,
  LOG,
  PLANKS,
  SAND,
  STONE,
  TALLGRASS,
  isOpaque,
  isSolid,
} from "./blocks.js";

export const SX = 64;
export const SY = 32;
export const SZ = 64;
export const CHUNK = 16;
export const SEED = 481516234;
const MEADOW = 12;

export function chunkCount() {
  return {
    x: SX / CHUNK,
    y: SY / CHUNK,
    z: SZ / CHUNK,
  };
}

export class World {
  constructor(seed = SEED) {
    this.seed = seed >>> 0;
    this.data = new Uint8Array(SX * SY * SZ);
    this.dirty = new Set();
  }

  index(x, y, z) {
    return x + SX * (z + SZ * y);
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  /**
   * Out of the vertical range above the world is air. Below, and past the
   * horizontal border, reads as bedrock so collision and face culling agree.
   */
  get(x, y, z) {
    if (y >= SY) return AIR;
    if (y < 0 || x < 0 || z < 0 || x >= SX || z >= SZ) return BEDROCK;
    return this.data[this.index(x, y, z)];
  }

  isSolidAt(x, y, z) {
    return isSolid(this.get(x, y, z));
  }

  isOpaqueAt(x, y, z) {
    return isOpaque(this.get(x, y, z));
  }

  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return false;
    const i = this.index(x, y, z);
    if (this.data[i] === id) return false;
    this.data[i] = id;
    this.markDirty(x, y, z);
    return true;
  }

  markDirty(x, y, z) {
    const cx = x >> 4;
    const cy = y >> 4;
    const cz = z >> 4;
    this.touch(cx, cy, cz);
    if ((x & 15) === 0) this.touch(cx - 1, cy, cz);
    if ((x & 15) === 15) this.touch(cx + 1, cy, cz);
    if ((y & 15) === 0) this.touch(cx, cy - 1, cz);
    if ((y & 15) === 15) this.touch(cx, cy + 1, cz);
    if ((z & 15) === 0) this.touch(cx, cy, cz - 1);
    if ((z & 15) === 15) this.touch(cx, cy, cz + 1);
  }

  touch(cx, cy, cz) {
    const n = chunkCount();
    if (cx < 0 || cy < 0 || cz < 0 || cx >= n.x || cy >= n.y || cz >= n.z) return;
    this.dirty.add(cx + "," + cy + "," + cz);
  }

  surfaceY(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    for (let y = SY - 1; y >= 0; y--) {
      if (isSolid(this.get(ix, y, iz))) return y;
    }
    return 0;
  }

  terrainHeight(x, z) {
    const cx = SX / 2 - 0.5;
    const cz = SZ / 2 - 0.5;
    let h = 8 + fbm((x + this.seed * 0.001) * 0.075, z * 0.075) * 11 + hash2(x >> 3, z >> 3, this.seed) * 3;
    const dist = Math.hypot(x - cx, z - cz);
    const blend = smoothstep(8, 18, dist);
    h = MEADOW * (1 - blend) + h * blend;
    const edge = Math.min(x, z, SX - 1 - x, SZ - 1 - z);
    if (edge < 5) h += (5 - edge) * 2.5;
    return Math.max(4, Math.min(SY - 4, Math.round(h)));
  }

  generate() {
    const cx = SX / 2 - 0.5;
    const cz = SZ / 2 - 0.5;
    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const h = this.terrainHeight(x, z);
        const dist = Math.hypot(x - cx, z - cz);
        let top = GRASS;
        if (Math.hypot(x - 46, z - 30) < 3.3) top = SAND;
        else if (dist > 18 && hash2(x, z, 7) > 0.9) top = SAND;
        for (let y = 0; y <= h; y++) {
          let id;
          if (y === 0) id = BEDROCK;
          else if (y === h) id = top;
          else if (y >= h - 3) id = top === SAND ? SAND : DIRT;
          else id = hash2(x, y, z) > 0.965 ? COAL : STONE;
          this.data[this.index(x, y, z)] = id;
        }
      }
    }
    this.growTrees();
    this.scatterPlants();
    this.dressMeadow();
    this.dirty.clear();
  }

  growTrees() {
    const cx = SX / 2 - 0.5;
    const cz = SZ / 2 - 0.5;
    for (let z = 2; z < SZ - 2; z++) {
      for (let x = 2; x < SX - 2; x++) {
        const dist = Math.hypot(x - cx, z - cz);
        if (dist < 10 || dist > 28) continue;
        if (hash2(x, z, 99) < 0.986) continue;
        const h = this.surfaceY(x, z);
        if (this.get(x, h, z) !== GRASS) continue;
        this.plantTree(x, h, z);
      }
    }
  }

  plantTree(x, y, z) {
    const height = 4 + ((hash2(x, z, 3) * 3) | 0);
    if (y + height + 2 >= SY) return;
    for (let i = 1; i <= height; i++) {
      if (isSolid(this.get(x, y + i, z))) return;
    }
    this.data[this.index(x, y, z)] = LOG;
    for (let i = 1; i < height; i++) this.data[this.index(x, y + i, z)] = LOG;
    const top = y + height - 1;
    for (let dy = -2; dy <= 1; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          const lx = x + dx;
          const ly = top + dy;
          const lz = z + dz;
          if (!this.inBounds(lx, ly, lz)) continue;
          if (dx === 0 && dz === 0 && dy <= 0) continue;
          const r = dx * dx + dz * dz + dy * dy * 0.8;
          if (r > 5.4) continue;
          if (r > 3.2 && hash2(lx, ly, lz) > 0.72) continue;
          if (this.data[this.index(lx, ly, lz)] !== AIR) continue;
          this.data[this.index(lx, ly, lz)] = LEAVES;
        }
      }
    }
  }

  scatterPlants() {
    const cx = SX / 2 - 0.5;
    const cz = SZ / 2 - 0.5;
    for (let z = 1; z < SZ - 1; z++) {
      for (let x = 1; x < SX - 1; x++) {
        const dist = Math.hypot(x - cx, z - cz);
        if (dist < 2.4) continue;
        const h = this.surfaceY(x, z);
        if (this.get(x, h, z) !== GRASS) continue;
        if (this.get(x, h + 1, z) !== AIR) continue;
        const r = hash2(x, z, 11);
        let id = 0;
        if (r > 0.93) {
          const k = hash2(x, z, 12);
          id = k > 0.66 ? FLOWER_R : k > 0.33 ? FLOWER_Y : FLOWER_B;
        } else if (r > 0.78) id = TALLGRASS;
        if (id) this.data[this.index(x, h + 1, z)] = id;
      }
    }
  }

  dressMeadow() {
    const spots = [
      [38, 37, LOG],
      [39, 37, LOG],
      [40, 38, LOG],
      [26, 36, STONE],
      [26, 37, COAL],
      [27, 36, COBBLE],
      [36, 28, PLANKS],
      [37, 28, PLANKS],
      [36, 27, PLANKS],
    ];
    for (const [x, z, id] of spots) {
      const h = this.surfaceY(x, z);
      const y = h + 1;
      if (!this.inBounds(x, y, z)) continue;
      if (this.data[this.index(x, y, z)] !== AIR) continue;
      this.data[this.index(x, y, z)] = id;
    }
  }
}

export function boxHitsSolid(world, x, y, z, hw, height) {
  const minX = Math.floor(x - hw);
  const maxX = Math.floor(x + hw - 1e-4);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + height - 1e-4);
  const minZ = Math.floor(z - hw);
  const maxZ = Math.floor(z + hw - 1e-4);
  for (let yy = minY; yy <= maxY; yy++) {
    for (let zz = minZ; zz <= maxZ; zz++) {
      for (let xx = minX; xx <= maxX; xx++) {
        if (world.isSolidAt(xx, yy, zz)) return true;
      }
    }
  }
  return false;
}

/** True when a slightly inset box just under the feet touches solid ground. */
export function isSupported(world, x, y, z, hw) {
  return boxHitsSolid(world, x, y - 0.12, z, Math.max(0.05, hw - 0.05), 0.12);
}

/**
 * Voxel DDA. Returns the first non-air cell, with the face normal pointing
 * back toward the ray origin. Distances are in world units of the direction,
 * which is normalized inside.
 */
export function raycast(world, ox, oy, oz, dx, dy, dz, maxDist, hits = (id) => id !== AIR) {
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-8) return null;
  dx /= len;
  dy /= len;
  dz /= len;

  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);
  if (world.inBounds(x, y, z) && hits(world.get(x, y, z))) {
    return { x, y, z, nx: 0, ny: 0, nz: 0, dist: 0, id: world.get(x, y, z) };
  }

  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;
  const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dz);
  // Distance to the next voxel boundary. An integer coordinate with a negative
  // step yields 0 so the ray steps into the adjacent cell immediately.
  const bound = (s, step) => (step > 0 ? Math.floor(s) + 1 - s : s - Math.floor(s));
  let tMaxX = stepX === 0 ? Infinity : bound(ox, stepX) * tDeltaX;
  let tMaxY = stepY === 0 ? Infinity : bound(oy, stepY) * tDeltaY;
  let tMaxZ = stepZ === 0 ? Infinity : bound(oz, stepZ) * tDeltaZ;

  let nx = 0;
  let ny = 0;
  let nz = 0;
  let dist = 0;
  for (let i = 0; i < 192; i++) {
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      if (tMaxX > maxDist) return null;
      x += stepX;
      dist = tMaxX;
      tMaxX += tDeltaX;
      nx = -stepX;
      ny = 0;
      nz = 0;
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > maxDist) return null;
      y += stepY;
      dist = tMaxY;
      tMaxY += tDeltaY;
      nx = 0;
      ny = -stepY;
      nz = 0;
    } else {
      if (tMaxZ > maxDist) return null;
      z += stepZ;
      dist = tMaxZ;
      tMaxZ += tDeltaZ;
      nx = 0;
      ny = 0;
      nz = -stepZ;
    }
    if (!world.inBounds(x, y, z)) return null;
    const id = world.get(x, y, z);
    if (hits(id)) return { x, y, z, nx, ny, nz, dist, id };
  }
  return null;
}

/** Slab test. Direction does not need to be normalized. Returns t or null. */
export function rayAABB(ox, oy, oz, dx, dy, dz, minX, minY, minZ, maxX, maxY, maxZ, maxT) {
  let tmin = 0;
  let tmax = maxT;
  const origins = [ox, oy, oz];
  const dirs = [dx, dy, dz];
  const mins = [minX, minY, minZ];
  const maxs = [maxX, maxY, maxZ];
  for (let i = 0; i < 3; i++) {
    const o = origins[i];
    const d = dirs[i];
    if (Math.abs(d) < 1e-8) {
      if (o < mins[i] || o > maxs[i]) return null;
      continue;
    }
    let t1 = (mins[i] - o) / d;
    let t2 = (maxs[i] - o) / d;
    if (t1 > t2) {
      const s = t1;
      t1 = t2;
      t2 = s;
    }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  return tmin >= 0 ? tmin : tmax >= 0 ? 0 : null;
}
