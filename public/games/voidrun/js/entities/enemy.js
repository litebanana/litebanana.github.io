/* enemy.js — modular enemy AI. Base state machine + behavior subclasses. */
(function () {
  'use strict';
  const VR = window.VR;

  class Enemy {
    constructor(def, x, y, opts) {
      opts = opts || {};
      this.def = def;
      this.id = def.id;
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.radius = def.radius * (opts.elite ? 1.45 : 1);
      this.elite = !!opts.elite;
      this.hpMult = opts.hpMult || 1;
      this.dmgMult = opts.dmgMult || 1;

      this.maxHp = Math.round(def.hp * this.hpMult * (this.elite ? 4.2 : 1));
      this.hp = this.maxHp;
      this.speedMult = opts.speedMult || 1;          // difficulty hunt speed
      this.contactCdMult = opts.contactCdMult || 1;   // difficulty attack rate
      this.speed = def.speed * (this.elite ? 1.06 : 1) * this.speedMult;
      this.contact = Math.round(def.contact * this.dmgMult * (this.elite ? 1.7 : 1));
      this.xp = Math.round(def.xp * (this.elite ? 12 : 1));
      this.shardChance = this.elite ? 1 : def.shardChance;
      this.color = def.color;
      this.name = (this.elite ? 'ELITE ' : '') + def.name;

      this.state = 'idle';
      this.stateTimer = 0;
      this.flash = 0;
      this.kbx = 0; this.kby = 0;
      this.hitCd = 0;         // contact-damage cooldown vs player
      this.dashHitCd = 0;     // voidstep per-enemy cooldown
      this.dead = false;
      this.deathTimer = 0;
      this.auraTimer = 0;
      this.aimAngle = 0;
      this.misc = {};
      this.spawnDelay = 0;
      this.orbCd = 0;         // void-orbit per-enemy hit cooldown
      this.splits = opts.splits || 0;   // how many times this enemy has split
      this.miniDrop = !!opts.miniDrop;  // reduced rewards (split minis)
      this.exploded = false;
      this.eliteMod = opts.eliteMod || null;
      if (this.elite && !this.eliteMod) {
        const mroll = Math.random();
        if (mroll < 0.35) this.eliteMod = 'vampiric';
        else if (mroll < 0.6) this.eliteMod = 'frost';
      }
      this.onSpawn();
    }

    onSpawn() { this.setState(this.initialState()); }

    initialState() {
      switch (this.def.behavior) {
        case 'drone': case 'swarm': case 'splitter': case 'exploder': return 'chase';
        case 'shooter': return 'keep';
        case 'charger': case 'brute': return 'idle';
        case 'shield': return 'approach';
        default: return 'chase';
      }
    }

    setState(s) { this.state = s; this.stateTimer = 0; }

    update(dt, game) {
      if (this.dead) {
        if (this.deathTimer > 0) this.deathTimer -= dt;
        return;
      }
      if (this.spawnDelay > 0) { this.spawnDelay -= dt; return; }
      if (this.flash > 0) this.flash -= dt;
      if (this.hitCd > 0) this.hitCd -= dt;
      if (this.dashHitCd > 0) this.dashHitCd -= dt;
      if (this.auraTimer > 0) this.auraTimer -= dt;
      if (this.orbCd > 0) this.orbCd -= dt;

      // knockback decay
      const decay = Math.pow(0.0001, dt);
      this.kbx *= decay; this.kby *= decay;

      // behavior-specific state machine
      this.think(dt, game);

      // integrate movement (knockback + own velocity)
      this.x += (this.vx + this.kbx) * dt;
      this.y += (this.vy + this.kby) * dt;
      const res = game.resolveSolids(this.x, this.y, this.radius);
      this.x = res.x; this.y = res.y;

      // contact damage
      if (this.contact > 0 && this.hitCd <= 0 && game.player && !game.player.dead && game.player.isVulnerable() &&
          VR.dist2(this.x, this.y, game.player.x, game.player.y) < (this.radius + game.player.radius) ** 2) {
        this.hitCd = 0.6 * this.contactCdMult;
        VR.combat.damagePlayer(this.contact, { source: this });
        this.onTouchedPlayer(game);
        // self knockback (bounce)
        const a = VR.angleTo(game.player.x, game.player.y, this.x, this.y);
        this.kbx += Math.cos(a) * 260; this.kby += Math.sin(a) * 260;
      }
    }

    /** Elite modifier hooks when this enemy damages the player. */
    onTouchedPlayer(game) {
      if (!this.elite || !this.eliteMod || !game.player) return;
      if (this.eliteMod === 'frost') {
        game.player.applyFrost(1.6);
        VR.fx.floatText(game.player.x, game.player.y - 30, 'FROST', '#43e6ff');
      } else if (this.eliteMod === 'vampiric') {
        const healAmt = Math.max(2, Math.round(this.maxHp * 0.12));
        this.hp = Math.min(this.maxHp, this.hp + healAmt);
        VR.fx.floatText(this.x, this.y - this.radius - 16, '+' + healAmt, '#ff5c7a');
        VR.fx.burst({ x: this.x, y: this.y, color: '#ff5c7a', count: 4, speed: 80, life: 0.3, size: 2 });
      }
    }

    /* ---- behaviors ---- */
    think(dt, game) {
      const p = game.player;
      if (!p || p.dead) { this.vx = 0; this.vy = 0; return; }
      switch (this.def.behavior) {
        case 'drone': case 'splitter': this.bDrone(dt, game); break;
        case 'swarm': this.bSwarm(dt, game); break;
        case 'shooter': this.bShooter(dt, game); break;
        case 'charger': this.bCharger(dt, game); break;
        case 'shield': this.bShield(dt, game); break;
        case 'exploder': this.bExploder(dt, game); break;
        case 'brute': this.bBrute(dt, game); break;
      }
      this.separate(dt, game);
    }

    moveToward(dt, p, speed, accel) {
      const a = VR.angleTo(this.x, this.y, p.x, p.y);
      this.aimAngle = a;
      const sp = speed || this.speed;
      const acc = accel || 900;
      const tx = Math.cos(a) * sp, ty = Math.sin(a) * sp;
      this.vx = VR.approach(this.vx, tx, acc * dt);
      this.vy = VR.approach(this.vy, ty, acc * dt);
    }

    separate(dt, game) {
      for (const o of game.enemies) {
        if (o === this || o.dead) continue;
        const rr = this.radius + o.radius;
        const d2 = VR.dist2(this.x, this.y, o.x, o.y);
        if (d2 > 0.01 && d2 < rr * rr) {
          const d = Math.sqrt(d2);
          const push = (rr - d) / d;
          this.x += (this.x - o.x) * push * 0.5;
          this.y += (this.y - o.y) * push * 0.5;
        }
      }
    }

    bDrone(dt, game) { this.moveToward(dt, game.player); }

    bExploder(dt, game) {
      const def = this.def;
      const p = game.player;
      this.stateTimer += dt;
      const d = p ? VR.dist(this.x, this.y, p.x, p.y) : 9999;
      if (this.state === 'chase') {
        this.moveToward(dt, p, this.speed * 0.85);
        if (p && d < (def.fuseDist || 130) + this.radius + p.radius) this.setState('telegraph');
      } else if (this.state === 'telegraph') {
        this.vx = 0; this.vy = 0;
        this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);
        if (this.stateTimer > (def.telegraph || 0.85)) this.explode(game, 1);
      }
    }

    explode(game, mult) {
      if (this.exploded) return;
      this.exploded = true;
      // bound chain reactions (exploder -> kill -> explode recursion)
      if ((game._explodeDepth || 0) > 6) {
        this.dead = true;
        this.deathTimer = 0.25;
        return;
      }
      const def = this.def;
      const R = def.explodeRange || 150;
      const dmg = (def.explodeDmg || 26) * this.dmgMult * (mult || 1);
      VR.fx.shake(0.45);
      VR.fx.flash('#ff8a3d', 0.14);
      VR.audio.play('explosion');
      VR.fx.burst({ x: this.x, y: this.y, color: '#ff8a3d', count: 26, speed: 250, life: 0.45, size: 3.5 });
      VR.fx.burst({ x: this.x, y: this.y, color: '#ffd97a', count: 12, speed: 170, life: 0.3, size: 2.5 });
      VR.fx.ring(this.x, this.y, '#ff8a3d', R, 0.9);
      if (game.player && !game.player.dead && VR.dist2(this.x, this.y, game.player.x, game.player.y) < (R + game.player.radius) ** 2) {
        VR.combat.damagePlayer(dmg, { source: this });
      }
      game._explodeDepth = (game._explodeDepth || 0) + 1;
      for (const e of game.enemies.slice()) {
        if (e === this || e.dead) continue;
        if (VR.dist2(this.x, this.y, e.x, e.y) < R * R) {
          VR.combat.damageEnemy(e, dmg * 0.8, { knockback: 320, source: this });
        }
      }
      game._explodeDepth--;
      for (const b of game.barrels.slice()) {
        if (!b.dead && VR.dist2(this.x, this.y, b.x, b.y) < (R + b.r) ** 2) b.hp = 0;
      }
      this.dead = true;
      this.deathTimer = 0.25;
      this.dropRewards();
    }

    bBrute(dt, game) {
      const def = this.def;
      const p = game.player;
      this.stateTimer += dt;
      if (this.state === 'idle') {
        this.moveToward(dt, p, this.speed);
        if (p && this.stateTimer > (def.slamCd || 3.2) && VR.dist(this.x, this.y, p.x, p.y) < 280) {
          this.setState('telegraph');
        }
      } else if (this.state === 'telegraph') {
        this.vx = 0; this.vy = 0;
        this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);
        if (this.stateTimer > 0.7) { this.setState('slam'); this.slam(game); }
      } else if (this.state === 'slam') {
        this.vx = 0; this.vy = 0;
        if (this.stateTimer > 0.4) { this.setState('idle'); this.stateTimer = 0; }
      }
    }

    slam(game) {
      const def = this.def;
      const R = def.slamRange || 210;
      VR.fx.shake(0.5);
      VR.audio.play('slam');
      VR.fx.ring(this.x, this.y, '#ffb84d', R, 0.8);
      VR.fx.burst({ x: this.x, y: this.y, color: '#a8804f', count: 18, speed: 220, life: 0.4, size: 3 });
      if (game.player && !game.player.dead && VR.dist2(this.x, this.y, game.player.x, game.player.y) < (R + game.player.radius) ** 2) {
        VR.combat.damagePlayer((def.slamDmg || 20) * this.dmgMult, { source: this });
        this.onTouchedPlayer(game);
      }
    }

    bSwarm(dt, game) {
      this.stateTimer += dt;
      const wob = Math.sin(this.stateTimer * 7) * 40;
      const a = VR.angleTo(this.x, this.y, game.player.x, game.player.y);
      const sp = this.speed;
      this.vx = VR.approach(this.vx, Math.cos(a) * sp - Math.sin(a) * wob, 1400 * dt);
      this.vy = VR.approach(this.vy, Math.sin(a) * sp + Math.cos(a) * wob, 1400 * dt);
      this.aimAngle = a;
    }

    bShooter(dt, game) {
      const def = this.def;
      const p = game.player;
      const d = VR.dist(this.x, this.y, p.x, p.y);
      const [keepMin, keepMax] = def.keepDist || [340, 520];
      this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);

      this.stateTimer += dt;
      if (this.state === 'keep') {
        // strafe + maintain distance
        let tx = 0, ty = 0;
        if (d < keepMin) { const a = VR.angleTo(p.x, p.y, this.x, this.y); tx = Math.cos(a); ty = Math.sin(a); }
        else if (d > keepMax) { const a = VR.angleTo(this.x, this.y, p.x, p.y); tx = Math.cos(a); ty = Math.sin(a); }
        // strafe
        const side = this.misc.side || 1;
        tx += Math.cos(this.aimAngle + Math.PI / 2) * side * 0.6;
        ty += Math.sin(this.aimAngle + Math.PI / 2) * side * 0.6;
        const len = Math.hypot(tx, ty) || 1;
        this.vx = VR.approach(this.vx, (tx / len) * this.speed * 0.8, 500 * dt);
        this.vy = VR.approach(this.vy, (ty / len) * this.speed * 0.8, 500 * dt);
        if (this.stateTimer > def.fireRate && d < keepMax + 60) {
          if (Math.random() < 0.35) this.misc.side = -this.misc.side;
          this.setState('telegraph');
        }
      } else if (this.state === 'telegraph') {
        this.vx = 0; this.vy = 0;
        if (this.stateTimer > 0.35) {
          this.setState('fire');
          this.fireProjectile(game);
        }
      } else if (this.state === 'fire') {
        this.vx = 0; this.vy = 0;
        if (this.stateTimer > 0.15) this.setState('keep'), this.stateTimer = 0;
      }
    }

    fireProjectile(game) {
      const def = this.def;
      const a = VR.angleTo(this.x, this.y, game.player.x, game.player.y);
      const sp = (def.projSpeed || 320) * this.speedMult;
      VR.projectiles.spawn({
        x: this.x + Math.cos(a) * (this.radius + 8),
        y: this.y + Math.sin(a) * (this.radius + 8),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        radius: 5, damage: (def.projDmg || 9) * this.dmgMult,
        friendly: false, color: '#ff8a3d',
        life: 2.4, knockback: 0
      });
      VR.fx.burst({ x: this.x, y: this.y, color: '#ff8a3d', count: 4, speed: 90, life: 0.2, size: 2 });
      VR.audio.play('enemyShoot');
    }

    bCharger(dt, game) {
      const def = this.def;
      const p = game.player;
      this.stateTimer += dt;
      if (this.state === 'idle') {
        this.moveToward(dt, p, this.speed * 0.55);
        if (this.stateTimer > 0.5) this.setState('telegraph');
      } else if (this.state === 'telegraph') {
        this.vx = 0; this.vy = 0;
        this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);
        this.misc.tgX = Math.cos(this.aimAngle); this.misc.tgY = Math.sin(this.aimAngle);
        if (this.stateTimer > (def.telegraph || 0.75)) {
          this.setState('charge');
          VR.audio.play('charge');
          VR.fx.shake(0.12);
        }
      } else if (this.state === 'charge') {
        const sp = (def.chargeSpeed || 620) * this.speedMult;
        this.vx = VR.approach(this.vx, this.misc.tgX * sp, 4000 * dt);
        this.vy = VR.approach(this.vy, this.misc.tgY * sp, 4000 * dt);
        // wall hit check: does the projected position collide?
        const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
        if (game.pointInSolids(nx + Math.sign(this.vx) * this.radius, ny + Math.sign(this.vy) * this.radius, this.radius * 0.8)) {
          this.setState('recover');
          VR.fx.burst({ x: this.x, y: this.y, color: this.color, count: 8, speed: 160, life: 0.3, size: 2.5 });
        }
        if (this.stateTimer > 1.4) this.setState('recover');
      } else if (this.state === 'recover') {
        this.vx = VR.approach(this.vx, 0, 600 * dt);
        this.vy = VR.approach(this.vy, 0, 600 * dt);
        if (this.stateTimer > 0.6) this.setState('idle'), this.stateTimer = 0;
      }
      // extra damage while charging
      if (this.state === 'charge' && this.hitCd <= 0 && game.player && game.player.isVulnerable() &&
          VR.dist2(this.x, this.y, p.x, p.y) < (this.radius + p.radius) ** 2) {
        this.hitCd = 0.8 * this.contactCdMult;
        VR.combat.damagePlayer(def.chargeDmg || 22, { source: this });
        this.onTouchedPlayer(game);
      }
    }

    bShield(dt, game) {
      const def = this.def;
      const p = game.player;
      this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);
      this.stateTimer += dt;
      if (this.state === 'approach') {
        const d = VR.dist(this.x, this.y, p.x, p.y);
        if (d > 200) this.moveToward(dt, p, this.speed);
        else { this.vx = VR.approach(this.vx, 0, 800 * dt); this.vy = VR.approach(this.vy, 0, 800 * dt); }
        if (this.stateTimer > 2.2 && d < 260) this.setState('telegraph'), this.stateTimer = 0;
      } else if (this.state === 'telegraph') {
        this.vx = 0; this.vy = 0;
        if (this.stateTimer > 0.5) { this.setState('swing'); this.swingAttack(game); }
      } else if (this.state === 'swing') {
        this.vx = 0; this.vy = 0;
        if (this.stateTimer > 0.25) this.setState('approach'), this.stateTimer = 0;
      }
    }

    swingAttack(game) {
      const a = this.aimAngle;
      if (game.player && VR.dist(this.x, this.y, game.player.x, game.player.y) < 150) {
        VR.combat.damagePlayer(this.contact * 1.4, { source: this });
      }
      VR.fx.burst({ x: this.x + Math.cos(a) * 40, y: this.y + Math.sin(a) * 40, color: this.color, count: 6, speed: 150, life: 0.2, size: 2.5, dir: a, spread: 1.2 });
      VR.audio.play('shoot.blade');
    }

    /** Directional shield blocking. */
    blocksProjectileFrom(px, py) {
      if (this.def.behavior !== 'shield' || this.state === 'swing') return false;
      const toP = Math.atan2(py - this.y, px - this.x);
      const facing = this.aimAngle;
      let d = Math.abs((toP - facing + Math.PI * 3) % VR.TAU - Math.PI);
      return d < (this.def.shieldArc / 2) * Math.PI / 180;
    }

    blocksMeleeFrom(px, py) {
      if (this.def.behavior !== 'shield' || this.state === 'swing') return false;
      const toP = Math.atan2(py - this.y, px - this.x);
      const facing = this.aimAngle;
      let d = Math.abs((toP - facing + Math.PI * 3) % VR.TAU - Math.PI);
      return d < (this.def.shieldArc / 2) * Math.PI / 180;
    }

    /* ---- damage / death ---- */
    damage(amount, opts) {
      opts = opts || {};
      if (this.dead) return 0;
      this.hp -= amount;
      this.flash = 0.09;
      const kbRes = this.def.kbResist || 1;
      this.kbx += (opts.kbX || 0) * kbRes;
      this.kby += (opts.kbY || 0) * kbRes;
      VR.fx.damageNumber(this.x, this.y - this.radius - 6, amount, opts.crit);
      if (this.hp <= 0) {
        this.die();
        return amount;
      }
      return amount;
    }

    die() {
      // exploding enemies detonate instead of dying quietly
      if (this.def.behavior === 'exploder' && !this.exploded) {
        this.explode(VR.game, 0.5);
        return;
      }
      // splitters spawn minis
      if (this.def.split && (this.splits || 0) < (this.def.splitMax || 1)) {
        this.spawnSplits();
      }
      this.dead = true;
      this.deathTimer = 0.25;
      VR.fx.burst({ x: this.x, y: this.y, color: this.color, count: this.elite ? 26 : 12, speed: 190, life: 0.45, size: this.elite ? 4 : 2.5 });
      VR.fx.burst({ x: this.x, y: this.y, color: '#ffffff', count: 4, speed: 100, life: 0.2, size: 2 });
      VR.fx.ring(this.x, this.y, this.color, this.elite ? 70 : 40, 0.8);
      VR.audio.play(this.elite ? 'explosion' : 'kill');
      if (this.elite) VR.fx.freeze(0.06);
      this.dropRewards();
    }

    spawnSplits() {
      const sp = this.def.split;
      const game = VR.game;
      if (!game) return;
      const def = VR.data.enemyById[sp.id];
      if (!def) return;
      const count = this.elite ? (sp.count || 2) + 1 : (sp.count || 2);
      for (let i = 0; i < count; i++) {
        const mini = VR.spawnEnemy(def, this.x + VR.randRange(-16, 16), this.y + VR.randRange(-16, 16), {
          hpMult: this.hpMult * (sp.hpMult || 0.5),
          dmgMult: this.dmgMult * 0.8,
          elite: false,
          splits: (this.splits || 0) + 1,
          miniDrop: true,
          speedMult: this.speedMult,
          contactCdMult: this.contactCdMult
        });
        mini.radius = Math.max(6, def.radius * (sp.radiusMult || 1));
        mini.spawnDelay = 0.2;
        game.enemies.push(mini);
      }
      VR.fx.burst({ x: this.x, y: this.y, color: '#6fd9c0', count: 10, speed: 160, life: 0.3, size: 2.5 });
      VR.audio.play('kill');
    }

    dropRewards() {
      // split minis drop a sliver of xp and nothing else
      if (this.miniDrop) {
        VR.game.spawnPickup('xp', this.x, this.y, Math.max(1, Math.round(this.xp / 2)));
        return;
      }
      // XP crystals
      const n = this.elite ? 6 : Math.max(2, Math.min(4, Math.round(this.xp / 3)));
      for (let i = 0; i < n; i++) {
        const a = VR.randRange(0, VR.TAU);
        const dist = VR.randRange(8, 22);
        VR.game.spawnPickup('xp', this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, Math.ceil(this.xp / n));
      }
      if (Math.random() < this.shardChance) {
        VR.game.spawnPickup('shard', this.x, this.y, 1);
      }
      // dungeon loot
      const loot = Math.random();
      if (this.elite) {
        if (loot < 0.25) VR.game.spawnPickup('gold', this.x, this.y, 12);
        else if (loot < 0.4) VR.game.spawnPickup('health', this.x, this.y, 1);
      } else {
        if (loot < 0.12) VR.game.spawnPickup('gold', this.x, this.y, 5);
        else if (loot < 0.17) VR.game.spawnPickup('health', this.x, this.y, 1);
        else if (loot < 0.2) VR.game.spawnPickup('bomb', this.x, this.y, 1);
        else if (loot < 0.21) VR.game.spawnPickup('key', this.x, this.y, 1);
      }
    }

    /* ---- render ---- */
    render(ctx) {
      if (this.dead) {
        const a = VR.clamp(this.deathTimer / 0.25, 0, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (1.4 - a * 0.4), 0, VR.TAU); ctx.fill();
        ctx.restore();
        return;
      }
      if (this.spawnDelay > 0) {
        // spawn portal
        const t = (VR.game && VR.game.time) || 0;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 20);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = this.color; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 1.6, 0, VR.TAU); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      const t = (VR.game && VR.game.time) || 0;
      const r = this.radius;

      // elite aura
      if (this.elite) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 5);
        ctx.strokeStyle = '#ff4dd8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff4dd8'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, r + 6 + Math.sin(t * 3) * 2, 0, VR.TAU); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      const flashA = VR.clamp(this.flash / 0.09, 0, 1);
      const fill = flashA > 0 ? '#ffffff' : this.color;
      const fillDark = flashA > 0 ? '#ffffff' : '#0a1220';
      ctx.fillStyle = fill;
      ctx.strokeStyle = fillDark;
      ctx.lineWidth = 2;

      // elite modifier aura (before body so it sits behind)
      if (this.eliteMod) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        if (this.eliteMod === 'frost') {
          ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 5);
          ctx.strokeStyle = '#43e6ff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#43e6ff'; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, VR.TAU); ctx.stroke();
          ctx.fillStyle = '#43e6ff';
          ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, VR.TAU); ctx.fill();
        } else if (this.eliteMod === 'vampiric') {
          ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6);
          ctx.fillStyle = '#ff5c7a';
          ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, VR.TAU); ctx.fill();
          if (Math.random() < 0.08) {
            ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(VR.randRange(-r, r), VR.randRange(-r, r), 2, 0, VR.TAU); ctx.fill();
          }
        }
        ctx.restore();
      }

      ctx.rotate(this.aimAngle);
      switch (this.def.behavior) {
        case 'splitter': {
          ctx.beginPath();
          ctx.moveTo(r, 0); ctx.lineTo(0, -r * 0.9); ctx.lineTo(-r * 0.8, 0); ctx.lineTo(0, r * 0.9);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = fillDark;
          ctx.beginPath();
          ctx.moveTo(r * 0.45, 0); ctx.lineTo(0, -r * 0.4); ctx.lineTo(-r * 0.35, 0); ctx.lineTo(0, r * 0.4);
          ctx.closePath(); ctx.fill();
          // glowing fracture seams
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8);
          ctx.strokeStyle = '#b6fff0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.45, 0);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'exploder': {
          ctx.beginPath(); ctx.arc(0, 0, r, 0, VR.TAU); ctx.fill(); ctx.stroke();
          const corePulse = this.state === 'telegraph' ? 1.2 : 1;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const pulse = this.state === 'telegraph' ? 0.5 + 0.5 * Math.sin(t * 22) : 0.35;
          ctx.globalAlpha = pulse;
          ctx.fillStyle = this.state === 'telegraph' ? '#ffffff' : '#ffd97a';
          ctx.shadowColor = '#ff8a3d'; ctx.shadowBlur = 16 * corePulse;
          ctx.beginPath(); ctx.arc(0, 0, r * 0.55 * corePulse, 0, VR.TAU); ctx.fill();
          ctx.restore();
          ctx.fillStyle = fillDark;
          ctx.fillRect(-r * 0.3, -r * 0.8, r * 0.6, r * 0.25); // fuse nub
          break;
        }
        case 'brute': {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * VR.TAU + Math.PI / 6;
            const px = Math.cos(a) * r, py = Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = fillDark;
          ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, VR.TAU); ctx.fill();
          ctx.fillStyle = flashA > 0 ? '#ffffff' : '#5a4a30';
          ctx.fillRect(-r * 0.75, -r * 0.1, r * 0.4, r * 0.2);
          ctx.fillRect(r * 0.35, -r * 0.1, r * 0.4, r * 0.2);
          // slam telegraph ring
          if (this.state === 'telegraph') {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const tgA = 0.3 + 0.3 * Math.sin(t * 20);
            ctx.globalAlpha = tgA;
            ctx.strokeStyle = '#ffb84d';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, (this.def.slamRange || 210) * (0.5 + 0.5 * (this.stateTimer / 0.7)), 0, VR.TAU); ctx.stroke();
            ctx.restore();
          }
          break;
        }
        case 'drone': {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * VR.TAU;
            const px = Math.cos(a) * r, py = Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = fillDark;
          ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, VR.TAU); ctx.fill();
          break;
        }
        case 'swarm': {
          ctx.beginPath();
          ctx.moveTo(r, 0); ctx.lineTo(-r * 0.7, -r * 0.7); ctx.lineTo(-r * 0.3, 0); ctx.lineTo(-r * 0.7, r * 0.7);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          break;
        }
        case 'shooter': {
          ctx.beginPath(); ctx.arc(0, 0, r, 0, VR.TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = fillDark;
          ctx.fillRect(r * 0.6, -3, r * 0.9, 6);
          ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, VR.TAU); ctx.fill();
          break;
        }
        case 'charger': {
          ctx.beginPath();
          ctx.moveTo(r * 1.2, 0); ctx.lineTo(0, -r * 0.8); ctx.lineTo(-r * 0.9, 0); ctx.lineTo(0, r * 0.8);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          // telegraph glow
          if (this.state === 'telegraph') {
            const tgA = 0.4 + 0.4 * Math.sin(t * 22);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = tgA;
            ctx.fillStyle = '#ff5c7a';
            ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, VR.TAU); ctx.fill();
            ctx.globalAlpha = 1;
          }
          break;
        }
        case 'shield': {
          ctx.beginPath();
          ctx.rect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
          ctx.fill(); ctx.stroke();
          // directional shield arc (drawn unrotated, facing aimAngle)
          ctx.restore();
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.aimAngle);
          const half = (this.def.shieldArc / 2) * Math.PI / 180;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.4 + (this.state === 'telegraph' ? 0.3 * Math.sin(t * 18) : 0);
          ctx.fillStyle = '#a06bff';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r + 10, -half, half);
          ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#a06bff';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, r + 10, -half, half); ctx.stroke();
          break;
        }
      }
      ctx.restore();

      // telegraph line for charger
      if (this.def.behavior === 'charger' && this.state === 'telegraph') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 20);
        ctx.strokeStyle = '#ff5c7a';
        ctx.lineWidth = this.radius * 0.8;
        ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.x + this.misc.tgX * this.radius, this.y + this.misc.tgY * this.radius);
        ctx.lineTo(this.x + this.misc.tgX * 220, this.y + this.misc.tgY * 220);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /* ============ behavior subclasses (thin, modular) ============ */
  class Drone extends Enemy { constructor(def, x, y, o) { super(def, x, y, o); } }
  class Swarm extends Enemy { constructor(def, x, y, o) { super(def, x, y, o); } }
  class Shooter extends Enemy { constructor(def, x, y, o) { super(def, x, y, o); } }
  class Charger extends Enemy { constructor(def, x, y, o) { super(def, x, y, o); } }
  class Shield extends Enemy { constructor(def, x, y, o) { super(def, x, y, o); } }

  VR.Enemy = Enemy;

  /** Factory: build an enemy (optionally elite) from an enemy def. */
  VR.spawnEnemy = function (def, x, y, opts) {
    let e;
    switch (def.behavior) {
      case 'swarm': e = new Swarm(def, x, y, opts); break;
      case 'shooter': e = new Shooter(def, x, y, opts); break;
      case 'charger': e = new Charger(def, x, y, opts); break;
      case 'shield': e = new Shield(def, x, y, opts); break;
      default: e = new Drone(def, x, y, opts);
    }
    return e;
  };
})();
