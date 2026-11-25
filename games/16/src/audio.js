export function createAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, gain, freq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const length = Math.max(1, (ac.sampleRate * dur) | 0);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    const amp = ac.createGain();
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ac.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      if (!muted) ensure();
      return !muted;
    },
    setMuted(v) {
      muted = v;
    },
    step(stone) {
      noise(0.05, 0.035, stone ? 240 : 140);
    },
    place() {
      tone(210, 0.07, "square", 0.035);
      tone(320, 0.05, "square", 0.02);
    },
    brk() {
      noise(0.12, 0.07, 420);
    },
    swing() {
      noise(0.07, 0.04, 980);
    },
    hit() {
      tone(160, 0.09, "triangle", 0.06, 70);
    },
    hurt() {
      tone(110, 0.18, "sawtooth", 0.045, 50);
    },
    toss() {
      tone(480, 0.08, "square", 0.03, 760);
      tone(720, 0.1, "triangle", 0.025, 400);
    },
    panda() {
      tone(280, 0.12, "sine", 0.04, 180);
    },
    death() {
      tone(220, 0.28, "triangle", 0.05, 60);
    },
    deflect() {
      tone(880, 0.06, "square", 0.035);
      tone(1320, 0.09, "square", 0.028);
    },
    jump() {
      tone(280, 0.07, "square", 0.02, 460);
    },
    clink() {
      tone(740, 0.05, "square", 0.03);
    },
    bite() {
      tone(90, 0.1, "square", 0.04, 50);
    },
  };
}
