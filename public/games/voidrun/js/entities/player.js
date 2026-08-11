/* player.js — RIFT, the playable operative. */
(function () {
  'use strict';
  const VR = window.VR;

  /** Hull silhouettes: each is a list of [x, y] points for the ship outline. */
  const SHIP_SHAPES = [
    [[18, 0], [-11, -10], [-6, 0], [-11, 10]],                            // 0 classic arrow
    [[22, 0], [-9, -7], [-4, 0], [-9, 7]],                                // 1 needle (sleek)
    [[16, 0], [-3, -13], [-12, -6], [-12, 6], [-3, 13]],                  // 2 broad fighter
    [[20, 0], [-2, -9], [-14, -3], [-10, 0], [-14, 3], [-2, 9]],          // 3 angular dart
    [[17, 0], [-5, -8], [-16, -2], [-16, 2], [-5, 8]]                     // 4 heavy wedge
  ];

  /** Draw the ship hull at the current transform origin (caller rotates first). */
  VR.drawShip = function (ctx, app, shapeIdx) {
    const shape = SHIP_SHAPES[Math.abs(shapeIdx | 0) % SHIP_SHAPES.length];
    const g = ctx.createLinearGradient(-14, 0, 14, 0);
    g.addColorStop(0, app.hullDark || '#1a7fa8');
    g.addColorStop(0.6, app.hullMid || '#43e6ff');
    g.addColorStop(1, app.hullLight || '#eafcff');
    ctx.fillStyle = g;
    ctx.shadowColor = app.glow || '#43e6ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    shape.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1])));
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // cockpit
    ctx.fillStyle = app.cockpit || '#062033';
    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, VR.TAU);
    ctx.fill();
    // weapon barrel
    ctx.fillStyle = app.barrel || '#0b2b40';
    ctx.fillRect(14, -2.5, 8, 5);
  };

  VR.SHIP_SHAPES = SHIP_SHAPES;

  class Player {
    constructor() {
      this.x = 0; this.y = 0;
      this.vx = 0; this.vy = 0;
      this.radius = 15;
      this.aimAngle = 0;
      this.weaponId = 'pulse';
      this.dead = false;
      // visual customization (persisted in save data)
      this.appearance = Object.assign({}, VR.saveData.appearance || {});

      // mana + inventory (dungeon systems)
      this.maxMana = 100;
      this.mana = 100;
      this.manaRegen = 13;
      this.manaDelay = 1.2;
      this.manaTimer = 0;
      this.items = { potions: 0, bombs: 0, keys: 0 };
      this.novaCd = 0;

      this.stats = {
        maxHp: 100, armor: 0, maxShield: 25,
        moveSpeed: 262, damage: 1, attackSpeed: 1,
        critChance: 0.05, critDamage: 2,
        projSpeed: 1, projCount: 1, pierce: 0,
        chainChance: 0, chainCount: 3, chainRange: 300,
        meleeRange: 1, meleeArc: 150,
        dashCd: 1.4, dashDist: 265, dashCharges: 1, dashDamage: false,
        pickupRadius: 80, xpGain: 1, lifesteal: 0,
        explosionCrit: false, lowHpBonus: 1, knockbackMult: 1,
        shieldRegenMult: 1, shieldDelay: 3.2,
        critLeech: 0, killExplode: false, doubleFire: 0,
        thorns: 0, goldMult: 1, fireWake: 0,
        healMult: 1
      };
      this.hp = 100; this.shield = 0;

      // run-only loadout
      this.relics = [];          // passive relic pouch (RELIC_SLOTS max)
      this.orbits = [];          // void orbit blades (type 'orbit')
      this.frostTimer = 0;       // elite frost slow
      this.frostSlow = 0.6;

      this.level = 1; this.xp = 0; this.xpToNext = 24;
      this.upgrades = new Map(); // id -> stacks

      // dash state
      this.dashCharges = 1;
      this.dashCdTimer = 0;      // regen timer for a charge
      this.dashTimer = 0;        // active dash time
      this.dashDirX = 1; this.dashDirY = 0;
      this.dashTrailTimer = 0;

      this.fireCd = 0;
      this.hurtTimer = 0;        // brief post-hit invuln
      this.shieldDelayTimer = 0;
      this.shieldFlash = 0;
      this.muzzleTimer = 0;
      this.swing = null;         // active melee swing effect
      this.kills = 0;
      this.powerTimer = 0;       // temporary damage boost pickup
    }

    applyFrost(dur) { this.frostTimer = Math.max(this.frostTimer, dur); }

    /* ---------------- stats ---------------- */
    applyRunMods(r) {
      // r from meta progression
      this.stats.maxHp *= r.hpMult || 1;
      this.stats.damage *= r.dmgMult || 1;
      this.stats.xpGain *= r.xpMult || 1;
      this.stats.moveSpeed *= r.moveMult || 1;
      this.stats.dashCd *= r.dashCdMult || 1;
      this.stats.pickupRadius *= r.pickupMult || 1;
      this.hp = Math.round(this.stats.maxHp);
      this.shield = r.shieldStart || 0;
    }

    effectiveDamage() {
      let d = this.stats.damage;
      if (this.hp < this.stats.maxHp * 0.5) d *= this.stats.lowHpBonus;
      if (this.powerTimer > 0) d *= 1.5;
      return d;
    }

    isVulnerable() { return this.dashTimer <= 0 && this.hurtTimer <= 0; }

    /* ---------------- core update ---------------- */
    update(dt, game) {
      const inp = VR.input;
      this.fireCd -= dt;
      if (this.hurtTimer > 0) this.hurtTimer -= dt;
      if (this.muzzleTimer > 0) this.muzzleTimer -= dt;
      if (this.frostTimer > 0) this.frostTimer -= dt;

      // aim
      const wx = inp.worldX, wy = inp.worldY;
      if (wx !== undefined) this.aimAngle = VR.angleTo(this.x, this.y, wx, wy);

      // dash
      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        const sp = this.stats.dashDist / 0.16;
        this.vx = this.dashDirX * sp;
        this.vy = this.dashDirY * sp;
        this.dashTrailTimer -= dt;
        if (this.dashTrailTimer <= 0) {
          this.dashTrailTimer = 0.014;
          VR.fx.trail(this.x, this.y, this.appearance.trail || '#43e6ff', 7);
          VR.fx.trail(this.x, this.y, this.appearance.trail2 || '#a06bff', 4);
        }
        // voidstep / wildfire wake: damage enemies passed through
        if (this.stats.dashDamage || this.stats.fireWake) {
          const wake = this.stats.fireWake > 0 && !this.stats.dashDamage;
          for (const e of game.enemies) {
            if (e.dead || e.dashHitCd > 0) continue;
            if (VR.dist2(this.x, this.y, e.x, e.y) < (this.radius + e.radius + 6) ** 2) {
              e.dashHitCd = 0.18;
              VR.combat.damageEnemy(e, this.effectiveDamage() * 0.6, { knockback: 320, source: this });
              if (wake) {
                VR.fx.burst({ x: e.x, y: e.y, color: '#ff8a3d', count: 4, speed: 100, life: 0.25, size: 2 });
              }
            }
          }
        }
      } else if (this.dashCdTimer > 0) {
        this.dashCdTimer -= dt;
        if (this.dashCdTimer <= 0 && this.dashCharges < this.stats.dashCharges) {
          this.dashCharges++;
          this.dashCdTimer = this.stats.dashCd;
        }
      }

      // movement (not while dashing)
      if (this.dashTimer <= 0) {
        let mx = 0, my = 0;
        if (inp.held('KeyW')) my -= 1;
        if (inp.held('KeyS')) my += 1;
        if (inp.held('KeyA')) mx -= 1;
        if (inp.held('KeyD')) mx += 1;
        if (mx || my) {
          const len = Math.hypot(mx, my);
          mx /= len; my /= len;
          const sp = this.stats.moveSpeed * (this.frostTimer > 0 ? this.frostSlow : 1);
          this.vx = VR.approach(this.vx, mx * sp, 2600 * dt);
          this.vy = VR.approach(this.vy, my * sp, 2600 * dt);
        } else {
          this.vx = VR.approach(this.vx, 0, 2600 * dt);
          this.vy = VR.approach(this.vy, 0, 2600 * dt);
        }
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const res = game.resolveSolids(this.x, this.y, this.radius);
      this.x = res.x; this.y = res.y;
      game.clampToRoom(this);

      // dash input
      if ((inp.wasPressed('Space') || inp.wasPressed('ShiftLeft') || inp.wasPressed('ShiftRight')) && this.dashTimer <= 0 && this.dashCharges > 0) {
        this.tryDash(game);
      }

      // fire
      if (this.fireCd <= 0 && inp.down) this.fire(game);
      this.updateOrbits(dt, game);
      if (this.swing) { this.swing.t -= dt; if (this.swing.t <= 0) this.swing = null; }

      // dungeon abilities & items
      if (inp.wasPressed('KeyQ') || inp.wasPressed('MouseRight')) this.nova(game);
      if (inp.wasPressed('Digit2')) this.usePotion(game);
      if (inp.wasPressed('Digit3')) this.useBomb(game);
      if (inp.wasPressed('KeyE')) game.tryInteract();

      // shield regen
      if (this.shieldDelayTimer > 0) this.shieldDelayTimer -= dt;
      else if (this.shield < this.stats.maxShield) {
        this.shield = Math.min(this.stats.maxShield, this.shield + 14 * this.stats.shieldRegenMult * dt);
      }
      if (this.shieldFlash > 0) this.shieldFlash -= dt;
      if (this.powerTimer > 0) this.powerTimer -= dt;

      // mana regen
      if (this.manaTimer > 0) this.manaTimer -= dt;
      else this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * dt);
      if (this.novaCd > 0) this.novaCd -= dt;
    }

    /* ---------------- dungeon abilities ---------------- */
    nova(game) {
      if (this.novaCd > 0 || this.mana < 25) return;
      this.mana -= 25;
      this.manaTimer = this.manaDelay;
      this.novaCd = 0.8;
      const R = 140;
      VR.audio.play('explosion');
      VR.fx.shake(0.4);
      VR.fx.ring(this.x, this.y, this.appearance.glow || '#ffb84d', R, 1);
      VR.fx.burst({ x: this.x, y: this.y, color: this.appearance.glow || '#ffb84d', count: 20, speed: 240, life: 0.4, size: 3 });
      for (const e of game.enemies.slice()) {
        if (e.dead) continue;
        if (VR.dist2(this.x, this.y, e.x, e.y) < R * R) {
          VR.combat.damageEnemy(e, 22 * this.effectiveDamage(), { knockback: 420, source: this });
        }
      }
      for (const b of game.barrels.slice()) {
        if (b.dead) continue;
        if (VR.dist2(this.x, this.y, b.x, b.y) < (R + b.r) ** 2) b.hp = 0;
      }
    }

    usePotion(game) {
      if (this.items.potions <= 0) return;
      this.items.potions--;
      if (VR.game.run) VR.game.run.potionsUsed++;
      this.heal(35);
      VR.audio.play('pickup.health');
      VR.fx.floatText(this.x, this.y - 26, '+35 HP', '#7dff9e');
      VR.fx.ring(this.x, this.y, '#7dff9e', 36, 0.7);
    }

    useBomb(game) {
      if (this.items.bombs <= 0) return;
      this.items.bombs--;
      if (VR.game.run) VR.game.run.bombsUsed++;
      const a = Math.atan2(VR.input.worldY - this.y, VR.input.worldX - this.x);
      game.bombs.push({ x: this.x + Math.cos(a) * 40, y: this.y + Math.sin(a) * 40, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, t: 1.1, r: 12 });
      VR.audio.play('charge');
    }

    /* ---------------- weapon helper (mana cost display) ---------------- */
    manaPct() { return this.mana / this.maxMana; }

    tryDash(game) {
      const inp = VR.input;
      let dx = 0, dy = 0;
      if (inp.held('KeyW')) dy -= 1;
      if (inp.held('KeyS')) dy += 1;
      if (inp.held('KeyA')) dx -= 1;
      if (inp.held('KeyD')) dx += 1;
      if (!dx && !dy) { dx = Math.cos(this.aimAngle); dy = Math.sin(this.aimAngle); }
      const len = Math.hypot(dx, dy); dx /= len; dy /= len;

      this.dashDirX = dx; this.dashDirY = dy;
      this.dashTimer = 0.16;
      this.dashCharges--;
      if (this.dashCharges <= 0) {
        this.dashCdTimer = this.stats.dashCd;
        this.dashCharges = 0;
      } else {
        this.dashCdTimer = 0;
      }
      this.hurtTimer = 0;
      VR.audio.play('dash');
      VR.fx.shake(0.25);
      VR.fx.burst({ x: this.x, y: this.y, color: this.appearance.glow || '#43e6ff', count: 14, speed: 180, life: 0.3, size: 3 });
      VR.fx.ring(this.x, this.y, this.appearance.glow || '#43e6ff', 40, 0.7);
    }

    /* ---------------- weapons ---------------- */
    fire(game) {
      const def = VR.data.weaponById[this.weaponId];
      const st = this.stats;
      this.fireCd = def.fireRate / st.attackSpeed;
      const doubles = (st.doubleFire || 0) > 0 && Math.random() < st.doubleFire;

      if (def.type === 'boomerang') { this.throwBoomerang(game, def); if (doubles) this.throwBoomerang(game, def); return; }
      if (def.type === 'deploy') { this.deployTurret(game, def); if (doubles) this.deployTurret(game, def); return; }
      if (def.type === 'orbit') { this.addOrbit(game, def); if (doubles) this.addOrbit(game, def); return; }
      if (def.type === 'melee') { this.meleeAttack(game, def); if (doubles) this.meleeAttack(game, def); return; }

      const shootOnce = () => {
        const baseDmg = def.damage * this.effectiveDamage();
        const crit = Math.random() < st.critChance;
        const dmg = baseDmg * (crit ? st.critDamage : 1);
        const sp = def.projSpeed * st.projSpeed;
        const kb = def.knockback * (st.knockbackMult || 1);

        let count;
        if (def.type === 'burst') count = def.pellets * st.projCount;
        else count = st.projCount;

        const chainRoll = st.chainChance > 0 && Math.random() < st.chainChance;

        for (let i = 0; i < count; i++) {
          let ang = this.aimAngle;
          if (def.type === 'burst') {
            const half = def.spread / 2;
            ang = this.aimAngle + VR.lerp(-half, half, count === 1 ? 0.5 : i / (count - 1));
          } else {
            ang = this.aimAngle + VR.randRange(-def.spread, def.spread) * 0.5 * Math.PI / 180;
            if (count > 1) {
              const fan = (i - (count - 1) / 2) * 3.2 * Math.PI / 180;
              ang += fan;
            }
          }
          VR.projectiles.spawn({
            x: this.x + Math.cos(this.aimAngle) * (this.radius + 10),
            y: this.y + Math.sin(this.aimAngle) * (this.radius + 10),
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            radius: def.size, damage: dmg, crit, friendly: true,
            color: def.color, pierce: st.pierce,
            life: def.lifetime, knockback: kb,
            chain: (def.type === 'chain' || chainRoll) ? { count: def.chainCount || st.chainCount, range: def.chainRange || st.chainRange, hitSet: new Set() } : null
          });
        }
      };
      shootOnce();
      if (doubles) shootOnce();

      this.muzzleTimer = 0.05;
      const tipX = this.x + Math.cos(this.aimAngle) * (this.radius + 12);
      const tipY = this.y + Math.sin(this.aimAngle) * (this.radius + 12);
      VR.fx.burst({ x: tipX, y: tipY, color: def.color, count: 3, speed: 120, life: 0.12, size: 2.2, dir: this.aimAngle, spread: 0.5 });
      VR.audio.play('shoot.' + def.id);
      VR.fx.shake(0.08);
    }

    throwBoomerang(game, def) {
      const st = this.stats;
      const crit = Math.random() < st.critChance;
      const dmg = def.damage * this.effectiveDamage() * (crit ? st.critDamage : 1);
      const sp = def.projSpeed * st.projSpeed;
      const a = this.aimAngle;
      VR.projectiles.spawn({
        x: this.x + Math.cos(a) * (this.radius + 10),
        y: this.y + Math.sin(a) * (this.radius + 10),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        radius: def.size, damage: dmg, crit, friendly: true,
        color: def.color, pierce: 0, life: def.lifetime,
        knockback: def.knockback * (st.knockbackMult || 1),
        boomerang: { t: 0, returnT: Math.min(1.15, def.lifetime * 0.42) }
      });
      VR.fx.burst({ x: this.x + Math.cos(a) * 22, y: this.y + Math.sin(a) * 22, color: def.color, count: 4, speed: 130, life: 0.14, size: 2.2, dir: a, spread: 0.4 });
      VR.audio.play('shoot.boomerang');
    }

    deployTurret(game, def) {
      const st = this.stats;
      const turrets = game.turrets;
      if (turrets.length >= 3) turrets.shift();
      const b = game.currentRoom.bounds;
      const wx = VR.input.worldX, wy = VR.input.worldY;
      let x = VR.clamp(wx !== undefined ? wx : this.x, b.x + 70, b.x2 - 70);
      let y = VR.clamp(wy !== undefined ? wy : this.y, 70, b.y2 - 70);
      if (game.collideSolids(x, y, 16)) {
        for (let tries = 0; tries < 24; tries++) {
          const a = Math.random() * VR.TAU;
          const nx = VR.clamp(x + Math.cos(a) * 46, b.x + 70, b.x2 - 70);
          const ny = VR.clamp(y + Math.sin(a) * 46, 70, b.y2 - 70);
          if (!game.collideSolids(nx, ny, 16)) { x = nx; y = ny; break; }
        }
      }
      turrets.push({
        x, y, life: def.lifetime, fireCd: 0.15,
        dmg: def.damage * this.effectiveDamage(), kb: def.knockback * (st.knockbackMult || 1),
        color: def.color, radius: 16, rot: 0
      });
      VR.audio.play('deploy');
      VR.fx.ring(x, y, def.color, 40, 0.6);
      VR.fx.burst({ x, y, color: def.color, count: 10, speed: 150, life: 0.3, size: 2.5 });
    }

    addOrbit(game, def) {
      const st = this.stats;
      if (this.orbits.length >= 5) this.orbits.shift();
      const crit = Math.random() < st.critChance;
      const dmg = def.damage * this.effectiveDamage() * (crit ? st.critDamage : 1);
      const base = this.orbits.length ? this.orbits[this.orbits.length - 1].angle : this.aimAngle;
      this.orbits.push({
        t: def.lifetime, angle: base + Math.PI / 2.2,
        r: 85 * (st.meleeRange || 1), spin: 3.6,
        dmg, crit, size: def.size + 2, kb: def.knockback * (st.knockbackMult || 1),
        color: def.color, x: this.x, y: this.y
      });
      VR.audio.play('shoot.orbit');
    }

    updateOrbits(dt, game) {
      for (let i = this.orbits.length - 1; i >= 0; i--) {
        const o = this.orbits[i];
        o.t -= dt;
        if (o.t <= 0) { this.orbits.splice(i, 1); continue; }
        o.angle += o.spin * dt;
        o.x = this.x + Math.cos(o.angle) * o.r;
        o.y = this.y + Math.sin(o.angle) * o.r;
        if (Math.random() < dt * 8) VR.fx.trail(o.x, o.y, o.color, 2.5);
        for (const e of game.enemies) {
          if (e.dead || e.orbCd > 0) continue;
          if (VR.dist2(o.x, o.y, e.x, e.y) < (o.size + e.radius) ** 2) {
            e.orbCd = 0.4;
            VR.combat.damageEnemy(e, o.dmg, { crit: o.crit, knockback: o.kb, source: this });
          }
        }
      }
    }

    /** Try to add a relic to the pouch. Returns true if equipped. */
    addRelic(relicDef) {
      if (this.relics.length >= VR.data.RELIC_SLOTS) return false;
      relicDef.apply(this);
      this.relics.push(relicDef);
      return true;
    }

    meleeAttack(game, def) {
      const st = this.stats;
      const range = def.range * st.meleeRange;
      const halfArc = (def.arc * Math.PI / 180) / 2;
      const crit = Math.random() < st.critChance;
      const dmg = def.damage * this.effectiveDamage() * (crit ? st.critDamage : 1);
      const kb = def.knockback * (st.knockbackMult || 1);

      this.swing = { t: 0.14, max: 0.14, angle: this.aimAngle, arc: def.arc, range, color: def.color };

      for (const e of game.enemies) {
        if (e.dead) continue;
        const d = VR.dist(this.x, this.y, e.x, e.y);
        if (d > range + e.radius) continue;
        if (e.blocksMeleeFrom && e.blocksMeleeFrom(this.x, this.y)) {
          VR.audio.play('shieldBlock');
          VR.fx.burst({ x: e.x, y: e.y, color: e.color, count: 5, speed: 100, life: 0.2, size: 2 });
          VR.fx.damageNumber(e.x, e.y - e.radius - 6, 'BLOCKED', false, '#a06bff');
          continue;
        }
        let a = VR.angleTo(this.x, this.y, e.x, e.y);
        if (Math.abs(((a - this.aimAngle + Math.PI * 3) % VR.TAU) - Math.PI) > halfArc) continue;
        VR.combat.damageEnemy(e, dmg, { crit, knockback: kb, source: this });
      }
      // damage barrels too
      for (const b of game.barrels) {
        if (b.dead) continue;
        if (VR.dist(this.x, this.y, b.x, b.y) > range + 14) continue;
        VR.combat.damageEnemy(b, dmg, { crit, knockback: 200, source: this });
      }

      VR.fx.burst({ x: this.x + Math.cos(this.aimAngle) * range * 0.6, y: this.y + Math.sin(this.aimAngle) * range * 0.6, color: def.color, count: 8, speed: 220, life: 0.2, size: 3, dir: this.aimAngle, spread: 1.4 });
      VR.audio.play('shoot.blade');
      VR.fx.shake(0.16);
    }

    /* ---------------- damage & xp ---------------- */
    damage(amount, opts) {
      if (this.dead) return;
      if (!this.isVulnerable()) { VR.audio.play('shieldBlock'); return; }
      let remaining = amount;
      if (this.shield > 0) {
        const absorbed = Math.min(this.shield, remaining);
        this.shield -= absorbed;
        remaining -= absorbed;
        this.shieldFlash = 0.25;
        VR.audio.play('hurt.shield');
        VR.fx.burst({ x: this.x, y: this.y, color: this.appearance.shield || '#43e6ff', count: 6, speed: 140, life: 0.2, size: 2 });
      }
      remaining = Math.max(1, remaining - this.stats.armor);
      this.hp -= remaining;
      this.hurtTimer = 0.4;
      this.shieldDelayTimer = this.stats.shieldDelay;
      VR.fx.damageNumber(this.x, this.y - 20, remaining, false, '#ff5c7a');
      VR.fx.shake(0.5);
      VR.audio.play('hurt');
      VR.fx.burst({ x: this.x, y: this.y, color: '#ff5c7a', count: 8, speed: 160, life: 0.3, size: 2.5 });
      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
      }
    }

    gainXp(amount, game) {
      this.xp += amount * this.stats.xpGain;
      let leveled = false;
      while (this.xp >= this.xpToNext) {
        this.xp -= this.xpToNext;
        this.level++;
        this.xpToNext = Math.floor(24 + this.level * 11 + this.level * this.level * 2.1);
        leveled = true;
      }
      if (leveled) game.onLevelUp();
    }

    heal(amount) {
      this.hp = Math.min(this.stats.maxHp, this.hp + amount * (this.stats.healMult || 1));
    }

    /* ---------------- render ---------------- */
    render(ctx) {
      const st = this.stats;
      const flicker = this.dashTimer > 0 || (this.hurtTimer > 0 && Math.floor(this.hurtTimer * 20) % 2 === 0);
      const t = (VR.game && VR.game.time) || 0;

      ctx.save();
      ctx.translate(this.x, this.y);

      // shield bubble
      if (this.shield > 0) {
        ctx.globalAlpha = 0.3 + this.shieldFlash * 1.2;
        ctx.strokeStyle = this.appearance.shield || '#43e6ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = this.appearance.shield || '#43e6ff'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(0, 0, this.radius + 8, 0, VR.TAU); ctx.stroke();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }

      // low mana / power glow
      if (this.powerTimer > 0) {
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 8);
        ctx.fillStyle = '#ffb84d';
        ctx.beginPath(); ctx.arc(0, 0, this.radius + 7, 0, VR.TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (flicker) ctx.globalAlpha = 0.5;

      ctx.rotate(this.aimAngle);
      VR.pixel.character(ctx, this.appearance, this.appearance.hairStyle || 0, 1.5);
      ctx.restore();

      // frost slow indicator
      if (this.frostTimer > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4 + 0.25 * Math.sin(t * 14);
        ctx.strokeStyle = '#43e6ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#43e6ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 7, 0, VR.TAU); ctx.stroke();
        ctx.restore();
      }

      // void orbits
      for (const o of this.orbits) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = o.color;
        ctx.shadowColor = o.color; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, o.size * 0.6, 0, VR.TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(0, 0, o.size * 0.25, 0, VR.TAU); ctx.fill();
        ctx.restore();
      }

      // muzzle flash
      if (this.muzzleTimer > 0 && this.weaponId !== 'blade') {
        const tipX = this.x + Math.cos(this.aimAngle) * 24;
        const tipY = this.y + Math.sin(this.aimAngle) * 24;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.muzzleTimer / 0.05;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.appearance.glow || '#ffb84d'; ctx.shadowBlur = 12;
        ctx.fillRect(tipX - 3, tipY - 3, 7, 7);
        ctx.restore();
      }

      // melee swing
      if (this.swing) {
        const sw = this.swing;
        const prog = 1 - sw.t / sw.max;
        const a0 = sw.angle - sw.arc * Math.PI / 180 / 2 + prog * sw.arc * Math.PI / 180 * 0.9;
        ctx.save();
        ctx.globalAlpha = 0.6 * (1 - prog);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, sw.range, a0, a0 + sw.arc * Math.PI / 180 * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  }

  VR.Player = Player;
})();
