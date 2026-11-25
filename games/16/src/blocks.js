export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const COBBLE = 4;
export const LOG = 5;
export const PLANKS = 6;
export const LEAVES = 7;
export const SAND = 8;
export const BEDROCK = 9;
export const COAL = 10;
export const FLOWER_R = 11;
export const FLOWER_Y = 12;
export const FLOWER_B = 13;
export const TALLGRASS = 14;

export const TILE = {
  grassTop: 0,
  grassSide: 1,
  dirt: 2,
  stone: 3,
  cobble: 4,
  logSide: 5,
  logTop: 6,
  planks: 7,
  leaves: 8,
  sand: 9,
  bedrock: 10,
  coal: 11,
  flowerR: 12,
  flowerY: 13,
  flowerB: 14,
  tallgrass: 15,
};

export const BLOCK_NAME = {
  [DIRT]: "Dirt",
  [COBBLE]: "Cobblestone",
  [LOG]: "Oak Log",
  [PLANKS]: "Oak Planks",
  [SAND]: "Sand",
  [GRASS]: "Grass",
  [STONE]: "Stone",
  [LEAVES]: "Leaves",
  [COAL]: "Coal Ore",
  [FLOWER_R]: "Poppy",
  [FLOWER_Y]: "Dandelion",
  [FLOWER_B]: "Cornflower",
  [TALLGRASS]: "Tallgrass",
  [BEDROCK]: "Bedrock",
};

/** Average color used for break particles and the held-block fallback. */
export const PARTICLE_COLOR = {
  [GRASS]: [0.42, 0.62, 0.22],
  [DIRT]: [0.58, 0.38, 0.22],
  [STONE]: [0.52, 0.52, 0.54],
  [COBBLE]: [0.42, 0.42, 0.44],
  [LOG]: [0.48, 0.32, 0.16],
  [PLANKS]: [0.72, 0.55, 0.32],
  [LEAVES]: [0.28, 0.55, 0.22],
  [SAND]: [0.84, 0.76, 0.46],
  [BEDROCK]: [0.18, 0.18, 0.2],
  [COAL]: [0.28, 0.28, 0.3],
  [FLOWER_R]: [0.8, 0.18, 0.2],
  [FLOWER_Y]: [0.9, 0.8, 0.2],
  [FLOWER_B]: [0.3, 0.4, 0.85],
  [TALLGRASS]: [0.35, 0.6, 0.22],
};

const SIMPLE_TILE = {
  [DIRT]: TILE.dirt,
  [STONE]: TILE.stone,
  [COBBLE]: TILE.cobble,
  [PLANKS]: TILE.planks,
  [SAND]: TILE.sand,
  [BEDROCK]: TILE.bedrock,
  [COAL]: TILE.coal,
  [LEAVES]: TILE.leaves,
};

export function isCross(id) {
  return id === FLOWER_R || id === FLOWER_Y || id === FLOWER_B || id === TALLGRASS;
}

/** Full cubes that hide neighboring faces. Leaves stay cut-out. */
export function isOpaque(id) {
  return id !== AIR && id !== LEAVES && !isCross(id);
}

/** Blocks the player and pandas collide with. Leaves are solid; plants are not. */
export function isSolid(id) {
  return id !== AIR && !isCross(id);
}

export function canBreak(id) {
  return id !== AIR && id !== BEDROCK;
}

/** Seconds to break with no tool bonus. */
export function hardness(id) {
  switch (id) {
    case GRASS:
      return 0.6;
    case DIRT:
      return 0.5;
    case SAND:
      return 0.45;
    case STONE:
      return 3.1;
    case COBBLE:
      return 2.9;
    case COAL:
      return 3.3;
    case LOG:
      return 1.9;
    case PLANKS:
      return 1.25;
    case LEAVES:
      return 0.32;
    case FLOWER_R:
    case FLOWER_Y:
    case FLOWER_B:
    case TALLGRASS:
      return 0.05;
    default:
      return Infinity;
  }
}

/** Item id added to the hotbar when this block breaks, or 0. */
export function dropOf(id) {
  switch (id) {
    case GRASS:
      return DIRT;
    case STONE:
    case COAL:
      return COBBLE;
    case DIRT:
    case COBBLE:
    case LOG:
    case PLANKS:
    case SAND:
      return id;
    default:
      return 0;
  }
}

export function tileForFace(id, ny) {
  if (id === GRASS) {
    if (ny === 1) return TILE.grassTop;
    if (ny === -1) return TILE.dirt;
    return TILE.grassSide;
  }
  if (id === LOG) return ny !== 0 ? TILE.logTop : TILE.logSide;
  if (id === FLOWER_R) return TILE.flowerR;
  if (id === FLOWER_Y) return TILE.flowerY;
  if (id === FLOWER_B) return TILE.flowerB;
  if (id === TALLGRASS) return TILE.tallgrass;
  return SIMPLE_TILE[id] ?? TILE.stone;
}

/** Break-time divisor for the equipped tool. */
export function toolMultiplier(tool, id) {
  if (tool === "pick" && (id === STONE || id === COBBLE || id === COAL)) return 6;
  if (tool === "axe" && (id === LOG || id === PLANKS)) return 4.8;
  if (tool === "axe" && id === LEAVES) return 2;
  if (tool === "shovel" && (id === DIRT || id === GRASS || id === SAND)) return 4.6;
  if (tool === "sword" && (id === LEAVES || isCross(id))) return 2.4;
  return 1;
}

export function toolDamage(tool) {
  switch (tool) {
    case "sword":
      return 6;
    case "axe":
      return 5;
    case "pick":
      return 3;
    case "shovel":
      return 2;
    default:
      return 1;
  }
}
