# PandaCraft — Pineapple Siege 🐼🍍

A tiny Minecraft-style voxel game for desktop and mobile browsers. No build
step, no server: just open `index.html`.

## The game

- Explore a procedurally generated block world (hills, lakes, beaches, trees).
- **Mine blocks** (hold the mine button / left mouse) and **place blocks**
  to build walls and towers.
- **Pandas** spawn in waves, waddle toward you and throw **pineapples** in
  ballistic arcs. Pineapples hurt — and they smash through nothing, so
  fortifications actually help (but watch out for arcing lobs over low walls!).
- **Tools**: sword (melee), fruit slinger (shoots pineapples — ammo comes from
  pineapples the pandas drop), shield (hold to block frontal pineapples) and
  a pickaxe (fast mining).
- Hearts, ammo and a panda counter are in the HUD. Pandas repelled = score.
  If you fall in battle, respawn and keep your fort.

## Controls

Desktop: `WASD` move, mouse look, `LMB` mine/attack/shoot, `RMB` place block
(or hold to raise the shield), `Space` jump, `Shift` sprint, `1–0`/wheel
hotbar, `M` mute, `F` fullscreen, `Esc` pauses (click to resume).

Touch: left stick moves, drag anywhere on the world to look, tap the world to
attack/shoot, `⚔` hold to mine, `▣` tap to place (hold for shield), `⬆` jumps,
tap the hotbar to select an item.

## Files

- `index.html` — page shell
- `style.css` — HUD, touch controls, overlays
- `bundle.js` — the game (TypeScript + three.js, bundled; source in `game-src/`)
