import { boxHitsSolid, isSupported } from "./world.js";

/**
 * Move one body against the voxel grid.
 * `frame` is the ground basis from readGroundFrame: fx/fz forward, rx/rz right.
 * Positive input.forward moves along forward. Positive input.strafe moves along right.
 */
export function stepBody(world, body, dt, frame, input, tuning) {
  const wasGround = body.onGround;
  let jumped = false;
  if (input.jump && (wasGround || body.coyote > 0) && body.jumpLock <= 0) {
    body.vy = tuning.jump;
    body.onGround = false;
    body.coyote = 0;
    body.jumpLock = 0.18;
    jumped = true;
  }
  if (body.jumpLock > 0) body.jumpLock -= dt;

  let f = input.forward || 0;
  let s = input.strafe || 0;
  const mag = Math.hypot(f, s);
  if (mag > 1) {
    f /= mag;
    s /= mag;
  }
  const speed = input.sneak ? tuning.sneakSpeed : tuning.speed;
  const wishX = (frame.rx * s + frame.fx * f) * speed;
  const wishZ = (frame.rz * s + frame.fz * f) * speed;
  const accel = wasGround ? tuning.groundAccel : tuning.airAccel;
  const k = 1 - Math.exp(-accel * dt);
  body.vx += (wishX - body.vx) * k;
  body.vz += (wishZ - body.vz) * k;

  const hsp = Math.hypot(body.vx, body.vz);
  const cap = speed * 1.35 + 0.01;
  if (hsp > cap) {
    body.vx = (body.vx / hsp) * cap;
    body.vz = (body.vz / hsp) * cap;
  }

  const blockedX = moveHorizontal(world, body, "x", body.vx * dt, input.sneak && wasGround);
  const blockedZ = moveHorizontal(world, body, "z", body.vz * dt, input.sneak && wasGround);

  const impactVy = body.vy;
  body.vy -= tuning.gravity * dt;
  if (body.vy < -tuning.terminal) body.vy = -tuning.terminal;
  const yBefore = body.y;
  const blockedY = moveVertical(world, body, body.vy * dt);
  if (blockedY && impactVy < 0) body.vy = 0;
  else if (blockedY && body.vy > 0) body.vy = 0;

  const landed = blockedY && impactVy < 0 && body.y <= yBefore + 1e-4;
  body.onGround = body.vy <= 0 && isSupported(world, body.x, body.y, body.z, body.hw);
  if (body.onGround) body.coyote = tuning.coyote;
  else body.coyote -= dt;

  return { blockedX, blockedZ, landed, impactVy, jumped };
}

function overlaps(world, body) {
  return boxHitsSolid(world, body.x, body.y, body.z, body.hw, body.height);
}

function moveHorizontal(world, body, axis, delta, sneak) {
  if (delta === 0) return false;
  const orig = body[axis];
  const allowed = (d) => {
    body[axis] = orig + d;
    if (overlaps(world, body)) return false;
    if (sneak && !isSupported(world, body.x, body.y, body.z, body.hw)) return false;
    return true;
  };
  if (allowed(delta)) return false;
  let lo = 0;
  let hi = delta;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) * 0.5;
    if (allowed(mid)) lo = mid;
    else hi = mid;
  }
  body[axis] = orig + lo;
  return Math.abs(lo) < Math.abs(delta) * 0.35;
}

function moveVertical(world, body, delta) {
  if (delta === 0) return false;
  const orig = body.y;
  body.y = orig + delta;
  if (!overlaps(world, body)) return false;
  let lo = 0;
  let hi = delta;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) * 0.5;
    body.y = orig + mid;
    if (overlaps(world, body)) hi = mid;
    else lo = mid;
  }
  body.y = orig + lo;
  return true;
}

/** Push a body upward out of solid, used if a placed block or a spawn clips it. */
export function unstuck(world, body) {
  if (!overlaps(world, body)) return false;
  const y0 = body.y;
  for (let i = 1; i <= 24; i++) {
    body.y = y0 + i * 0.1;
    if (!overlaps(world, body)) return true;
  }
  body.y = y0;
  return false;
}
