import { AIR, LEAVES, isCross, isOpaque, tileForFace } from "./blocks.js";
import { hash2 } from "./hash.js";
import { CHUNK, SY, SZ, SX } from "./world.js";

/**
 * Outward faces, counter-clockwise when viewed against the normal.
 * Winding is checked by test/logic.mjs (triangle 0-1-2 dot normal > 0).
 * uv v=0 is the bottom of a side face so grass pixels stay up.
 */
export const FACES = [
  {
    n: [1, 0, 0],
    verts: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    uv: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  },
  {
    n: [-1, 0, 0],
    verts: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    uv: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  },
  {
    n: [0, 1, 0],
    verts: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    uv: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
  },
  {
    n: [0, -1, 0],
    verts: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    uv: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  },
  {
    n: [0, 0, 1],
    verts: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
    uv: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  },
  {
    n: [0, 0, -1],
    verts: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    uv: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  },
];

const CROSSES = [
  [
    [0, 0, 0],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [1, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
    [1, 1, 0],
  ],
];

function emptyBuffers() {
  return { positions: [], normals: [], uvs: [], colors: [], indices: [] };
}

function writeUV(uvs, tile, u, v) {
  const col = tile % 16;
  const row = (tile / 16) | 0;
  const pad = 0.04;
  const uu = u * (1 - pad * 2) + pad;
  const vv = v * (1 - pad * 2) + pad;
  uvs.push((col + uu) / 16);
  uvs.push(1 - (row + (1 - vv)) / 16);
}

function pushQuad(buf, x, y, z, verts, normal, tile, tint) {
  const base = buf.positions.length / 3;
  for (let i = 0; i < 4; i++) {
    const v = verts[i];
    buf.positions.push(x + v[0], y + v[1], z + v[2]);
    buf.normals.push(normal[0], normal[1], normal[2]);
    const uu = i === 0 || i === 1 ? 0 : 1;
    const vv = i === 1 || i === 2 ? 1 : 0;
    writeUV(buf.uvs, tile, uu, vv);
  }
  buf.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  const c = buf.colors;
  c.push(tint, tint, tint, tint, tint, tint, tint, tint, tint, tint, tint, tint);
}

function quadNormal(verts) {
  const ax = verts[1][0] - verts[0][0];
  const ay = verts[1][1] - verts[0][1];
  const az = verts[1][2] - verts[0][2];
  const bx = verts[2][0] - verts[0][0];
  const by = verts[2][1] - verts[0][1];
  const bz = verts[2][2] - verts[0][2];
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

export function buildChunkGeometry(world, cx, cy, cz) {
  const opaque = emptyBuffers();
  const cutout = emptyBuffers();
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  const z0 = cz * CHUNK;
  const x1 = Math.min(SX, x0 + CHUNK);
  const y1 = Math.min(SY, y0 + CHUNK);
  const z1 = Math.min(SZ, z0 + CHUNK);

  for (let y = y0; y < y1; y++) {
    for (let z = z0; z < z1; z++) {
      for (let x = x0; x < x1; x++) {
        const id = world.get(x, y, z);
        if (id === AIR) continue;
        const tint = 0.9 + hash2(x, z, y + id) * 0.1;
        if (isCross(id)) {
          const tile = tileForFace(id, 0);
          for (const raw of CROSSES) {
            // Reorder to bottom, top, top, bottom so the shared UV rule stays upright.
            const verts = [raw[0], raw[3], raw[2], raw[1]];
            const n = quadNormal(verts);
            const len = Math.hypot(n[0], n[1], n[2]) || 1;
            const normal = [n[0] / len, n[1] / len, n[2] / len];
            pushQuad(cutout, x, y, z, verts, normal, tile, tint);
            const rev = [verts[0], verts[3], verts[2], verts[1]];
            pushQuad(cutout, x, y, z, rev, [-normal[0], -normal[1], -normal[2]], tile, tint);
          }
          continue;
        }
        const leaf = id === LEAVES;
        const dest = leaf ? cutout : opaque;
        for (const face of FACES) {
          const nid = world.get(x + face.n[0], y + face.n[1], z + face.n[2]);
          if (leaf) {
            if (nid === LEAVES || isOpaque(nid)) continue;
          } else if (isOpaque(nid)) continue;
          const tile = tileForFace(id, face.n[1]);
          pushQuad(dest, x, y, z, face.verts, face.n, tile, tint);
        }
      }
    }
  }
  return { opaque, cutout };
}

/** Used by the logic test. Throws if a face triangle points inward. */
export function assertFaceWindings() {
  for (const face of FACES) {
    const n = quadNormal(face.verts);
    const dot = n[0] * face.n[0] + n[1] * face.n[1] + n[2] * face.n[2];
    if (dot <= 0) {
      throw new Error("inward face " + face.n.join(","));
    }
  }
}
