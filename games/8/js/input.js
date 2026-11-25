'use strict';
/* PandaCraft — keyboard, mouse (pointer lock) and touch input */

const input = {
  keys: {},
  move: { x: 0, z: 0, kx: 0, kz: 0 },
  joy: { x: 0, z: 0 },
  jump: false, jumpTouch: false,
  breaking: false, placeHeld: false, placeT: 0,
  locked: false,
  sens: 0.0032, touchSens: 0.0045,
  lastTouchTs: 0,
};

let joyTouchId = null;
let joyOrigin = { x: 0, y: 0 };
let lookTouch = null;

function inputTick(){
  let mx = 0, mz = 0;
  if(input.keys['KeyW'] || input.keys['ArrowUp']) mz += 1;
  if(input.keys['KeyS'] || input.keys['ArrowDown']) mz -= 1;
  if(input.keys['KeyA'] || input.keys['ArrowLeft']) mx -= 1;
  if(input.keys['KeyD'] || input.keys['ArrowRight']) mx += 1;
  input.move.kx = mx; input.move.kz = mz;
  input.move.x = clamp(mx + input.joy.x, -1, 1);
  input.move.z = clamp(mz + input.joy.z, -1, 1);
  input.jump = !!input.keys['Space'] || input.jumpTouch;
  // long-press on the look side starts mining
  if(lookTouch && !lookTouch.moved && !lookTouch.mining &&
     performance.now() - lookTouch.t0 > 320 && game.state === 'playing'){
    lookTouch.mining = true;
    input.breaking = true;
  }
}

function touchTapAction(g){
  const lk = g.look;
  if(lk){
    for(const pd of g.pandas){
      if(pd.dead) continue;
      const t = rayAABB(lk.ox, lk.oy, lk.oz, lk.dx, lk.dy, lk.dz,
        pd.pos[0] - 0.65, pd.pos[1] - 0.1, pd.pos[2] - 0.65,
        pd.pos[0] + 0.65, pd.pos[1] + 1.5, pd.pos[2] + 0.65, 3.4);
      if(t >= 0 && !raycastWorld(lk.ox, lk.oy, lk.oz, lk.dx, lk.dy, lk.dz, t)){
        tryAttack(g);
        return;
      }
    }
  }
  tryUse(g);
}

function inputInit(g){
  const cv = document.getElementById('game');
  document.body.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, capture: true });
  document.addEventListener('gesturestart', e => e.preventDefault());

  window.addEventListener('keydown', e => {
    input.keys[e.code] = true;
    if(e.code === 'Space') e.preventDefault();
    if(e.code.indexOf('Digit') === 0){
      const d = +e.code.slice(5);
      if(d >= 1 && d <= 9){ player.sel = d - 1; ui.slotDirty = true; }
    }
    if(e.code === 'KeyQ' && game.state === 'playing') quickThrow();
    if(e.code === 'Escape'){
      if(game.state === 'playing' && IS_TOUCH) game.pause();
      else if(game.state === 'paused') game.resume();
    }
  });
  window.addEventListener('keyup', e => { input.keys[e.code] = false; });
  window.addEventListener('blur', () => {
    input.keys = {};
    input.breaking = false;
    input.placeHeld = false;
  });

  document.addEventListener('pointerlockchange', () => {
    input.locked = document.pointerLockElement === cv;
    if(!input.locked && game.state === 'playing' && !IS_TOUCH) game.pause();
  });

  cv.addEventListener('mousedown', e => {
    if(game.state !== 'playing') return;
    if(performance.now() - input.lastTouchTs < 1000) return; // synthetic mouse after touch
    if(!input.locked){
      if(cv.requestPointerLock) cv.requestPointerLock();
      return;
    }
    if(e.button === 0){
      input.breaking = true;
      tryAttack(game);
    } else if(e.button === 2){
      input.placeHeld = true;
      input.placeT = 0;
      tryUse(game);
    } else if(e.button === 1){
      e.preventDefault();
      pickBlock();
    }
  });
  window.addEventListener('mouseup', e => {
    if(e.button === 0) input.breaking = false;
    if(e.button === 2) input.placeHeld = false;
  });
  window.addEventListener('mousemove', e => {
    if(!input.locked || game.state !== 'playing') return;
    player.yaw -= e.movementX*input.sens;
    player.pitch -= e.movementY*input.sens;
    player.pitch = clamp(player.pitch, -1.55, 1.55);
  });
  window.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('wheel', e => {
    if(game.state !== 'playing') return;
    player.sel = (player.sel + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
    ui.slotDirty = true;
  }, { passive: true });

  /* ---- touch ---- */
  const joyBase = document.getElementById('joyBase');
  const joyKnob = document.getElementById('joyKnob');

  function setJoyPos(x, y){
    joyBase.style.left = (x - 60) + 'px';
    joyBase.style.top = (y - 60) + 'px';
    joyBase.style.opacity = 0.55;
  }
  function moveJoy(dx, dy){
    const d = Math.hypot(dx, dy), m = Math.min(d, 52);
    const nx = d > 0 ? dx/d : 0, ny = d > 0 ? dy/d : 0;
    joyKnob.style.transform = 'translate(' + (nx*m) + 'px,' + (ny*m) + 'px)';
    input.joy.x = nx*(m/52);
    input.joy.z = -ny*(m/52); // knob up (screen -y) = forward
  }
  function endJoy(){
    joyTouchId = null;
    joyBase.style.opacity = 0;
    input.joy.x = 0; input.joy.z = 0;
  }

  cv.addEventListener('touchstart', e => {
    e.preventDefault();
    input.lastTouchTs = performance.now();
    if(game.state !== 'playing') return;
    for(const t of e.changedTouches){
      if(joyTouchId === null && t.clientX < window.innerWidth*0.45){
        joyTouchId = t.identifier;
        joyOrigin.x = t.clientX; joyOrigin.y = t.clientY;
        setJoyPos(t.clientX, t.clientY);
        moveJoy(0, 0);
      } else if(lookTouch === null){
        lookTouch = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY,
                      t0: performance.now(), moved: false, mining: false };
      }
    }
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    for(const t of e.changedTouches){
      if(joyTouchId === t.identifier){
        moveJoy(t.clientX - joyOrigin.x, t.clientY - joyOrigin.y);
      } else if(lookTouch && lookTouch.id === t.identifier){
        const dx = t.clientX - lookTouch.x, dy = t.clientY - lookTouch.y;
        lookTouch.x = t.clientX; lookTouch.y = t.clientY;
        if(Math.hypot(t.clientX - lookTouch.ox, t.clientY - lookTouch.oy) > 14) lookTouch.moved = true;
        if(game.state === 'playing'){
          player.yaw -= dx*input.touchSens;
          player.pitch -= dy*input.touchSens;
          player.pitch = clamp(player.pitch, -1.55, 1.55);
        }
      }
    }
  }, { passive: false });

  function touchEnd(e){
    e.preventDefault();
    input.lastTouchTs = performance.now();
    for(const t of e.changedTouches){
      if(joyTouchId === t.identifier) endJoy();
      else if(lookTouch && lookTouch.id === t.identifier){
        if(lookTouch.mining) input.breaking = false;
        else if(!lookTouch.moved && performance.now() - lookTouch.t0 < 300 && game.state === 'playing'){
          touchTapAction(game);
        }
        lookTouch = null;
      }
    }
  }
  cv.addEventListener('touchend', touchEnd, { passive: false });
  cv.addEventListener('touchcancel', touchEnd, { passive: false });

  const bj = document.getElementById('btnJump');
  bj.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); input.jumpTouch = true; }, { passive: false });
  bj.addEventListener('touchend', e => {
    e.preventDefault();
    // keep the latch briefly so quick taps still cover one game frame
    setTimeout(() => { input.jumpTouch = false; }, 150);
  }, { passive: false });
  bj.addEventListener('touchcancel', () => { setTimeout(() => { input.jumpTouch = false; }, 150); });

  const bp = document.getElementById('btnPause');
  bp.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation();
    if(game.state === 'playing') game.pause();
  }, { passive: false });
}

function quickThrow(){
  const e = HOTBAR[1];
  if(e.count <= 0){ ui.toast('No pineapples!'); Sfx.play('denied'); return; }
  const save = player.sel;
  player.sel = 1;
  tryUse(game);
  player.sel = save;
  ui.slotDirty = true;
}
