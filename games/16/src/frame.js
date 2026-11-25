/**
 * Shared yaw for anything whose front is local −Z (Three.js cameras, and the pandas).
 * yaw 0 faces world −Z. Facing +X yields −π/2.
 * Check: yawFromDirection(0, -1) === 0, yawFromDirection(1, 0) === -π/2.
 */
export function yawFromDirection(dx, dz) {
  return Math.atan2(-dx, -dz);
}

/** Positive pitch looks up. Check: pitchFromDirection(0, 1, 0) === π/2. */
export function pitchFromDirection(dx, dy, dz) {
  return Math.atan2(dy, Math.hypot(dx, dz));
}

/**
 * Ground movement basis from the camera matrix, after updateMatrixWorld().
 * Column 0 is screen-right. Forward is up × right.
 * Check: at the identity view, right is (1,0,0) and forward is (0,0,-1).
 * fwd.set(right.z, 0, -right.x) is that cross product for a horizontal right.
 */
export function readGroundFrame(camera, fwd, right) {
  right.setFromMatrixColumn(camera.matrixWorld, 0);
  right.y = 0;
  const len = Math.hypot(right.x, right.z);
  if (len < 1e-6) right.set(1, 0, 0);
  else {
    right.x /= len;
    right.z /= len;
  }
  fwd.set(right.z, 0, -right.x);
}
