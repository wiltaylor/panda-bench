/** Deterministic hash in [0, 1). Coordinates are integer. */
export function hash2(x, y, z = 0) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1440662683);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function noise2(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const v00 = hash2(x0, z0, 1);
  const v10 = hash2(x0 + 1, z0, 1);
  const v01 = hash2(x0, z0 + 1, 1);
  const v11 = hash2(x0 + 1, z0 + 1, 1);
  return (v00 * (1 - sx) + v10 * sx) * (1 - sz) + (v01 * (1 - sx) + v11 * sx) * sz;
}

export function fbm(x, z) {
  return noise2(x, z) * 0.55 + noise2(x * 2.1 + 4, z * 2.1) * 0.3 + noise2(x * 4.3 + 9, z * 4.3) * 0.15;
}

export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
