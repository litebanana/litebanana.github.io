/* fx.js — pooled particles, damage numbers, screen shake, flashes. */
(function () {
  'use strict';
  const VR = window.VR;

  const fx = {
    particles: [],        // pooled via VR.Pool
    numbers: [],          // pooled damage numbers
    textFX: [],
    rings: [],
    shakeTrauma: 0,       // 0..1, squared for intensity
    flashAlpha: 0,
    flashColor: '#ffffff',
    hitStop: 0,           // seconds of time-freeze
    _pPool: null,
    _nPool: null,

    init() {
      this._pPool = new VR.Pool(() => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', drag: 1, grav: 0, glow: false, dead: false, pool: null }), 120);
      this._nPool = new VR.Pool(() => ({ x: 0, y: 0, val: 0, crit: false, life: 0, maxLife: 0.9, vy: -60, color: '#fff', text: '', dead: false, pool: null }), 40);
    },

    /* ---- particles ---- */
    burst(opts) {
      const { x, y, color, count = 8, speed = 160, life = 0.5, size = 2.5, spread = VR.TAU, dir = 0, glow = true, grav = 0, drag = 1 } = opts;
      for (let i = 0; i < count; i++) {
        const a = dir + VR.randRange(-spread / 2, spread / 2);
        const sp = speed * VR.randRange(0.3, 1);
        const p = this._pPool.get();
        p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.life = life * VR.randRange(0.6, 1.2); p.maxLife = p.life;
        p.size = size * VR.randRange(0.6, 1.4); p.color = color; p.glow = glow;
        p.grav = grav; p.drag = drag;
      }
    },
    trail(x, y, color, size) {
      const p = this._pPool.get();
      p.x = x; p.y = y; p.vx = 0; p.vy = 0;
      p.life = 0.28; p.maxLife = p.life;
      p.size = size; p.color = color; p.glow = true; p.grav = 0; p.drag = 1;
    },
    ring(x, y, color, radius, alpha) {
      this.rings.push({ x, y, color, r0: radius, r: radius * 0.3, life: 0.4, maxLife: 0.4, alpha: alpha || 0.8 });
    },

    /* ---- damage numbers ---- */
    damageNumber(x, y, val, crit, color) {
      if (!VR.saveData.settings.damageNumbers) return;
      const n = this._nPool.get();
      n.x = x + VR.randRange(-6, 6); n.y = y - 8;
      n.val = Math.round(val); n.crit = crit;
      n.life = crit ? 1.1 : 0.85; n.maxLife = n.life;
      n.color = color || (crit ? '#ffb84d' : '#ffffff');
      n.text = '';
    },
    floatText(x, y, text, color) {
      this.textFX.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
    },

    /* ---- screen effects ---- */
    shake(amount) { this.shakeTrauma = Math.min(1, this.shakeTrauma + amount); },
    flash(color, alpha) { this.flashColor = color || '#ffffff'; this.flashAlpha = Math.max(this.flashAlpha, alpha || 0.3); },
    freeze(sec) { this.hitStop = Math.max(this.hitStop, sec); },

    update(dt) {
      // particles
      const pp = this._pPool;
      for (const p of pp.active.slice()) {
        p.life -= dt;
        if (p.life <= 0) { pp.release(p); continue; }
        p.vy += p.grav * dt;
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy *= Math.pow(p.drag, dt * 60);
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      // damage numbers
      const np = this._nPool;
      for (const n of np.active.slice()) {
        n.life -= dt;
        if (n.life <= 0) { np.release(n); continue; }
        n.y += n.vy * dt;
        n.vy *= Math.pow(0.85, dt * 60);
      }
      // text
      for (const t of this.textFX.slice()) {
        t.life -= dt;
        if (t.life <= 0) this.textFX.splice(this.textFX.indexOf(t), 1);
      }
      // rings
      for (const r of this.rings.slice()) {
        r.life -= dt;
        if (r.life <= 0) { this.rings.splice(this.rings.indexOf(r), 1); continue; }
        const t = 1 - r.life / r.maxLife;
        r.r = VR.lerp(r.r0 * 0.3, r.r0, VR.easeOut(t));
      }
      // decay
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.2);
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
      if (this.hitStop > 0) this.hitStop = Math.max(0, this.hitStop - dt);
    },

    get shakeOffset() {
      const t = this.shakeTrauma;
      const s = t * t * 26 * (VR.saveData.settings.screenShake ? VR.saveData.settings.shakeIntensity : 0);
      return { x: VR.randRange(-s, s), y: VR.randRange(-s, s) };
    },

    render(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pp = this._pPool;
      for (const p of pp.active) {
        const a = VR.clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        if (p.glow) ctx.shadowColor = p.color, ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, VR.TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // rings
      for (const r of this.rings) {
        const a = VR.clamp(r.life / r.maxLife, 0, 1) * r.alpha;
        ctx.globalAlpha = a;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = r.color; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, VR.TAU);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // damage numbers (not additive, pixel font)
      ctx.save();
      for (const n of this._nPool.active) {
        const a = VR.clamp(n.life / n.maxLife, 0, 1);
        ctx.globalAlpha = a;
        const txt = n.text || (n.crit ? n.val + '!' : String(n.val));
        VR.pixel.text(ctx, txt, n.x, n.y, n.color, n.crit ? 3 : 2.4, 'center');
      }
      ctx.restore();

      // floating text
      ctx.save();
      for (const t of this.textFX) {
        const a = VR.clamp(t.life / t.maxLife, 0, 1);
        ctx.globalAlpha = a;
        VR.pixel.text(ctx, t.text, t.x, t.y, t.color, 2.6, 'center');
      }
      ctx.restore();
    },

    releaseAll() {
      this._pPool.releaseAll();
      this._nPool.releaseAll();
      this.textFX.length = 0;
      this.rings.length = 0;
      this.shakeTrauma = 0; this.flashAlpha = 0; this.hitStop = 0;
    }
  };

  VR.fx = fx;
})();
