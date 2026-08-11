/* projectile.js — pooled projectiles (player + enemy). */
(function () {
  'use strict';
  const VR = window.VR;      const sys = {
    pool: null,
    init() {
      this.pool = new VR.Pool(() => ({
        x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0,
        radius: 4, damage: 0, crit: false, friendly: true,
        color: '#43e6ff', pierce: 0, life: 0, maxLife: 1,
        knockback: 150, chain: null, boomerang: null, hitSet: null, trailTimer: 0, dead: false, pool: null
      }), 80);
    },

    spawn(o) {
      const p = this.pool.get();
      p.x = o.x; p.y = o.y; p.px = o.x; p.py = o.y;
      p.vx = o.vx; p.vy = o.vy;
      p.radius = o.radius || 4;
      p.damage = o.damage || 1;
      p.crit = !!o.crit;
      p.friendly = o.friendly !== false;
      p.color = o.color || (p.friendly ? '#43e6ff' : '#ff5c7a');
      p.pierce = o.pierce || 0;
      p.maxLife = o.life || 1.2;
      p.life = p.maxLife;
      p.knockback = o.knockback || 0;
      p.chain = o.chain || null;
      p.boomerang = o.boomerang || null;
      p.hitSet = p.boomerang ? new Set() : null;
      p.trailTimer = 0;
      p._delay = 0;
      return p;
    },

    update(dt, game) {
      const pp = this.pool;
      for (const p of pp.active.slice()) {
        p.life -= dt;
        if (p.life <= 0) { pp.release(p); continue; }
        if (p._delay > 0) { p._delay -= dt; continue; }
        p.px = p.x; p.py = p.y;
        p.x += p.vx * dt; p.y += p.vy * dt;

        // trail
        p.trailTimer -= dt;
        if (p.trailTimer <= 0) {
          p.trailTimer = 0.018;
          VR.fx.trail(p.x, p.y, p.color, p.radius * 0.8);
        }

        // wall collision (world solids)
        const hitWall = game.collideSolids(p.x, p.y, p.radius);
        if (hitWall) { this.onWall(p); pp.release(p); continue; }

        // ---- boomerang: flies out, then returns to the player ----
        if (p.boomerang) {
          p.boomerang.t += dt;
          const pl = game.player;
          if (p.boomerang.t > p.boomerang.returnT && pl && !pl.dead) {
            const a = VR.angleTo(p.x, p.y, pl.x, pl.y);
            const sp = Math.hypot(p.vx, p.vy);
            p.vx = VR.approach(p.vx, Math.cos(a) * sp, 2600 * dt);
            p.vy = VR.approach(p.vy, Math.sin(a) * sp, 2600 * dt);
            if (VR.dist(p.x, p.y, pl.x, pl.y) < 28) {
              VR.fx.burst({ x: p.x, y: p.y, color: p.color, count: 6, speed: 120, life: 0.2, size: 2 });
              pp.release(p);
              continue;
            }
          }
          // slice every enemy it passes (once each)
          for (const e of game.enemies) {
            if (e.dead || p.hitSet.has(e)) continue;
            if (VR.dist2(p.x, p.y, e.x, e.y) < (p.radius + e.radius + 6) ** 2) {
              p.hitSet.add(e);
              VR.combat.damageEnemy(e, p.damage, { crit: p.crit, knockback: p.knockback, source: p });
            }
          }
          if (game.boss && !game.boss.dead && !p.hitSet.has(game.boss) &&
              VR.dist2(p.x, p.y, game.boss.x, game.boss.y) < (p.radius + game.boss.radius + 6) ** 2) {
            p.hitSet.add(game.boss);
            VR.combat.damageEnemy(game.boss, p.damage, { crit: p.crit, knockback: p.knockback, source: p });
          }
          continue;
        }

        if (p.friendly) {
          const target = game.findEnemyInRange(p.x, p.y, p.radius + 8);
          if (target && (!p.chain || !p.chain.hitSet.has(target))) {
            this.onHit(p, target, game);
            if (p.dead) continue;
          }
        } else {
          if (game.player && game.player.isVulnerable() &&
              VR.dist2(p.x, p.y, game.player.x, game.player.y) < (p.radius + game.player.radius) ** 2) {
            VR.combat.damagePlayer(p.damage, { source: p });
            pp.release(p); continue;
          }
        }

        // chain check on life end or when hitting nothing special — handled in onHit
      }
    },

    onWall(p) {
      VR.fx.burst({ x: p.x, y: p.y, color: p.color, count: 4, speed: 90, life: 0.25, size: 1.8 });
    },

    onHit(p, target, game) {
      // directional shield block (SENTINEL)
      if (target.blocksProjectileFrom && target.blocksProjectileFrom(p.x, p.y)) {
        VR.audio.play('shieldBlock');
        VR.fx.burst({ x: p.x, y: p.y, color: target.color, count: 6, speed: 120, life: 0.25, size: 2 });
        VR.fx.damageNumber(p.x, p.y - 10, 'BLOCKED', false, '#a06bff');
        this.pool.release(p);
        return;
      }
      const dmg = VR.combat.damageEnemy(target, p.damage, { crit: p.crit, knockback: p.knockback, source: p });
      const chain = p.chain;
      if (chain && chain.count > 0) {
        // find next target within range
        let best = null, bd = chain.range * chain.range;
        for (const e of game.enemies) {
          if (e.dead || e === target || chain.hitSet.has(e)) continue;
          const d2 = VR.dist2(p.x, p.y, e.x, e.y);
          if (d2 < bd) { bd = d2; best = e; }
        }
        if (best) {
          chain.hitSet.add(target);
          chain.count--;
          const ang = VR.angleTo(p.x, p.y, best.x, best.y);
          const sp = Math.hypot(p.vx, p.vy);
          this.spawn({
            x: p.x, y: p.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            radius: p.radius, damage: p.damage, crit: p.crit, friendly: true,
            color: p.color, pierce: 0, life: p.maxLife * 0.7, knockback: p.knockback, chain
          });
          // lightning visuals
          VR.fx.burst({ x: p.x, y: p.y, color: p.color, count: 6, speed: 140, life: 0.18, size: 2 });
          VR.fx.ring(best.x, best.y, p.color, 34, 0.6);
          VR.audio.play('chain');
        }
      }
      if (p.pierce > 0) {
        p.pierce--;
        p.chain && chain && chain.hitSet.add(target);
        return; // keep flying
      }
      this.pool.release(p);
    },

    releaseAll() { this.pool.releaseAll(); },

    render(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of this.pool.active) {
        const a = VR.clamp(p.life / p.maxLife, 0, 1);
        const ang = Math.atan2(p.vy, p.vx);
        const len = Math.hypot(p.vx, p.vy) * 0.028 + p.radius * 2;
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius * 2;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = a * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.5, 0, VR.TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  VR.projectiles = sys;
})();
