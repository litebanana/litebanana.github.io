/* util.js — shared math, RNG, pooling, helpers. */
(function () {
  'use strict';
  window.VR = window.VR || {};

  const VR = window.VR;
  VR.TAU = Math.PI * 2;

  VR.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  VR.lerp = (a, b, t) => a + (b - a) * t;
  VR.rand = () => Math.random();
  VR.randRange = (a, b) => a + Math.random() * (b - a);
  VR.irand = (n) => Math.floor(Math.random() * n);
  VR.choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
  VR.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  VR.dist2 = (ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    return dx * dx + dy * dy;
  };
  VR.angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  VR.approach = (val, target, step) => (val < target ? Math.min(val + step, target) : Math.max(val - step, target));
  VR.angleLerp = (a, b, t) => {
    let d = (b - a) % VR.TAU;
    if (d > Math.PI) d -= VR.TAU;
    if (d < -Math.PI) d += VR.TAU;
    return a + d * t;
  };

  /** Weighted pick: arr of items, weightFn(item) -> weight */
  VR.weightedPick = function (arr, weightFn) {
    let total = 0;
    for (const it of arr) total += weightFn(it);
    let r = Math.random() * total;
    for (const it of arr) {
      r -= weightFn(it);
      if (r <= 0) return it;
    }
    return arr[arr.length - 1];
  };

  /** Deterministic seeded RNG (mulberry32) for room generation. */
  VR.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** FNV-1a hash of a string -> 32-bit unsigned seed. */
  VR.hashSeed = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  /** Seed for the daily run — derived from the calendar date. */
  VR.dailySeed = function () {
    const d = new Date();
    const p = (n) => (n < 10 ? '0' + n : '' + n);
    return VR.hashSeed(d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()));
  };

  VR.formatTime = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };
  VR.formatNum = (n) => Math.floor(n).toLocaleString('en-US');

  /** Lightweight object pool. factory returns a fresh object; objects get init(...). */
  VR.Pool = class Pool {
    constructor(factory, prewarm) {
      this.factory = factory;
      this.free = [];
      this.active = [];
      if (prewarm) for (let i = 0; i < prewarm; i++) this.free.push(factory());
    }
    get() {
      const o = this.free.pop() || this.factory();
      if (o.init) o.init.apply(o, arguments);
      o.pool = this; o.dead = false;
      this.active.push(o);
      return o;
    }
    release(o) {
      if (o.dead) return;
      o.dead = true;
      const i = this.active.indexOf(o);
      if (i >= 0) this.active.splice(i, 1);
      this.free.push(o);
    }
    releaseAll() {
      const act = this.active.slice();
      for (const o of act) this.release(o);
    }
  };

  /** Circle vs AABB overlap test. */
  VR.circleRectHit = function (cx, cy, r, rx, ry, rw, rh) {
    const nx = VR.clamp(cx, rx, rx + rw), ny = VR.clamp(cy, ry, ry + rh);
    return VR.dist2(cx, cy, nx, ny) <= r * r;
  };

  /** Push a circle out of an AABB, returning new position (no velocity change). */
  VR.resolveCircleRect = function (cx, cy, r, rx, ry, rw, rh) {
    const nx = VR.clamp(cx, rx, rx + rw), ny = VR.clamp(cy, ry, ry + rh);
    let dx = cx - nx, dy = cy - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r * r) return { x: cx, y: cy };
    if (d2 === 0) {
      // center inside rect — push out along smallest axis
      const left = cx - rx, right = rx + rw - cx, top = cy - ry, bottom = ry + rh - cy;
      const m = Math.min(left, right, top, bottom);
      if (m === left) return { x: rx - r, y: cy };
      if (m === right) return { x: rx + rw + r, y: cy };
      if (m === top) return { x: cx, y: ry - r };
      return { x: cx, y: ry + rh + r };
    }
    const d = Math.sqrt(d2);
    return { x: cx + (dx / d) * r, y: cy + (dy / d) * r };
  };

  /** Cheap quadratic ease-out. */
  VR.easeOut = (t) => 1 - (1 - t) * (1 - t);
  VR.easeIn = (t) => t * t;
  VR.easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
})();
