import * as THREE from "three";
import { DIRT, FLOWER_R, GRASS, STONE, isSolid } from "../src/blocks.js";
import { pitchFromDirection, readGroundFrame, yawFromDirection } from "../src/frame.js";
import { assertFaceWindings } from "../src/mesher.js";
import { stepBody } from "../src/physics.js";
import { World, raycast } from "../src/world.js";

const failures = [];
function check(cond, msg) {
  if (!cond) failures.push(msg);
}
function near(a, b, eps = 1e-3) {
  return Math.abs(a - b) < eps;
}

assertFaceWindings();
check(yawFromDirection(0, -1) === 0, "yaw 0 faces -Z");
check(near(yawFromDirection(1, 0), -Math.PI / 2), "yaw facing +X is -pi/2");
check(near(pitchFromDirection(0, 1, 0), Math.PI / 2), "pitch up is +pi/2");

const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
cam.rotation.order = "YXZ";
cam.position.set(0, 2, 0);
cam.rotation.set(0, 0, 0);
cam.updateMatrixWorld(true);
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
readGroundFrame(cam, fwd, right);
check(fwd.distanceTo(new THREE.Vector3(0, 0, -1)) < 0.02, "identity forward " + fwd.toArray());
check(right.distanceTo(new THREE.Vector3(1, 0, 0)) < 0.02, "identity right " + right.toArray());
const look = new THREE.Vector3();
cam.getWorldDirection(look);
check(look.distanceTo(new THREE.Vector3(0, 0, -1)) < 0.02, "camera look -Z " + look.toArray());

cam.rotation.y = yawFromDirection(1, 0);
cam.updateMatrixWorld(true);
cam.getWorldDirection(look);
check(look.x > 0.98 && Math.abs(look.z) < 0.05, "yaw helper faces +X " + look.toArray());
readGroundFrame(cam, fwd, right);
check(fwd.x > 0.98, "ground forward follows camera +X " + fwd.toArray());
check(right.z > 0.98, "ground right is +Z when facing +X " + right.toArray());

cam.rotation.set(0.4, 0, 0);
cam.updateMatrixWorld(true);
cam.getWorldDirection(look);
check(look.y > 0.3, "positive camera pitch looks up " + look.toArray());

const flat = new World(1);
for (let z = 0; z < 24; z++) {
  for (let x = 0; x < 24; x++) flat.set(x, 0, z, DIRT);
}
const tune = {
  speed: 5.55,
  sneakSpeed: 2.15,
  groundAccel: 46,
  airAccel: 11,
  gravity: 28,
  jump: 8.55,
  terminal: 36,
  coyote: 0.12,
};
function bodyAt(x, y, z) {
  return { x, y, z, vx: 0, vy: 0, vz: 0, onGround: true, coyote: 0.12, jumpLock: 0, hw: 0.3, height: 1.8 };
}
const frame = { fx: 0, fz: -1, rx: 1, rz: 0 };
const walker = bodyAt(10.5, 1, 12.5);
for (let i = 0; i < 40; i++) stepBody(flat, walker, 1 / 60, frame, { forward: 1, strafe: 0, jump: false, sneak: false }, tune);
check(walker.z < 11.2, "forward along -Z decreases z (" + walker.z.toFixed(2) + ")");
check(Math.abs(walker.x - 10.5) < 0.15, "forward keeps x (" + walker.x.toFixed(2) + ")");
check(walker.y > 0.9 && walker.y < 1.2, "forward stays on the floor");

const strafer = bodyAt(10.5, 1, 12.5);
for (let i = 0; i < 40; i++) stepBody(flat, strafer, 1 / 60, frame, { forward: 0, strafe: 1, jump: false, sneak: false }, tune);
check(strafer.x > 11.8, "positive strafe increases x (" + strafer.x.toFixed(2) + ")");
check(Math.abs(strafer.z - 12.5) < 0.2, "strafe keeps z");

const jumper = bodyAt(10.5, 1, 12.5);
stepBody(flat, jumper, 1 / 60, frame, { forward: 0, strafe: 0, jump: true, sneak: false }, tune);
check(jumper.y > 1.02 || jumper.vy > 1, "jump leaves the floor");

const ledge = new World(2);
ledge.set(4, 0, 4, DIRT);
const sneaker = bodyAt(4.5, 1, 4.5);
for (let i = 0; i < 90; i++) {
  stepBody(ledge, sneaker, 1 / 60, frame, { forward: 1, strafe: 0, jump: false, sneak: true }, tune);
}
check(sneaker.y > 0.9, "sneak does not walk off (" + sneaker.y.toFixed(2) + ")");
check(sneaker.z > 3.7 && sneaker.z < 4.3, "sneak stops at the edge (" + sneaker.z.toFixed(2) + ")");
const faller = bodyAt(4.5, 1, 4.5);
for (let i = 0; i < 90; i++) {
  stepBody(ledge, faller, 1 / 60, frame, { forward: 1, strafe: 0, jump: false, sneak: false }, tune);
}
check(faller.y < 0.5 || faller.z < 3.7, "unsneaked walk leaves the block (" + faller.y.toFixed(2) + "," + faller.z.toFixed(2) + ")");

const voxels = new World(3);
voxels.set(8, 4, 8, STONE);
let hit = raycast(voxels, 8.5, 4.5, 12, 0, 0, -1, 8);
check(hit && hit.x === 8 && hit.y === 4 && hit.z === 8 && hit.nz === 1, "ray from +Z " + JSON.stringify(hit));
hit = raycast(voxels, 8.5, 9, 8.5, 0, -1, 0, 8);
check(hit && hit.y === 4 && hit.ny === 1, "ray from above " + JSON.stringify(hit));
hit = raycast(voxels, 8.2, 4.2, 8.2, 1, 0, 0, 4);
check(hit && hit.dist === 0 && hit.id === STONE, "ray starts inside solid");
voxels.set(4, 5, 5, STONE);
hit = raycast(voxels, 5, 5.5, 5.5, -1, 0, 0, 3);
check(hit && hit.x === 4 && hit.nx === 1, "negative step on an integer boundary does not skip " + JSON.stringify(hit));
voxels.set(3, 2, 3, FLOWER_R);
hit = raycast(voxels, 3.5, 2.5, 7, 0, 0, -1, 8);
check(hit && hit.id === FLOWER_R, "default ray hits a flower");
hit = raycast(voxels, 3.5, 2.5, 7, 0, 0, -1, 8, isSolid);
check(hit == null, "solid ray passes a flower " + JSON.stringify(hit));

const meadow = new World();
meadow.generate();
const a = meadow.surfaceY(32, 32);
const b = meadow.surfaceY(32, 28);
check(Math.abs(a - b) <= 1, "meadow is flat near spawn (" + a + "," + b + ")");
check(meadow.get(32, a, 32) === GRASS, "spawn surface is grass");
check(meadow.get(32, a + 1, 32) === 0, "air above the meadow center");
check(a >= 10 && a <= 14, "meadow height near 12 (" + a + ")");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("logic ok: " + 22 + " checks");
