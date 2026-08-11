/* game.js — run orchestration, combat, camera, HUD. The hub module. */
(function () {
  'use strict';
  const VR = window.VR;

  const game = {
    state: 'boot',            // boot|menu|weaponSelect|playing|levelup|paused|gameover|victory|shop|settings|reward|branch|rshop
    canvas: null, ctx: null,

    viewW: 1280, viewH: 720,
    viewScale: 1, ox: 0, oy: 0,
    dpr: 1, vw: 1280, vh: 720,
    bgCanvas: null, bgCtx: null,   // cached static room layer (perf)

    time: 0,                  // global time (pauses in menus)
    runTime: 0,

    rooms: [], roomIndex: 0, currentRoom: null,
    player: null, enemies: [], pickups: [], boss: null, barrels: [],
    bombs: [], turrets: [],
    worldRng: null,           // seeded rng used to rebuild branch rooms
    pendingRoom: null,        // unbuilt 'choice' room awaiting a branch pick
    gearRect: null,           // settings button rect (logical coords)

    camX: 0, camY: 0, camZoom: 1, zoomImpulse: 0,
    shake: 0,

    run: null,                // current run stats
    bossIntro: 0,
    slowmo: 0, slowmoTarget: 1,
    hintTimer: 0,
    bannerTimer: 0,

    /* ================= init ================= */
    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.bgCanvas = document.createElement('canvas');
      this.bgCtx = this.bgCanvas.getContext('2d');
      VR.fx.init();
      VR.projectiles.init();
      this.resize();
      this.state = 'menu';
    },

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const cw = window.innerWidth, ch = window.innerHeight;
      this.dpr = dpr;
      this.vw = cw; this.vh = ch;
      const c = this.canvas;
      c.width = Math.round(cw * dpr);
      c.height = Math.round(ch * dpr);
      c.style.width = cw + 'px';
      c.style.height = ch + 'px';
      this.viewScale = Math.min(cw / this.viewW, ch / this.viewH);
      this.ox = (cw - this.viewW * this.viewScale) / 2;
      this.oy = (ch - this.viewH * this.viewScale) / 2;
    },

    /* ================= run lifecycle ================= */
    newRun(weaponId, opts) {
      opts = opts || {};
      VR.fx.releaseAll();
      VR.projectiles.releaseAll();
      this.enemies = [];
      this.pickups = [];
      this.boss = null;
      this.bombs = [];
      this.turrets = [];
      this.pendingRoom = null;
      this.pendingBranch = false;

      const save = VR.save.get();
      const r = {};
      for (const mid in save.meta) {
        const m = VR.data.metaById[mid];
        if (m && !m.weaponUnlock) {
          for (let i = 0; i < save.meta[mid]; i++) m.apply(r);
        }
      }
      // safety defaults
      r.hpMult = r.hpMult || 1; r.dmgMult = r.dmgMult || 1; r.xpMult = r.xpMult || 1;

      // difficulty (daily runs are always MEDIUM for a fair shared seed)
      const diff = VR.data.resolveDifficulty(opts.difficulty, opts.daily);

      // higher difficulties dampen permanent meta power — your upgrades still
      // help, but they can no longer out-scale the descent
      if (diff.metaMult !== 1) {
        const mm = diff.metaMult;
        r.hpMult = 1 + (r.hpMult - 1) * mm;
        r.dmgMult = 1 + (r.dmgMult - 1) * mm;
        r.xpMult = 1 + (r.xpMult - 1) * mm;
        if (r.moveMult) r.moveMult = 1 + (r.moveMult - 1) * mm;
        if (r.dashCdMult) r.dashCdMult = 1 + (r.dashCdMult - 1) * mm;
        if (r.pickupMult) r.pickupMult = 1 + (r.pickupMult - 1) * mm;
        if (r.shieldStart) r.shieldStart = Math.round(r.shieldStart * mm);
      }

      this.player = new VR.Player();
      this.player.weaponId = weaponId;
      this.player.applyRunMods(r);
      // difficulty modifiers
      this.player.stats.xpGain *= diff.xpMult;
      this.player.stats.goldMult *= diff.goldMult;
      this.player.stats.healMult = diff.healMult;   // all healing scaled by difficulty
      if (diff.healBonus > 0) {
        this.player.stats.maxHp += diff.healBonus;
        this.player.hp += diff.healBonus;
        this.player.maxHp += diff.healBonus;
      }
      this.player.x = 720; this.player.y = 450;
      const sv = VR.save.get();
      sv.codex.weapons[weaponId] = true;
      VR.save.write();

      const gen = VR.arena.generateWorld(opts.seed, diff.id);
      this.rooms = gen.rooms;
      this.worldRng = gen.rng;
      this.run = {
        weaponId, time: 0, kills: 0, damageDealt: 0,
        shardsEarned: 0, upgradesTaken: [], room: 0, gold: 0, potionsUsed: 0, bombsUsed: 0,
        daily: !!opts.daily, seed: opts.seed || null, dateKey: opts.dateKey || null,
        relicsTaken: [], difficulty: diff.id
      };
      this.player.items = { potions: 0, bombs: 0, keys: 0 };
      this.player.mana = this.player.maxMana;
      this.roomIndex = 0;
      this.currentRoom = this.rooms[0];
      this.enterRoom(0);
      this.camX = this.player.x; this.camY = this.player.y;

      this.runTime = 0;
      this.bossIntro = 0;
      this.slowmo = 1;

      this.state = 'playing';
      VR.ui.hideAll();
      VR.ui.showHints('MOVE — WASD   AIM — MOUSE   FIRE — LMB   DASH — SPACE/SHIFT   NOVA — Q   POTION — 2   BOMB — 3   OPEN — E', 6);
      if (!save.tutorialDone) VR.ui.showTutorial();
      else this.resolvePendingBranch();
      VR.audio.setMusic('combat');
    },

    /** Show the branch choice for the first room once the world is live. */
    resolvePendingBranch() {
      if (!this.pendingBranch) return;
      this.pendingBranch = false;
      const self = this;
      setTimeout(() => { if (self.state === 'playing') self.maybeBranch(); }, 400);
    },

    /* ================= state helpers ================= */
    isPausedWorld() {
      return this.state === 'levelup' || this.state === 'reward' || this.state === 'paused' ||
             this.state === 'branch' || this.state === 'rshop';
    },

    togglePause() {
      if (this.state === 'playing') {
        this.state = 'paused';
        VR.ui.showPause();
        VR.audio.setMusic('menu');
      } else if (this.state === 'paused') {
        this.resume();
      }
    },

    resume() {
      if (this.state === 'paused' || this.state === 'levelup' || this.state === 'reward' ||
          this.state === 'branch' || this.state === 'rshop') {
        this.state = 'playing';
        VR.ui.hideAll();
        VR.audio.setMusic(this.boss && !this.boss.dead ? 'boss' : 'combat');
      }
      // if this room is cleared but its exit was held for a branch choice, resolve it
      if (this.currentRoom && this.currentRoom.cleared && this.currentRoom.doorRight && !this.currentRoom.doorRight.open) {
        this.maybeBranch();
      }
    },

    restartRun() {
      if (this.run) this.newRun(this.run.weaponId);
    },

    toMenu() {
      this.state = 'menu';
      VR.ui.hideAll();
      VR.ui.showMenu();
      VR.audio.setMusic('menu');
    },

    /* ================= main frame ================= */
    frame(dtRaw) {
      const inp = VR.input;
      const dt = Math.min(dtRaw, 1 / 30);

      // global esc handling
      if (inp.wasPressed('Escape')) {
        if (this.state === 'playing') this.togglePause();
        else if (this.state === 'paused') this.togglePause();
      }

      // debug keys (playing only)
      if (this.state === 'playing' && VR.saveData.settings.debugMode) this.debugKeys(inp);

      this.time += dt;

      if (this.state === 'playing') {
        this.updateWorld(dt * this.slowmo);
      } else if (this.state === 'levelup' || this.state === 'reward' || this.state === 'branch' || this.state === 'rshop') {
        // world frozen; only fx pulse
        VR.fx.update(dt);
      } else if (this.state === 'paused') {
        VR.fx.update(dt);
      }

      // update mouse world coords
      const rect = this.canvas.getBoundingClientRect();
      const sx = (inp.mouseX - rect.left - this.ox) / this.viewScale;
      const sy = (inp.mouseY - rect.top - this.oy) / this.viewScale;
      inp.worldX = this.camX + (sx - this.viewW / 2) / this.camZoom;
      inp.worldY = this.camY + (sy - this.viewH / 2) / this.camZoom;

      // HUD gear button (pause/settings)
      if (this.state === 'playing' && inp.clicked && this.gearRect) {
        if (sx >= this.gearRect.x && sx <= this.gearRect.x + this.gearRect.w &&
            sy >= this.gearRect.y && sy <= this.gearRect.y + this.gearRect.h) {
          this.togglePause();
        }
      }

      this.render();

      if (this.state === 'playing') {
        this.runTime += dt;
        this.run.time = this.runTime;
      }

      // clear one-shot input flags now that they have been consumed
      inp.endFrame();
    },

    /* ================= world update ================= */
    updateWorld(dt) {
      const p = this.player;
      if (this.slowmo < 1) this.slowmo = Math.min(1, this.slowmo + dt * 2.2);
      if (this.bossIntro > 0) {
        this.bossIntro -= dt;
        if (this.bossIntro <= 0 && this.boss && this.boss.state === 'idle') {
          this.boss.spawnDelay = 0;
        }
      }

      // room transition check
      this.checkRoomTransition();

      // waves
      this.updateWaves(dt);

      // lasers / barrels / flames / spikes / movers
      VR.arena.updateLasers(this, this.currentRoom, dt);
      VR.arena.updateBarrels(this, this.currentRoom, dt);
      VR.arena.updateFlames(this, this.currentRoom, dt);
      VR.arena.updateSpikes(this, this.currentRoom, dt);
      VR.arena.updateMovers(this, this.currentRoom, dt);

      // player
      p.update(dt, this);
      if (p.dead) {
        this.triggerGameOver();
        return;
      }

      // enemies
      for (const e of this.enemies.slice()) {
        if (e.dead && e.deathTimer <= 0) {
          this.enemies.splice(this.enemies.indexOf(e), 1);
          continue;
        }
        e.update(dt, this);
      }

      // boss
      if (this.boss) {
        this.boss.update(dt, this);
        if (this.boss.dead && this.boss.deathTimer <= 0) {
          this.run.bossId = this.boss.def ? this.boss.def.id : 'warden';
          this.boss = null;
          this.triggerVictory();
          return;
        }
      }

      // turrets
      this.updateTurrets(dt);

      // projectiles
      VR.projectiles.update(dt, this);

      // bombs
      this.updateBombs(dt);

      // pickups
      this.updatePickups(dt);

      // camera
      this.updateCamera(dt);

      VR.fx.update(dt);

      if (this.hintTimer > 0) {
        this.hintTimer -= dt;
        if (this.hintTimer <= 0) VR.ui.hideHints();
      }
      if (this.bannerTimer > 0) this.bannerTimer -= dt;
    },

    /* ================= turrets ================= */
    updateTurrets(dt) {
      const p = this.player;
      for (let i = this.turrets.length - 1; i >= 0; i--) {
        const t = this.turrets[i];
        t.life -= dt;
        if (t.life <= 0) { this.turrets.splice(i, 1); continue; }
        t.fireCd -= dt;
        const target = this.findEnemyInRange(t.x, t.y, 430);
        if (target) t.rot = VR.angleTo(t.x, t.y, target.x, target.y);
        if (t.fireCd <= 0 && target && !target.dead) {
          t.fireCd = 0.5;
          const crit = Math.random() < p.stats.critChance;
          const dmg = t.dmg * (crit ? p.stats.critDamage : 1);
          const a = VR.angleTo(t.x, t.y, target.x, target.y);
          VR.projectiles.spawn({
            x: t.x + Math.cos(a) * 16, y: t.y + Math.sin(a) * 16,
            vx: Math.cos(a) * 560, vy: Math.sin(a) * 560,
            radius: 4, damage: dmg, crit, friendly: true,
            color: t.color, pierce: 0, life: 1.1, knockback: t.kb
          });
          VR.audio.play('shoot.sentinel');
          VR.fx.burst({ x: t.x + Math.cos(a) * 20, y: t.y + Math.sin(a) * 20, color: t.color, count: 2, speed: 90, life: 0.1, size: 1.8, dir: a, spread: 0.3 });
        }
      }
    },

    renderTurrets(ctx) {
      const t = this.time;
      for (const tu of this.turrets) {
        ctx.save();
        ctx.translate(tu.x, tu.y);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.08 * Math.sin(t * 6)) + ')';
        ctx.beginPath(); ctx.arc(0, 0, tu.radius + 3, 0, VR.TAU); ctx.fill();
        ctx.fillStyle = '#2a3a52';
        ctx.beginPath(); ctx.arc(0, 0, tu.radius, 0, VR.TAU); ctx.fill();
        ctx.strokeStyle = tu.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, tu.radius, 0, VR.TAU); ctx.stroke();
        ctx.rotate(tu.rot || 0);
        ctx.fillStyle = tu.color;
        ctx.fillRect(0, -3, tu.radius + 8, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tu.radius + 2, -1.5, 4, 3);
        ctx.restore();
      }
    },

    /* ================= rooms & waves ================= */
    checkRoomTransition() {
      const p = this.player;
      const room = this.currentRoom;
      if (p.x > room.bounds.x2 - 30) {
        const next = this.rooms[this.roomIndex + 1];
        if (next) {
          if (room.doorRight && !room.doorRight.open) {
            p.x = room.bounds.x2 - 40;
            return;
          }
          this.enterRoom(this.roomIndex + 1);
        } else {
          p.x = room.bounds.x2 - 30;
        }
      } else if (p.x < room.bounds.x - 30) {
        if (this.roomIndex > 0) {
          const prev = this.rooms[this.roomIndex - 1];
          if (prev.doorRight && !prev.doorRight.open) {
            p.x = room.bounds.x + 40;
            return;
          }
          this.enterRoom(this.roomIndex - 1);
        } else {
          p.x = room.bounds.x + 30;
        }
      }
    },

    enterRoom(idx) {
      this.roomIndex = idx;
      this.currentRoom = this.rooms[idx];
      this.barrels = this.currentRoom.barrels;
      this.turrets = [];   // sentinels stay in the room they were deployed in
      this.run.room = idx;
      this.buildRoomLayer(this.currentRoom);

      if (!this.currentRoom.entered) {
        this.currentRoom.entered = true;
        const type = this.currentRoom.type;
        if (type === 'combat' || type === 'pillar' || type === 'hazard' || type === 'cursed') {
          this.startWaves();
        } else if (type === 'elite') {
          this.showBanner('⚠ ELITE ENCOUNTER ⚠', 2);
          this.startWaves();
          VR.audio.setMusic('boss');
        } else if (type === 'treasure') {
          const self = this;
          setTimeout(() => { if (self.state === 'playing') self.showRewardChoice(); }, 700);
        } else if (type === 'shop') {
          const self = this;
          setTimeout(() => { if (self.state === 'playing') self.showRunShop(); }, 700);
        } else if (type === 'boss') {
          this.startBoss();
        }
        // rooms with no waves resolve their exit once cleared
        if ((type === 'spawn' || type === 'treasure' || type === 'shop' || type === 'choice') && !this.currentRoom.cleared) {
          this.currentRoom.cleared = true;
          // treasure/shop rooms resolve their exit after their modal is dismissed (resume())
          if (type === 'spawn' || type === 'choice') {
            if (this.state === 'playing') this.maybeBranch();
            else this.pendingBranch = true;
          }
        }
      }
    },

    /* ---------------- branching path choices ---------------- */
    maybeBranch() {
      const room = this.currentRoom;
      if (!room || !room.cleared) return;
      const next = this.rooms[this.roomIndex + 1];
      if (next && next.type === 'choice' && !next.entered) {
        this.showBranchChoice(next);
        return;
      }
      this.openExitDoor(room);
    },

    openExitDoor(room) {
      if (!room.doorRight || room.doorRight.open) return;
      room.doorRight.open = true;
      this.removeDoorSolid(room);
      VR.audio.play('doorOpen');
      VR.fx.burst({ x: room.doorRight.x, y: room.doorRight.y, color: '#43e6ff', count: 16, speed: 160, life: 0.4, size: 2.5 });
    },

    showBranchChoice(room) {
      this.pendingRoom = room;
      this.state = 'branch';
      VR.audio.play('doorOpen');
      VR.ui.showBranch(this.player, room.index);
    },

    chooseBranch(type) {
      if (!this.pendingRoom) return;
      const idx = this.pendingRoom.index;
      const rng = this.worldRng || VR.mulberry32(Math.floor(Math.random() * 1e9));
      this.rooms[idx] = VR.arena.buildRoom(idx, type, rng, this.run ? this.run.difficulty : null);
      this.pendingRoom = null;
      VR.audio.play('uiClick');
      VR.ui.hideAll();
      this.openExitDoor(this.currentRoom);
      this.state = 'playing';
      VR.audio.setMusic('combat');
    },

    startWaves() {
      const room = this.currentRoom;
      room.waveDelay = 1.4;
      room.waveIdx = 0;
      room.waveActive = false;
      this.showBanner('SECTOR ' + (room.index + 1), 1.4);
      VR.audio.play('waveStart');
    },

    updateWaves(dt) {
      const room = this.currentRoom;
      const waves = room.waves;
      if (!waves || !waves.length || room.cleared || room.type === 'spawn' || room.type === 'reward') return;

      let liveEnemies = 0;
      for (const e of this.enemies) if (!e.dead && !e.isBossAdd) liveEnemies++;

      if (room.waveActive) {
        if (liveEnemies === 0) {
          room.waveActive = false;
          room.waveIdx++;
          if (room.waveIdx < waves.length) {
            room.waveDelay = 2.2;
            this.showBanner(waves[room.waveIdx].desc || ('WAVE ' + (room.waveIdx + 1)), 1.6);
            VR.audio.play('waveStart');
          } else {
            this.clearRoom();
          }
        }
      } else if (room.waveIdx < waves.length) {
        if (room.waveDelay > 0) {
          room.waveDelay -= dt;
        } else {
          room.waveActive = true;
          VR.arena.spawnWave(this, room, waves[room.waveIdx]);
          VR.audio.play('doorOpen');
        }
      }
    },

    clearRoom() {
      const room = this.currentRoom;
      if (room.cleared) return;
      room.cleared = true;
      this.showBanner('ROOM CLEARED', 1.6);
      VR.audio.play('roomClear');
      const diff = VR.data.difficultyById[this.run.difficulty];
      const gMult = (diff && diff.goldMult) || 1;
      this.run.gold += Math.round(6 * gMult);
      if (room.cursed) {
        this.run.gold += Math.round(10 * gMult);
        VR.fx.floatText(room.bounds.x2 - 200, 420, '+' + Math.round(10 * gMult) + ' CURSE BOUNTY', '#ff5c7a');
      }
      // elite rooms may drop a relic
      if (room.type === 'elite' && Math.random() < 0.35) {
        const relic = VR.data.rollRelic(this.player);
        if (relic) this.giveRelic(relic);
      }
      // reward drops
      const roll = Math.random();
      if (roll < 0.4) this.spawnPickup('health', room.bounds.x2 - 200, 450, 1);
      else if (roll < 0.7) this.spawnPickup('gold', room.bounds.x2 - 200, 450, 12);
      else if (roll < 0.85) this.spawnPickup('power', room.bounds.x2 - 200, 450, 1);
      else this.spawnPickup('bomb', room.bounds.x2 - 200, 450, 1);
      // resolve the exit (or hold it for a branch choice)
      this.maybeBranch();
    },

    removeDoorSolid(room) {
      room.solids = room.solids.filter((s) => !(s.w === 26 && s.h === 170));
    },

    /* ================= boss ================= */
    startBoss() {
      const room = this.currentRoom;
      const def = room.bossId === 'razor' ? VR.BOSS_DEFS.razor : VR.BOSS_DEFS.warden;
      const BossCtor = room.bossId === 'razor' ? VR.Boss2 : VR.Boss;
      const diff = VR.data.difficultyById[this.run.difficulty] || VR.data.difficultyById.medium;
      this.boss = new BossCtor(room.bounds.x + room.bounds.w / 2, 450, {
        hpMult: (1 + this.roomIndex * 0.1) * diff.bossHp,
        dmgMult: (1 + this.roomIndex * 0.05) * diff.bossDmg,
        speedMult: diff.enemySpeedMult || 1,
        cdMult: diff.enemyCdMult || 1,
        contactCdMult: diff.enemyCdMult || 1
      });
      this.boss.spawnDelay = 1.0;
      this.bossIntro = 1.6;
      this.slowmo = 0.25;
      VR.ui.showBossBanner(def.name, def.subtitle);
      const sv = VR.save.get();
      sv.codex.bosses[def.id] = true;
      VR.audio.play('bossRoar');
      VR.audio.setMusic('boss');
      VR.fx.shake(0.7);
      VR.fx.flash(def.color, 0.25);
    },

    /** Apply the difficulty shard multiplier to a finished run. */
    applyShardMult(run) {
      const diff = VR.data.difficultyById[run.difficulty];
      if (diff && diff.shardMult !== 1) run.shardsEarned = Math.round(run.shardsEarned * diff.shardMult);
    },

    todayKey() {
      const d = new Date();
      const p = (n) => (n < 10 ? '0' + n : '' + n);
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    },

    /** Persist run-end records (daily scores, leaderboard, achievements). */
    recordRunEnd(won) {
      const run = this.run;
      const save = VR.save.get();
      save.shardsEarnedTotal = (save.shardsEarnedTotal || 0) + run.shardsEarned;
      const entry = {
        date: this.todayKey(), weapon: run.weaponId, won,
        time: run.time, kills: run.kills, depth: this.roomIndex,
        daily: !!run.daily, difficulty: run.difficulty || 'medium'
      };
      save.bestRuns.push(entry);
      if (save.bestRuns.length > 12) save.bestRuns.shift();
      if (won) {
        save.winsByWeapon[run.weaponId] = (save.winsByWeapon[run.weaponId] || 0) + 1;
        if (run.bossId) save.bossesKilled[run.bossId] = (save.bossesKilled[run.bossId] || 0) + 1;
        if (!save.bestRun || run.time < save.bestRun.time) {
          save.bestRun = { time: run.time, kills: run.kills, weapon: run.weaponId, date: entry.date, depth: this.roomIndex, difficulty: run.difficulty || 'medium' };
        }
      }
      if (run.daily && run.dateKey) {
        const prev = save.dailyScores[run.dateKey];
        if (!prev || (won && !prev.won) || (won === !!prev.won && run.time < prev.time)) {
          save.dailyScores[run.dateKey] = { time: run.time, kills: run.kills, depth: this.roomIndex, won, weapon: run.weaponId };
        }
        if (won) save.dailyWins = (save.dailyWins || 0) + 1;
      }
      VR.achievements.checkAll({ victory: won, run });
      VR.save.write();
    },

    triggerVictory() {
      if (this.state !== 'playing') return;
      const run = this.run;
      const save = VR.save.get();
      run.shardsEarned += Math.floor(run.gold) + 25;   // gold is converted to Void Shards
      this.applyShardMult(run);
      save.runsCompleted++; save.runsWon++;
      save.bestDepth = Math.max(save.bestDepth, this.roomIndex);
      VR.save.addShards(run.shardsEarned);
      VR.save.write();
      this.recordRunEnd(true);
      VR.fx.flash('#ffffff', 0.5);
      VR.audio.play('victory');
      VR.audio.setMusic('menu');
      this.state = 'victory';
      VR.ui.showEndScreen(true, run);
    },

    triggerGameOver() {
      if (this.state !== 'playing') return;
      const run = this.run;
      const save = VR.save.get();
      run.shardsEarned += Math.floor(run.gold);   // gold is converted to Void Shards
      this.applyShardMult(run);
      save.runsCompleted++;
      save.bestDepth = Math.max(save.bestDepth, this.roomIndex);
      VR.save.addShards(run.shardsEarned);
      VR.save.write();
      this.recordRunEnd(false);
      VR.fx.shake(0.6);
      VR.audio.play('gameOver');
      VR.audio.setMusic('menu');
      this.state = 'gameover';
      VR.ui.showEndScreen(false, run);
    },

    /* ================= pickups ================= */
    spawnPickup(type, x, y, value) {
      this.pickups.push({ x, y, type, value, vx: VR.randRange(-40, 40), vy: VR.randRange(-60, -20), life: 14, dead: false, bob: VR.randRange(0, 6) });
    },

    updatePickups(dt) {
      const p = this.player;
      const radius = p.stats.pickupRadius;
      for (const pk of this.pickups.slice()) {
        pk.life -= dt;
        if (pk.life <= 0) { this.pickups.splice(this.pickups.indexOf(pk), 1); continue; }
        const d2 = VR.dist2(pk.x, pk.y, p.x, p.y);
        if (d2 < radius * radius) {
          // magnet toward player
          const a = VR.angleTo(pk.x, pk.y, p.x, p.y);
          const sp = 520;
          pk.vx = VR.approach(pk.vx, Math.cos(a) * sp, 2600 * dt);
          pk.vy = VR.approach(pk.vy, Math.sin(a) * sp, 2600 * dt);
        } else {
          pk.vx *= Math.pow(0.9, dt * 60);
          pk.vy *= Math.pow(0.9, dt * 60);
        }
        pk.x += pk.vx * dt; pk.y += pk.vy * dt;

        if (d2 < (pk.r || 14) * (pk.r || 14) || VR.dist2(pk.x, pk.y, p.x, p.y) < (14 + p.radius) ** 2) {
          this.collectPickup(pk);
        }
      }
    },

    collectPickup(pk) {
      const i = this.pickups.indexOf(pk);
      if (i >= 0) this.pickups.splice(i, 1);
      const p = this.player;
      if (pk.type === 'xp') {
        // gold coin XP
        p.gainXp(pk.value, this);
        VR.audio.play('pickup');
        VR.fx.burst({ x: pk.x, y: pk.y, color: '#ffcf4d', count: 4, speed: 90, life: 0.2, size: 1.5 });
      } else if (pk.type === 'gold') {
        const gained = Math.round(pk.value * (p.stats.goldMult || 1));
        this.run.gold += gained;
        VR.audio.play('coin');
        VR.fx.floatText(p.x, p.y - 26, '+' + gained + ' GOLD', '#ffcf4d');
      } else if (pk.type === 'health') {
        // potion item (drink with 2)
        p.items.potions = Math.min(99, p.items.potions + pk.value);
        VR.audio.play('pickup.health');
        VR.fx.floatText(p.x, p.y - 26, '+ POTION', '#7dff9e');
      } else if (pk.type === 'bomb') {
        p.items.bombs = Math.min(99, p.items.bombs + pk.value);
        VR.audio.play('pickup');
        VR.fx.floatText(p.x, p.y - 26, '+ BOMB', '#ff8a3d');
      } else if (pk.type === 'key') {
        p.items.keys = Math.min(9, p.items.keys + pk.value);
        VR.audio.play('pickup.shard');
        VR.fx.floatText(p.x, p.y - 26, '+ KEY', '#ffe9a3');
      } else if (pk.type === 'shard') {
        this.run.shardsEarned += pk.value;
        VR.audio.play('pickup.shard');
        VR.fx.floatText(p.x, p.y - 26, '+' + pk.value + ' SHARD', '#a06bff');
      } else if (pk.type === 'power') {
        p.powerTimer = 15;
        VR.audio.play('levelup');
        VR.fx.floatText(p.x, p.y - 26, 'DAMAGE UP!', '#ffb84d');
        VR.fx.ring(p.x, p.y, '#ffb84d', 60, 1);
      }
    },

    /* ---------------- bombs ---------------- */
    updateBombs(dt) {
      for (const b of this.bombs.slice()) {
        b.t -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= Math.pow(0.86, dt * 60);
        b.vy *= Math.pow(0.86, dt * 60);
        const res = this.resolveSolids(b.x, b.y, b.r);
        if (Math.abs(res.x - b.x) > 1 || Math.abs(res.y - b.y) > 1) { b.vx = 0; b.vy = 0; }
        b.x = res.x; b.y = res.y;
        if (b.t <= 0) {
          this.bombs.splice(this.bombs.indexOf(b), 1);
          this.explodeBomb(b);
        }
      }
    },

    explodeBomb(b) {
      const R = 115;
      VR.fx.shake(0.7);
      VR.fx.flash('#ffb84d', 0.18);
      VR.audio.play('explosion');
      VR.fx.burst({ x: b.x, y: b.y, color: '#ffb84d', count: 30, speed: 260, life: 0.5, size: 3.5 });
      VR.fx.burst({ x: b.x, y: b.y, color: '#ff5c7a', count: 16, speed: 200, life: 0.4, size: 3 });
      VR.fx.ring(b.x, b.y, '#ffb84d', R, 1);
      for (const e of this.enemies.slice()) {
        if (e.dead) continue;
        if (VR.dist2(b.x, b.y, e.x, e.y) < R * R) {
          VR.combat.damageEnemy(e, 85, { knockback: 700, source: null });
        }
      }
      for (const bar of this.barrels.slice()) if (!bar.dead && VR.dist2(b.x, b.y, bar.x, bar.y) < (R + bar.r) ** 2) bar.hp = 0;
    },

    /* ---------------- chests & interact ---------------- */
    tryInteract() {
      const p = this.player;
      const room = this.currentRoom;
      if (!room || !room.chests) return;
      for (const c of room.chests) {
        if (c.open) continue;
        if (VR.dist2(p.x, p.y, c.x, c.y) < 56 * 56) {
          if (c.locked && p.items.keys <= 0) {
            VR.audio.play('uiBack');
            VR.fx.floatText(c.x, c.y - 30, 'NEED A KEY', '#ffe9a3');
            return;
          }
          if (c.locked) { p.items.keys--; VR.audio.play('pickup.shard'); }
          c.open = true;
          this.openChest(c);
          return;
        }
      }
    },

    openChest(c) {
      VR.fx.shake(0.2);
      VR.audio.play('coin');
      VR.fx.burst({ x: c.x, y: c.y, color: '#ffcf4d', count: 18, speed: 160, life: 0.4, size: 2.5 });
      const roll = Math.random();
      if (roll < 0.4) this.spawnPickup('gold', c.x + VR.randRange(-10, 10), c.y - 20, 25 + VR.irand(35));
      else if (roll < 0.6) this.spawnPickup('health', c.x + VR.randRange(-10, 10), c.y - 20, 2);
      else if (roll < 0.72) this.spawnPickup('bomb', c.x + VR.randRange(-10, 10), c.y - 20, 2);
      else if (roll < 0.82) this.spawnPickup('key', c.x + VR.randRange(-10, 10), c.y - 20, 1);
      else {
        // relic: grant a random passive relic
        const relic = VR.data.rollRelic(this.player);
        if (relic) this.giveRelic(relic);
        else this.spawnPickup('gold', c.x, c.y - 20, 20);
      }
      if (c.big) {
        this.spawnPickup('gold', c.x + 16, c.y - 16, 40);
        this.spawnPickup('health', c.x - 16, c.y - 16, 2);
        this.spawnPickup('key', c.x, c.y - 30, 1);
      }
    },

    /* ================= level up ================= */
    onLevelUp() {
      this.state = 'levelup';
      VR.audio.play('levelup');
      VR.fx.flash('#43e6ff', 0.12);
      VR.ui.showLevelUp(this.player);
    },

    applyUpgrade(player, upgrade) {
      upgrade.apply(player);
      player.upgrades.set(upgrade.id, (player.upgrades.get(upgrade.id) || 0) + 1);
      this.run.upgradesTaken.push(upgrade.id);
      VR.audio.play('upgrade');
      VR.fx.flash('#a06bff', 0.2);
      VR.fx.ring(player.x, player.y, '#a06bff', 90, 1);
    },

    /* ================= reward room / run shop / relics ================= */
    showRewardChoice() {
      if (this.currentRoom.rewardGiven) return;
      this.currentRoom.rewardGiven = true;
      this.state = 'reward';
      VR.audio.play('coin');
      VR.ui.showReward(this.player);
    },

    showRunShop() {
      if (this.currentRoom.shopGiven) return;
      this.currentRoom.shopGiven = true;
      this.state = 'rshop';
      VR.audio.play('coin');
      VR.ui.showRunShop(this.player);
    },

    /** Grant a relic to the pouch. If full, converts to gold. Returns equipped flag. */
    giveRelic(relicDef) {
      if (!relicDef) return false;
      if (this.player.addRelic(relicDef)) {
        this.run.relicsTaken.push(relicDef.id);
        VR.audio.play('relic');
        VR.fx.floatText(this.player.x, this.player.y - 30, 'RELIC: ' + relicDef.name, relicDef.color);
        VR.fx.ring(this.player.x, this.player.y, relicDef.color, 70, 1);
        VR.fx.burst({ x: this.player.x, y: this.player.y, color: relicDef.color, count: 14, speed: 170, life: 0.35, size: 2.5 });
        VR.achievements.checkAll({});
        return true;
      }
      VR.audio.play('coin');
      VR.fx.floatText(this.player.x, this.player.y - 30, 'POUCH FULL — +20 GOLD', '#ffcf4d');
      this.run.gold += 20;
      return false;
    },

    /** Purchase an item in a run shop room. Returns success. */
    buyRunShopItem(kind) {
      const p = this.player;
      const g = this.run.gold;
      const costs = { potion: 20, bomb: 15, key: 25, relic: 50, heal: 18 };
      const cost = costs[kind];
      if (cost === undefined || g < cost) { VR.audio.play('uiBack'); return false; }
      if (kind === 'relic') {
        const relic = VR.data.rollRelic(p);
        if (!relic || p.relics.length >= VR.data.RELIC_SLOTS) { VR.audio.play('uiBack'); return false; }
        this.run.gold -= cost;
        this.giveRelic(relic);
        VR.audio.play('coin');
        return true;
      }
      this.run.gold -= cost;
      if (kind === 'potion') { p.items.potions = Math.min(99, p.items.potions + 2); VR.fx.floatText(p.x, p.y - 26, '+2 POTIONS', '#7dff9e'); }
      else if (kind === 'bomb') { p.items.bombs = Math.min(99, p.items.bombs + 2); VR.fx.floatText(p.x, p.y - 26, '+2 BOMBS', '#ff8a3d'); }
      else if (kind === 'key') { p.items.keys = Math.min(9, p.items.keys + 1); VR.fx.floatText(p.x, p.y - 26, '+1 KEY', '#ffe9a3'); }
      else if (kind === 'heal') { p.heal(40); VR.fx.floatText(p.x, p.y - 26, '+40 HP', '#7dff9e'); }
      VR.audio.play('pickup.health');
      return true;
    },

    /* ================= combat ================= */
    collideSolids(x, y, r) {
      const room = this.currentRoom;
      for (const s of room.solids) {
        if (VR.circleRectHit(x, y, r, s.x, s.y, s.w, s.h)) return true;
      }
      for (const m of room.moverRects || []) {
        if (VR.circleRectHit(x, y, r, m.x, m.y, m.w, m.h)) return true;
      }
      return false;
    },

    pointInSolids(x, y, r) {
      return this.collideSolids(x, y, r);
    },

    resolveSolids(x, y, r) {
      let res = { x, y };
      const room = this.currentRoom;
      for (const s of room.solids) {
        if (VR.circleRectHit(res.x, res.y, r, s.x, s.y, s.w, s.h)) {
          res = VR.resolveCircleRect(res.x, res.y, r, s.x, s.y, s.w, s.h);
        }
      }
      for (const m of room.moverRects || []) {
        if (VR.circleRectHit(res.x, res.y, r, m.x, m.y, m.w, m.h)) {
          res = VR.resolveCircleRect(res.x, res.y, r, m.x, m.y, m.w, m.h);
        }
      }
      return res;
    },

    clampToRoom(entity) {
      const b = this.currentRoom.bounds;
      entity.y = VR.clamp(entity.y, 26 + entity.radius, b.y2 - 26 - entity.radius);
      entity.x = VR.clamp(entity.x, b.x - 20 + entity.radius, b.x2 + 20 - entity.radius);
    },

    findEnemyInRange(x, y, r) {
      let best = null, bd = r * r;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const rr = r + e.radius;
        const d2 = VR.dist2(x, y, e.x, e.y);
        if (d2 < rr * rr && d2 < bd) { bd = d2; best = e; }
      }
      if (this.boss && !this.boss.dead) {
        const rr = r + this.boss.radius;
        const d2 = VR.dist2(x, y, this.boss.x, this.boss.y);
        if (d2 < rr * rr && d2 < bd) { bd = d2; best = this.boss; }
      }
      for (const b of this.barrels) {
        if (b.dead) continue;
        const rr = r + b.r;
        const d2 = VR.dist2(x, y, b.x, b.y);
        if (d2 < rr * rr && d2 < bd) { bd = d2; best = b; }
      }
      return best;
    },

    /* ================= camera ================= */
    updateCamera(dt) {
      const p = this.player;
      const lookX = Math.cos(p.aimAngle) * 80;
      const lookY = Math.sin(p.aimAngle) * 80;
      const tx = p.x + lookX, ty = p.y + lookY;
      this.camX = VR.lerp(this.camX, tx, 1 - Math.pow(0.0001, dt));
      this.camY = VR.lerp(this.camY, ty, 1 - Math.pow(0.0001, dt));

      const room = this.currentRoom;
      const minX = room.bounds.x + this.viewW / 2 - 40;
      const maxX = room.bounds.x2 - this.viewW / 2 + 40;
      const minY = this.viewH / 2 - 40;
      const maxY = room.bounds.h - this.viewH / 2 + 40;
      this.camX = VR.clamp(this.camX, minX, maxX);
      this.camY = VR.clamp(this.camY, minY, maxY);

      this.zoomImpulse = Math.max(0, this.zoomImpulse - dt * 3);
      this.camZoom = 1 + this.zoomImpulse;
    },

    zoomPulse() { this.zoomImpulse = 0.08; },

    /* ================= debug ================= */
    debugKeys(inp) {
      const p = this.player;
      if (inp.wasPressed('F1')) { p.godMode = !p.godMode; VR.fx.floatText(p.x, p.y - 30, p.godMode ? 'GOD MODE ON' : 'GOD MODE OFF', '#ffb84d'); }
      if (inp.wasPressed('F2')) {
        for (const e of this.enemies.slice()) if (!e.dead) { e.hp = 0; e.die(); }
        VR.fx.floatText(p.x, p.y - 30, 'ALL ENEMIES VANQUISHED', '#ff5c7a');
      }
      if (inp.wasPressed('F3')) { p.gainXp(p.xpToNext - p.xp + 1, this); }
      if (inp.wasPressed('F4')) { this.run.shardsEarned += 50; VR.fx.floatText(p.x, p.y - 30, '+50 SHARDS', '#a06bff'); }
      if (inp.wasPressed('F5')) { p.hp = p.stats.maxHp; p.shield = p.stats.maxShield; VR.fx.floatText(p.x, p.y - 30, 'FULLY RESTORED', '#7dff9e'); }
      if (inp.wasPressed('F6')) {
        const room = this.currentRoom;
        if (room.waves && room.waves.length) this.clearRoom();
        for (const e of this.enemies.slice()) if (!e.dead) { e.hp = 0; e.die(); }
      }
      if (inp.wasPressed('F7')) {
        // skip to boss room
        for (let i = this.roomIndex; i < this.rooms.length - 1; i++) {
          const r = this.rooms[i];
          r.cleared = true;
          if (r.doorRight) { r.doorRight.open = true; this.removeDoorSolid(r); }
        }
        this.player.x = this.rooms[this.rooms.length - 1].bounds.x + 200;
      }
    },

    /* ================= banners ================= */
    showBanner(text, dur) {
      VR.ui.showWaveBanner(text, dur);
      this.bannerTimer = dur;
    },

    /* ================= render ================= */
    render() {
      const ctx = this.ctx;
      const dpr = this.dpr || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0a0705';
      ctx.fillRect(0, 0, this.vw, this.vh);

      if (!this.currentRoom || !this.bgCanvas) {
        this.renderMenuBackdrop(ctx);
        return;
      }

      /* -- world pass: native resolution, camera transform -- */
      ctx.save();
      ctx.translate(this.ox * dpr, this.oy * dpr);
      ctx.scale(this.viewScale * dpr, this.viewScale * dpr);
      const shake = VR.fx.shakeOffset;
      ctx.translate(this.viewW / 2 + shake.x / this.viewScale, this.viewH / 2 + shake.y / this.viewScale);
      ctx.scale(this.camZoom, this.camZoom);
      ctx.translate(-this.camX, -this.camY);

      const room = this.currentRoom;
      // cached static layer (floor, walls, braziers, chains) drawn first —
      // nearest-neighbour so the cached image stays crisp when scaled
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.bgCanvas, room.bounds.x, room.bounds.y);
      ctx.imageSmoothingEnabled = true;
      this.renderRoomDynamic(ctx);
      VR.arena.renderLasers(ctx, room);
      VR.arena.renderSpikes(ctx, room);
      VR.arena.renderMovers(ctx, room);
      for (const b of room.barrels) VR.arena.renderBarrel(ctx, b);
      VR.arena.renderFlames(ctx, room);
      for (const pk of this.pickups) VR.arena.renderPickup(ctx, pk);
      for (const e of this.enemies) e.render(ctx);
      if (this.boss) this.boss.render(ctx);
      for (const b of this.bombs) VR.arena.renderBomb(ctx, b);
      this.renderTurrets(ctx);
      VR.projectiles.render(ctx);
      if (this.player && !this.player.dead) this.player.render(ctx);
      VR.fx.render(ctx);

      // cursed room dark tint
      if (room.cursed) {
        const b = room.bounds;
        ctx.fillStyle = 'rgba(28, 0, 40, 0.28)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      ctx.restore();

      /* -- crisp HUD pass -- */
      ctx.translate(this.ox * dpr, this.oy * dpr);
      ctx.scale(this.viewScale * dpr, this.viewScale * dpr);
      this.renderHUD(ctx);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.renderVignette(ctx);

      if (VR.fx.flashAlpha > 0) {
        ctx.globalAlpha = VR.fx.flashAlpha;
        ctx.fillStyle = VR.fx.flashColor;
        ctx.fillRect(0, 0, this.vw, this.vh);
        ctx.globalAlpha = 1;
      }
    },

    renderMenuBackdrop(ctx) {
      const t = this.time;
      ctx.save();
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 137.51) % 1) * this.vw;
        const sy = ((i * 73.31) % 1) * this.vh;
        const drift = Math.sin(t * 0.4 + i) * 12;
        const a = 0.12 + 0.1 * Math.sin(t * 1.5 + i * 2.3);
        ctx.globalAlpha = Math.max(0.04, a);
        ctx.fillStyle = i % 3 === 0 ? '#a06bff' : '#ffb84d';
        ctx.fillRect(sx + drift, sy, 2, 2);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    /* Build the static room layer (floor, walls, bricks, grout) into a cached
       offscreen canvas at native resolution — redrawn only on room change. */
    buildRoomLayer(room) {
      const b = room.bounds;
      const ctx = this.bgCtx;
      const w = Math.max(2, Math.ceil(b.w));
      const h = Math.max(2, Math.ceil(b.h));
      if (this.bgCanvas.width !== w) this.bgCanvas.width = w;
      if (this.bgCanvas.height !== h) this.bgCanvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(-b.x, -b.y); // draw in world coords; drawn back at bounds origin

      // ---- stone paver floor ----
      ctx.fillStyle = '#2b1f18';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // diamond paver pattern
      const pw = 56, ph = 30;
      for (let gy = 0; gy < b.h / ph + 1; gy++) {
        for (let gx = 0; gx < b.w / pw + 1; gx++) {
          const cx = b.x + gx * pw + (gy % 2 ? pw / 2 : 0);
          const cy = b.y + gy * ph;
          ctx.fillStyle = (gx + gy) % 2 === 0 ? '#3a2a20' : '#35271e';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + pw / 2, cy + ph / 2);
          ctx.lineTo(cx, cy + ph);
          ctx.lineTo(cx - pw / 2, cy + ph / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
      // grout + stains
      ctx.strokeStyle = 'rgba(20, 12, 8, 0.5)';
      ctx.lineWidth = 1;
      for (let gy = 0; gy < b.h / ph + 1; gy++) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + gy * ph);
        ctx.lineTo(b.x2, b.y + gy * ph);
        ctx.stroke();
      }

      // room border
      ctx.strokeStyle = 'rgba(138, 106, 58, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

      // ---- stone walls / pillars with brick detail ----
      // (door solids are drawn dynamically by renderDoor so they can open)
      for (const s of room.solids) {
        if (s.w === 26 && s.h === 170) continue;
        ctx.fillStyle = '#4a4238';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#5d5447';
        ctx.fillRect(s.x, s.y, s.w, 4);
        ctx.fillStyle = '#2b241c';
        ctx.fillRect(s.x, s.y + s.h - 3, s.w, 3);
        // brick rows
        ctx.strokeStyle = 'rgba(30, 22, 16, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let by = s.y + 6; by < s.y + s.h; by += 10) {
          ctx.moveTo(s.x, by); ctx.lineTo(s.x + s.w, by);
        }
        ctx.stroke();
        // brick offset verticals
        ctx.beginPath();
        for (let bx = s.x + 8; bx < s.x + s.w; bx += 16) {
          const off = Math.floor((bx - s.x) / 16) % 2;
          ctx.moveTo(bx, s.y + 6 + off * 5); ctx.lineTo(bx, s.y + s.h - 3);
        }
        ctx.stroke();
      }
    },

    /* Animated / stateful room elements drawn every frame (doors, flames, chests). */
    renderRoomDynamic(ctx) {
      const room = this.currentRoom;
      const b = room.bounds;
      const t = this.time;

      // doorways (barrier animates / opens)
      this.renderDoor(ctx, room, true);
      this.renderDoor(ctx, room, false);

      // ---- wall braziers (torches) ----
      for (const s of room.solids) {
        if (s.h < 40) continue; // only thick walls
        for (let bx = s.x + 30; bx < s.x + s.w - 20; bx += 130) {
          this.renderBrazier(ctx, bx, s.y, s.y + s.h, t);
        }
      }

      // ---- hanging chains from the ceiling ----
      for (let cx = b.x + 150; cx < b.x2 - 60; cx += 300) {
        this.renderChain(ctx, cx, t);
      }

      // ---- chests ----
      if (room.chests) {
        for (const c of room.chests) this.renderChest(ctx, c, t);
      }

      // dungeon merchant stall (shop rooms)
      if (room.shop) {
        const sx = room.shop.x, sy = room.shop.y;
        ctx.fillStyle = '#3a2f22';
        ctx.fillRect(sx - 70, sy - 26, 140, 52);
        ctx.fillStyle = '#5d4a30';
        ctx.fillRect(sx - 70, sy - 26, 140, 8);
        ctx.fillStyle = '#8a6a3a';
        ctx.fillRect(sx - 70, sy - 6, 140, 6);
        ctx.fillRect(sx - 70, sy + 16, 140, 6);
        ctx.fillStyle = '#c8a84a';
        ctx.fillRect(sx - 4, sy - 20, 8, 40);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + 0.25 * Math.sin(t * 6);
        ctx.fillStyle = '#ffb84d';
        ctx.fillRect(sx - 46, sy - 34, 5, 8);
        ctx.fillRect(sx + 42, sy - 34, 5, 8);
        ctx.restore();
        VR.pixel.text(ctx, 'SHOP', sx, sy + 30, '#ffe9a3', 2.4, 'center');
        // wares
        VR.pixel.icon(ctx, 'potion', sx - 46, sy - 14, 18);
        VR.pixel.icon(ctx, 'bomb', sx - 14, sy - 14, 18);
        VR.pixel.icon(ctx, 'key', sx + 18, sy - 14, 18);
        VR.pixel.icon(ctx, 'chest', sx + 48, sy - 14, 18);
      }

      // interact prompt
      if (this.player && room.chests) {
        for (const c of room.chests) {
          if (c.open) continue;
          if (VR.dist2(this.player.x, this.player.y, c.x, c.y) < 56 * 56) {
            VR.pixel.text(ctx, c.locked ? 'E - OPEN (KEY)' : 'E - OPEN', c.x, c.y - 34, '#ffe9a3', 2, 'center');
          }
        }
      }
    },

    renderBrazier(ctx, bx, y0, y1, t) {
      // wall torch: bowl + flame
      const by = y0 + 12;
      ctx.fillStyle = '#3a2f22';
      ctx.fillRect(bx - 5, by, 10, 6);
      const fl = 3 + Math.floor(Math.sin(t * 14 + bx) * 1.5);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(bx - 2, by - 6 - fl, 4, 6 + fl);
      ctx.fillStyle = '#ffd97a';
      ctx.fillRect(bx - 1, by - 4 - fl, 2, 4);
      ctx.restore();
      void y1;
    },

    renderChain(ctx, cx, t) {
      // hanging chain ending in a burning cage
      const top = this.currentRoom.bounds.y;
      ctx.fillStyle = '#6a6258';
      for (let i = 0; i < 4; i++) ctx.fillRect(cx - 1, top + 4 + i * 7, 3, 6);
      ctx.fillStyle = '#3a2f22';
      ctx.fillRect(cx - 7, top + 30, 14, 12);
      const fl = 4 + Math.floor(Math.sin(t * 11 + cx * 0.7) * 2);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(cx - 3, top + 26 - fl, 6, 8 + fl);
      ctx.fillStyle = '#ffd97a';
      ctx.fillRect(cx - 1, top + 28 - fl, 3, 5);
      ctx.restore();
    },

    renderChest(ctx, c, t) {
      const w = 44, h = 30;
      const x = c.x - w / 2, y = c.y - h / 2;
      if (c.open) {
        ctx.fillStyle = '#5a3a18';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#7a4a22';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.fillStyle = 'rgba(255, 207, 77, 0.7)';
        ctx.fillRect(x + 6, y + 6, w - 12, 6);
        // glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(t * 6);
        ctx.fillStyle = '#ffcf4d';
        ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
        ctx.restore();
        return;
      }
      // closed chest with gold bands
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = '#8f5c2c';
      ctx.fillRect(x + 2, y + 2, w - 4, 6);
      ctx.fillStyle = '#c8a84a';
      ctx.fillRect(x + 2, y + 10, w - 4, 4);
      ctx.fillRect(x + 2, y + h - 8, w - 4, 4);
      ctx.fillRect(x + w / 2 - 3, y + 2, 6, h - 4);
      // lock
      if (c.locked) {
        ctx.fillStyle = '#d9d2b8';
        ctx.fillRect(x + w / 2 - 3, y + h / 2 - 5, 6, 6);
      }
      // faint glow pulse
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(t * 3 + c.x);
      ctx.fillStyle = '#ffcf4d';
      ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.restore();
    },

    renderDoor(ctx, room, isRight) {
      if (isRight && !room.doorRight) return;
      if (!isRight && !room.doorLeft) return;
      const door = isRight ? room.doorRight : room.doorLeft;
      const x = door.x - 20;
      const y = door.y - 85;
      // stone frame
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(x, y, 40, 170);
      ctx.fillStyle = '#5d5447';
      ctx.fillRect(x, y, 40, 4);
      ctx.fillStyle = '#2b241c';
      ctx.fillRect(x, y + 166, 40, 4);
      // torch-field barrier when closed
      if (!door.open) {
        const t = this.time;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.7 + 0.2 * Math.sin(t * 6);
        ctx.fillStyle = '#ff8a3d';
        ctx.fillRect(x + 6, y + 4, 28, 162);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd97a';
        for (let yy = y + 8; yy < y + 170; yy += 18) ctx.fillRect(x + 8, yy, 24, 3);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(20, 14, 10, 0.6)';
        ctx.fillRect(x + 6, y + 4, 28, 162);
      }
    },

    /* ================= dungeon HUD ================= */
    drawSlot(ctx, x, y, s) {
      ctx.fillStyle = '#241a12';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(x, y, s, 2);
      ctx.fillRect(x, y + s - 2, s, 2);
      ctx.fillRect(x, y, 2, s);
      ctx.fillRect(x + s - 2, y, 2, s);
      ctx.strokeStyle = 'rgba(255, 233, 163, 0.2)';
      ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    },

    renderHUD(ctx) {
      const p = this.player;
      if (!p || !this.run) return;
      const w = this.viewW, h = this.viewH;
      const app = p.appearance;

      /* ---- top-left: portrait, name, bars ---- */
      const frameX = 16, frameY = 16, frameS = 56;
      ctx.fillStyle = '#1d140c';
      ctx.fillRect(frameX - 3, frameY - 3, frameS + 6, frameS + 6);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(frameX - 2, frameY - 2, frameS + 4, 2);
      ctx.fillRect(frameX - 2, frameY + frameS + 2, frameS + 4, 2);
      ctx.fillRect(frameX - 2, frameY - 2, 2, frameS + 4);
      ctx.fillRect(frameX + frameS + 2, frameY - 2, 2, frameS + 4);
      ctx.save();
      ctx.translate(frameX + frameS / 2, frameY + frameS / 2 - 2);
      VR.pixel.character(ctx, app, app.hairStyle || 0, 2.3);
      ctx.restore();

      const tx = frameX + frameS + 14;
      VR.pixel.text(ctx, 'BLACK RABBIT', tx, frameY + 4, '#ffe9c9', 2.6);

      // HP bar
      const barW = 224, barH = 13, barY = frameY + 30;
      ctx.fillStyle = '#3a0d0d';
      ctx.fillRect(tx - 1, barY - 1, barW + 2, barH + 2);
      const hpPct = VR.clamp(p.hp / p.stats.maxHp, 0, 1);
      ctx.fillStyle = '#d92626';
      ctx.fillRect(tx, barY, barW * hpPct, barH);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(tx, barY, barW * hpPct, 3);
      VR.pixel.text(ctx, Math.max(0, Math.ceil(p.hp)) + ' / ' + p.stats.maxHp, tx + 3, barY + 3, '#ffffff', 1.6);

      // MP bar
      const mpY = barY + barH + 6, mpH = 9;
      ctx.fillStyle = '#14204a';
      ctx.fillRect(tx - 1, mpY - 1, barW + 2, mpH + 2);
      ctx.fillStyle = '#2f5fd6';
      ctx.fillRect(tx, mpY, barW * p.manaPct(), mpH);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(tx, mpY, barW * p.manaPct(), 2);
      VR.pixel.text(ctx, Math.floor(p.mana), tx + barW - 30, mpY + 1, '#d6e4ff', 1.5);

      // XP bar + level
      const xpY = mpY + mpH + 5, xpH = 6;
      ctx.fillStyle = '#201608';
      ctx.fillRect(tx - 1, xpY - 1, barW + 2, xpH + 2);
      ctx.fillStyle = '#c8a84a';
      ctx.fillRect(tx, xpY, barW * VR.clamp(p.xp / p.xpToNext, 0, 1), xpH);
      VR.pixel.text(ctx, 'LV ' + p.level, tx, xpY - 12, '#ffe9c9', 2);

      // gear button (settings)
      const gx = frameX + frameS + 14 + barW + 6, gy = frameY;
      this.gearRect = { x: gx, y: gy, w: 26, h: 26 };
      this.drawSlot(ctx, gx, gy, 26);
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(gx + 9, gy + 6, 8, 14);
      ctx.fillRect(gx + 6, gy + 9, 14, 8);

      /* ---- top-right: inventory slots ---- */
      const invS = 46, invGap = 7;
      const invY = 16;
      const invItems = [
        { type: 'gold', n: this.run.gold, label: '' },
        { type: 'potion', n: p.items.potions, label: '' },
        { type: 'bomb', n: p.items.bombs, label: '' },
        { type: 'key', n: p.items.keys, label: '' },
        { type: null, n: 0, label: '' },
        { type: null, n: 0, label: '' }
      ];
      for (let i = 0; i < invItems.length; i++) {
        const sx = w - 16 - invS - i * (invS + invGap);
        this.drawSlot(ctx, sx, invY, invS);
        const it = invItems[i];
        if (it.type === 'gold') {
          VR.pixel.coin(ctx, sx + invS / 2, invY + 14, 9);
          VR.pixel.text(ctx, String(it.n), sx + invS / 2, invY + invS - 16, '#ffcf4d', 2, 'center');
        } else if (it.type) {
          VR.pixel.icon(ctx, it.type, sx + invS / 2 - 9, invY + 7, 18);
          // count badge
          ctx.fillStyle = '#2a1c12';
          ctx.beginPath(); ctx.arc(sx + invS - 9, invY + 9, 8, 0, VR.TAU); ctx.fill();
          ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(sx + invS - 9, invY + 9, 8, 0, VR.TAU); ctx.stroke();
          VR.pixel.text(ctx, String(it.n), sx + invS - 9, invY + 4, '#ffffff', 1.5, 'center');
        }
      }
      // shards + kills under inventory
      VR.pixel.icon(ctx, 'gem', w - 16 - invS - 3 * (invS + invGap) - 24, invY + invS + 6, 12);
      VR.pixel.text(ctx, this.run.shardsEarned, w - 16 - invS - 3 * (invS + invGap) + 12, invY + invS + 6, '#c9a6ff', 2);
      VR.pixel.text(ctx, 'KILLS ' + this.run.kills, w - 16 - invS, invY + invS + 8, '#c9a0a0', 1.6, 'right');

      // relic pouch (below inventory)
      const rSize = 22, rGap = 5, rY = invY + invS + 26;
      for (let i = 0; i < VR.data.RELIC_SLOTS; i++) {
        const rx = w - 16 - invS - (VR.data.RELIC_SLOTS - 1 - i) * (rSize + rGap);
        this.drawSlot(ctx, rx, rY, rSize);
        const relic = p.relics[i];
        if (relic) {
          ctx.save();
          ctx.font = '14px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(relic.icon, rx + rSize / 2, rY + rSize / 2 + 1);
          ctx.restore();
        }
      }
      if (p.relics.length) {
        VR.pixel.text(ctx, 'RELIC POUCH ' + p.relics.length + '/' + VR.data.RELIC_SLOTS, w - 16 - invS - 2, rY - 15, '#a06bff', 1.3, 'right');
      }

      /* ---- top-center: timer + wave + difficulty ---- */
      const tw = VR.pixel.text(ctx, 'TIME ' + VR.formatTime(this.runTime), w / 2, 16, '#e8d5b5', 2.4, 'center');
      const diff = VR.data.difficultyById[this.run.difficulty];
      if (diff) {
        VR.pixel.text(ctx, diff.name, w / 2 + tw / 2 + 34, 16, diff.color, 2, 'left');
      }
      const room = this.currentRoom;
      if (room.waves && room.waves.length && !room.cleared && room.waveIdx < room.waves.length) {
        VR.pixel.text(ctx, room.waves[room.waveIdx].desc || 'WAVE', w / 2, 34, '#ffb84d', 2, 'center');
      }
      if (p.powerTimer > 0) {
        VR.pixel.text(ctx, 'POWER UP ' + Math.ceil(p.powerTimer), w / 2, 52, '#ffcf4d', 2, 'center');
      }

      /* ---- bottom-left: action bar ---- */
      const abS = 48, abGap = 10, abY = h - 16 - abS;
      const actions = [
        { key: '1', icon: 'skull', name: 'DASH', cd: p.dashTimer > 0 ? 1 : (p.dashCharges >= p.stats.dashCharges ? 0 : 1 - p.dashCdTimer / p.stats.dashCd), ready: p.dashCharges > 0 },
        { key: '2', icon: 'potion', name: 'POTION', count: p.items.potions, ready: p.items.potions > 0 },
        { key: '3', icon: 'bomb', name: 'BOMB', count: p.items.bombs, ready: p.items.bombs > 0 },
        { key: 'Q', icon: 'nova', name: 'NOVA', mana: 25, ready: p.mana >= 25 && p.novaCd <= 0 }
      ];
      for (let i = 0; i < actions.length; i++) {
        const ax = 16 + i * (abS + abGap);
        const a = actions[i];
        this.drawSlot(ctx, ax, abY, abS);
        VR.pixel.icon(ctx, a.icon, ax + abS / 2 - 10, abY + 5, 20);
        if (a.count !== undefined) {
          ctx.fillStyle = '#2a1c12';
          ctx.beginPath(); ctx.arc(ax + abS - 8, abY + 8, 7, 0, VR.TAU); ctx.fill();
          ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(ax + abS - 8, abY + 8, 7, 0, VR.TAU); ctx.stroke();
          VR.pixel.text(ctx, String(a.count), ax + abS - 8, abY + 4, '#ffffff', 1.4, 'center');
        }
        if (a.mana) VR.pixel.text(ctx, a.mana + 'MP', ax + abS / 2, abY + abS - 16, '#8fd0ff', 1.3, 'center');
        VR.pixel.text(ctx, a.key, ax + abS / 2, abY + abS + 2, '#e8d5b5', 2, 'center');
        // dim + cooldown overlay
        if (!a.ready) {
          ctx.fillStyle = 'rgba(10, 7, 5, 0.55)';
          ctx.fillRect(ax + 2, abY + 2, abS - 4, abS - 4);
        }
        if (a.cd > 0) {
          ctx.fillStyle = 'rgba(10, 7, 5, 0.7)';
          ctx.fillRect(ax + 2, abY + 2, abS - 4, (abS - 4) * VR.clamp(a.cd, 0, 1));
        }
      }

      /* ---- bottom-right: minimap ---- */
      this.renderMinimap(ctx, p);

      /* ---- boss bar ---- */
      if (this.boss && !this.boss.dead) {
        const bw2 = 560, bh2 = 16;
        const bx2 = w / 2 - bw2 / 2, by2 = 58;
        ctx.fillStyle = '#1a0d0d';
        ctx.fillRect(bx2 - 3, by2 - 3, bw2 + 6, bh2 + 6);
        const bp = VR.clamp(this.boss.hp / this.boss.maxHp, 0, 1);
        ctx.fillStyle = '#8a2b3d';
        ctx.fillRect(bx2, by2, bw2, bh2);
        ctx.fillStyle = '#d9264a';
        ctx.fillRect(bx2, by2, bw2 * bp, bh2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(bx2, by2, bw2 * bp, 3);
        ctx.strokeStyle = '#8a6a3a';
        ctx.strokeRect(bx2 - 3, by2 - 3, bw2 + 6, bh2 + 6);
        for (const f of [0.7, 0.4, 0.15]) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(bx2 + bw2 * f - 1, by2 - 4, 2, bh2 + 8);
        }
        VR.pixel.text(ctx, this.boss.name + '  -  PHASE ' + this.boss.phase, w / 2, by2 - 14, '#ffd6f2', 2.2, 'center');
        if (this.boss.activeShield > 0) VR.pixel.text(ctx, 'SHIELD ' + Math.ceil(this.boss.activeShield), w / 2, by2 + bh2 + 10, '#8fd0ff', 1.8, 'center');
      }

      /* --- level-up glow --- */
      if (this.state === 'levelup' || this.state === 'reward') {
        const g = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 700);
        g.addColorStop(0, 'rgba(255,184,77,0.0)');
        g.addColorStop(1, 'rgba(10,7,5,0.55)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    },

    renderMinimap(ctx, p) {
      const w = this.viewW, h = this.viewH;
      const mw = 208, mh = 128;
      const mx = w - 16 - mw, my = h - 16 - mh;
      ctx.fillStyle = '#1d140c';
      ctx.fillRect(mx, my, mw, mh);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(mx, my, mw, 2);
      ctx.fillRect(mx, my + mh - 2, mw, 2);
      ctx.fillRect(mx, my, 2, mh);
      ctx.fillRect(mx + mw - 2, my, 2, mh);
      VR.pixel.text(ctx, (this.run && this.run.daily ? 'DAILY' : 'DUNGEON') + ' ' + (VR.saveData.runsCompleted + 1), mx + mw / 2, my + 8, this.run && this.run.daily ? '#ffb84d' : '#ffe9c9', 2, 'center');

      const n = this.rooms.length;
      const cellW = (mw - 24 - (n - 1) * 5) / n;
      const cellH = 18, topY = my + mh - cellH - 14;
      for (let i = 0; i < n; i++) {
        const cx = mx + 12 + i * (cellW + 5);
        const r = this.rooms[i];
        let col = '#4a3a2c';
        if (r.type === 'elite') col = '#8a2b3d';
        else if (r.type === 'treasure') col = '#8a6a2b';
        else if (r.type === 'shop') col = '#2b6a8a';
        else if (r.type === 'cursed') col = '#6a2b5a';
        else if (r.type === 'boss') col = '#5a2b8a';
        else if (r.type === 'spawn') col = '#3a5a2b';
        else if (r.type === 'choice') col = '#3a3a46';
        if (r.cleared && i !== this.roomIndex) col = '#2e241a';
        ctx.fillStyle = col;
        ctx.fillRect(cx, topY, cellW, cellH);
        if (i === this.roomIndex) {
          ctx.fillStyle = 'rgba(255, 233, 163, 0.35)';
          ctx.fillRect(cx, topY, cellW, cellH);
          ctx.strokeStyle = '#ffe9a3';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - 1, topY - 1, cellW + 2, cellH + 2);
        }
        if (r.type === 'boss') VR.pixel.icon(ctx, 'skull', cx + cellW / 2 - 4, topY + 3, 8);
        else if (r.type === 'choice') VR.pixel.text(ctx, '?', cx + cellW / 2, topY + 2, '#9a9ab2', 1.6, 'center');
        // connector to next room
        if (i < n - 1) {
          ctx.fillStyle = r.cleared && this.rooms[i + 1].cleared ? '#8a6a3a' : '#3a2f22';
          ctx.fillRect(cx + cellW, topY + cellH / 2 - 2, 5, 4);
        }
      }
      VR.pixel.text(ctx, 'ROOM ' + (this.roomIndex + 1) + '/' + n, mx + mw / 2, my + mh - 12, '#c9a0a0', 1.6, 'center');
      void p;
    },

    renderVignette(ctx) {
      const p = this.player;
      const g = ctx.createRadialGradient(this.vw / 2, this.vh / 2, this.vh * 0.42, this.vw / 2, this.vh / 2, this.vh * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.vw, this.vh);

      // low HP pulse
      if (p && !p.dead && p.hp < p.stats.maxHp * 0.3) {
        const a = 0.16 + 0.12 * Math.sin(this.time * 6);
        const rg = ctx.createRadialGradient(this.vw / 2, this.vh / 2, this.vh * 0.3, this.vw / 2, this.vh / 2, this.vh * 0.8);
        rg.addColorStop(0, 'rgba(255,0,60,0)');
        rg.addColorStop(1, 'rgba(255,0,60,' + a + ')');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, this.vw, this.vh);
      }
    }
  };

  /* ================= combat helper ================= */
  VR.combat = {
    damageEnemy(target, amount, opts) {
      opts = opts || {};
      if (!target || target.dead) return 0;
      const p = game.player;
      const src = opts.source;
      let kbX = 0, kbY = 0;
      if (opts.knockback && src && src.x !== undefined) {
        const a = VR.angleTo(src.x, src.y, target.x, target.y);
        kbX = Math.cos(a) * opts.knockback;
        kbY = Math.sin(a) * opts.knockback;
      }
      const dmg = target.damage(amount, { crit: opts.crit, kbX, kbY });
      if (dmg > 0) {
        game.run.damageDealt += dmg;
        VR.fx.shake(opts.crit ? 0.12 : 0.03);
        VR.audio.play(opts.crit ? 'hit.crit' : 'hit');
        const sv = VR.save.get();
        // critical leech (BLOOD ORB)
        if (opts.crit && p && p.stats.critLeech > 0) {
          const heal = Math.max(1, Math.round(dmg * p.stats.critLeech));
          p.heal(heal);
          VR.fx.floatText(p.x, p.y - 30, '+' + heal, '#ff5c7a');
        }
        // explosion crits
        if (opts.crit && p && p.stats.explosionCrit && target.id !== 'barrel') {
          const R = 78;
          VR.fx.shake(0.25);
          VR.fx.ring(target.x, target.y, '#ffb84d', R, 1);
          VR.fx.burst({ x: target.x, y: target.y, color: '#ffb84d', count: 16, speed: 240, life: 0.35, size: 3 });
          VR.audio.play('explosion');
          for (const e of game.enemies.slice()) {
            if (e === target || e.dead) continue;
            if (VR.dist2(target.x, target.y, e.x, e.y) < R * R) {
              e.damage(amount * 0.6, { crit: false, kbX: 0, kbY: 0 });
            }
          }
        }
        // enemy died?
        if (target.dead && target !== game.boss) {
          p.kills++;
          game.run.kills++;
          sv.totalKills = (sv.totalKills || 0) + 1;
          if (target.elite) { game.run.shardsEarned += 5; sv.eliteKills = (sv.eliteKills || 0) + 1; }
          if (target.def) sv.codex.enemies[target.def.id] = true;
          if (p.stats.lifesteal > 0) {
            p.heal(p.stats.lifesteal);
            VR.fx.floatText(p.x, p.y - 30, '+' + p.stats.lifesteal, '#7dff9e');
          }
          // kill cascade (CASCADE CORE)
          if (p.stats.killExplode) {
            const R = 80;
            VR.fx.shake(0.18);
            VR.fx.ring(target.x, target.y, '#ffb84d', R, 1);
            VR.fx.burst({ x: target.x, y: target.y, color: '#ffb84d', count: 12, speed: 200, life: 0.3, size: 2.5 });
            VR.audio.play('explosion');
            for (const e of game.enemies.slice()) {
              if (e === target || e.dead) continue;
              if (VR.dist2(target.x, target.y, e.x, e.y) < R * R) {
                e.damage(dmg * 0.6, { crit: false, kbX: 0, kbY: 0 });
              }
            }
          }
          VR.achievements.checkAll({ kill: true });
        }
      }
      return dmg;
    },

    damagePlayer(amount, opts) {
      const p = game.player;
      if (!p || p.dead) return;
      if (p.godMode) { VR.fx.floatText(p.x, p.y - 30, 'GOD', '#ffb84d'); return; }
      p.damage(amount, opts);
      // thorns reflect
      if (p && !p.dead && p.stats.thorns > 0 && opts && opts.source &&
          typeof opts.source.damage === 'function' && !opts.source.dead && opts.source !== p) {
        VR.combat.damageEnemy(opts.source, 12 * p.stats.thorns, { source: p });
      }
      if (p.dead) game.triggerGameOver();
    }
  };

  VR.game = game;
})();
