import { hash2 } from "./hash.js";
import { TILE } from "./blocks.js";

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function paint(data, fn) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4;
      const c = fn(x, y);
      data[i] = clampByte(c[0]);
      data[i + 1] = clampByte(c[1]);
      data[i + 2] = clampByte(c[2]);
      data[i + 3] = c.length > 3 ? clampByte(c[3]) : 255;
    }
  }
}

function dirtPixel(x, y, salt) {
  const n = hash2(x, y, salt);
  const n2 = hash2(x * 2, y, salt + 3);
  let r = 128 + n * 36;
  let g = 82 + n * 24;
  let b = 46 + n * 14;
  if (n2 > 0.82) {
    r -= 28;
    g -= 18;
    b -= 10;
  }
  if (n > 0.93) {
    r += 20;
    g += 14;
  }
  return [r, g, b, 255];
}

function grassTop(x, y) {
  const n = hash2(x, y, 4);
  let r = 62 + n * 30;
  let g = 130 + n * 50;
  let b = 42 + n * 18;
  if (hash2(x + 3, y, 5) > 0.86) {
    r += 24;
    g += 16;
    b -= 8;
  }
  if (((x * 3 + y * 5) & 7) === 0) {
    g -= 18;
  }
  return [r, g, b, 255];
}

function grassSide(x, y) {
  const drip = 3 + ((hash2(x, 0, 8) * 4) | 0);
  if (y < drip) {
    const g = grassTop(x, y);
    if (y === drip - 1 && hash2(x, y, 2) > 0.5) return dirtPixel(x, y, 9);
    return g;
  }
  return dirtPixel(x, y, 9);
}

function stonePixel(x, y, salt) {
  const n = hash2(x, y, salt);
  let v = 118 + n * 42;
  if (hash2(x, y, salt + 2) > 0.9) v -= 30;
  if (y % 7 === 0 && x % 5 === 2) v -= 16;
  return [v, v, v + 2, 255];
}

function cobble(x, y) {
  const gy = Math.floor(y / 4);
  const shift = (gy & 1) * 2;
  const gx = Math.floor((x + shift) / 4);
  const n = hash2(gx, gy, 6);
  let v = 96 + n * 58;
  const lx = (x + shift) % 4;
  const ly = y % 4;
  if (lx === 0 || ly === 0) v -= 28;
  if (n > 0.75 && lx === 2 && ly === 2) v += 18;
  return [v, v, v + 1, 255];
}

function logSide(x, y) {
  const stripe = hash2(x, 0, 15);
  let r = 102 + stripe * 40;
  let g = 68 + stripe * 24;
  let b = 34 + stripe * 12;
  if (x % 4 === 0) {
    r -= 24;
    g -= 16;
    b -= 8;
  }
  const knot = hash2(x, y, 16);
  if (knot > 0.92) {
    r -= 20;
    g -= 10;
  }
  return [r + (y & 1) * 4, g, b, 255];
}

function logTop(x, y) {
  const dx = x - 7.5;
  const dy = y - 7.5;
  const d = Math.sqrt(dx * dx + dy * dy);
  const ring = Math.sin(d * 1.7) > 0.2 ? 18 : -8;
  const n = hash2(x, y, 17);
  return [118 + ring + n * 16, 78 + ring * 0.6, 40 + n * 8, 255];
}

function planks(x, y) {
  const row = Math.floor(y / 4);
  const n = hash2(row, 0, 18);
  let r = 168 + n * 30;
  let g = 124 + n * 24;
  let b = 68 + n * 12;
  if (y % 4 === 0) {
    r -= 36;
    g -= 26;
    b -= 14;
  }
  const shift = (row & 1) * 5;
  if ((x + shift) % 8 === 0) {
    r -= 20;
    g -= 14;
  }
  if (hash2(x, y, 19) > 0.9) {
    r += 10;
    g += 6;
  }
  return [r, g, b, 255];
}

function leaves(x, y) {
  const n = hash2(x, y, 21);
  if (n > 0.82) return [0, 0, 0, 0];
  let r = 46 + n * 30;
  let g = 110 + n * 50;
  let b = 40 + n * 16;
  if (hash2(y, x, 22) > 0.78) {
    r += 10;
    g -= 20;
  }
  return [r, g, b, 255];
}

function sand(x, y) {
  const n = hash2(x, y, 23);
  let r = 214 + n * 24;
  let g = 196 + n * 20;
  let b = 120 + n * 18;
  if (n > 0.85) {
    r -= 16;
    g -= 12;
    b -= 8;
  }
  return [r, g, b, 255];
}

function bedrock(x, y) {
  const n = hash2(x, y, 24);
  let v = 28 + n * 36;
  if (n > 0.7) v = 12 + n * 10;
  return [v, v, v + 2, 255];
}

function coal(x, y) {
  const base = stonePixel(x, y, 25);
  const n = hash2(x, y, 26);
  if (n > 0.62) {
    const v = 16 + hash2(x + 1, y, 27) * 24;
    return [v, v, v, 255];
  }
  return base;
}

function flower(x, y, petal) {
  const cx = 7.5;
  const cy = 6;
  const dx = x - cx;
  const dy = y - cy;
  if (y >= 9 && x >= 7 && x <= 8) return [40, 120, 36, 255];
  if (y === 8 && x >= 6 && x <= 9 && hash2(x, y, 2) > 0.4) return [46, 130, 40, 255];
  const d = dx * dx + dy * dy;
  if (d < 3.2) return [240, 220, 60, 255];
  if (d < 14 && (Math.abs(dx) < 4.2 && Math.abs(dy) < 4.2)) {
    if (hash2(x, y, 28) > 0.25) return petal;
  }
  return [0, 0, 0, 0];
}

function tallgrass(x, y) {
  const blade = x === 4 || x === 8 || x === 12 || x === 6;
  if (!blade) return [0, 0, 0, 0];
  const lean = ((hash2(x, 0, 29) * 3) | 0) - 1;
  const xx = x + ((y > 8 ? lean : 0) | 0);
  if (xx !== x && y > 8) return [0, 0, 0, 0];
  const top = 2 + ((hash2(x, 1, 30) * 4) | 0);
  if (y < top) return [0, 0, 0, 0];
  const n = hash2(x, y, 31);
  return [50 + n * 20, 120 + n * 40, 36, 255];
}

const PAINTERS = {
  [TILE.grassTop]: grassTop,
  [TILE.grassSide]: grassSide,
  [TILE.dirt]: (x, y) => dirtPixel(x, y, 9),
  [TILE.stone]: (x, y) => stonePixel(x, y, 10),
  [TILE.cobble]: cobble,
  [TILE.logSide]: logSide,
  [TILE.logTop]: logTop,
  [TILE.planks]: planks,
  [TILE.leaves]: leaves,
  [TILE.sand]: sand,
  [TILE.bedrock]: bedrock,
  [TILE.coal]: coal,
  [TILE.flowerR]: (x, y) => flower(x, y, [196, 42, 48, 255]),
  [TILE.flowerY]: (x, y) => flower(x, y, [232, 196, 48, 255]),
  [TILE.flowerB]: (x, y) => flower(x, y, [70, 110, 196, 255]),
  [TILE.tallgrass]: tallgrass,
};

export function makeAtlasCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  g.clearRect(0, 0, 256, 256);
  for (const key of Object.keys(PAINTERS)) {
    const tile = Number(key);
    const col = tile % 16;
    const row = (tile / 16) | 0;
    const img = g.createImageData(16, 16);
    paint(img.data, PAINTERS[tile]);
    g.putImageData(img, col * 16, row * 16);
  }
  return canvas;
}

export function makeCrackCanvases() {
  const cracks = [];
  for (let stage = 0; stage < 5; stage++) {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const g = canvas.getContext("2d");
    const img = g.createImageData(16, 16);
    const amount = stage + 1;
    for (let n = 0; n < amount * 3; n++) {
      let x = (hash2(n, stage, 40) * 16) | 0;
      let y = (hash2(n, stage, 41) * 16) | 0;
      const steps = 4 + stage * 2;
      for (let s = 0; s < steps; s++) {
        if (x >= 0 && y >= 0 && x < 16 && y < 16) {
          const i = (y * 16 + x) * 4;
          img.data[i] = 20;
          img.data[i + 1] = 20;
          img.data[i + 2] = 20;
          img.data[i + 3] = 180;
        }
        const dir = (hash2(n, s, stage + 50) * 4) | 0;
        if (dir === 0) x++;
        else if (dir === 1) x--;
        else if (dir === 2) y++;
        else y--;
      }
    }
    g.putImageData(img, 0, 0);
    cracks.push(canvas);
  }
  return cracks;
}

export function makePineappleCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const g = canvas.getContext("2d");
  const img = g.createImageData(32, 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const i = (y * 32 + x) * 4;
      const cell = ((x / 4) | 0) + ((y / 4) | 0);
      const on = cell & 1;
      const edge = x % 4 === 0 || y % 4 === 0;
      img.data[i] = on ? 214 : 186;
      img.data[i + 1] = on ? 168 : 130;
      img.data[i + 2] = 42;
      img.data[i + 3] = 255;
      if (edge) {
        img.data[i] -= 30;
        img.data[i + 1] -= 24;
      }
    }
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

export function makeBlobCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grd.addColorStop(0, "rgba(0,0,0,0.45)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return canvas;
}

export function makeSunCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 6, 32, 32, 30);
  grd.addColorStop(0, "rgba(255,248,220,1)");
  grd.addColorStop(0.45, "rgba(255,220,120,0.9)");
  grd.addColorStop(1, "rgba(255,200,80,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return canvas;
}

function iconCanvas(draw) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const g = canvas.getContext("2d");
  g.clearRect(0, 0, 16, 16);
  draw(g);
  return canvas;
}

function px(g, x, y, color) {
  g.fillStyle = color;
  g.fillRect(x, y, 1, 1);
}

export function makeToolIcons() {
  const sword = iconCanvas((g) => {
    for (let i = 0; i < 9; i++) {
      px(g, 3 + i, 1 + i, "#f4f7fb");
      px(g, 4 + i, 1 + i, "#c5cad6");
      px(g, 3 + i, 2 + i, "#8e95a6");
    }
    for (let i = 0; i < 5; i++) px(g, 8 + i, 10, "#e0b15a");
    px(g, 9, 9, "#c48a3a");
    px(g, 12, 11, "#c48a3a");
    for (let i = 0; i < 3; i++) {
      px(g, 12, 12 + i, "#6b3e22");
      px(g, 13, 12 + i, "#4a2916");
    }
  });
  const pick = iconCanvas((g) => {
    for (let i = 0; i < 8; i++) px(g, 2 + i, 3, "#dfe3ea");
    for (let i = 0; i < 8; i++) px(g, 2 + i, 4, "#9aa3b5");
    px(g, 2, 2, "#dfe3ea");
    px(g, 9, 2, "#dfe3ea");
    px(g, 2, 5, "#6d7688");
    px(g, 9, 5, "#6d7688");
    for (let i = 0; i < 8; i++) {
      px(g, 8 + (i > 4 ? i - 5 : 0), 5 + i, "#6b3e22");
      px(g, 9, 5 + i, "#4a2916");
    }
  });
  const axe = iconCanvas((g) => {
    px(g, 3, 2, "#9aa3b5");
    px(g, 4, 2, "#dfe3ea");
    px(g, 5, 2, "#dfe3ea");
    px(g, 6, 2, "#9aa3b5");
    for (let y = 3; y <= 7; y++) {
      px(g, 3, y, "#dfe3ea");
      px(g, 4, y, "#f4f7fb");
      px(g, 5, y, "#9aa3b5");
    }
    px(g, 6, 4, "#dfe3ea");
    px(g, 6, 5, "#dfe3ea");
    for (let i = 0; i < 8; i++) {
      px(g, 6 + (i > 3 ? 1 : 0), 6 + i, "#6b3e22");
      px(g, 7, 6 + i, "#4a2916");
    }
  });
  const shovel = iconCanvas((g) => {
    for (let y = 1; y <= 5; y++) {
      px(g, 6, y, "#dfe3ea");
      px(g, 7, y, "#f7f8fb");
      px(g, 8, y, "#9aa3b5");
    }
    px(g, 5, 2, "#dfe3ea");
    px(g, 9, 2, "#9aa3b5");
    px(g, 5, 3, "#dfe3ea");
    px(g, 9, 3, "#9aa3b5");
    for (let i = 0; i < 8; i++) {
      px(g, 7, 6 + i, "#6b3e22");
      px(g, 8, 6 + i, "#4a2916");
    }
  });
  return { sword, pick, axe, shovel };
}
