/* audio.js — fully procedural WebAudio: SFX synthesis + generative music. */
(function () {
  'use strict';
  const VR = window.VR;

  const A = { ctx: null, master: null, musicGain: null, sfxGain: null, ready: false };

  /* ---------- low-level voice helpers ---------- */
  function tone(opts) {
    const ctx = A.ctx, t0 = opts.when || ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(opts.f0, t0);
    if (opts.f1 !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.f1), t0 + (opts.dur || 0.1));
    const g = ctx.createGain();
    const vol = opts.vol || 0.2;
    const atk = opts.attack || 0.003;
    const dec = opts.decay || (opts.dur || 0.1) * 0.9;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + atk + dec);
    o.connect(g); g.connect(A.sfxGain);
    o.start(t0); o.stop(t0 + atk + dec + 0.05);
    return o;
  }

  function noise(opts) {
    const ctx = A.ctx, t0 = opts.when || ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * (opts.dur || 0.1)));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = opts.filterType || 'bandpass';
    f.frequency.value = opts.filterFreq || 2000;
    f.Q.value = opts.Q || 0.8;
    const g = ctx.createGain();
    const atk = opts.attack || 0.002;
    const vol = opts.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + atk + (opts.dur || 0.1));
    src.connect(f); f.connect(g); g.connect(A.sfxGain);
    src.start(t0); src.stop(t0 + atk + opts.dur + 0.05);
  }

  const f = (x) => Math.pow(2, x / 12); // semitone multiplier

  /* ---------- SFX recipes ---------- */
  const SOUNDS = {
    'shoot.pulse': (t) => {
      tone({ when: t, type: 'square', f0: 880, f1: 220, dur: 0.07, vol: 0.09, decay: 0.05 });
      noise({ when: t, dur: 0.05, filterFreq: 5200, Q: 0.6, vol: 0.06 });
    },
    'shoot.scatter': (t) => {
      for (let i = 0; i < 3; i++) tone({ when: t + i * 0.02, type: 'sawtooth', f0: 520, f1: 140, dur: 0.1, vol: 0.08 });
      noise({ when: t, dur: 0.12, filterFreq: 2400, vol: 0.09 });
    },
    'shoot.arc': (t) => {
      tone({ when: t, type: 'sine', f0: 220, f1: 880, dur: 0.16, vol: 0.11, decay: 0.12 });
      tone({ when: t + 0.01, type: 'triangle', f0: 440, f1: 1200, dur: 0.14, vol: 0.07 });
    },
    'shoot.blade': (t) => {
      noise({ when: t, dur: 0.14, filterFreq: 900, Q: 1.4, vol: 0.16 });
      tone({ when: t, type: 'sawtooth', f0: 180, f1: 60, dur: 0.14, vol: 0.09 });
    },
    chain: (t) => {
      tone({ when: t, type: 'triangle', f0: 1100, f1: 2200, dur: 0.09, vol: 0.07 });
      noise({ when: t, dur: 0.05, filterFreq: 7000, vol: 0.04 });
    },
    'hit': (t) => {
      tone({ when: t, type: 'square', f0: 300, f1: 160, dur: 0.05, vol: 0.07 });
      noise({ when: t, dur: 0.04, filterFreq: 1400, vol: 0.05 });
    },
    'hit.crit': (t) => {
      tone({ when: t, type: 'sawtooth', f0: 500, f1: 90, dur: 0.12, vol: 0.1 });
      noise({ when: t, dur: 0.09, filterFreq: 3200, vol: 0.09 });
    },
    kill: (t) => {
      tone({ when: t, type: 'square', f0: 420, f1: 60, dur: 0.16, vol: 0.09 });
      noise({ when: t, dur: 0.16, filterFreq: 900, Q: 1.2, vol: 0.12 });
    },
    explosion: (t) => {
      noise({ when: t, dur: 0.5, filterType: 'lowpass', filterFreq: 900, Q: 0.4, vol: 0.3 });
      tone({ when: t, type: 'sine', f0: 130, f1: 30, dur: 0.4, vol: 0.22 });
      noise({ when: t, dur: 0.18, filterFreq: 2600, vol: 0.14 });
    },
    dash: (t) => {
      noise({ when: t, dur: 0.16, filterFreq: 1400, Q: 1.8, vol: 0.14 });
      tone({ when: t, type: 'sine', f0: 300, f1: 900, dur: 0.12, vol: 0.08 });
    },
    pickup: (t) => {
      tone({ when: t, type: 'sine', f0: 660, f1: 1320, dur: 0.09, vol: 0.07 });
    },
    'pickup.health': (t) => {
      tone({ when: t, type: 'sine', f0: 440, f1: 880, dur: 0.14, vol: 0.09 });
      tone({ when: t + 0.08, type: 'sine', f0: 660, f1: 990, dur: 0.12, vol: 0.08 });
    },
    'pickup.shard': (t) => {
      tone({ when: t, type: 'triangle', f0: 990, f1: 1980, dur: 0.12, vol: 0.09 });
      noise({ when: t, dur: 0.06, filterFreq: 6000, vol: 0.04 });
    },
    levelup: (t) => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => tone({ when: t + i * 0.07, type: 'square', f0: n, f1: n, dur: 0.12, vol: 0.09 }));
    },
    upgrade: (t) => {
      [660, 880, 1320].forEach((n, i) => tone({ when: t + i * 0.05, type: 'triangle', f0: n, dur: 0.16, vol: 0.1 }));
      noise({ when: t + 0.1, dur: 0.3, filterType: 'highpass', filterFreq: 3000, vol: 0.06 });
    },
    hurt: (t) => {
      tone({ when: t, type: 'sawtooth', f0: 220, f1: 80, dur: 0.18, vol: 0.14 });
      noise({ when: t, dur: 0.1, filterFreq: 700, vol: 0.08 });
    },
    'hurt.shield': (t) => {
      tone({ when: t, type: 'sine', f0: 900, f1: 500, dur: 0.1, vol: 0.09 });
      noise({ when: t, dur: 0.06, filterFreq: 4200, vol: 0.05 });
    },
    uiClick: (t) => tone({ when: t, type: 'square', f0: 700, f1: 900, dur: 0.05, vol: 0.05 }),
    uiHover: (t) => tone({ when: t, type: 'sine', f0: 500, f1: 540, dur: 0.03, vol: 0.03 }),
    uiBack: (t) => tone({ when: t, type: 'square', f0: 500, f1: 300, dur: 0.06, vol: 0.05 }),
    bossRoar: (t) => {
      tone({ when: t, type: 'sawtooth', f0: 70, f1: 35, dur: 1.1, vol: 0.2 });
      tone({ when: t, type: 'sawtooth', f0: 71, f1: 36, dur: 1.1, vol: 0.15 });
      noise({ when: t, dur: 1.0, filterType: 'lowpass', filterFreq: 400, vol: 0.12 });
    },
    bossHit: (t) => {
      tone({ when: t, type: 'square', f0: 220, f1: 110, dur: 0.07, vol: 0.09 });
      noise({ when: t, dur: 0.05, filterFreq: 2000, vol: 0.06 });
    },
    bossDeath: (t) => {
      noise({ when: t, dur: 1.4, filterType: 'lowpass', filterFreq: 1200, Q: 0.3, vol: 0.35 });
      tone({ when: t, type: 'sawtooth', f0: 200, f1: 20, dur: 1.3, vol: 0.2 });
      tone({ when: t + 0.5, type: 'sine', f0: 60, f1: 25, dur: 0.9, vol: 0.2 });
    },
    laserWarn: (t) => tone({ when: t, type: 'sine', f0: 1400, f1: 1400, dur: 0.18, vol: 0.05 }),
    laserFire: (t) => {
      noise({ when: t, dur: 0.5, filterType: 'highpass', filterFreq: 1800, vol: 0.1 });
      tone({ when: t, type: 'sawtooth', f0: 120, f1: 60, dur: 0.45, vol: 0.06 });
    },
    charge: (t) => {
      tone({ when: t, type: 'sawtooth', f0: 200, f1: 800, dur: 0.4, vol: 0.09 });
      noise({ when: t, dur: 0.4, filterFreq: 2000, Q: 2, vol: 0.05 });
    },
    enemyShoot: (t) => {
      tone({ when: t, type: 'square', f0: 500, f1: 300, dur: 0.06, vol: 0.05 });
      noise({ when: t, dur: 0.04, filterFreq: 3000, vol: 0.03 });
    },
    doorOpen: (t) => {
      tone({ when: t, type: 'sawtooth', f0: 160, f1: 320, dur: 0.3, vol: 0.08 });
      noise({ when: t, dur: 0.3, filterType: 'lowpass', filterFreq: 500, vol: 0.06 });
    },
    waveStart: (t) => {
      tone({ when: t, type: 'triangle', f0: 440, f1: 660, dur: 0.12, vol: 0.06 });
    },
    roomClear: (t) => {
      [523, 659, 784].forEach((n, i) => tone({ when: t + i * 0.06, type: 'triangle', f0: n, dur: 0.14, vol: 0.08 }));
    },
    victory: (t) => {
      const seq = [392, 523, 659, 784, 1047, 784, 1047];
      seq.forEach((n, i) => tone({ when: t + i * 0.11, type: 'triangle', f0: n, dur: 0.22, vol: 0.1 }));
      noise({ when: t + 0.7, dur: 0.6, filterType: 'highpass', filterFreq: 4000, vol: 0.05 });
    },
    gameOver: (t) => {
      [330, 262, 196, 131].forEach((n, i) => tone({ when: t + i * 0.22, type: 'sawtooth', f0: n, dur: 0.4, vol: 0.09 }));
    },
    coin: (t) => {
      tone({ when: t, type: 'sine', f0: 880, f1: 1760, dur: 0.14, vol: 0.09 });
      tone({ when: t + 0.09, type: 'sine', f0: 1175, dur: 0.14, vol: 0.07 });
    },
    shieldBlock: (t) => {
      tone({ when: t, type: 'square', f0: 1800, f1: 900, dur: 0.06, vol: 0.06 });
      noise({ when: t, dur: 0.05, filterFreq: 5000, vol: 0.05 });
    },
    'shoot.boomerang': (t) => {
      tone({ when: t, type: 'sine', f0: 700, f1: 1200, dur: 0.12, vol: 0.06 });
      tone({ when: t + 0.09, type: 'sine', f0: 1200, f1: 700, dur: 0.12, vol: 0.05 });
      noise({ when: t, dur: 0.09, filterFreq: 4600, Q: 2, vol: 0.05 });
    },
    'shoot.sentinel': (t) => {
      tone({ when: t, type: 'square', f0: 900, f1: 500, dur: 0.06, vol: 0.07 });
      noise({ when: t, dur: 0.05, filterFreq: 4200, vol: 0.05 });
    },
    'shoot.orbit': (t) => {
      tone({ when: t, type: 'triangle', f0: 330, f1: 660, dur: 0.12, vol: 0.06 });
      noise({ when: t, dur: 0.05, filterFreq: 3000, vol: 0.03 });
    },
    deploy: (t) => {
      tone({ when: t, type: 'square', f0: 200, f1: 90, dur: 0.09, vol: 0.09 });
      noise({ when: t, dur: 0.07, filterFreq: 1400, vol: 0.06 });
    },
    slam: (t) => {
      noise({ when: t, dur: 0.4, filterType: 'lowpass', filterFreq: 700, Q: 0.5, vol: 0.22 });
      tone({ when: t, type: 'sine', f0: 120, f1: 35, dur: 0.3, vol: 0.16 });
    },
    teleport: (t) => {
      noise({ when: t, dur: 0.2, filterType: 'bandpass', filterFreq: 1800, Q: 2, vol: 0.09 });
      tone({ when: t, type: 'sine', f0: 500, f1: 1400, dur: 0.18, vol: 0.06 });
    },
    relic: (t) => {
      [660, 880, 1320, 1760].forEach((n, i) => tone({ when: t + i * 0.06, type: 'triangle', f0: n, dur: 0.2, vol: 0.08 }));
      noise({ when: t + 0.14, dur: 0.35, filterType: 'highpass', filterFreq: 4000, vol: 0.04 });
    },
    barrel: (t) => SOUNDS.explosion(t)
  };

  /* ---------- music: 16-step sequencer ---------- */
  const MUSIC = {
    timer: null, step: 0, mode: null, nextTime: 0, bpm: 120,
    scale: [0, 2, 3, 5, 7, 8, 10], // A minor-ish
    bassSeq: [0, 0, -1, 0, 3, 3, 2, 1, 5, 5, 3, 2, 7, 7, 5, 4],
    padSeq: [0, 3, 5, 7],
    start(mode) {
      if (!A.ready) return;
      this.stop();
      this.mode = mode;
      this.bpm = mode === 'menu' ? 88 : mode === 'boss' ? 148 : 126;
      this.step = 0;
      this.nextTime = A.ctx.currentTime + 0.08;
      this.timer = setInterval(() => this.schedule(), 28);
    },
    stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.mode = null; },
    schedule() {
      const spb = 60 / this.bpm / 2; // 8th-note duration
      while (this.nextTime < A.ctx.currentTime + 0.16) {
        this.tick(this.step, this.nextTime);
        this.nextTime += spb;
        this.step = (this.step + 1) % 16;
      }
    },
    tone(opts) {
      const ctx = A.ctx, t0 = opts.when;
      const o = ctx.createOscillator();
      o.type = opts.type || 'square';
      o.frequency.value = opts.f0;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(opts.vol || 0.06, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
      o.connect(g); g.connect(A.musicGain);
      o.start(t0); o.stop(t0 + opts.dur + 0.05);
    },
    tick(step, when) {
      const root = 110; // A2
      const base = MUSIC;
      // kick on beats
      if (step % 4 === 0) {
        tone({ when, type: 'sine', f0: 160, f1: 45, dur: 0.22, vol: 0.32 });
      }
      // hats offbeat
      if (step % 4 === 2) noise({ when, dur: 0.03, filterType: 'highpass', filterFreq: 8000, vol: 0.05 });
      if (step % 4 === 0) noise({ when, dur: 0.02, filterType: 'highpass', filterFreq: 9000, vol: 0.03 });

      if (base.mode === 'menu') {
        // slow ambient pad + sparse pluck
        const chordIdx = Math.floor(step / 4);
        const deg = base.padSeq[chordIdx % 4];
        const f0 = root * f(deg) * 2;
        this.tone({ when, type: 'sawtooth', f0: f0, dur: 1.6, vol: 0.028 });
        this.tone({ when, type: 'sawtooth', f0: f0 * 1.007, dur: 1.6, vol: 0.022 });
        if (step % 4 === 2) this.tone({ when, type: 'triangle', f0: f0 * 2, dur: 0.35, vol: 0.03 });
        return;
      }
      // combat / boss: driving bass + arp
      const bassDeg = base.bassSeq[step];
      this.tone({ when, type: 'square', f0: root * f(bassDeg), dur: 0.24, vol: base.mode === 'boss' ? 0.085 : 0.06 });
      if (step % 2 === 0) {
        const arpDeg = base.scale[(step / 2 | 0) % base.scale.length] + 12;
        this.tone({ when, type: 'square', f0: root * f(arpDeg), dur: 0.09, vol: base.mode === 'boss' ? 0.05 : 0.035 });
      }
      if (base.mode === 'boss' && step % 8 === 4) {
        this.tone({ when, type: 'sawtooth', f0: root * f(5) * 2, dur: 0.5, vol: 0.035 });
      }
    }
  };

  /* ---------- public API ---------- */
  A.init = function () {
    if (A.ready) { A.ctx.resume && A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.musicGain = A.ctx.createGain();
    A.sfxGain = A.ctx.createGain();
    A.musicGain.connect(A.master); A.sfxGain.connect(A.master);
    A.master.connect(A.ctx.destination);
    A.ready = true;
    A.applyVolumes();
  };

  A.applyVolumes = function () {
    if (!A.ready) return;
    const s = VR.saveData.settings;
    A.master.gain.value = s.masterVol * s.masterVol;   // perceptual curve
    A.musicGain.gain.value = s.musicVol;
    A.sfxGain.gain.value = s.sfxVol;
  };

  A.play = function (name) {
    if (!A.ready) return;
    const fn = SOUNDS[name];
    if (fn) fn(A.ctx.currentTime + 0.001);
  };

  A.setMusic = function (mode) {
    if (!A.ready) return;
    if (MUSIC.mode !== mode) MUSIC.start(mode);
  };
  A.stopMusic = function () { MUSIC.stop(); };

  VR.audio = A;
})();
