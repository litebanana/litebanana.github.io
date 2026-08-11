/* boss.js — THE NULL WARDEN. Multi-phase boss with telegraphed attacks. */
(function () {
  'use strict';
  const VR = window.VR;

  /** Boss identity defs (used by the HUD, codex and victory screens). */
  VR.BOSS_DEFS = {
    warden: {
      id: 'warden', name: 'THE NULL WARDEN', color: '#ff4dd8',
      subtitle: 'SECTOR FINAL — THE VOID CONVERGES',
      lore: 'A hole in the world that learned to hate. It wears the void like a crown and waits at the bottom of everything.'
    },
    razor: {
      id: 'razor', name: 'RAZOR VESSEL', color: '#ff5c7a',
      subtitle: 'SECTOR FINAL — BLADE OF THE HOLLOW',
      lore: 'A blade forged from the screams of the fallen, given a body of shadow. It dances, and everything in the dance dies.'
    }
  };

  class Boss {
    constructor(x, y, opts) {
      opts = opts || {};
      this.def = VR.BOSS_DEFS.warden;
      this.name = this.def.name;
      this.x = x; this.y = y;
      this.radius = 46;
      this.maxHp = Math.round(1500 * (opts.hpMult || 1));
      this.hp = this.maxHp;
      this.dmgMult = opts.dmgMult || 1;
      this.speedMult = opts.speedMult || 1;
      this.contactCdMult = opts.contactCdMult || 1;
      this.speed = 62 * this.speedMult;
      this.contact = 18;
      this.flash = 0;
      this.dead = false;
      this.deathTimer = 0;
      this.phase = 1;
      this.state = 'idle';      // idle | telegraph | fire | dash
      this.stateTimer = 0;
      this.attackCd = 1.6 * (opts.cdMult || 1);
      this.currentAttack = null;
      this.aimAngle = 0;
      this.kbx = 0; this.kby = 0;
      this.hitCd = 0;
      this.summoned = [];
      this.activeShield = 0;    // temporary shield amount (P4)
      this.shieldTimer = 6;     // time until next shield
      this.dashDir = { x: 1, y: 0 };
      this.dashActive = 0;
      this.ringTimer = 0;
      this.telegraph = null;    // {type, t, data}
      this.spawnDelay = 0;
    }

    /* ---------- phases ---------- */
    updatePhase() {
      const pct = this.hp / this.maxHp;
      if (pct <= 0.15) this.phase = 4;
      else if (pct <= 0.4) this.phase = 3;
      else if (pct <= 0.7) this.phase = 2;
      else this.phase = 1;
    }

    /* ---------- update ---------- */
    update(dt, game) {
      if (this.dead) {
        if (this.deathTimer > 0) this.deathTimer -= dt;
        return;
      }
      this.updatePhase();
      if (this.spawnDelay > 0) { this.spawnDelay -= dt; return; }
      if (this.flash > 0) this.flash -= dt;
      if (this.hitCd > 0) this.hitCd -= dt;
      const t = game.time;

      // slow drift toward player
      const p = game.player;
      this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);
      const d = VR.dist(this.x, this.y, p.x, p.y);
      if (this.dashActive > 0) {
        this.dashActive -= dt;
        this.x += this.dashDir.x * 720 * dt;
        this.y += this.dashDir.y * 720 * dt;
        VR.fx.trail(this.x, this.y, '#ff4dd8', 8);
      } else if (d > 320) {
        this.x += Math.cos(this.aimAngle) * this.speed * dt;
        this.y += Math.sin(this.aimAngle) * this.speed * dt;
      } else if (this.state !== 'telegraph' && this.state !== 'fire') {
        this.x -= Math.cos(this.aimAngle) * this.speed * 0.4 * dt;
        this.y -= Math.sin(this.aimAngle) * this.speed * 0.4 * dt;
      }
      const res = game.resolveSolids(this.x, this.y, this.radius);
      this.x = res.x; this.y = res.y;
      game.clampToRoom(this);

      // contact damage
      if (this.hitCd <= 0 && p && p.isVulnerable() &&
          VR.dist2(this.x, this.y, p.x, p.y) < (this.radius + p.radius) ** 2) {
        this.hitCd = 0.7 * this.contactCdMult;
        VR.combat.damagePlayer(this.contact * this.dmgMult, { source: this });
      }

      // P4 temporary shield
      if (this.phase >= 4) {
        this.shieldTimer -= dt;
        if (this.shieldTimer <= 0 && this.activeShield <= 0) {
          this.activeShield = 220;
          this.shieldTimer = 9;
          VR.fx.ring(this.x, this.y, '#43e6ff', 90, 1);
          VR.audio.play('shieldBlock');
        }
      }
      if (this.activeShield > 0) {
        this.activeShield -= dt * 30; // decay
        if (this.activeShield <= 0) this.activeShield = 0;
      }

      // state machine
      this.stateTimer -= dt;
      const speedMul = this.phase === 4 ? 0.72 : this.phase === 3 ? 0.85 : 1;

      if (this.state === 'idle') {
        if (this.telegraph) this.telegraph = null;
        this.attackCd -= dt * speedMul;
        if (this.attackCd <= 0) {
          this.chooseAttack(game);
          this.attackCd = this.phase === 1 ? 2.2 : this.phase === 2 ? 1.9 : this.phase === 3 ? 1.7 : 1.4;
        }
      } else if (this.state === 'telegraph') {
        if (this.telegraph && this.telegraph.t > 0) this.telegraph.t -= dt;
        if (this.stateTimer <= 0) {
          this.executeAttack(game);
        }
      } else if (this.state === 'fire') {
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = 0;
        }
      } else if (this.state === 'dash') {
        if (this.dashActive <= 0) {
          this.state = 'fire';
          this.stateTimer = 0.7;
        }
      }

      // telegraph warning rings
      if (this.telegraph && (this.telegraph.type === 'ring' || this.telegraph.type === 'spiral')) {
        this.ringTimer += dt;
        const prog = this.telegraph.maxT - this.telegraph.t;
        const r = VR.lerp(50, this.telegraph.radius, VR.clamp(prog / this.telegraph.maxT, 0, 1));
        VR.fx.ring(this.x, this.y, '#ff4dd8', r, 0.5 + 0.3 * Math.sin(t * 24));
      }
    }

    chooseAttack(game) {
      const attacks = [];
      attacks.push({ id: 'burst', w: 2 });
      attacks.push({ id: 'ring', w: this.phase >= 2 ? 2 : 1 });
      if (this.phase >= 2) attacks.push({ id: 'summon', w: 1.6 });
      if (this.phase >= 3) attacks.push({ id: 'spiral', w: 1.6 });
      if (this.phase >= 4) attacks.push({ id: 'dash', w: 2 });

      const chosen = VR.weightedPick(attacks, (a) => a.w);
      this.currentAttack = chosen.id;
      this.state = 'telegraph';
      this.stateTimer = chosen.id === 'dash' ? 0.7 : chosen.id === 'summon' ? 0.9 : chosen.id === 'burst' ? 0.65 : 1.0;
      this.telegraph = { type: chosen.id, t: this.stateTimer, maxT: this.stateTimer, radius: chosen.id === 'ring' ? 210 : chosen.id === 'spiral' ? 300 : 0, angle: this.aimAngle };
      if (chosen.id === 'burst' || chosen.id === 'dash') {
        VR.audio.play('laserWarn');
      }
    }

    executeAttack(game) {
      const id = this.currentAttack;
      const p = game.player;
      this.state = 'fire';
      this.stateTimer = id === 'summon' ? 0.3 : 0.4;

      switch (id) {
        case 'burst': {
          const a = this.aimAngle;
          for (let i = -1; i <= 1; i++) {
            const ang = a + i * 0.18;
            VR.projectiles.spawn({
              x: this.x + Math.cos(a) * (this.radius + 10),
              y: this.y + Math.sin(a) * (this.radius + 10),
              vx: Math.cos(ang) * 380, vy: Math.sin(ang) * 380,
              radius: 6, damage: 14 * this.dmgMult, friendly: false,
              color: '#ff4dd8', life: 3, knockback: 0
            });
          }
          VR.fx.burst({ x: this.x, y: this.y, color: '#ff4dd8', count: 10, speed: 180, life: 0.3, size: 3 });
          VR.audio.play('enemyShoot');
          break;
        }
        case 'ring': {
          const n = 14;
          const base = Math.random() * VR.TAU;
          for (let i = 0; i < n; i++) {
            const a = base + (i / n) * VR.TAU;
            VR.projectiles.spawn({
              x: this.x, y: this.y,
              vx: Math.cos(a) * 300, vy: Math.sin(a) * 300,
              radius: 5.5, damage: 11 * this.dmgMult, friendly: false,
              color: '#a06bff', life: 3.2, knockback: 0
            });
          }
          VR.fx.shake(0.3);
          VR.audio.play('laserFire');
          break;
        }
        case 'spiral': {
          const n = 26;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * VR.TAU * 2;
            const delay = i * 0.05;
            const proj = VR.projectiles.spawn({
              x: this.x, y: this.y,
              vx: Math.cos(a) * 240, vy: Math.sin(a) * 240,
              radius: 5, damage: 10 * this.dmgMult, friendly: false,
              color: '#ffb84d', life: 3, knockback: 0
            });
            proj.life = 3 + delay;
            proj._delay = delay;
          }
          VR.audio.play('laserFire');
          break;
        }
        case 'summon': {
          const defs = ['swarm', 'swarm', 'drone'];
          const count = 3 + (this.phase >= 3 ? 1 : 0);
          let alive = 0;
          for (const e of game.enemies) if (!e.dead && e.isBossAdd) alive++;
          for (let i = 0; i < count && alive < 6; i++) {
            const defId = VR.choose(defs);
            const def = VR.data.enemyById[defId];
            const a = VR.randRange(0, VR.TAU);
            const sx = VR.clamp(this.x + Math.cos(a) * 200, game.currentRoom.bounds.x + 40, game.currentRoom.bounds.x2 - 40);
            const sy = VR.clamp(this.y + Math.sin(a) * 200, 40, 860);
            const e = VR.spawnEnemy(def, sx, sy, { hpMult: 0.9, dmgMult: this.dmgMult * 0.8, speedMult: this.speedMult, contactCdMult: this.contactCdMult });
            e.isBossAdd = true;
            game.enemies.push(e);
            alive++;
          }
          VR.fx.ring(this.x, this.y, '#a06bff', 140, 0.8);
          VR.audio.play('roomClear');
          break;
        }
        case 'dash': {
          // telegraph already shown as line toward player; now dash
          this.dashDir = { x: Math.cos(this.aimAngle), y: Math.sin(this.aimAngle) };
          this.dashActive = 0.55;
          this.state = 'dash';
          VR.audio.play('charge');
          VR.fx.shake(0.4);
          break;
        }
      }
      this.telegraph = null;
    }

    /* ---------- damage ---------- */
    damage(amount, opts) {
      opts = opts || {};
      if (this.dead) return 0;
      if (this.activeShield > 0) {
        const absorbed = Math.min(this.activeShield, amount);
        this.activeShield -= absorbed;
        VR.fx.burst({ x: this.x, y: this.y, color: '#43e6ff', count: 5, speed: 130, life: 0.25, size: 2.5 });
        VR.audio.play('hurt.shield');
        VR.fx.damageNumber(this.x, this.y - this.radius - 10, absorbed, false, '#43e6ff');
        if (this.activeShield <= 0) { this.activeShield = 0; VR.fx.ring(this.x, this.y, '#43e6ff', 100, 1); }
        return 0;
      }
      this.hp -= amount;
      this.flash = 0.08;
      this.kbx += (opts.kbX || 0) * 0.06;
      this.kby += (opts.kbY || 0) * 0.06;
      VR.fx.damageNumber(this.x, this.y - this.radius - 8, amount, opts.crit, opts.crit ? '#ffb84d' : '#ff4dd8');
      VR.audio.play('bossHit');
      if (this.hp <= 0) {
        this.hp = 0;
        this.die();
        return amount;
      }
      return amount;
    }

    die() {
      this.dead = true;
      this.deathTimer = 2.4;
      VR.fx.freeze(0.15);
      VR.fx.shake(1);
      VR.fx.flash('#ff4dd8', 0.4);
      VR.audio.play('bossDeath');
    }

    /* ---------- render ---------- */
    render(ctx) {
      const t = (VR.game && VR.game.time) || 0;
      if (this.dead) {
        const a = VR.clamp(1 - this.deathTimer / 2.4, 0, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - a;
        ctx.fillStyle = '#ff4dd8';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (2.4 - a * 1.4), 0, VR.TAU); ctx.fill();
        if (this.deathTimer <= 0.2) {
          ctx.globalAlpha = 1;
          ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 60;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 3, 0, VR.TAU); ctx.fill();
        }
        ctx.restore();
        return;
      }

      const flashA = VR.clamp(this.flash / 0.08, 0, 1);
      const color = flashA > 0 ? '#ffffff' : '#ff4dd8';
      const core = flashA > 0 ? '#ffffff' : '#2a0a22';

      ctx.save();
      ctx.translate(this.x, this.y);

      // phase aura
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 4);
      ctx.strokeStyle = this.phase >= 3 ? '#ffb84d' : '#ff4dd8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff4dd8'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 8 + Math.sin(t * 2) * 3, 0, VR.TAU); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // void crystal body
      ctx.rotate(t * 0.4);
      ctx.fillStyle = core;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color; ctx.shadowBlur = 26;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * VR.TAU + Math.PI / 8;
        const rr = i % 2 === 0 ? this.radius : this.radius * 0.72;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      // inner eye
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.28, 0, VR.TAU); ctx.fill();
      ctx.restore();

      // temporary shield bubble (P4)
      if (this.activeShield > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#43e6ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#43e6ff'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 16, 0, VR.TAU); ctx.stroke();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#43e6ff';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 16, 0, VR.TAU); ctx.fill();
        ctx.restore();
      }

      // telegraphs
      if (this.telegraph) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const a = 0.5 + 0.4 * Math.sin(t * 22);
        ctx.globalAlpha = a;
        if (this.telegraph.type === 'ring' || this.telegraph.type === 'spiral') {
          ctx.strokeStyle = '#ff4dd8';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#ff4dd8'; ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.telegraph.radius, 0, VR.TAU); ctx.stroke();
        }
        if (this.telegraph.type === 'burst') {
          ctx.strokeStyle = '#ff4dd8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + Math.cos(this.aimAngle) * 320, this.y + Math.sin(this.aimAngle) * 320);
          ctx.stroke();
        }
        if (this.telegraph.type === 'dash') {
          ctx.strokeStyle = '#ff4dd8';
          ctx.lineWidth = this.radius * 0.9;
          ctx.beginPath();
          ctx.moveTo(this.x + Math.cos(this.aimAngle) * this.radius, this.y + Math.sin(this.aimAngle) * this.radius);
          ctx.lineTo(this.x + Math.cos(this.aimAngle) * 420, this.y + Math.sin(this.aimAngle) * 420);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  VR.Boss = Boss;

  /* =====================================================================
     RAZOR VESSEL — a fast teleporting assassin boss. Alternates with the
     Null Warden at the final sector (seeded per run).
     ===================================================================== */
  class Boss2 {
    constructor(x, y, opts) {
      opts = opts || {};
      this.def = VR.BOSS_DEFS.razor;
      this.name = this.def.name;
      this.x = x; this.y = y;
      this.radius = 40;
      this.maxHp = Math.round(1350 * (opts.hpMult || 1));
      this.hp = this.maxHp;
      this.dmgMult = opts.dmgMult || 1;
      this.speedMult = opts.speedMult || 1;
      this.contactCdMult = opts.contactCdMult || 1;
      this.speed = 130 * this.speedMult;
      this.contact = 18;
      this.flash = 0;
      this.dead = false;
      this.deathTimer = 0;
      this.phase = 1;
      this.state = 'idle';
      this.stateTimer = 0;
      this.attackCd = 1.2 * (opts.cdMult || 1);
      this.currentAttack = null;
      this.aimAngle = 0;
      this.kbx = 0; this.kby = 0;
      this.hitCd = 0;
      this.teleportCd = 2.8;
      this.dashDir = { x: 1, y: 0 };
      this.dashActive = 0;
      this.dashesLeft = 0;
      this.telegraph = null;
      this.spawnDelay = 0;
    }

    updatePhase() {
      const pct = this.hp / this.maxHp;
      if (pct <= 0.15) this.phase = 4;
      else if (pct <= 0.4) this.phase = 3;
      else if (pct <= 0.7) this.phase = 2;
      else this.phase = 1;
    }

    update(dt, game) {
      if (this.dead) {
        if (this.deathTimer > 0) this.deathTimer -= dt;
        return;
      }
      this.updatePhase();
      if (this.spawnDelay > 0) { this.spawnDelay -= dt; return; }
      if (this.flash > 0) this.flash -= dt;
      if (this.hitCd > 0) this.hitCd -= dt;
      const p = game.player;
      this.aimAngle = p ? VR.angleTo(this.x, this.y, p.x, p.y) : 0;

      // periodic blink reposition
      this.teleportCd -= dt;
      if (this.state === 'idle' && this.teleportCd <= 0 && p) {
        this.teleportCd = 2.8 + (this.phase >= 3 ? 1.2 : 2.2);
        this.blink(game);
      }

      if (this.dashActive > 0) {
        this.dashActive -= dt;
        this.x += this.dashDir.x * 760 * dt;
        this.y += this.dashDir.y * 760 * dt;
        VR.fx.trail(this.x, this.y, '#ff5c7a', 8);
        if (p && !p.dead && this.hitCd <= 0 && p.isVulnerable() &&
            VR.dist2(this.x, this.y, p.x, p.y) < (this.radius + p.radius) ** 2) {
          this.hitCd = 0.6;
          VR.combat.damagePlayer(20 * this.dmgMult, { source: this });
        }
      } else if (p && this.state === 'idle') {
        // strafe orbit around the player
        const d = VR.dist(this.x, this.y, p.x, p.y);
        const side = Math.floor(game.time * 0.6) % 2 ? 1 : -1;
        const a = VR.angleTo(this.x, this.y, p.x, p.y) + (Math.PI / 2) * side;
        const sp = this.speed * (d < 260 ? 0.75 : 1);
        this.x += Math.cos(a) * sp * dt;
        this.y += Math.sin(a) * sp * dt;
        if (d < 180) {
          this.x -= Math.cos(this.aimAngle) * sp * 0.6 * dt;
          this.y -= Math.sin(this.aimAngle) * sp * 0.6 * dt;
        }
      }
      const res = game.resolveSolids(this.x, this.y, this.radius);
      this.x = res.x; this.y = res.y;
      game.clampToRoom(this);

      // contact damage (all phases)
      if (this.hitCd <= 0 && p && !p.dead && p.isVulnerable() &&
          VR.dist2(this.x, this.y, p.x, p.y) < (this.radius + p.radius) ** 2) {
        this.hitCd = 0.7 * this.contactCdMult;
        VR.combat.damagePlayer(this.contact * this.dmgMult, { source: this });
      }

      // state machine
      this.stateTimer -= dt;
      const speedMul = this.phase === 4 ? 0.7 : this.phase === 3 ? 0.85 : 1;
      if (this.state === 'idle') {
        if (this.telegraph) this.telegraph = null;
        this.attackCd -= dt * speedMul;
        if (this.attackCd <= 0) {
          this.chooseAttack(game);
          this.attackCd = this.phase === 1 ? 1.9 : this.phase === 2 ? 1.6 : this.phase === 3 ? 1.4 : 1.1;
        }
      } else if (this.state === 'telegraph') {
        if (this.telegraph && this.telegraph.t > 0) this.telegraph.t -= dt;
        if (this.stateTimer <= 0) this.executeAttack(game);
      } else if (this.state === 'dash') {
        if (this.dashActive <= 0) {
          this.dashesLeft--;
          if (this.dashesLeft > 0) {
            this.aimAngle = VR.angleTo(this.x, this.y, p.x, p.y);
            this.dashDir = { x: Math.cos(this.aimAngle), y: Math.sin(this.aimAngle) };
            this.dashActive = 0.4;
            VR.audio.play('dash');
          } else {
            this.state = 'idle'; this.stateTimer = 0;
          }
        }
      } else if (this.state === 'fire') {
        if (this.stateTimer <= 0) { this.state = 'idle'; this.stateTimer = 0; }
      }
    }

    blink(game) {
      const b = game.currentRoom.bounds;
      const nx = VR.clamp(b.x + VR.randRange(150, b.w - 150), b.x + 60, b.x2 - 60);
      const ny = VR.clamp(VR.randRange(120, b.h - 120), 60, b.y2 - 60);
      VR.fx.burst({ x: this.x, y: this.y, color: '#ff5c7a', count: 14, speed: 180, life: 0.3, size: 2.5 });
      this.x = nx; this.y = ny;
      VR.fx.burst({ x: this.x, y: this.y, color: '#ff5c7a', count: 14, speed: 180, life: 0.3, size: 2.5 });
      VR.fx.ring(this.x, this.y, '#ff5c7a', 50, 0.7);
      VR.audio.play('teleport');
    }

    chooseAttack(game) {
      const attacks = [{ id: 'fan', w: 2.2 }];
      attacks.push({ id: 'slash', w: this.phase >= 2 ? 2.4 : 1.6 });
      if (this.phase >= 2) attacks.push({ id: 'shadows', w: 1.6 });
      if (this.phase >= 3) attacks.push({ id: 'cross', w: 2 });
      if (this.phase >= 4) attacks.push({ id: 'fanx', w: 1.8 });
      const chosen = VR.weightedPick(attacks, (a) => a.w);
      this.currentAttack = chosen.id;
      this.state = 'telegraph';
      this.stateTimer = chosen.id === 'slash' || chosen.id === 'cross' ? 0.6 : 0.75;
      this.telegraph = { type: chosen.id, t: this.stateTimer, maxT: this.stateTimer, angle: this.aimAngle };
      if (chosen.id === 'slash' || chosen.id === 'cross') VR.audio.play('laserWarn');
    }

    executeAttack(game) {
      const id = this.currentAttack;
      const p = game.player;
      this.state = 'fire';
      this.stateTimer = 0.35;
      const a = this.aimAngle;
      const shoot = (ang, color) => {
        VR.projectiles.spawn({
          x: this.x, y: this.y,
          vx: Math.cos(ang) * 400, vy: Math.sin(ang) * 400,
          radius: 5.5, damage: 12 * this.dmgMult, friendly: false,
          color: color || '#ff5c7a', life: 2.6, knockback: 0
        });
      };
      switch (id) {
        case 'fan':
          for (let i = -2; i <= 2; i++) shoot(a + i * 0.17);
          VR.fx.burst({ x: this.x, y: this.y, color: '#ff5c7a', count: 8, speed: 170, life: 0.25, size: 2.5 });
          VR.audio.play('enemyShoot');
          break;
        case 'fanx':
          for (let i = -3; i <= 3; i += 2) shoot(a + i * 0.22, '#ffb84d');
          for (let i = -2; i <= 2; i++) shoot(a + Math.PI / 2 + i * 0.2, '#a06bff');
          VR.audio.play('enemyShoot');
          break;
        case 'slash':
          this.dashDir = { x: Math.cos(a), y: Math.sin(a) };
          this.dashActive = 0.4;
          this.dashesLeft = 1;
          this.state = 'dash';
          VR.audio.play('charge');
          VR.fx.shake(0.3);
          break;
        case 'cross':
          this.dashDir = { x: Math.cos(a), y: Math.sin(a) };
          this.dashActive = 0.4;
          this.dashesLeft = 2;
          this.state = 'dash';
          VR.audio.play('charge');
          VR.fx.shake(0.4);
          break;
        case 'shadows': {
          const count = 2 + (this.phase >= 4 ? 1 : 0);
          const b = game.currentRoom.bounds;
          for (let i = 0; i < count; i++) {
            const def = VR.data.enemyById['swarm'];
            const sx = VR.clamp(this.x + VR.randRange(-160, 160), b.x + 40, b.x2 - 40);
            const sy = VR.clamp(this.y + VR.randRange(-160, 160), 40, b.y2 - 40);
            const e = VR.spawnEnemy(def, sx, sy, { hpMult: 0.8, dmgMult: this.dmgMult * 0.7, speedMult: this.speedMult, contactCdMult: this.contactCdMult });
            e.isBossAdd = true;
            game.enemies.push(e);
          }
          VR.fx.ring(this.x, this.y, '#ff5c7a', 130, 0.8);
          VR.audio.play('roomClear');
          break;
        }
      }
      this.telegraph = null;
    }

    damage(amount, opts) {
      opts = opts || {};
      if (this.dead) return 0;
      this.hp -= amount;
      this.flash = 0.08;
      this.kbx += (opts.kbX || 0) * 0.06;
      this.kby += (opts.kbY || 0) * 0.06;
      VR.fx.damageNumber(this.x, this.y - this.radius - 8, amount, opts.crit, opts.crit ? '#ffb84d' : '#ff5c7a');
      VR.audio.play('bossHit');
      if (this.hp <= 0) {
        this.hp = 0;
        this.die();
        return amount;
      }
      return amount;
    }

    die() {
      this.dead = true;
      this.deathTimer = 2.4;
      VR.fx.freeze(0.15);
      VR.fx.shake(1);
      VR.fx.flash('#ff5c7a', 0.4);
      VR.audio.play('bossDeath');
    }

    render(ctx) {
      const t = (VR.game && VR.game.time) || 0;
      if (this.dead) {
        const a = VR.clamp(1 - this.deathTimer / 2.4, 0, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - a;
        ctx.fillStyle = '#ff5c7a';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (2.4 - a * 1.4), 0, VR.TAU); ctx.fill();
        if (this.deathTimer <= 0.2) {
          ctx.globalAlpha = 1;
          ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 60;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 3, 0, VR.TAU); ctx.fill();
        }
        ctx.restore();
        return;
      }

      const flashA = VR.clamp(this.flash / 0.08, 0, 1);
      const color = flashA > 0 ? '#ffffff' : '#ff5c7a';
      const core = flashA > 0 ? '#ffffff' : '#220a14';

      ctx.save();
      ctx.translate(this.x, this.y);

      // phase aura (blade rings)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 5);
      ctx.strokeStyle = this.phase >= 3 ? '#ffb84d' : '#ff5c7a';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 8 + Math.sin(t * 2.5) * 3, 0, VR.TAU); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // four-blade dart body, slowly spinning
      ctx.rotate(t * 0.9 + Math.PI / 4);
      ctx.fillStyle = core;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color; ctx.shadowBlur = 26;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * VR.TAU;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.22, 0, VR.TAU); ctx.fill();
      ctx.restore();

      // telegraphs
      if (this.telegraph) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const a = 0.5 + 0.4 * Math.sin(t * 22);
        ctx.globalAlpha = a;
        if (this.telegraph.type === 'fan' || this.telegraph.type === 'fanx') {
          ctx.strokeStyle = '#ff5c7a';
          ctx.lineWidth = 3;
          for (let i = -2; i <= 2; i++) {
            const ang = this.aimAngle + i * 0.17;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(ang) * 300, this.y + Math.sin(ang) * 300);
            ctx.stroke();
          }
        }
        if (this.telegraph.type === 'slash' || this.telegraph.type === 'cross') {
          ctx.strokeStyle = '#ff5c7a';
          ctx.lineWidth = this.radius * 0.9;
          ctx.beginPath();
          ctx.moveTo(this.x + Math.cos(this.aimAngle) * this.radius, this.y + Math.sin(this.aimAngle) * this.radius);
          ctx.lineTo(this.x + Math.cos(this.aimAngle) * 400, this.y + Math.sin(this.aimAngle) * 400);
          ctx.stroke();
        }
        if (this.telegraph.type === 'shadows') {
          ctx.strokeStyle = '#ff5c7a';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 12]);
          ctx.beginPath(); ctx.arc(this.x, this.y, 130, 0, VR.TAU); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }
    }
  }

  VR.Boss2 = Boss2;
})();
