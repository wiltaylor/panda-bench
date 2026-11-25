import * as THREE from "three";
import { createAudio } from "./audio.js";
import {
  BEDROCK,
  COBBLE,
  DIRT,
  LOG,
  PARTICLE_COLOR,
  PLANKS,
  SAND,
  canBreak,
  dropOf,
  hardness,
  isCross,
  isSolid,
  tileForFace,
  toolDamage,
  toolMultiplier,
} from "./blocks.js";
import { pitchFromDirection, readGroundFrame, yawFromDirection } from "./frame.js";
import { buildChunkGeometry } from "./mesher.js";
import { stepBody, unstuck } from "./physics.js";
import {
  makeAtlasCanvas,
  makeBlobCanvas,
  makeCrackCanvases,
  makePineappleCanvas,
  makeSunCanvas,
  makeToolIcons,
} from "./textures.js";
import { LEAVES } from "./blocks.js";
import { SEED, World, chunkCount, raycast } from "./world.js";

const EYE = 1.62;
const REACH = 5;
const MELEE = 3.55;
const MAX_PINES = 28;
const MAX_PART = 320;
const HOTBAR = [
  { kind: "tool", tool: "sword", name: "Stone Sword" },
  { kind: "tool", tool: "pick", name: "Stone Pickaxe" },
  { kind: "tool", tool: "axe", name: "Stone Axe" },
  { kind: "tool", tool: "shovel", name: "Stone Shovel" },
  { kind: "block", id: DIRT, name: "Dirt" },
  { kind: "block", id: COBBLE, name: "Cobblestone" },
  { kind: "block", id: LOG, name: "Oak Log" },
  { kind: "block", id: PLANKS, name: "Oak Planks" },
  { kind: "block", id: SAND, name: "Sand" },
];

const PLAYER_TUNE = {
  speed: 5.55,
  sneakSpeed: 2.15,
  groundAccel: 46,
  airAccel: 11,
  gravity: 28,
  jump: 8.55,
  terminal: 36,
  coyote: 0.12,
};

const PANDA_BASE = {
  sneakSpeed: 2.4,
  groundAccel: 16,
  airAccel: 4,
  gravity: 28,
  jump: 7.7,
  terminal: 30,
  coyote: 0.08,
};

const audio = createAudio();
const keys = new Set();
const stacks = { [DIRT]: 16, [COBBLE]: 8, [LOG]: 6, [PLANKS]: 12, [SAND]: 0 };
const stats = { kills: 0, throws: 0, placed: 0, broken: 0, deflects: 0, hurt: 0 };
const pines = [];
const particles = [];
const floaters = [];
const respawns = [];
const pandas = [];

const world = new World(SEED);
const player = makeBody(32.5, 20, 32.5, 0.3, 1.8);
const spawn = { x: 32.5, y: 14, z: 32.5 };

let mode = "loading";
let yaw = 0;
let pitch = -0.12;
let selected = 0;
let playerHp = 20;
let invuln = 0;
let hurtFlash = 0;
let sinceHurt = 0;
let regen = 0;
let aggroDelay = 99;
let shake = 0;
let bob = 0;
let stepAcc = 0;
let attackCd = 0;
let placeCd = 0;
let deflectWindow = 0;
let swing = 0;
let leftDown = false;
let rightDown = false;
let jumpHeld = false;
let mine = null;
let clink = 0;
let chip = 0;
let lastPlaced = null;
let sensScale = 1;
let invertY = false;
let debugOn = false;
let bannerUntil = 0;
let hintUntil = 0;
let shownWave = 1;
let loopOn = true;
let booted = false;

const stick = { id: null, cx: 0, cy: 0, forward: 0, strafe: 0, on: false };
let lookId = null;
let lookX = 0;
let lookY = 0;
const touchUI = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;

const UP = new THREE.Vector3(0, 1, 0);
const fwdV = new THREE.Vector3();
const rightV = new THREE.Vector3();
const lookV = new THREE.Vector3();
const pandaFwd = new THREE.Vector3();
const pandaRight = new THREE.Vector3();
const dummy = new THREE.Object3D();
const dummyB = new THREE.Object3D();
const proj = new THREE.Vector3();

const canvas = document.getElementById("view");
const hud = document.getElementById("hud");
const menu = document.getElementById("menu");
const pauseEl = document.getElementById("pause");
const deadEl = document.getElementById("dead");
const loadingEl = document.getElementById("loading");
const loadText = document.getElementById("loadtext");
const hearts = document.getElementById("hearts");
const cross = document.getElementById("cross");
const hint = document.getElementById("hint");
const banner = document.getElementById("banner");
const lockHint = document.getElementById("lockhint");
const slotName = document.getElementById("slotname");
const killsEl = document.getElementById("kills");
const waveEl = document.getElementById("wave");
const seedLine = document.getElementById("seedline");
const btnPlace = document.getElementById("btn-place");
const btnBreak = document.getElementById("btn-break");
const btnJump = document.getElementById("btn-jump");
const joystick = document.getElementById("joystick");
const knob = document.getElementById("knob");
const sensInput = document.getElementById("sens");
const invertInput = document.getElementById("invert");
const slotButtons = [];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touchUI, alpha: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touchUI ? 1.5 : 2));
const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 150);
camera.rotation.order = "YXZ";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9e7ff);
scene.fog = new THREE.Fog(0xc9e7ff, 46, 96);
scene.add(new THREE.HemisphereLight(0xd6ecff, 0x6c8a45, 0.92));
const sun = new THREE.DirectionalLight(0xfff2d0, 1.08);
sun.position.set(48, 86, 26);
scene.add(sun);

const chunks = new Map();
let opaqueMat;
let cutoutMat;
let atlasTex;
const crackMeshes = [];
let crackTextures = [];
let selection;
let ghost;
let held;
let sky;
let clouds;
let pineMesh;
let pineLeafMesh;
let partPoints;
let partPos;
let partCol;
const debugGroup = new THREE.Group();
let playerDbg;
const pandaDbgs = [];

function makeBody(x, y, z, hw, height) {
  return { x, y, z, vx: 0, vy: 0, vz: 0, onGround: false, coyote: 0, jumpLock: 0, hw, height };
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function waveNumber() {
  return 1 + Math.floor(stats.kills / 3);
}

function pandaCap() {
  return Math.min(8, 4 + Math.floor(stats.kills / 2));
}

function currentSlot() {
  return HOTBAR[selected];
}

function swordOut() {
  const s = currentSlot();
  return s.kind === "tool" && s.tool === "sword";
}

function toolId() {
  const s = currentSlot();
  return s.kind === "tool" ? s.tool : "block";
}

function loadSettings() {
  try {
    const s = Number(localStorage.getItem("pandacraft-sens"));
    if (s >= 0.5 && s <= 2.2) sensScale = s;
    invertY = localStorage.getItem("pandacraft-invert") === "1";
  } catch (err) {
    /* private mode */
  }
  sensInput.value = String(sensScale);
  invertInput.checked = invertY;
}

function saveSettings() {
  sensScale = Number(sensInput.value);
  invertY = invertInput.checked;
  try {
    localStorage.setItem("pandacraft-sens", String(sensScale));
    localStorage.setItem("pandacraft-invert", invertY ? "1" : "0");
  } catch (err) {
    /* ignore */
  }
}

function makeTexture(canvas, nearest = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  tex.minFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function tileTexture(source, tile) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const col = tile % 16;
  const row = (tile / 16) | 0;
  c.getContext("2d").drawImage(source, col * 16, row * 16, 16, 16, 0, 0, 16, 16);
  return makeTexture(c);
}

function applyGeo(mesh, data) {
  if (mesh.geometry) mesh.geometry.dispose();
  if (!data || data.indices.length === 0) {
    mesh.geometry = new THREE.BufferGeometry();
    mesh.visible = false;
    return;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(data.normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(data.uvs, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(data.colors, 3));
  g.setIndex(new THREE.Uint32BufferAttribute(data.indices, 1));
  g.computeBoundingSphere();
  mesh.geometry = g;
  mesh.visible = true;
}

function rebuildChunk(cx, cy, cz) {
  const key = cx + "," + cy + "," + cz;
  let rec = chunks.get(key);
  if (!rec) {
    rec = {
      opaque: new THREE.Mesh(new THREE.BufferGeometry(), opaqueMat),
      cutout: new THREE.Mesh(new THREE.BufferGeometry(), cutoutMat),
    };
    scene.add(rec.opaque, rec.cutout);
    chunks.set(key, rec);
  }
  const built = buildChunkGeometry(world, cx, cy, cz);
  applyGeo(rec.opaque, built.opaque);
  applyGeo(rec.cutout, built.cutout);
}

function flushDirty() {
  if (world.dirty.size === 0) return;
  const pending = [...world.dirty];
  world.dirty.clear();
  for (const key of pending) {
    const [cx, cy, cz] = key.split(",").map(Number);
    rebuildChunk(cx, cy, cz);
  }
}

function setupScene(atlasCanvas) {
  atlasTex = makeTexture(atlasCanvas);
  opaqueMat = new THREE.MeshLambertMaterial({ map: atlasTex, vertexColors: true });
  cutoutMat = new THREE.MeshLambertMaterial({
    map: atlasTex,
    vertexColors: true,
    alphaTest: 0.45,
    side: THREE.FrontSide,
  });

  const skyGeo = new THREE.SphereGeometry(130, 18, 12);
  const pos = skyGeo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const zenith = new THREE.Color("#3b93d8");
  const horizon = new THREE.Color("#d7eeff");
  const mix = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 130;
    mix.copy(horizon).lerp(zenith, Math.max(0, y) ** 0.55);
    cols[i * 3] = mix.r;
    cols[i * 3 + 1] = mix.g;
    cols[i * 3 + 2] = mix.b;
  }
  skyGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.renderOrder = -2;
  scene.add(sky);

  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 256;
  cloudCanvas.height = 256;
  const cg = cloudCanvas.getContext("2d");
  cg.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) {
    const x = (i * 97) % 220;
    const y = (i * 53) % 200;
    const r = 18 + (i % 5) * 6;
    const g = cg.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    cg.fillStyle = g;
    cg.beginPath();
    cg.arc(x, y, r, 0, Math.PI * 2);
    cg.fill();
  }
  const cloudTex = makeTexture(cloudCanvas, false);
  cloudTex.wrapS = THREE.RepeatWrapping;
  cloudTex.wrapT = THREE.RepeatWrapping;
  cloudTex.repeat.set(4, 4);
  clouds = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: true }),
  );
  clouds.rotation.x = -Math.PI / 2;
  scene.add(clouds);

  const sunSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeTexture(makeSunCanvas(), false), transparent: true, depthWrite: false, fog: false }),
  );
  sunSprite.scale.set(18, 18, 1);
  sunSprite.position.set(70, 90, 40);
  scene.add(sunSprite);

  selection = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
    new THREE.LineBasicMaterial({ color: 0xf4f8ff }),
  );
  selection.visible = false;
  scene.add(selection);

  ghost = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  ghost.visible = false;
  scene.add(ghost);

  crackTextures = makeCrackCanvases().map((c) => makeTexture(c));
  const crack = new THREE.Mesh(
    new THREE.PlaneGeometry(0.99, 0.99),
    new THREE.MeshBasicMaterial({ map: crackTextures[0], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  );
  crack.visible = false;
  scene.add(crack);
  crackMeshes.push(crack);

  const pineTex = makeTexture(makePineappleCanvas());
  const pineMat = new THREE.MeshLambertMaterial({ map: pineTex });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2c8a34 });
  const pineGeo = new THREE.SphereGeometry(0.18, 8, 6);
  const leafGeo = new THREE.ConeGeometry(0.11, 0.2, 6);
  leafGeo.translate(0, 0.16, 0);
  pineMesh = new THREE.InstancedMesh(pineGeo, pineMat, MAX_PINES);
  pineLeafMesh = new THREE.InstancedMesh(leafGeo, leafMat, MAX_PINES);
  pineMesh.count = 0;
  pineLeafMesh.count = 0;
  pineMesh.frustumCulled = false;
  pineLeafMesh.frustumCulled = false;
  scene.add(pineMesh, pineLeafMesh);

  partPos = new Float32Array(MAX_PART * 3);
  partCol = new Float32Array(MAX_PART * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
  pg.setAttribute("color", new THREE.BufferAttribute(partCol, 3));
  pg.setDrawRange(0, 0);
  partPoints = new THREE.Points(
    pg,
    new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, depthWrite: false }),
  );
  partPoints.frustumCulled = false;
  scene.add(partPoints);

  held = new THREE.Group();
  camera.add(held);
  scene.add(camera);
  buildHeldItems(atlasCanvas, pineMat, leafMat);

  const blob = makeTexture(makeBlobCanvas(), false);
  const blobMat = new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false });
  debugGroup.visible = false;
  scene.add(debugGroup);
  const dbgGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  playerDbg = new THREE.LineSegments(dbgGeo, new THREE.LineBasicMaterial({ color: 0x7dffb2 }));
  debugGroup.add(playerDbg);

  return { pineMat, leafMat, blobMat };
}

function buildHeldItems(atlasCanvas, pineMat, leafMat) {
  const brown = new THREE.MeshLambertMaterial({ color: 0x6b3e22 });
  const brownDark = new THREE.MeshLambertMaterial({ color: 0x4a2916 });
  const metal = new THREE.MeshLambertMaterial({ color: 0xd5dbe6 });
  const metalDark = new THREE.MeshLambertMaterial({ color: 0x8d95a6 });
  const gold = new THREE.MeshLambertMaterial({ color: 0xd7a441 });

  function toolRoot() {
    const g = new THREE.Group();
    held.add(g);
    return g;
  }
  const sword = toolRoot();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 0.035), metal);
  blade.position.y = 0.42;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 0.04), metalDark);
  edge.position.set(0.04, 0.42, 0);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.06), gold);
  guard.position.y = 0.18;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), brown);
  handle.position.y = 0.06;
  sword.add(blade, edge, guard, handle);

  const pick = toolRoot();
  const pHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.05), brown);
  pHandle.position.y = 0.2;
  const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.07), metal);
  pHead.position.y = 0.46;
  const pTipL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), metalDark);
  pTipL.position.set(-0.14, 0.4, 0);
  const pTipR = pTipL.clone();
  pTipR.position.x = 0.14;
  pick.add(pHandle, pHead, pTipL, pTipR);

  const axe = toolRoot();
  const aHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.05), brownDark);
  aHandle.position.y = 0.16;
  const aHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.06), metal);
  aHead.position.set(0.08, 0.42, 0);
  axe.add(aHandle, aHead);

  const shovel = toolRoot();
  const sHandle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.045), brown);
  sHandle.position.y = 0.18;
  const sHead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.04), metal);
  sHead.position.y = 0.48;
  shovel.add(sHandle, sHead);

  held.userData.items = { sword, pick, axe, shovel };
  for (const slot of HOTBAR) {
    if (slot.kind !== "block") continue;
    const tile = tileForFace(slot.id, 0);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), new THREE.MeshLambertMaterial({ map: tileTexture(atlasCanvas, tile) }));
    mesh.position.y = 0.16;
    held.add(mesh);
    held.userData.items["b" + slot.id] = mesh;
  }
  void leafMat;
  void pineMat;
}

function showHeld() {
  const items = held.userData.items;
  const slot = currentSlot();
  const key = slot.kind === "tool" ? slot.tool : "b" + slot.id;
  for (const k of Object.keys(items)) items[k].visible = k === key;
}

function makePanda(mats) {
  const white = new THREE.MeshLambertMaterial({ color: 0xf7f7f7 });
  const black = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const noseMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.62, 0.7), white);
  body.position.set(0, 0.78, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.5, 0.52), white);
  head.position.set(0, 1.2, -0.32);
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), black);
  earL.position.set(-0.22, 1.5, -0.32);
  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), black);
  earR.position.set(0.22, 1.5, -0.32);
  const patchL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.05), black);
  patchL.position.set(-0.14, 1.24, -0.58);
  const patchR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.05), black);
  patchR.position.set(0.14, 1.24, -0.58);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.03), white);
  eyeL.position.set(-0.14, 1.25, -0.61);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.03), white);
  eyeR.position.set(0.14, 1.25, -0.61);
  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.032, 0.02), noseMat);
  pupilL.position.set(-0.14, 1.24, -0.64);
  const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.032, 0.02), noseMat);
  pupilR.position.set(0.14, 1.24, -0.64);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), noseMat);
  nose.position.set(0, 1.08, -0.62);
  nose.name = "nose";

  const legGeo = new THREE.BoxGeometry(0.24, 0.4, 0.26);
  function limb(x, y, z, geo, mat) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = -0.2;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  const legL = limb(-0.24, 0.42, -0.12, legGeo, black);
  const legR = limb(0.24, 0.42, -0.12, legGeo, black);
  const backL = limb(-0.24, 0.42, 0.18, legGeo, black);
  const backR = limb(0.24, 0.42, 0.18, legGeo, black);
  const armGeo = new THREE.BoxGeometry(0.22, 0.42, 0.22);
  const armL = limb(-0.58, 0.98, -0.08, armGeo, black);
  const armR = limb(0.58, 0.98, -0.08, armGeo, black);
  const fruit = new THREE.Group();
  const fb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 6), mats.pineMat);
  fb.scale.set(1, 1.3, 1);
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 5), mats.leafMat);
  fl.position.y = 0.12;
  fruit.add(fb, fl);
  fruit.position.set(0.02, -0.28, -0.16);
  fruit.visible = false;
  armR.add(fruit);

  const barCanvas = document.createElement("canvas");
  barCanvas.width = 64;
  barCanvas.height = 8;
  const barTex = new THREE.CanvasTexture(barCanvas);
  barTex.magFilter = THREE.NearestFilter;
  const bar = new THREE.Sprite(new THREE.SpriteMaterial({ map: barTex, transparent: true, depthTest: true }));
  bar.scale.set(0.9, 0.11, 1);
  bar.position.y = 1.78;
  bar.visible = false;

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), mats.blobMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;

  g.add(body, head, earL, earR, patchL, patchR, eyeL, eyeR, pupilL, pupilR, nose, bar);
  scene.add(g, shadow);

  const dbg = new THREE.LineSegments(playerDbg.geometry, new THREE.LineBasicMaterial({ color: 0xff5d6c }));
  debugGroup.add(dbg);
  pandaDbgs.push(dbg);

  return {
    group: g,
    shadow,
    nose,
    bar,
    barCanvas,
    barTex,
    fruit,
    legL,
    legR,
    backL,
    backR,
    armL,
    armR,
    dbg,
    mats: [white, black, noseMat],
    alive: true,
    deadTime: 0,
    hp: 14,
    maxHp: 14,
    hurt: 0,
    flash: 0,
    windup: 0,
    throwCd: 1.2 + Math.random(),
    biteCd: 0.6,
    jumpCd: 0,
    blocked: false,
    stuck: 0,
    sidestep: 0,
    phase: Math.random() * 6,
    wanderA: Math.random() * Math.PI * 2,
    wanderT: 1,
    body: makeBody(0, 0, 0, 0.45, 1.5),
  };
}

function paintBar(p) {
  const g = p.barCanvas.getContext("2d");
  g.clearRect(0, 0, 64, 8);
  g.fillStyle = "#241418";
  g.fillRect(0, 0, 64, 8);
  const f = Math.max(0, p.hp / p.maxHp);
  g.fillStyle = f > 0.45 ? "#43c94a" : "#e23b3b";
  g.fillRect(1, 1, Math.max(0, (62 * f) | 0), 6);
  p.barTex.needsUpdate = true;
  p.bar.visible = p.alive && p.hp < p.maxHp;
}

function spawnPanda(x, z, extraHp = 0) {
  const y = world.surfaceY(x, z) + 1;
  const p = makePanda(scene.userData.mats);
  p.body.x = x;
  p.body.y = y;
  p.body.z = z;
  p.body.onGround = true;
  p.home = { x, y, z };
  p.maxHp = 14 + extraHp;
  p.hp = p.maxHp;
  p.group.position.set(x, y, z);
  pandas.push(p);
  return p;
}

function burst(x, y, z, color, n, speed = 2.5) {
  for (let i = 0; i < n; i++) {
    if (particles.length >= MAX_PART) particles.shift();
    particles.push({
      x, y, z,
      vx: (Math.random() - 0.5) * speed,
      vy: Math.random() * speed * 0.8,
      vz: (Math.random() - 0.5) * speed,
      life: 0.35 + Math.random() * 0.35,
      r: color[0], g: color[1], b: color[2],
    });
  }
}

function floater(text, x, y, z, color) {
  const el = document.createElement("div");
  el.className = "floater";
  el.textContent = text;
  el.style.color = color;
  document.getElementById("floaters").appendChild(el);
  floaters.push({ el, x, y, z, life: 0.85 });
}

function breakBlock(x, y, z, give) {
  const id = world.get(x, y, z);
  if (!canBreak(id)) return false;
  world.set(x, y, z, 0);
  if (give) {
    const drop = dropOf(id);
    if (drop && stacks[drop] != null) stacks[drop] = Math.min(64, stacks[drop] + 1);
  }
  const c = PARTICLE_COLOR[id] || [0.8, 0.8, 0.8];
  burst(x + 0.5, y + 0.5, z + 0.5, c, 12, 3);
  audio.brk();
  stats.broken += 1;
  if (mine && mine.x === x && mine.y === y && mine.z === z) mine = null;
  return true;
}

function blockHitsBody(bx, by, bz, body) {
  return (
    bx < body.x + body.hw &&
    bx + 1 > body.x - body.hw &&
    by < body.y + body.height &&
    by + 1 > body.y &&
    bz < body.z + body.hw &&
    bz + 1 > body.z - body.hw
  );
}

function eyePos() {
  return { x: player.x, y: player.y + EYE, z: player.z };
}

function viewRay() {
  camera.getWorldDirection(lookV);
  const e = eyePos();
  return raycast(world, e.x, e.y, e.z, lookV.x, lookV.y, lookV.z, REACH);
}

function pandaInCone(reach, minDot) {
  camera.getWorldDirection(lookV);
  const e = eyePos();
  let best = null;
  let bestD = reach;
  for (const p of pandas) {
    if (!p.alive) continue;
    const dx = p.body.x - e.x;
    const dy = p.body.y + 0.75 - e.y;
    const dz = p.body.z - e.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > bestD || d < 0.05) continue;
    const dot = (dx * lookV.x + dy * lookV.y + dz * lookV.z) / d;
    if (dot < minDot) continue;
    const wall = raycast(world, e.x, e.y, e.z, dx, dy, dz, d, isSolid);
    if (wall && wall.dist < d - 0.45) continue;
    best = p;
    bestD = d;
  }
  return best ? { panda: best, dist: bestD } : null;
}

function damagePanda(p, dmg) {
  if (!p.alive || p.hurt > 0 || mode !== "play") return;
  p.hp -= dmg;
  p.hurt = 0.38;
  p.flash = 1;
  const dx = p.body.x - player.x;
  const dz = p.body.z - player.z;
  const len = Math.hypot(dx, dz) || 1;
  p.body.vx += (dx / len) * 6.5;
  p.body.vz += (dz / len) * 6.5;
  p.body.vy = Math.max(p.body.vy, 3.4);
  audio.hit();
  floater("-" + dmg, p.body.x, p.body.y + 1.6, p.body.z, "#ffe27a");
  paintBar(p);
  if (p.hp <= 0) killPanda(p);
}

function killPanda(p) {
  p.alive = false;
  p.deadTime = 0;
  p.bar.visible = false;
  p.fruit.visible = false;
  stats.kills += 1;
  audio.death();
  burst(p.body.x, p.body.y + 0.8, p.body.z, [0.95, 0.95, 0.95], 10, 3);
  burst(p.body.x, p.body.y + 0.6, p.body.z, [0.1, 0.1, 0.1], 6, 2);
  respawns.push(4.5);
  const wave = waveNumber();
  if (wave !== shownWave) {
    shownWave = wave;
    showBanner("Wave " + wave);
  }
  refreshScore();
}

function hurtPlayer(amount, kx, kz) {
  if (mode !== "play" || invuln > 0 || playerHp <= 0) return;
  if (swordOut() && rightDown) amount = Math.max(1, Math.round(amount * 0.25));
  playerHp = Math.max(0, playerHp - amount);
  invuln = 0.72;
  hurtFlash = 1;
  sinceHurt = 0;
  shake = Math.min(0.55, shake + 0.28);
  stats.hurt += 1;
  audio.hurt();
  try {
    if (navigator.vibrate) navigator.vibrate(28);
  } catch (err) {
    /* some browsers throw */
  }
  const len = Math.hypot(kx, kz) || 1;
  player.vx += (kx / len) * 6;
  player.vz += (kz / len) * 6;
  player.vy = Math.max(player.vy, 4.2);
  drawHearts();
  if (playerHp <= 0) die();
}

function die() {
  playerHp = 0;
  const lines = ["A pineapple found you.", "The pandas win this round.", "You were fruit-sniped.", "That one had your name on it."];
  document.getElementById("deathtext").textContent = lines[(Math.random() * lines.length) | 0];
  drawHearts();
  setMode("dead");
}

function deflectPines(minDot, reach) {
  if (!swordOut()) return;
  camera.getWorldDirection(lookV);
  const ox = player.x;
  const oy = player.y + 1.15;
  const oz = player.z;
  for (const pine of pines) {
    if (pine.returning) continue;
    const dx = pine.x - ox;
    const dy = pine.y - oy;
    const dz = pine.z - oz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > reach || dist < 0.05) continue;
    const dot = (dx * lookV.x + dy * lookV.y + dz * lookV.z) / dist;
    if (dot < minDot) continue;
    pine.vx = lookV.x * 16;
    pine.vy = lookV.y * 16 + 1.4;
    pine.vz = lookV.z * 16;
    pine.returning = true;
    pine.life = 2.1;
    stats.deflects += 1;
    audio.deflect();
    floater("Returned", pine.x, pine.y, pine.z, "#fff1a8");
  }
}

function tryPlace() {
  const slot = currentSlot();
  if (slot.kind !== "block") return false;
  const have = stacks[slot.id] | 0;
  if (have <= 0) return false;
  camera.getWorldDirection(lookV);
  const e = eyePos();
  const hit = raycast(world, e.x, e.y, e.z, lookV.x, lookV.y, lookV.z, REACH);
  if (!hit || (hit.nx === 0 && hit.ny === 0 && hit.nz === 0)) return false;
  const px = hit.x + hit.nx;
  const py = hit.y + hit.ny;
  const pz = hit.z + hit.nz;
  if (!world.inBounds(px, py, pz) || world.get(px, py, pz) !== 0) return false;
  if (blockHitsBody(px, py, pz, player)) return false;
  for (const p of pandas) {
    if (p.alive && blockHitsBody(px, py, pz, p.body)) return false;
  }
  world.set(px, py, pz, slot.id);
  stacks[slot.id] = have - 1;
  lastPlaced = { x: px, y: py, z: pz };
  stats.placed += 1;
  audio.place();
  const c = PARTICLE_COLOR[slot.id];
  burst(px + 0.5, py + 0.5, pz + 0.5, c, 6, 1.4);
  return true;
}

function combat(dt) {
  const guarding = swordOut() && rightDown;
  camera.getWorldDirection(lookV);
  const blockHit = viewRay();
  const melee = pandaInCone(MELEE, 0.78);
  if (leftDown) {
    const hitPanda = melee && (!blockHit || melee.dist < blockHit.dist - 0.05);
    if (hitPanda) {
      mine = null;
      if (attackCd <= 0) {
        damagePanda(melee.panda, toolDamage(toolId()));
        attackCd = 0.42;
        startSwing();
        deflectWindow = 0.2;
      }
    } else if (blockHit && blockHit.dist <= REACH && canBreak(blockHit.id)) {
      const key = blockHit.x + "," + blockHit.y + "," + blockHit.z;
      if (!mine || mine.key !== key) mine = { key, x: blockHit.x, y: blockHit.y, z: blockHit.z, id: blockHit.id, progress: 0, hit: blockHit };
      if (world.get(mine.x, mine.y, mine.z) !== mine.id) mine = null;
      else {
        const time = hardness(mine.id) / toolMultiplier(toolId(), mine.id);
        mine.progress += dt / time;
        mine.hit = blockHit;
        chip -= dt;
        if (chip <= 0) {
          chip = 0.12;
          const c = PARTICLE_COLOR[mine.id] || [1, 1, 1];
          burst(mine.x + 0.5, mine.y + 0.5, mine.z + 0.5, c, 2, 1.5);
        }
        if (mine.progress >= 1) breakBlock(mine.x, mine.y, mine.z, true);
        if (attackCd <= 0) {
          attackCd = 0.34;
          startSwing();
          deflectWindow = 0.12;
        }
      }
    } else if (blockHit && blockHit.id === BEDROCK) {
      mine = null;
      clink -= dt;
      if (clink <= 0) {
        clink = 0.35;
        audio.clink();
      }
    } else {
      mine = null;
      if (attackCd <= 0) {
        attackCd = 0.42;
        startSwing();
        deflectWindow = 0.2;
        const close = pandaInCone(2.3, 0.55);
        if (close) damagePanda(close.panda, toolDamage(toolId()));
      }
    }
  } else {
    mine = null;
  }
  if (guarding) deflectPines(0.32, 2.55);
  else if (deflectWindow > 0) deflectPines(0.58, 2.15);
  if (!guarding && rightDown && currentSlot().kind === "block" && placeCd <= 0) {
    if (tryPlace()) placeCd = 0.18;
  }
  attackCd = Math.max(0, attackCd - dt);
  placeCd = Math.max(0, placeCd - dt);
  deflectWindow = Math.max(0, deflectWindow - dt);
  updateAim(blockHit, melee, guarding);
}

function updateAim(blockHit, melee, guarding) {
  cross.classList.toggle("enemy", Boolean(melee));
  cross.classList.toggle("guard", guarding);
  selection.visible = false;
  ghost.visible = false;
  crackMeshes[0].visible = false;
  if (mode !== "play") return;
  if (blockHit && blockHit.nx + blockHit.ny + blockHit.nz !== 0) {
    selection.visible = true;
    selection.position.set(blockHit.x + 0.5, blockHit.y + 0.5, blockHit.z + 0.5);
    const slot = currentSlot();
    if (slot.kind === "block" && (stacks[slot.id] | 0) > 0) {
      const px = blockHit.x + blockHit.nx;
      const py = blockHit.y + blockHit.ny;
      const pz = blockHit.z + blockHit.nz;
      const free = world.inBounds(px, py, pz) && world.get(px, py, pz) === 0 && !blockHitsBody(px, py, pz, player);
      ghost.visible = true;
      ghost.position.set(px + 0.5, py + 0.5, pz + 0.5);
      ghost.material.color.set(free ? 0xffffff : 0xff665f);
    }
  }
  if (mine && mine.progress > 0) {
    const stage = Math.min(4, Math.floor(mine.progress * 5));
    const crack = crackMeshes[0];
    crack.material.map = crackTextures[stage];
    crack.visible = true;
    const h = mine.hit;
    crack.position.set(h.x + 0.5 + h.nx * 0.51, h.y + 0.5 + h.ny * 0.51, h.z + 0.5 + h.nz * 0.51);
    crack.rotation.set(0, 0, 0);
    if (h.nx === 1) crack.rotation.y = Math.PI / 2;
    else if (h.nx === -1) crack.rotation.y = -Math.PI / 2;
    else if (h.ny === 1) crack.rotation.x = -Math.PI / 2;
    else if (h.ny === -1) crack.rotation.x = Math.PI / 2;
    else if (h.nz === -1) crack.rotation.y = Math.PI;
  }
}

function startSwing() {
  swing = 0.001;
  audio.swing();
}

function launchFrom(p) {
  p.group.updateMatrixWorld(true);
  const from = new THREE.Vector3();
  p.fruit.getWorldPosition(from);
  const speed = 8.4 + Math.min(3, (waveNumber() - 1) * 0.4);
  const dx = player.x + player.vx * 0.22 - from.x;
  const dy = player.y + 1.05 - from.y;
  const dz = player.z + player.vz * 0.22 - from.z;
  const distH = Math.hypot(dx, dz);
  const time = Math.min(1.65, Math.max(0.42, distH / speed));
  const g = 16;
  let vy = (dy + 0.5 * g * time * time) / time;
  vy = Math.max(-1, Math.min(13, vy));
  pines.push({
    x: from.x, y: from.y, z: from.z,
    vx: dx / time, vy, vz: dz / time,
    life: 4.2, returning: false, spin: Math.random() * 4,
  });
  if (pines.length > MAX_PINES) pines.shift();
  stats.throws += 1;
  audio.toss();
  audio.panda();
}

function updatePandas(dt) {
  const allow = mode === "play" && aggroDelay <= 0;
  const speed = Math.min(4.25, 2.35 + (waveNumber() - 1) * 0.18);
  for (const p of pandas) {
    if (!p.alive) {
      p.deadTime += dt;
      p.group.rotation.z = Math.min(1.25, p.deadTime * 2.5);
      p.group.position.y -= dt * 0.25;
      p.shadow.visible = false;
      continue;
    }
    const dx = player.x - p.body.x;
    const dz = player.z - p.body.z;
    const dist = Math.hypot(dx, dz);
    let fx = dx;
    let fz = dz;
    if (!allow || dist > 26) {
      p.wanderT -= dt;
      if (p.wanderT <= 0) {
        p.wanderA = Math.random() * Math.PI * 2;
        p.wanderT = 1.4 + Math.random() * 2.2;
      }
      fx = Math.sin(p.wanderA);
      fz = Math.cos(p.wanderA);
    }
    if (fx * fx + fz * fz > 1e-6) p.group.rotation.y = yawFromDirection(fx, fz);
    p.group.position.set(p.body.x, p.body.y, p.body.z);
    p.group.rotation.z = 0;
    p.group.rotation.x = 0;
    pandaFwd.set(0, 0, -1).applyQuaternion(p.group.quaternion);
    pandaFwd.y = 0;
    if (pandaFwd.lengthSq() < 1e-6) pandaFwd.set(0, 0, -1);
    else pandaFwd.normalize();
    pandaRight.crossVectors(pandaFwd, UP);
    let forward = 0;
    if (p.windup > 0) forward = 0;
    else if (allow && dist < 30 && dist > 1.45) forward = 1;
    else if (!allow) forward = 0.45;
    if (p.blocked) p.stuck += dt;
    else p.stuck = Math.max(0, p.stuck - dt * 0.5);
    const strafe = p.stuck > 0.45 ? (p.sidestep || (p.sidestep = Math.random() < 0.5 ? -1 : 1)) : 0;
    if (p.stuck < 0.3) p.sidestep = 0;
    const wantJump = p.windup <= 0 && p.blocked && p.body.onGround && p.jumpCd <= 0;
    if (wantJump) p.jumpCd = 0.5;
    const result = stepBody(
      world,
      p.body,
      dt,
      { fx: pandaFwd.x, fz: pandaFwd.z, rx: pandaRight.x, rz: pandaRight.z },
      { forward, strafe, jump: wantJump, sneak: false },
      { ...PANDA_BASE, speed, sneakSpeed: speed * 0.7 },
    );
    p.blocked = result.blockedX || result.blockedZ;
    if (p.jumpCd > 0) p.jumpCd -= dt;
    unstuck(world, p.body);
    if (p.stuck > 2.8) {
      const spot = randomSpot();
      if (spot) {
        p.body.x = spot.x;
        p.body.y = spot.y;
        p.body.z = spot.z;
        p.body.vx = 0;
        p.body.vz = 0;
      }
      p.stuck = 0;
    }
    separate(p);
    const moving = Math.hypot(p.body.vx, p.body.vz);
    p.phase += dt * (moving > 0.4 ? 8 : 2);
    const sw = Math.sin(p.phase) * Math.min(1, moving / 2);
    p.legL.rotation.x = sw * 0.8;
    p.legR.rotation.x = -sw * 0.8;
    p.backL.rotation.x = -sw * 0.55;
    p.backR.rotation.x = sw * 0.55;
    p.armL.rotation.x = -sw * 0.45;
    if (allow && p.windup <= 0 && p.throwCd <= 0 && dist < 12.5 && dist > 3.3 && hasLos(p)) p.windup = 0.46;
    if (p.windup > 0) {
      p.windup -= dt;
      p.fruit.visible = true;
      p.armR.rotation.x = 2.15 * (1 - Math.max(0, p.windup) / 0.46);
      if (p.windup <= 0) {
        launchFrom(p);
        p.throwCd = Math.max(1.05, 2.35 - (waveNumber() - 1) * 0.18);
        p.fruit.visible = false;
      }
    } else {
      p.throwCd -= dt;
      p.fruit.visible = false;
      p.armR.rotation.x = sw * 0.45;
    }
    if (allow && dist < 1.65 && Math.abs(player.y - p.body.y) < 2.2 && p.biteCd <= 0) {
      p.biteCd = 1.15;
      audio.bite();
      hurtPlayer(4, player.x - p.body.x, player.z - p.body.z);
    }
    if (p.biteCd > 0) p.biteCd -= dt;
    if (p.hurt > 0) p.hurt -= dt;
    p.flash = Math.max(0, p.flash - dt * 3);
    for (const m of p.mats) m.emissive.setRGB(p.flash * 0.75, p.flash * 0.08, p.flash * 0.08);
    p.group.position.set(p.body.x, p.body.y, p.body.z);
    const gy = groundTop(p.body.x, p.body.y, p.body.z);
    p.shadow.visible = true;
    p.shadow.position.set(p.body.x, gy, p.body.z);
    paintBar(p);
  }
  for (let i = pandas.length - 1; i >= 0; i--) {
    const p = pandas[i];
    if (!p.alive && p.deadTime > 1.05) {
      scene.remove(p.group);
      scene.remove(p.shadow);
      debugGroup.remove(p.dbg);
      const di = pandaDbgs.indexOf(p.dbg);
      if (di >= 0) pandaDbgs.splice(di, 1);
      pandas.splice(i, 1);
    }
  }
  for (let i = respawns.length - 1; i >= 0; i--) {
    respawns[i] -= dt;
    if (respawns[i] <= 0) {
      respawns.splice(i, 1);
      if (pandas.filter((p) => p.alive).length < pandaCap()) {
        const spot = randomSpot();
        if (spot) spawnPanda(spot.x, spot.z, waveNumber() - 1);
      }
    }
  }
}

function separate(p) {
  for (const o of pandas) {
    if (o === p || !o.alive) continue;
    const dx = p.body.x - o.body.x;
    const dz = p.body.z - o.body.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.001 && d < 0.95) {
      p.body.x += (dx / d) * 0.05;
      p.body.z += (dz / d) * 0.05;
    }
  }
}

function hasLos(p) {
  const ox = p.body.x;
  const oy = p.body.y + 1.15;
  const oz = p.body.z;
  const dx = player.x - ox;
  const dy = player.y + 1.1 - oy;
  const dz = player.z - oz;
  const dist = Math.hypot(dx, dy, dz);
  const hit = raycast(world, ox, oy, oz, dx, dy, dz, dist, isSolid);
  return !hit || hit.dist > dist - 0.55;
}

function groundTop(x, y, z) {
  for (let yy = Math.floor(y); yy >= 0; yy--) {
    if (world.isSolidAt(Math.floor(x), yy, Math.floor(z))) return yy + 1.03;
  }
  return 0.03;
}

function randomSpot() {
  for (let k = 0; k < 14; k++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 12;
    const x = player.x + Math.sin(ang) * dist;
    const z = player.z + Math.cos(ang) * dist;
    if (x < 4 || z < 4 || x > 60 || z > 60) continue;
    const y = world.surfaceY(x, z) + 1;
    if (world.isSolidAt(Math.floor(x), y, Math.floor(z))) continue;
    if (world.isSolidAt(Math.floor(x), y + 1, Math.floor(z))) continue;
    return { x, y, z };
  }
  return null;
}

function pineappleHitsPanda(x, y, z) {
  for (const p of pandas) {
    if (!p.alive) continue;
    const dx = Math.max(p.body.x - p.body.hw - 0.1, Math.min(x, p.body.x + p.body.hw + 0.1)) - x;
    const dy = Math.max(p.body.y, Math.min(y, p.body.y + p.body.height)) - y;
    const dz = Math.max(p.body.z - p.body.hw - 0.1, Math.min(z, p.body.z + p.body.hw + 0.1)) - z;
    if (dx * dx + dy * dy + dz * dz < 0.08) return p;
  }
  return null;
}

function hitsPlayer(x, y, z) {
  const dx = Math.max(player.x - player.hw, Math.min(x, player.x + player.hw)) - x;
  const dy = Math.max(player.y, Math.min(y, player.y + player.height)) - y;
  const dz = Math.max(player.z - player.hw, Math.min(z, player.z + player.hw)) - z;
  return dx * dx + dy * dy + dz * dz < 0.06;
}

function updatePines(dt) {
  const g = 16;
  for (let i = pines.length - 1; i >= 0; i--) {
    const pine = pines[i];
    pine.life -= dt;
    pine.spin += dt * 7;
    let alive = pine.life > 0 && pine.y > -2;
    const steps = Math.max(1, Math.ceil((Math.hypot(pine.vx, pine.vy, pine.vz) * dt) / 0.22));
    const h = dt / steps;
    for (let s = 0; s < steps && alive; s++) {
      pine.vy -= g * h;
      const nx = pine.x + pine.vx * h;
      const ny = pine.y + pine.vy * h;
      const nz = pine.z + pine.vz * h;
      if (pine.returning) {
        const hit = pineappleHitsPanda(nx, ny, nz);
        if (hit) {
          damagePanda(hit, 5);
          burst(nx, ny, nz, [0.95, 0.78, 0.2], 8, 2);
          alive = false;
          break;
        }
      } else if (mode === "play" && hitsPlayer(nx, ny, nz)) {
        hurtPlayer(4, pine.vx, pine.vz);
        burst(nx, ny, nz, [0.95, 0.78, 0.2], 8, 2);
        alive = false;
        break;
      }
      const ix = Math.floor(nx);
      const iy = Math.floor(ny);
      const iz = Math.floor(nz);
      if (world.isSolidAt(ix, iy, iz)) {
        const id = world.get(ix, iy, iz);
        if (isCross(id) || id === LEAVES) breakBlock(ix, iy, iz, false);
        burst(pine.x, pine.y, pine.z, [0.93, 0.76, 0.18], 8, 2.2);
        alive = false;
        break;
      }
      pine.x = nx;
      pine.y = ny;
      pine.z = nz;
    }
    if (!alive) pines.splice(i, 1);
  }
  const n = Math.min(MAX_PINES, pines.length);
  pineMesh.count = n;
  pineLeafMesh.count = n;
  for (let i = 0; i < n; i++) {
    const p = pines[i];
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(p.spin * 0.4, p.spin, 0);
    dummy.scale.set(1, 1.35, 1);
    dummy.updateMatrix();
    pineMesh.setMatrixAt(i, dummy.matrix);
    dummyB.position.set(p.x, p.y + 0.2, p.z);
    dummyB.rotation.set(0, p.spin, 0);
    dummyB.scale.set(1, 1, 1);
    dummyB.updateMatrix();
    pineLeafMesh.setMatrixAt(i, dummyB.matrix);
  }
  pineMesh.instanceMatrix.needsUpdate = true;
  pineLeafMesh.instanceMatrix.needsUpdate = true;
  if (n === 0) {
    pineMesh.visible = false;
    pineLeafMesh.visible = false;
  } else {
    pineMesh.visible = true;
    pineLeafMesh.visible = true;
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.vy -= 9 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
  }
  const n = particles.length;
  for (let i = 0; i < n; i++) {
    const p = particles[i];
    partPos[i * 3] = p.x;
    partPos[i * 3 + 1] = p.y;
    partPos[i * 3 + 2] = p.z;
    partCol[i * 3] = p.r;
    partCol[i * 3 + 1] = p.g;
    partCol[i * 3 + 2] = p.b;
  }
  partPoints.geometry.setDrawRange(0, n);
  partPoints.geometry.attributes.position.needsUpdate = true;
  partPoints.geometry.attributes.color.needsUpdate = true;
  partPoints.visible = n > 0;
}

function updateFloaters(dt) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt;
    f.y += dt * 0.7;
    if (f.life <= 0) {
      f.el.remove();
      floaters.splice(i, 1);
      continue;
    }
    proj.set(f.x, f.y, f.z).project(camera);
    if (proj.z > 1) {
      f.el.style.display = "none";
      continue;
    }
    f.el.style.display = "block";
    f.el.style.left = (proj.x * 0.5 + 0.5) * w + "px";
    f.el.style.top = (-proj.y * 0.5 + 0.5) * h + "px";
    f.el.style.opacity = String(Math.min(1, f.life * 2));
  }
}

function readMoveInput() {
  let forward = 0;
  let strafe = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) forward += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) forward -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) strafe += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) strafe -= 1;
  if (stick.on) {
    forward += stick.forward;
    strafe += stick.strafe;
  }
  return {
    forward,
    strafe,
    jump: keys.has("Space") || jumpHeld,
    sneak: keys.has("ShiftLeft") || keys.has("ShiftRight"),
  };
}

function applyLookToCamera() {
  camera.rotation.order = "YXZ";
  camera.rotation.x = pitch;
  camera.rotation.y = yaw;
  camera.rotation.z = 0;
}

function addLook(dx, dy) {
  const scale = sensScale * (touchUI ? 0.0054 : 0.00215);
  yaw -= dx * scale;
  pitch -= dy * scale * (invertY ? -1 : 1);
  const lim = Math.PI / 2 - 0.02;
  if (pitch > lim) pitch = lim;
  if (pitch < -lim) pitch = -lim;
}

function updateHand(dt, moving) {
  showHeld();
  if (swing > 0) {
    swing += dt / 0.2;
    if (swing >= 1) swing = 0;
  }
  const s = swing > 0 ? Math.sin(Math.min(1, swing) * Math.PI) : 0;
  const guarding = swordOut() && rightDown && mode === "play";
  bob += dt * (moving ? 9 : 0);
  if (guarding) {
    held.position.set(0.16, -0.22, -0.48);
    held.rotation.set(-0.25, 0.55, 0.2);
  } else {
    held.position.set(0.46 + Math.cos(bob * 0.5) * (moving ? 0.02 : 0), -0.4 + Math.sin(bob) * (moving ? 0.03 : 0), -0.68);
    held.rotation.set(-0.15 - s * 1.15, 0.2 + s * 0.35, -0.45);
  }
  held.visible = mode === "play";
}

function updatePlay(dt) {
  aggroDelay = Math.max(0, aggroDelay - dt);
  invuln = Math.max(0, invuln - dt);
  hurtFlash = Math.max(0, hurtFlash - dt * 1.4);
  sinceHurt += dt;
  applyLookToCamera();
  camera.position.set(player.x, player.y + EYE, player.z);
  camera.updateMatrixWorld(true);
  readGroundFrame(camera, fwdV, rightV);
  const frame = { fx: fwdV.x, fz: fwdV.z, rx: rightV.x, rz: rightV.z };
  const input = readMoveInput();
  const guarding = swordOut() && rightDown;
  const tune = guarding ? { ...PLAYER_TUNE, speed: 2.35, sneakSpeed: 1.5 } : PLAYER_TUNE;
  const result = stepBody(world, player, dt, frame, input, tune);
  if (result.jumped) audio.jump();
  unstuck(world, player);
  if (result.landed && result.impactVy < -15) {
    const dmg = Math.floor((-result.impactVy - 15) * 1.35);
    if (dmg > 0) hurtPlayer(dmg, 0, 0);
  }
  const moving = player.onGround && Math.hypot(input.forward, input.strafe) > 0.15;
  if (moving) {
    stepAcc += dt;
    if (stepAcc > (input.sneak ? 0.58 : 0.4)) {
      stepAcc = 0;
      const under = world.get(Math.floor(player.x), Math.floor(player.y - 0.2), Math.floor(player.z));
      audio.step(under === 3 || under === 4 || under === 9 || under === 10);
    }
  }
  if (sinceHurt > 8 && playerHp > 0 && playerHp < 20 && mode === "play") {
    regen += dt;
    if (regen > 2.4) {
      regen = 0;
      playerHp += 1;
      drawHearts();
    }
  } else regen = 0;
  camera.position.set(player.x, player.y + EYE + (moving ? Math.sin(bob) * 0.03 : 0), player.z);
  if (shake > 0) {
    camera.position.x += (Math.random() - 0.5) * shake * 0.18;
    camera.position.y += (Math.random() - 0.5) * shake * 0.18;
    shake *= Math.exp(-7 * dt);
  }
  camera.updateMatrixWorld(true);
  combat(dt);
  updatePandas(dt);
  updatePines(dt);
  updateParticles(dt);
  updateHand(dt, moving);
  updateFloaters(dt);
  if (performance.now() > bannerUntil) banner.classList.remove("show");
  if (performance.now() > hintUntil) hint.classList.remove("show");
  const v = Math.max(hurtFlash * 0.62, playerHp > 0 && playerHp <= 6 ? 0.22 : 0);
  document.getElementById("hud").style.setProperty("--hurt", String(v));
  refreshHotbar();
  updateDebug();
}

function updateMenu(dt) {
  const t = performance.now() * 0.00018;
  camera.position.set(spawn.x + Math.sin(t) * 6.2, spawn.y + 3.4, spawn.z + Math.cos(t) * 6.2);
  camera.lookAt(spawn.x, spawn.y + 1.1, spawn.z);
  updatePandas(dt);
  updatePines(dt);
  updateParticles(dt);
  held.visible = false;
}

function update(dt) {
  sky.position.copy(camera.position);
  clouds.position.set(camera.position.x, 40, camera.position.z);
  clouds.material.map.offset.x += dt * 0.004;
  if (mode === "menu") updateMenu(dt);
  else if (mode === "play") updatePlay(dt);
  flushDirty();
  const locked = document.pointerLockElement === canvas;
  lockHint.classList.toggle("show", mode === "play" && !touchUI && !locked);
  cross.classList.toggle("on", mode === "play");
}

function updateDebug() {
  debugGroup.visible = debugOn;
  if (!debugOn) return;
  playerDbg.scale.set(player.hw * 2, player.height, player.hw * 2);
  playerDbg.position.set(player.x, player.y + player.height / 2, player.z);
  pandas.forEach((p, i) => {
    const box = pandaDbgs[i];
    if (!box) return;
    box.visible = p.alive;
    box.scale.set(p.body.hw * 2, p.body.height, p.body.hw * 2);
    box.position.set(p.body.x, p.body.y + p.body.height / 2, p.body.z);
  });
}

function drawHearts() {
  const g = hearts.getContext("2d");
  g.clearRect(0, 0, hearts.width, hearts.height);
  const pattern = ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000"];
  for (let i = 0; i < 10; i++) {
    const full = playerHp >= (i + 1) * 2;
    const half = !full && playerHp >= i * 2 + 1;
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < 8; x++) {
        if (pattern[y][x] !== "1") continue;
        const on = full || (half && x < 4);
        g.fillStyle = on ? "#e23b4a" : "#4a1c22";
        g.fillRect(i * 18 + x * 2, y * 2, 2, 2);
      }
    }
  }
}

function drawSlotIcon(canvasEl, index) {
  const g = canvasEl.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, 16, 16);
  const slot = HOTBAR[index];
  if (slot.kind === "tool") g.drawImage(scene.userData.icons[slot.tool], 0, 0);
  else {
    const tile = tileForFace(slot.id, 0);
    const col = tile % 16;
    const row = (tile / 16) | 0;
    g.drawImage(scene.userData.atlas, col * 16, row * 16, 16, 16, 0, 0, 16, 16);
  }
}

function buildHotbar() {
  const root = document.getElementById("hotbar");
  HOTBAR.forEach((slot, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.setAttribute("aria-label", slot.name);
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 16;
    const count = document.createElement("span");
    count.className = "count";
    const key = document.createElement("span");
    key.className = "keycap";
    key.textContent = String(i + 1);
    btn.append(c, count, key);
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectSlot(i);
    });
    root.appendChild(btn);
    slotButtons.push(btn);
    drawSlotIcon(c, i);
  });
}

function selectSlot(i) {
  selected = ((i % 9) + 9) % 9;
  refreshHotbar();
}

function refreshHotbar() {
  slotButtons.forEach((el, i) => {
    el.classList.toggle("selected", i === selected);
    const slot = HOTBAR[i];
    const count = el.querySelector(".count");
    if (slot.kind === "block") {
      count.textContent = String(stacks[slot.id] | 0);
      el.classList.toggle("empty", !(stacks[slot.id] > 0));
    } else {
      count.textContent = "";
      el.classList.remove("empty");
    }
    el.setAttribute("aria-pressed", i === selected ? "true" : "false");
  });
  const slot = currentSlot();
  slotName.textContent = slot.name;
  const label = btnPlace.querySelector("span");
  label.textContent = swordOut() ? "Guard" : "Place";
}

function refreshScore() {
  killsEl.textContent = "Pandas routed " + stats.kills;
  waveEl.textContent = "Wave " + waveNumber();
}

function showBanner(text) {
  banner.textContent = text;
  banner.classList.add("show");
  bannerUntil = performance.now() + 2200;
}

function showHint(text, ms) {
  hint.textContent = text;
  hint.classList.add("show");
  hintUntil = performance.now() + ms;
}

function resize() {
  const w = window.innerWidth;
  const h = Math.max(1, window.innerHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function setMode(next) {
  const prev = mode;
  mode = next;
  menu.hidden = mode !== "menu";
  pauseEl.hidden = mode !== "pause";
  deadEl.hidden = mode !== "dead";
  hud.hidden = mode !== "play";
  if (mode !== "play") {
    keys.clear();
    leftDown = false;
    rightDown = false;
    jumpHeld = false;
    stick.on = false;
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
  }
  if (next === "play" && prev === "menu") {
    aggroDelay = 1.5;
    invuln = 1.5;
    yaw = 0;
    pitch = -0.12;
    showHint("Break and place blocks for cover. Sword swings hurt pandas. Hold Place with the sword out to guard and return pineapples.", 9500);
  }
}

function resetSpawn() {
  player.x = spawn.x;
  player.y = spawn.y;
  player.z = spawn.z;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.onGround = true;
  player.coyote = 0.12;
  player.jumpLock = 0;
  yaw = 0;
  pitch = -0.12;
}

function aimAt(x, y, z) {
  yaw = yawFromDirection(x - player.x, z - player.z);
  pitch = pitchFromDirection(x - player.x, y - (player.y + EYE), z - player.z);
}

function respawnPlayer() {
  playerHp = 20;
  resetSpawn();
  invuln = 2.6;
  hurtFlash = 0;
  pines.length = 0;
  for (const p of pandas) {
    if (!p.alive) continue;
    const dx = p.body.x - spawn.x;
    const dz = p.body.z - spawn.z;
    const d = Math.hypot(dx, dz);
    if (d < 5.5) {
      const spot = randomSpot();
      if (spot) {
        p.body.x = spot.x;
        p.body.y = spot.y;
        p.body.z = spot.z;
      }
    }
  }
  drawHearts();
  setMode("play");
}

function bindHold(button, set) {
  const down = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== "play") return;
    set(true);
  };
  const up = (e) => {
    e.preventDefault();
    set(false);
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointerleave", up);
  button.addEventListener("pointercancel", up);
}

function bindInput() {
  document.body.classList.toggle("touch", touchUI);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
    if (mode === "menu" && (e.code === "Enter" || e.code === "Space")) {
      document.getElementById("play").click();
      return;
    }
    if (e.code === "Escape") {
      if (mode === "play") setMode("pause");
      else if (mode === "pause") setMode("play");
      return;
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (mode === "play" && /^Digit[1-9]$/.test(e.code)) selectSlot(Number(e.code.slice(5)) - 1);
    if (e.code === "F3") debugOn = !debugOn;
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => {
    keys.clear();
    leftDown = false;
    rightDown = false;
    jumpHeld = false;
  });
  canvas.addEventListener("mousedown", (e) => {
    if (mode !== "play") return;
    if (!touchUI && document.pointerLockElement !== canvas) {
      const lock = canvas.requestPointerLock();
      if (lock && lock.catch) lock.catch(() => {});
      return;
    }
    if (e.button === 0) leftDown = true;
    if (e.button === 2) rightDown = true;
    if (e.button === 1) {
      const hit = viewRay();
      if (hit) {
        const id = dropOf(hit.id) || hit.id;
        const idx = HOTBAR.findIndex((s) => s.kind === "block" && s.id === id);
        if (idx >= 0) selectSlot(idx);
      }
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) leftDown = false;
    if (e.button === 2) rightDown = false;
  });
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas && mode === "play") addLook(e.movementX, e.movementY);
  });
  window.addEventListener(
    "wheel",
    (e) => {
      if (mode !== "play") return;
      e.preventDefault();
      selectSlot(selected + (e.deltaY > 0 ? 1 : -1));
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (mode !== "play") return;
      for (const t of e.changedTouches) {
        if (lookId == null) {
          lookId = t.identifier;
          lookX = t.clientX;
          lookY = t.clientY;
        }
      }
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          addLook(t.clientX - lookX, t.clientY - lookY);
          lookX = t.clientX;
          lookY = t.clientY;
        }
      }
    },
    { passive: false },
  );
  const endLook = (e) => {
    for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
  };
  canvas.addEventListener("touchend", endLook);
  canvas.addEventListener("touchcancel", endLook);

  joystick.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      stick.id = e.pointerId;
      const r = joystick.getBoundingClientRect();
      stick.cx = r.left + r.width / 2;
      stick.cy = r.top + r.height / 2;
      stick.on = true;
      moveStick(e.clientX, e.clientY);
      try {
        joystick.setPointerCapture(e.pointerId);
      } catch (err) {
        /* Untrusted events, and some mobile browsers, reject capture. */
      }
    },
  );
  joystick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stick.id) return;
    moveStick(e.clientX, e.clientY);
  });
  const endStick = (e) => {
    if (e.pointerId !== stick.id) return;
    stick.id = null;
    stick.on = false;
    stick.forward = 0;
    stick.strafe = 0;
    knob.style.transform = "translate(0px, 0px)";
  };
  joystick.addEventListener("pointerup", endStick);
  joystick.addEventListener("pointercancel", endStick);

  bindHold(btnJump, (v) => {
    jumpHeld = v;
  });
  bindHold(btnBreak, (v) => {
    leftDown = v;
  });
  bindHold(btnPlace, (v) => {
    rightDown = v;
  });

  document.getElementById("play").addEventListener("click", () => {
    audio.unlock();
    setMode("play");
    if (!touchUI) {
      const lock = canvas.requestPointerLock();
      if (lock && lock.catch) lock.catch(() => {});
    }
  });
  document.getElementById("resume").addEventListener("click", () => {
    saveSettings();
    audio.unlock();
    setMode("play");
    if (!touchUI) {
      const lock = canvas.requestPointerLock();
      if (lock && lock.catch) lock.catch(() => {});
    }
  });
  document.getElementById("respawn").addEventListener("click", () => {
    audio.unlock();
    respawnPlayer();
  });
  document.getElementById("btn-pause").addEventListener("click", () => {
    if (mode === "play") setMode("pause");
  });
  document.getElementById("btn-sound").addEventListener("click", () => {
    const on = audio.toggle();
    document.getElementById("btn-sound").textContent = on ? "Sound" : "Muted";
  });
  sensInput.addEventListener("input", saveSettings);
  invertInput.addEventListener("change", saveSettings);
  window.addEventListener("resize", resize);
}

function moveStick(x, y) {
  const maxR = 46;
  let dx = x - stick.cx;
  let dy = y - stick.cy;
  const mag = Math.hypot(dx, dy) || 1;
  if (mag > maxR) {
    dx = (dx / mag) * maxR;
    dy = (dy / mag) * maxR;
  }
  knob.style.transform = "translate(" + dx + "px, " + dy + "px)";
  stick.strafe = dx / maxR;
  stick.forward = -dy / maxR;
}

async function selfTest() {
  const failures = [];
  function check(cond, msg) {
    if (!cond) failures.push(msg);
  }
  const saved = {
    x: player.x, y: player.y, z: player.z,
    vx: player.vx, vy: player.vy, vz: player.vz,
    yaw, pitch, hp: playerHp, aggro: aggroDelay,
    stacks: { ...stacks },
    stats: { ...stats },
    pandas: pandas.map((p) => ({ p, x: p.body.x, y: p.body.y, z: p.body.z, hp: p.hp, alive: p.alive })),
    mode,
  };
  loopOn = false;
  try {
    if (mode !== "play") setMode("play");
    aggroDelay = 99;
    resetSpawn();
    pitch = 0;
    applyLookToCamera();
    camera.position.set(player.x, player.y + EYE, player.z);
    camera.updateMatrixWorld(true);
    readGroundFrame(camera, fwdV, rightV);
    check(fwdV.distanceTo(new THREE.Vector3(0, 0, -1)) < 0.02, "yaw 0 forward " + fwdV.toArray());
    check(rightV.distanceTo(new THREE.Vector3(1, 0, 0)) < 0.02, "yaw 0 right " + rightV.toArray());
    const yawBefore = yaw;
    addLook(40, 0);
    check(yaw < yawBefore, "look right decreases yaw");
    applyLookToCamera();
    camera.updateMatrixWorld(true);
    camera.getWorldDirection(lookV);
    check(lookV.x > 0.04, "look right faces +X " + lookV.toArray());
    yaw = 0;
    pitch = 0;
    addLook(0, -30);
    check(pitch > 0, "look up increases pitch");
    applyLookToCamera();
    camera.updateMatrixWorld(true);
    camera.getWorldDirection(lookV);
    check(lookV.y > 0.03, "positive pitch looks up " + lookV.toArray());

    async function slide(code, axis, sign) {
      resetSpawn();
      pitch = 0;
      yaw = 0;
      player.vx = 0;
      player.vz = 0;
      keys.clear();
      leftDown = false;
      rightDown = false;
      applyLookToCamera();
      camera.position.set(player.x, player.y + EYE, player.z);
      camera.updateMatrixWorld(true);
      readGroundFrame(camera, fwdV, rightV);
      const dir = axis === "f" ? fwdV.clone() : rightV.clone();
      const x0 = player.x;
      const z0 = player.z;
      keys.add(code);
      for (let i = 0; i < 36; i++) update(1 / 60);
      keys.delete(code);
      const dx = player.x - x0;
      const dz = player.z - z0;
      const len = Math.hypot(dx, dz);
      const along = (dx * dir.x + dz * dir.z) * sign;
      check(len > 0.7, code + " moved " + len.toFixed(2));
      check(len < 0.05 || along / len > 0.85, code + " direction " + (along / Math.max(len, 0.001)).toFixed(2));
    }
    await slide("KeyW", "f", 1);
    await slide("KeyS", "f", -1);
    await slide("KeyD", "r", 1);
    await slide("KeyA", "r", -1);

    resetSpawn();
    player.onGround = true;
    player.coyote = 0.12;
    const y0 = player.y;
    keys.add("Space");
    update(1 / 60);
    keys.delete("Space");
    check(player.y > y0 + 0.02 || player.vy > 1, "jump leaves the ground");

    const nosePanda = pandas.find((p) => p.alive) || pandas[0];
    nosePanda.group.position.set(nosePanda.body.x, nosePanda.body.y, nosePanda.body.z);
    nosePanda.group.rotation.set(0, yawFromDirection(1, 0), 0);
    nosePanda.group.updateMatrixWorld(true);
    const noseWorld = nosePanda.nose.getWorldPosition(new THREE.Vector3());
    const noseDir = noseWorld.sub(nosePanda.group.position);
    noseDir.y = 0;
    noseDir.normalize();
    check(noseDir.dot(new THREE.Vector3(1, 0, 0)) > 0.9, "panda nose faces travel +X " + noseDir.toArray());

    resetSpawn();
    pitch = -0.55;
    yaw = 0;
    selectSlot(4);
    const dirtBefore = stacks[DIRT];
    const placedBefore = stats.placed;
    rightDown = true;
    for (let i = 0; i < 3; i++) update(1 / 60);
    rightDown = false;
    check(stats.placed === placedBefore + 1, "placed one block");
    check(stacks[DIRT] === dirtBefore - 1, "dirt stack decreased");
    check(lastPlaced && world.get(lastPlaced.x, lastPlaced.y, lastPlaced.z) === DIRT, "placed cell is dirt");
    if (lastPlaced) {
      selectSlot(3);
      aimAt(lastPlaced.x + 0.5, lastPlaced.y + 0.5, lastPlaced.z + 0.5);
      const brokenBefore = stats.broken;
      leftDown = true;
      for (let i = 0; i < 40; i++) {
        update(1 / 60);
        if (world.get(lastPlaced.x, lastPlaced.y, lastPlaced.z) === 0) break;
      }
      leftDown = false;
      check(world.get(lastPlaced.x, lastPlaced.y, lastPlaced.z) === 0, "shovel removed the dirt");
      check(stats.broken > brokenBefore, "break counted");
    }

    const target = pandas.find((p) => p.alive);
    if (target) {
      player.x = target.body.x;
      player.z = target.body.z + 1.7;
      player.y = target.body.y;
      player.vx = 0;
      player.vz = 0;
      yaw = 0;
      pitch = 0;
      selectSlot(0);
      attackCd = 0;
      target.hurt = 0;
      const hp0 = target.hp;
      leftDown = true;
      for (let i = 0; i < 8; i++) update(1 / 60);
      leftDown = false;
      check(target.hp < hp0, "sword damaged the panda (" + target.hp + "/" + hp0 + ")");
    }

    resetSpawn();
    yaw = 0;
    pitch = 0;
    selectSlot(0);
    const deflectBefore = stats.deflects;
    pines.push({ x: player.x, y: player.y + 1.2, z: player.z - 1.25, vx: 0, vy: 0, vz: 5, life: 3, returning: false, spin: 0 });
    rightDown = true;
    update(1 / 60);
    rightDown = false;
    const returned = pines.some((p) => p.returning) || stats.deflects > deflectBefore;
    check(returned, "guard returned a pineapple");
  } catch (err) {
    failures.push(String(err && err.stack ? err.stack : err));
  } finally {
    keys.clear();
    leftDown = false;
    rightDown = false;
    jumpHeld = false;
    player.x = saved.x;
    player.y = saved.y;
    player.z = saved.z;
    player.vx = saved.vx;
    player.vy = saved.vy;
    player.vz = saved.vz;
    yaw = saved.yaw;
    pitch = saved.pitch;
    playerHp = saved.hp;
    aggroDelay = 0.4;
    Object.assign(stacks, saved.stacks);
    Object.assign(stats, saved.stats);
    if (lastPlaced) {
      world.set(lastPlaced.x, lastPlaced.y, lastPlaced.z, 0);
      lastPlaced = null;
    }
    for (const row of saved.pandas) {
      if (!pandas.includes(row.p)) continue;
      row.p.body.x = row.x;
      row.p.body.y = row.y;
      row.p.body.z = row.z;
      row.p.body.vx = 0;
      row.p.body.vz = 0;
      row.p.hp = row.hp;
      row.p.alive = row.alive;
      row.p.hurt = 0;
      paintBar(row.p);
    }
    pines.length = 0;
    mine = null;
    drawHearts();
    refreshHotbar();
    refreshScore();
    flushDirty();
    loopOn = true;
    requestAnimationFrame(frame);
  }
  return { ok: failures.length === 0, failures };
}

let lastTime = performance.now();
function frame(now) {
  if (!loopOn) return;
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  if (dt > 0) update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

async function boot() {
  window.addEventListener("error", (e) => {
    const el = document.getElementById("errmsg");
    el.hidden = false;
    el.textContent = String(e.message || e.error || "error");
  });
  window.addEventListener("unhandledrejection", (e) => {
    const el = document.getElementById("errmsg");
    el.hidden = false;
    el.textContent = String(e.reason && e.reason.message ? e.reason.message : e.reason);
  });
  loadSettings();
  if (touchUI) document.body.classList.add("touch");
  seedLine.textContent = "Seed " + SEED;
  resize();
  await nextFrame();
  loadText.textContent = "Raising the meadow…";
  world.generate();
  await nextFrame();
  loadText.textContent = "Stacking blocks…";
  const atlas = makeAtlasCanvas();
  scene.userData.atlas = atlas;
  scene.userData.icons = makeToolIcons();
  scene.userData.mats = setupScene(atlas);
  const n = chunkCount();
  let built = 0;
  const total = n.x * n.y * n.z;
  for (let cy = 0; cy < n.y; cy++) {
    for (let cz = 0; cz < n.z; cz++) {
      for (let cx = 0; cx < n.x; cx++) {
        rebuildChunk(cx, cy, cz);
        built += 1;
        if (built % 4 === 0) {
          loadText.textContent = "Stacking blocks… " + Math.floor((built / total) * 100) + "%";
          await nextFrame();
        }
      }
    }
  }
  spawn.y = world.surfaceY(spawn.x, spawn.z) + 1;
  resetSpawn();
  player.onGround = true;
  spawnPanda(spawn.x, spawn.z - 7.5, 0);
  spawnPanda(spawn.x + 10, spawn.z + 4, 0);
  spawnPanda(spawn.x - 9, spawn.z - 6, 0);
  spawnPanda(spawn.x + 2, spawn.z + 14, 0);
  buildHotbar();
  bindInput();
  drawHearts();
  refreshHotbar();
  refreshScore();
  loadingEl.classList.add("hidden");
  setMode("menu");
  booted = true;
  window.__PC = {
    world,
    player,
    pandas,
    pines,
    stats,
    stacks,
    camera,
    renderer,
    selectSlot,
    aimAt,
    resetSpawn,
    selfTest,
    setDebug(on) {
      debugOn = on;
    },
    setTouch(on) {
      document.body.classList.toggle("touch", on);
    },
    getState() {
      return {
        mode,
        x: player.x,
        y: player.y,
        z: player.z,
        yaw,
        pitch,
        hp: playerHp,
        pandas: pandas.filter((p) => p.alive).length,
        pines: pines.length,
        kills: stats.kills,
        throws: stats.throws,
        placed: stats.placed,
        broken: stats.broken,
        deflects: stats.deflects,
        booted,
      };
    },
    setLeft(v) {
      leftDown = v;
    },
    setRight(v) {
      rightDown = v;
    },
  };
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

boot();
