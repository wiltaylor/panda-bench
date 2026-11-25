'use strict';
/* PandaCraft — game state, loop, glue */

const game = {
  state: 'menu', ready: false,
  player,
  pandas: [], selBlock: null, look: null,
  spawn: [64, 40, 64], spawnTimer: 3,
  menuYaw: 0, fps: 0, frames: 0, fpsT: 0,
  lastT: 0,

  init(){
    try {
      const cv = document.getElementById('game');
      Renderer.init(cv);
      ui.init(this);
      inputInit(this);
      Renderer.onEntities = t => this.drawScene(t);
      Renderer.onHeld = t => this.drawHeld(t);
      this.lastT = performance.now();
      requestAnimationFrame(t => this.loop(t));
      setTimeout(() => { // let the menu paint first, then build the world
        const t0 = performance.now();
        const seed = (Math.random()*0x7fffffff)|0;
        generateWorld(seed);
        this.spawn = findSpawn();
        player.pos = this.spawn.slice();
        const t1 = performance.now();
        Renderer.buildAllChunks();
        console.log('worldgen_ms=' + (t1 - t0).toFixed(0) + ' mesh_ms=' + (performance.now() - t1).toFixed(0));
        for(let i = 0; i < 6; i++) spawnPanda(this, 12, 30);
        this.ready = true;
        ui.els.genNote.style.display = 'none';
      }, 50);
    } catch(err){
      const el = document.getElementById('overlay');
      el.innerHTML = '<div class="panel"><h1>Error</h1><p>' + ((err && err.message) || err) + '</p></div>';
      throw err;
    }
  },

  start(){
    if(!this.ready) return;
    this.state = 'playing';
    ui.els.overlay.classList.add('hidden');
    ui.els.pauseOv.classList.add('hidden');
    ui.els.deathOv.classList.add('hidden');
    if(!IS_TOUCH && Renderer.canvas.requestPointerLock) Renderer.canvas.requestPointerLock();
    Sfx.play('pickup');
  },
  pause(){
    if(this.state !== 'playing') return;
    this.state = 'paused';
    input.breaking = false; input.placeHeld = false;
    input.jumpTouch = false; input.joy.x = 0; input.joy.z = 0;
    ui.els.pauseHint.textContent = IS_TOUCH
      ? 'Tap RESUME to keep playing.'
      : 'The mouse will be captured again when you resume.';
    ui.els.pauseOv.classList.remove('hidden');
    if(document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
  },
  resume(){
    this.state = 'playing';
    ui.els.pauseOv.classList.add('hidden');
    if(!IS_TOUCH && Renderer.canvas.requestPointerLock) Renderer.canvas.requestPointerLock();
  },
  playerDied(){
    this.state = 'dead';
    mining.active = false;
    input.breaking = false; input.placeHeld = false;
    ui.els.deathScore.textContent = 'Pandas defeated: ' + player.score;
    ui.els.deathOv.classList.remove('hidden');
    if(document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
  },
  respawn(){
    player.dead = false;
    player.hp = player.maxHp;
    player.pos = this.spawn.slice();
    player.vel = [0, 0, 0];
    player.sinceHurt = 99; player.hurtCd = 0;
    Projectiles.length = 0;
    mining.active = false;
    ui.heartsDirty = true;
    ui.els.deathOv.classList.add('hidden');
    this.pandas = [];
    for(let i = 0; i < 5; i++) spawnPanda(this, 16, 30);
    this.state = 'playing';
    if(!IS_TOUCH && Renderer.canvas.requestPointerLock) Renderer.canvas.requestPointerLock();
  },

  loop(t){
    const dt = Math.min(0.05, (t - this.lastT)/1000 || 0.016);
    this.lastT = t;
    this.frames++; this.fpsT += dt;
    if(this.fpsT >= 1){ this.fps = this.frames; this.frames = 0; this.fpsT -= 1; }
    if(this.ready){
      if(this.state === 'playing') this.update(dt);
      else if(this.state === 'menu') this.menuYaw += dt*0.12;
      this.render();
    }
    ui.tick();
    requestAnimationFrame(tt => this.loop(tt));
  },

  update(dt){
    inputTick();
    if(input.placeHeld){
      input.placeT -= dt;
      if(input.placeT <= 0){ input.placeT = 0.27; tryUse(this); }
    }
    updateTargeting(this);
    playerUpdate(dt, this);
    updateMining(dt, this);
    for(const pd of this.pandas) if(!pd.dead) pd.update(dt, this);
    if(this.pandas.some(p => p.dead)) this.pandas = this.pandas.filter(p => !p.dead);
    updateProjectiles(dt, this);
    updatePickups(dt, this);
    updateParticles(dt);
    this.spawnTimer -= dt;
    if(this.spawnTimer <= 0){
      this.spawnTimer = 4;
      const want = 6 + Math.min(3, Math.floor(player.score/4));
      if(this.pandas.length < want) spawnPanda(this, 16, 34);
    }
  },

  render(){
    const cam = (this.state === 'menu')
      ? { pos: [this.spawn[0], this.spawn[1] + 5, this.spawn[2]], yaw: this.menuYaw, pitch: -0.28, fov: 75 }
      : { pos: [player.pos[0], player.pos[1] + player.eye, player.pos[2]], yaw: player.yaw, pitch: player.pitch, fov: 75 };
    Renderer.frame(cam);
  },

  drawScene(R){
    if(this.selBlock && this.state === 'playing'){
      const m = mMul(mT(this.selBlock.x - 0.002, this.selBlock.y - 0.002, this.selBlock.z - 0.002), mS(1.004, 1.004, 1.004));
      R.drawMesh(R.meshes.sel, m, [0.05, 0.05, 0.05, 0.85], false);
    }
    for(const pd of this.pandas) pd.draw();
    for(const pr of Projectiles) drawPineapple(R, pr.pos, 0.85, pr.spin);
    for(const pk of pickups){
      drawPineapple(R, [pk.pos[0], pk.pos[1] + 0.22 + Math.sin(pk.age*3)*0.05, pk.pos[2]], 0.7, pk.age*2 + 1);
    }
    drawParticles(R);
  },

  drawHeld(R){
    if(player.dead) return;
    const bob = Math.sin(player.walkT*6)*0.02;
    const swing = player.swingT < 1 ? Math.sin(player.swingT*Math.PI) : 0;
    const e = HOTBAR[player.sel];
    let m = mT(0.5, -0.42 + bob - swing*0.15, -0.85);
    m = mMul(m, mRX(swing*-1.3));
    m = mMul(m, mRY(0.45));
    if(e.kind === 'block'){
      const cube = R.getBlockCube(e.id);
      R.drawMesh(cube, mMul(m, mS(0.34, 0.34, 0.34)), [1, 1, 1, 1], true);
    } else if(e.kind === 'pineapple'){
      const s = mMul(m, mS(0.85, 0.85, 0.85));
      R.drawMesh(R.meshes.pine, mMul(s, mT(0, -0.05, 0)), [1, 1, 1, 1], true);
      R.drawMesh(R.meshes.crown, mMul(s, mT(0, 0.05, 0)), [0.3, 0.62, 0.25, 1], false);
    } else {
      drawSwordModel(R, mMul(m, mS(0.52, 0.52, 0.52)));
    }
  }
};

function drawSwordModel(R, m){
  const part = (x, y, z, sx, sy, sz, col) => {
    const mm = mMul(m, mMul(mT(x, y, z), mS(sx, sy, sz)));
    R.drawMesh(R.meshes.unit, mm, col, false);
  };
  part(0, 0.16, 0, 0.055, 0.3, 0.055, [0.36, 0.24, 0.14, 1]);   // handle
  part(0, 0.36, 0, 0.2, 0.05, 0.07, [0.45, 0.33, 0.16, 1]);     // guard
  part(0, 0.65, 0, 0.09, 0.52, 0.035, [0.78, 0.83, 0.86, 1]);   // blade
  part(0, 0.94, 0, 0.055, 0.12, 0.03, [0.88, 0.92, 0.94, 1]);   // tip
}

/* debug/test hooks */
window.__game = {
  game, player, W, Renderer, HOTBAR, input, mining, Panda, Projectiles,
  pandas: () => game.pandas,
  debug: {
    aim(yaw, pitch){ player.yaw = yaw; player.pitch = pitch; },
    down0(){ input.breaking = true; tryAttack(game); },
    up0(){ input.breaking = false; },
    use(){ tryUse(game); },
    select(i){ player.sel = i; ui.slotDirty = true; },
    miningState(){ return { active: mining.active, prog: +mining.prog.toFixed(2), need: mining.need }; },
    state(){ return game.state; }
  }
};

window.addEventListener('DOMContentLoaded', () => game.init());
