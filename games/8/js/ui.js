'use strict';
/* PandaCraft — HUD: hotbar, hearts, crosshair, toasts, overlays */

const SWORD_ART = [
  '................',
  '.......W........',
  '......WBW.......',
  '......WBW.......',
  '......WBW.......',
  '......WBW.......',
  '......WBW.......',
  '......WBW.......',
  '......WBW.......',
  '......WBW.......',
  '....oGGGGGo.....',
  '......HH........',
  '......HH........',
  '......HHo.......',
  '.......o........',
  '................',
];
const SWORD_PAL = { W: '#dfe7ea', B: '#9fb0b8', G: '#7a5a24', o: '#4a3b18', H: '#5d3f22' };

const PINE_ART = [
  '.......G........',
  '......GG.G......',
  '....G.GG..G.....',
  '......GGG.......',
  '.....GG.G.......',
  '......YY........',
  '.....YYYY.......',
  '....YYDYDYY.....',
  '....YDYDYDY.....',
  '....YYDYDYY.....',
  '....YDYDYDY.....',
  '....YYDYDYY.....',
  '.....DYDYD......',
  '.....YYYY.......',
  '......YY........',
  '................',
];
const PINE_PAL = { G: '#3f8f2f', Y: '#e8b23c', D: '#96651e' };

const HEART_ART = [
  '.XX.XX.',
  'XXXXXXX',
  'XXXXXXX',
  '.XXXXX.',
  '..XXX..',
  '...X...',
];

function drawArt(ctx, rows, pal, size){
  const s = size/16;
  for(let y = 0; y < rows.length; y++){
    const row = rows[y];
    for(let x = 0; x < row.length; x++){
      const ch = row[x];
      if(ch === '.' || ch === ' ') continue;
      ctx.fillStyle = pal[ch] || '#f0f';
      ctx.fillRect(Math.round(x*s), Math.round(y*s), Math.ceil(s), Math.ceil(s));
    }
  }
}
function drawArtAt(ctx, art, ox, oy, color, scale, maxCol){
  const s = scale || 2;
  for(let y = 0; y < art.length; y++){
    for(let x = 0; x < art[y].length; x++){
      if(art[y][x] !== 'X') continue;
      if(maxCol !== undefined && x > maxCol) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x*s, oy + y*s, s, s);
    }
  }
}

const ui = {
  heartsDirty: true, invDirty: true, slotDirty: true,
  slots: [], els: {}, toastTO: 0,

  init(g){
    const $ = id => document.getElementById(id);
    this.els = {
      hotbar: $('hotbar'), hearts: $('hearts'), score: $('score'), toast: $('toast'),
      vignette: $('vignette'), xhair: $('crosshair'),
      overlay: $('overlay'), pauseOv: $('pauseOverlay'), deathOv: $('deathOverlay'),
      deathScore: $('deathScore'), pauseHint: $('pauseHint'), genNote: $('genNote'),
    };
    for(let i = 0; i < 9; i++){
      const d = document.createElement('div');
      d.className = 'slot';
      const c = document.createElement('canvas');
      c.width = 44; c.height = 44;
      const n = document.createElement('span');
      n.className = 'count';
      d.appendChild(c); d.appendChild(n);
      d.addEventListener('pointerdown', e => {
        e.stopPropagation(); e.preventDefault();
        player.sel = i; this.slotDirty = true; Sfx.ensure();
      });
      this.els.hotbar.appendChild(d);
      this.slots.push({ div: d, cv: c, count: n });
    }
    $('btnPlay').addEventListener('click', () => { Sfx.ensure(); game.start(); });
    $('btnResume').addEventListener('click', () => { Sfx.ensure(); game.resume(); });
    $('btnRespawn').addEventListener('click', () => { Sfx.ensure(); game.respawn(); });
    $('ctrlDesktop').style.display = IS_TOUCH ? 'none' : 'block';
    $('ctrlTouch').style.display = IS_TOUCH ? 'block' : 'none';
    if(IS_TOUCH) document.body.classList.add('touch');
    for(let i = 0; i < 9; i++) this.drawIcon(i);
    this.invDirty = true;
  },

  drawIcon(i){
    const e = HOTBAR[i];
    const c = this.slots[i].cv, g2 = c.getContext('2d');
    g2.clearRect(0, 0, 44, 44);
    g2.imageSmoothingEnabled = false;
    if(e.kind === 'block'){
      const tile = faceTile(bd(e.id), 'side');
      const col = tile % ATLAS_COLS, row = Math.floor(tile/ATLAS_COLS);
      g2.drawImage(Renderer.atlasCanvas, col*16, row*16, 16, 16, 4, 4, 36, 36);
    } else if(e.kind === 'pineapple'){
      drawArt(g2, PINE_ART, PINE_PAL, 44);
    } else {
      drawArt(g2, SWORD_ART, SWORD_PAL, 44);
    }
  },

  drawHearts(){
    const cv = this.els.hearts;
    const g2 = cv.getContext('2d');
    g2.clearRect(0, 0, cv.width, cv.height);
    const hp = player.hp;
    for(let i = 0; i < 10; i++){
      const x0 = i*16;
      const v = hp - i*2;
      drawArtAt(g2, HEART_ART, x0, 2, '#2f3338');
      if(v >= 2) drawArtAt(g2, HEART_ART, x0, 2, '#e3313d');
      else if(v === 1) drawArtAt(g2, HEART_ART, x0, 2, '#e3313d', 2, 3);
      else drawArtAt(g2, HEART_ART, x0, 2, '#565b63');
    }
  },

  setScore(n){ this.els.score.textContent = 'Pandas defeated: ' + n; },

  toast(msg){
    this.els.toast.textContent = msg;
    this.els.toast.classList.remove('show');
    void this.els.toast.offsetWidth;
    this.els.toast.classList.add('show');
    clearTimeout(this.toastTO);
    this.toastTO = setTimeout(() => this.els.toast.classList.remove('show'), 2200);
  },

  damageFlash(){
    const v = this.els.vignette;
    v.style.transition = 'none';
    v.style.opacity = 0.85;
    requestAnimationFrame(() => {
      v.style.transition = 'opacity 0.6s';
      v.style.opacity = 0;
    });
  },

  tick(){
    if(this.heartsDirty){ this.drawHearts(); this.heartsDirty = false; }
    if(this.slotDirty){
      for(let i = 0; i < 9; i++) this.slots[i].div.classList.toggle('sel', i === player.sel);
      this.slotDirty = false;
    }
    if(this.invDirty){
      for(let i = 0; i < 9; i++){
        const e = HOTBAR[i];
        this.slots[i].count.textContent = e.kind === 'sword' ? '' : String(e.count);
      }
      this.invDirty = false;
    }
    const g2 = this.els.xhair.getContext('2d');
    g2.clearRect(0, 0, 48, 48);
    g2.strokeStyle = 'rgba(255,255,255,0.85)';
    g2.lineWidth = 2;
    g2.beginPath();
    g2.moveTo(24, 16); g2.lineTo(24, 32);
    g2.moveTo(16, 24); g2.lineTo(32, 24);
    g2.stroke();
    if(mining.active && game.selBlock){
      const p = clamp(mining.prog/mining.need, 0, 1);
      g2.strokeStyle = 'rgba(255,255,255,0.95)';
      g2.lineWidth = 3;
      g2.beginPath();
      g2.arc(24, 24, 14, -Math.PI/2, -Math.PI/2 + p*Math.PI*2);
      g2.stroke();
    }
  }
};
