/* arena.js — procedural rooms, waves, hazards, barrels, pickups. */
(function () {
  'use strict';
  const VR = window.VR;

  const ROOM_W = 1440, ROOM_H = 900;
  const WALL_T = 26, DOOR_W = 170, DOOR_CY = ROOM_H / 2;

  function makeBarrel(x, y) {
    return {
      x, y, r: 15, hp: 24, dead: false, flash: 0, kbx: 0, kby: 0, id: 'barrel',
      damage(amount, opts) {
        if (this.dead) return 0;
        opts = opts || {};
        this.hp -= amount;
        this.flash = 0.1;
        this.kbx += opts.kbX || 0;
        this.kby += opts.kbY || 0;
        VR.fx.damageNumber(this.x, this.y - 18, Math.round(amount), !!opts.crit, '#ffb84d');
        VR.audio.play('hit');
        return amount;
      }
    };
  }

  const arena = {
    ROOM_W, ROOM_H,

    /* ---------------- world generation ---------------- */
    generateWorld(seed, difficulty) {
      const rng = VR.mulberry32(seed || (Date.now() % 1e9));
      const rooms = [];

      // layout: spawn, 7 branch rooms (player chooses each), boss
      // branch rooms start as 'choice' and are rebuilt with the picked type
      const types = ['spawn', 'choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'boss'];

      for (let i = 0; i < types.length; i++) {
        rooms.push(this.buildRoom(i, types[i], rng, difficulty));
      }
      return { rooms, rng };
    },

    /** Weighted pool of room types a player may choose at a branch. */
    branchOptions() {
      const pool = [
        { type: 'combat', w: 26 },
        { type: 'pillar', w: 20 },
        { type: 'hazard', w: 20 },
        { type: 'elite', w: 16 },
        { type: 'cursed', w: 12 },
        { type: 'treasure', w: 14 },
        { type: 'shop', w: 14 }
      ];
      const picks = [];
      const copy = pool.slice();
      while (picks.length < 3 && copy.length) {
        const pick = VR.weightedPick(copy, (o) => o.w);
        picks.push(pick.type);
        copy.splice(copy.indexOf(pick), 1);
      }
      return picks;
    },

    buildRoom(index, type, rng, difficulty) {
      const x = index * ROOM_W;
      const room = {
        index, type, x,
        bounds: { x, x2: x + ROOM_W, y: 0, y2: ROOM_H, w: ROOM_W, h: ROOM_H },
        solids: [],
        doorRight: null,
        doorLeft: null,
        cleared: false,
        entered: false,
        waves: [],
        waveIdx: 0,
        waveDelay: 0,
        waveActive: false,
        laserQueue: 0,
        pillars: [],
        lasers: [],
        barrels: [],
        chests: [],
        flames: [],
        spikes: [],
        movers: [],
        moverRects: [],
        cursed: false,
        bossId: null,
        rewardGiven: false
      };
      room.chests = [];
      room.flames = [];
      room.spikes = [];
      room.movers = [];
      room.moverRects = [];

      // boundary walls
      const leftGap = DOOR_CY - DOOR_W / 2, rightGap = DOOR_CY - DOOR_W / 2;
      const isFirst = index === 0;
      const isLast = type === 'boss';

      // left wall
      if (!isFirst) {
        room.solids.push({ x: x - 10, y: 0, w: WALL_T + 10, h: leftGap });
        room.solids.push({ x: x - 10, y: leftGap + DOOR_W, w: WALL_T + 10, h: ROOM_H - leftGap - DOOR_W });
        room.doorLeft = { x: x - 8, y: leftGap, open: true, target: index - 1 };
      } else {
        room.solids.push({ x: x - 20, y: 0, w: WALL_T + 20, h: ROOM_H });
      }
      // right wall
      if (!isLast) {
        room.solids.push({ x: x + ROOM_W - WALL_T, y: 0, w: WALL_T, h: rightGap });
        room.solids.push({ x: x + ROOM_W - WALL_T, y: rightGap + DOOR_W, w: WALL_T, h: ROOM_H - rightGap - DOOR_W });
        room.doorRight = { x: x + ROOM_W - WALL_T / 2, y: DOOR_CY, open: false, target: index + 1 };
        room.solids.push({ x: x + ROOM_W - WALL_T, y: rightGap, w: WALL_T, h: DOOR_W }); // door solid
      } else {
        room.solids.push({ x: x + ROOM_W - WALL_T, y: 0, w: WALL_T, h: ROOM_H });
      }
      // top / bottom
      room.solids.push({ x: x, y: -20, w: ROOM_W, h: WALL_T + 20 });
      room.solids.push({ x: x, y: ROOM_H, w: ROOM_W, h: 20 });

      // template-specific geometry
      const rnd = (a, b) => a + rng() * (b - a);
      const centerX = x + ROOM_W / 2;
      const sideClear = 140;

      const addPillar = (px, py, w, h) => {
        room.pillars.push({ x: px, y: py, w, h });
        room.solids.push({ x: px, y: py, w, h });
      };

      if (type === 'combat') {
        if (rng() < 0.5) {
          const pw = rnd(50, 90), ph = rnd(50, 90);
          addPillar(rnd(x + 220, x + 460), rnd(120, ROOM_H - 160 - ph), pw, ph);
        }
        if (rng() < 0.35) {
          const pw = rnd(40, 60), ph = rnd(40, 60);
          addPillar(rnd(x + ROOM_W - 480, x + ROOM_W - 260), rnd(120, ROOM_H - 160 - ph), pw, ph);
        }
      } else if (type === 'pillar') {
        // dense pillar field — two staggered rows
        const count = 6;
        for (let i = 0; i < count; i++) {
          const col = x + ROOM_W * ((i + 0.5) / (count / 2 + 0.5)) + (i % 2 ? 40 : -40);
          if (col < x + sideClear || col > x + ROOM_W - sideClear) continue;
          const pw = rnd(56, 80), ph = rnd(56, 80);
          const py = i % 2 === 0 ? rnd(100, ROOM_H * 0.42 - ph) : rnd(ROOM_H * 0.58, ROOM_H - 140 - ph);
          addPillar(col, py, pw, ph);
        }
        if (rng() < 0.7) {
          const pw = 44, ph = 140;
          addPillar(centerX, ROOM_H / 2 - ph / 2, pw, ph);
        }
      } else if (type === 'hazard') {
        // laser strips
        const laserCount = 3;
        for (let i = 0; i < laserCount; i++) {
          const axis = rng() < 0.5 ? 'h' : 'v';
          if (axis === 'h') {
            const ly = rnd(140, ROOM_H - 140);
            room.lasers.push({ axis: 'h', pos: ly, a: x + 120, b: x + ROOM_W - 120, width: 34, phase: rnd(0, 3), cycle: 5.2, active: false, warn: 0, bossOnly: false });
          } else {
            const lx = rnd(x + 220, x + ROOM_W - 220);
            room.lasers.push({ axis: 'v', pos: lx, a: 120, b: ROOM_H - 120, width: 34, phase: rnd(0, 3), cycle: 5.2, active: false, warn: 0, bossOnly: false });
          }
        }
        // explosive barrels
        const barrels = rng() < 0.5 ? 2 : 3;
        for (let i = 0; i < barrels; i++) {
          const bx = rnd(x + 260, x + ROOM_W - 260);
          const by = rnd(160, ROOM_H - 160);
          room.barrels.push(makeBarrel(bx, by));
        }
        // one center obstacle
        addPillar(centerX, ROOM_H / 2 - 40, 90, 80);
        // new hazards: spike traps + moving walls
        if (rng() < 0.5) {
          const sCount = 3 + (rng() < 0.5 ? 1 : 0);
          for (let i = 0; i < sCount; i++) {
            room.spikes.push(this.makeSpike(x, rng() < 0.5 ? 'h' : 'v', rng));
          }
        }
        if (rng() < 0.4) {
          room.movers.push(this.makeMover(x, rng() < 0.5 ? 'h' : 'v', rng));
        }
      } else if (type === 'elite') {
        addPillar(centerX, ROOM_H / 2 - 30, 60, 60);
        addPillar(x + 300, ROOM_H / 2 - 100, 70, 200);
        addPillar(x + ROOM_W - 300 - 70, ROOM_H / 2 - 100, 70, 200);
      } else if (type === 'cursed') {
        // heavy hazard gauntlet with a dark tint and bonus gold
        room.cursed = true;
        addPillar(centerX, ROOM_H / 2 - 40, 90, 80);
        const mCount = 2;
        for (let i = 0; i < mCount; i++) {
          const axis = rng() < 0.5 ? 'h' : 'v';
          room.movers.push(this.makeMover(x, axis, rng));
        }
        const sCount = 5;
        for (let i = 0; i < sCount; i++) {
          room.spikes.push(this.makeSpike(x, rng() < 0.5 ? 'h' : 'v', rng));
        }
        const fCount = 3;
        for (let i = 0; i < fCount; i++) {
          room.flames.push({ x: rnd(x + 300, x + ROOM_W - 300), y: rnd(200, ROOM_H - 200), w: rnd(70, 110), h: rnd(50, 80), hitCd: 0 });
        }
        const bCount = 3;
        for (let i = 0; i < bCount; i++) {
          room.barrels.push(makeBarrel(rnd(x + 260, x + ROOM_W - 260), rnd(160, ROOM_H - 160)));
        }
      } else if (type === 'boss') {
        // 4 side lasers, activated at boss phase 3
        for (const [axis, pos] of [['v', x + 340], ['v', x + ROOM_W - 340], ['h', 260], ['h', 640]]) {
          room.lasers.push({
            axis, pos,
            a: axis === 'v' ? 120 : x + 160,
            b: axis === 'v' ? ROOM_H - 120 : x + ROOM_W - 160,
            width: 40, phase: rnd(0, 3), cycle: 5.2, active: false, warn: 0, bossOnly: true
          });
        }
      }

      // dungeon props
      const centerY = 450;
      if (type === 'elite') {
        room.chests.push({ x: x + 320, y: centerY - 140, locked: true, open: false, big: false });
        room.chests.push({ x: x + ROOM_W - 320, y: centerY - 140, locked: false, open: false, big: false });
      } else if (type === 'boss') {
        room.chests.push({ x: x + ROOM_W / 2, y: centerY + 240, locked: true, open: false, big: true });
      } else if (type === 'treasure') {
        room.chests.push({ x: x + 360, y: centerY - 140, locked: true, open: false, big: false });
        room.chests.push({ x: x + ROOM_W - 360, y: centerY - 140, locked: false, open: false, big: false });
        room.chests.push({ x: centerX, y: centerY + 190, locked: false, open: false, big: true });
      } else if (type === 'shop') {
        room.shop = { x: centerX, y: centerY };
      } else if ((type === 'combat' || type === 'pillar' || type === 'hazard' || type === 'cursed') && rng() < 0.35) {
        room.chests.push({ x: x + ROOM_W / 2, y: 170, locked: false, open: false, big: false });
      }
      // flame pits (persistent fire hazards)
      if (type === 'hazard') {
        const n = 2;
        for (let i = 0; i < n; i++) {
          const fx = rnd(x + 300, x + ROOM_W - 300);
          const fy = rnd(200, ROOM_H - 200);
          room.flames.push({ x: fx, y: fy, w: rnd(70, 110), h: rnd(50, 80), hitCd: 0 });
        }
      } else if (type === 'boss' && rng() < 0.5) {
        room.flames.push({ x: x + ROOM_W - 260, y: 220, w: 120, h: 90, hitCd: 0 });
        room.flames.push({ x: x + 260, y: 560, w: 110, h: 90, hitCd: 0 });
      }

      // boss selection (seeded)
      if (type === 'boss') room.bossId = rng() < 0.5 ? 'razor' : 'warden';

      // waves
      if (type === 'combat' || type === 'pillar' || type === 'hazard') {
        room.waves = this.buildWaves(index, 'normal', difficulty);
      } else if (type === 'elite') {
        room.waves = this.buildWaves(index, 'elite', difficulty);
      } else if (type === 'cursed') {
        room.waves = this.buildWaves(index, 'cursed', difficulty);
      }
      return room;
    },

    makeSpike(x, axis, rng) {
      const rnd = (a, b) => a + rng() * (b - a);
      if (axis === 'h') {
        const sy = rnd(150, ROOM_H - 150);
        const sx0 = rnd(x + 160, x + ROOM_W - 320);
        return { axis: 'h', pos: sy, a: sx0, b: sx0 + rnd(130, 230), w: 26, phase: rnd(0, 3), cycle: 3.2, hitCd: 0 };
      }
      const sx = rnd(x + 260, x + ROOM_W - 260);
      const sy0 = rnd(140, ROOM_H - 320);
      return { axis: 'v', pos: sx, a: sy0, b: sy0 + rnd(130, 230), w: 26, phase: rnd(0, 3), cycle: 3.2, hitCd: 0 };
    },

    makeMover(x, axis, rng) {
      const rnd = (a, b) => a + rng() * (b - a);
      const m = {
        axis, len: rnd(160, 250), thick: 60, span: rnd(220, 340), phase: rnd(0, 6.28),
        baseX: axis === 'v' ? rnd(x + 300, x + ROOM_W - 300) : x + ROOM_W / 2,
        baseY: axis === 'h' ? rnd(180, ROOM_H - 180) : ROOM_H / 2,
        off: 0, hitCd: 0
      };
      return m;
    },

    /* ---------------- spike traps ---------------- */
    updateSpikes(game, room, dt) {
      const p = game.player;
      const t = game.time;
      for (const s of room.spikes) {
        if (s.hitCd > 0) s.hitCd -= dt;
        const tt = (t + s.phase) % s.cycle;
        const up = tt > 1.0 && tt <= 2.4;
        if (!up || !p || p.dead) continue;
        const rect = s.axis === 'h'
          ? { x: s.a, y: s.pos - s.w / 2, w: s.b - s.a, h: s.w }
          : { x: s.pos - s.w / 2, y: s.a, w: s.w, h: s.b - s.a };
        if (s.hitCd <= 0 && VR.circleRectHit(p.x, p.y, p.radius, rect.x, rect.y, rect.w, rect.h)) {
          s.hitCd = 0.5;
          VR.combat.damagePlayer(12, { source: null });
          VR.fx.burst({ x: p.x, y: p.y, color: '#cfd6dd', count: 6, speed: 130, life: 0.25, size: 2 });
          VR.audio.play('hit');
        }
      }
    },

    renderSpikes(ctx, room) {
      const t = (VR.game && VR.game.time) || 0;
      for (const s of room.spikes) {
        const tt = (t + s.phase) % s.cycle;
        const warn = tt > 0.35 && tt <= 1.0;
        const up = tt > 1.0 && tt <= 2.4;
        if (!warn && !up) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        if (warn) {
          ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 24);
          ctx.strokeStyle = '#ff5c3d';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 12]);
          ctx.beginPath();
          if (s.axis === 'h') { ctx.moveTo(s.a, s.pos); ctx.lineTo(s.b, s.pos); }
          else { ctx.moveTo(s.pos, s.a); ctx.lineTo(s.pos, s.b); }
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = '#b9c2cc';
          ctx.shadowColor = '#cfd6dd'; ctx.shadowBlur = 8;
          const step = 15;
          if (s.axis === 'h') {
            for (let px = s.a; px <= s.b; px += step) {
              ctx.beginPath();
              ctx.moveTo(px - 6, s.pos + s.w / 2);
              ctx.lineTo(px, s.pos - s.w / 2 - 4);
              ctx.lineTo(px + 6, s.pos + s.w / 2);
              ctx.closePath();
              ctx.fill();
            }
          } else {
            for (let py = s.a; py <= s.b; py += step) {
              ctx.beginPath();
              ctx.moveTo(s.pos + s.w / 2, py - 6);
              ctx.lineTo(s.pos - s.w / 2 - 4, py);
              ctx.lineTo(s.pos + s.w / 2, py + 6);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }
    },

    /* ---------------- moving walls ---------------- */
    updateMovers(game, room, dt) {
      room.moverRects = [];
      const t = game.time;
      for (const m of room.movers) {
        m.off = Math.sin(t * 1.4 + m.phase) * (m.span / 2);
        let rx, ry, rw, rh;
        if (m.axis === 'v') { rx = m.baseX + m.off - m.thick / 2; ry = m.baseY - m.len / 2; rw = m.thick; rh = m.len; }
        else { rx = m.baseX - m.len / 2; ry = m.baseY + m.off - m.thick / 2; rw = m.len; rh = m.thick; }
        room.moverRects.push({ x: rx, y: ry, w: rw, h: rh });
        if (m.hitCd > 0) m.hitCd -= dt;
        const p = game.player;
        if (p && !p.dead && m.hitCd <= 0 && VR.circleRectHit(p.x, p.y, p.radius, rx, ry, rw, rh)) {
          m.hitCd = 0.6;
          VR.combat.damagePlayer(14, { source: null });
          VR.fx.burst({ x: p.x, y: p.y, color: '#9a8f7d', count: 6, speed: 140, life: 0.25, size: 2.5 });
          VR.audio.play('slam');
        }
      }
    },

    renderMovers(ctx, room) {
      for (const r of room.moverRects || []) {
        ctx.fillStyle = '#4a4238';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#5d5447';
        ctx.fillRect(r.x, r.y, r.w, 4);
        ctx.fillStyle = '#2b241c';
        ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
        ctx.strokeStyle = 'rgba(200,168,74,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
        ctx.fillStyle = '#c8a84a';
        ctx.fillRect(r.x + r.w / 2 - 5, r.y + r.h / 2 - 2, 10, 4);
      }
    },

    /* ---------------- wave building ---------------- */
    buildWaves(depth, kind, difficulty) {
      const waves = [];
      const unlocked = VR.data.enemies.filter((e) => e.depth <= depth);
      if (!unlocked.length) return waves;
      const diff = difficulty ? (VR.data.difficultyById[difficulty] || null) : null;

      if (kind === 'elite') {
        waves.push({ desc: 'ELITE', units: [{ id: 'drone', count: 5, elite: false }] });
        waves.push({ desc: 'ELITE', units: [{ id: VR.choose(unlocked).id, count: 1, elite: true }, { id: 'drone', count: 3, elite: false }] });
        waves.push({ desc: 'ELITE', units: [{ id: VR.choose(unlocked).id, count: 1, elite: true }, { id: 'swarm', count: 4, elite: false }] });
        // impossible: every elite room stacks a second champion in the last wave
        if (diff && diff.eliteExtra) {
          waves[2].units.push({ id: VR.choose(unlocked).id, count: 1, elite: true });
        }
        return waves;
      }

      let budget = 15 + depth * 9;
      if (kind === 'cursed') budget = Math.round(budget * 1.25);
      if (diff && diff.budgetMult !== 1) budget = Math.round(budget * diff.budgetMult);
      // wave size floor scales with difficulty so EASY feels easy from room 1
      const floor = Math.max(2, Math.round(6 * (diff ? diff.budgetMult : 1)));
      const splits = [0.42, 0.34, 0.24];
      for (const frac of splits) {
        const waveBudget = Math.max(floor, Math.round(budget * frac));
        const units = [];
        let remaining = waveBudget;
        const used = [];
        let guard = 0;
        while (remaining > 0 && guard++ < 40) {
          const pick = VR.weightedPick(unlocked, (e) => e.weight * (e.depth <= depth - 2 ? 1.3 : 1));
          const cost = this.enemyCost(pick);
          if (cost <= remaining) {
            units.push({ id: pick.id, count: 1, elite: false });
            remaining -= cost;
          } else if (remaining >= 3) {
            // cheap filler
            const cheap = unlocked.filter((e) => this.enemyCost(e) <= remaining);
            if (cheap.length) {
              const c = VR.choose(cheap);
              units.push({ id: c.id, count: 1, elite: false });
              remaining -= this.enemyCost(c);
            } else break;
          } else break;
          used.push(pick);
        }
        if (units.length) waves.push({ desc: 'WAVE ' + (waves.length + 1), units });
      }
      // impossible: weave guaranteed elites into mid/late waves of deep normal rooms
      if (diff && diff.eliteExtra && kind === 'normal' && depth >= 3 && waves.length >= 2) {
        const mid = Math.floor(waves.length / 2);
        waves[mid].units.push({ id: VR.choose(unlocked).id, count: 1, elite: true });
        waves[waves.length - 1].units.push({ id: VR.choose(unlocked).id, count: 1, elite: true });
      }
      return waves;
    },

    enemyCost(def) {
      switch (def.id) {
        case 'swarm': return 3;
        case 'drone': return 5;
        case 'splitter': return 6;
        case 'shooter': return 7;
        case 'exploder': return 7;
        case 'charger': return 9;
        case 'shield': return 11;
        case 'brute': return 12;
        default: return 5;
      }
    },

    /* ---------------- wave execution (called by game) ---------------- */
    spawnWave(game, room, wave) {
      const depth = room.index;
      let hpMult = 1 + depth * 0.13;
      let dmgMult = 1 + depth * 0.06;
      if (room.cursed) { hpMult *= 1.2; dmgMult *= 1.12; }
      const diff = game.run ? VR.data.difficultyById[game.run.difficulty] : null;
      let spdMult = 1, cdMult = 1;
      if (diff) {
        hpMult *= diff.hpMult; dmgMult *= diff.dmgMult;
        spdMult = diff.enemySpeedMult || 1;
        cdMult = diff.enemyCdMult || 1;
      }
      for (const u of wave.units) {
        const def = VR.data.enemyById[u.id];
        const count = u.count;
        for (let i = 0; i < count; i++) {
          const e = VR.spawnEnemy(def, 0, 0, {
            hpMult, dmgMult, elite: u.elite, speedMult: spdMult, contactCdMult: cdMult
          });
          const pos = this.randomSpawnPos(game, room, e.radius);
          e.x = pos.x; e.y = pos.y;
          e.spawnDelay = 0.5 + i * 0.12;
          game.enemies.push(e);
        }
      }
    },

    randomSpawnPos(game, room, radius) {
      const p = game.player;
      let x, y, tries = 0;
      do {
        x = VR.randRange(room.bounds.x + 80 + radius, room.bounds.x2 - 80 - radius);
        y = VR.randRange(80 + radius, room.bounds.y2 - 80 - radius);
        tries++;
      } while (tries < 12 && p && VR.dist2(x, y, p.x, p.y) < 300 * 300);
      return { x, y };
    },

    /* ---------------- lasers ---------------- */
    updateLasers(game, room, dt) {
      const bossActive = game.boss && !game.boss.dead && game.boss.phase >= 3;
      for (const L of room.lasers) {
        if (L.bossOnly) {
          if (!bossActive) { L.active = false; L.warn = 0; continue; }
        }
        L.phase += dt;
        const cycle = L.cycle;
        const t = L.phase % cycle;
        L.warn = t < 1.0 ? 1.0 - t : 0;
        L.active = t >= 1.0 && t < 1.0 + 2.4;

        if (L.warn > 0 && Math.floor(t * 10) % 3 === 0) {
          // periodic warn ping (throttled by frame anyway)
        }
        if (L.active && game.player && !game.player.dead) {
          const p = game.player;
          let hit;
          if (L.axis === 'h') hit = Math.abs(p.y - L.pos) < L.width / 2 + p.radius && p.x > L.a && p.x < L.b;
          else hit = Math.abs(p.x - L.pos) < L.width / 2 + p.radius && p.y > L.a && p.y < L.b;
          if (hit && (L.hitCd = (L.hitCd || 0) - dt) <= 0) {
            L.hitCd = 0.45;
            VR.combat.damagePlayer(12, { source: null });
            VR.fx.burst({ x: p.x, y: p.y, color: '#ff4dd8', count: 8, speed: 160, life: 0.25, size: 2.5 });
          }
        } else if (!L.active) {
          L.hitCd = 0;
        }
      }
    },

    renderLasers(ctx, room) {
      const t = (VR.game && VR.game.time) || 0;
      for (const L of room.lasers) {
        if (L.bossOnly && !(VR.game.boss && !VR.game.boss.dead && VR.game.boss.phase >= 3)) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        if (L.warn > 0) {
          ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 24);
          ctx.strokeStyle = '#ff5c3d';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 14]);
          ctx.beginPath();
          if (L.axis === 'h') { ctx.moveTo(L.a, L.pos); ctx.lineTo(L.b, L.pos); }
          else { ctx.moveTo(L.pos, L.a); ctx.lineTo(L.pos, L.b); }
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (L.active) {
          const fl = 3 + Math.floor(Math.sin(t * 18 + L.pos) * 2);
          ctx.globalAlpha = 0.85;
          ctx.shadowColor = '#ff4d2b'; ctx.shadowBlur = 20;
          ctx.fillStyle = '#ff6a2b';
          if (L.axis === 'h') ctx.fillRect(L.a, L.pos - L.width / 2 - fl / 2, L.b - L.a, L.width + fl);
          else ctx.fillRect(L.pos - L.width / 2 - fl / 2, L.a, L.width + fl, L.b - L.a);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffd97a';
          ctx.globalAlpha = 0.9;
          if (L.axis === 'h') ctx.fillRect(L.a, L.pos - 3, L.b - L.a, 6);
          else ctx.fillRect(L.pos - 3, L.a, 6, L.b - L.a);
        }
        ctx.restore();
      }
    },

    /* ---------------- flame pits ---------------- */
    updateFlames(game, room, dt) {
      const p = game.player;
      if (!p || p.dead) return;
      const t = (game.time || 0);
      for (const f of room.flames) {
        if (f.hitCd > 0) f.hitCd -= dt;
        if (VR.circleRectHit(p.x, p.y, p.radius, f.x, f.y, f.w, f.h)) {
          if (f.hitCd <= 0) {
            f.hitCd = 0.5;
            VR.combat.damagePlayer(9, { source: null });
            VR.fx.burst({ x: p.x, y: p.y, color: '#ff8a3d', count: 6, speed: 120, life: 0.3, size: 2.5 });
          }
        }
        // embers
        if (Math.random() < dt * 14) {
          VR.fx.trail(f.x + Math.random() * f.w, f.y + f.h - 4, '#ff8a3d', 1.5);
        }
        void t;
      }
    },

    renderFlames(ctx, room) {
      const t = (VR.game && VR.game.time) || 0;
      for (const f of room.flames) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fl = 2 + Math.floor(Math.sin(t * 12 + f.x) * 2);
        ctx.fillStyle = '#8a2000';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#ff5c1f';
        ctx.fillRect(f.x + 2, f.y + 2 + fl / 2, f.w - 4, f.h - 2 - fl / 2);
        ctx.fillStyle = '#ffb84d';
        ctx.fillRect(f.x + f.w * 0.15, f.y + 4 + fl, f.w * 0.7, f.h - 6 - fl);
        ctx.fillStyle = '#ffe9a3';
        for (let i = 0; i < f.w / 16; i++) {
          const px = f.x + 6 + i * 16;
          const ph = Math.floor(Math.sin(t * 20 + i * 7) * 3);
          ctx.fillRect(px, f.y + f.h - 5 - ph, 5, 3 + ph);
        }
        ctx.restore();
      }
    },

    renderBomb(ctx, b) {
      const t = (VR.game && VR.game.time) || 0;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = '#222222';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(-5, -5, 5, 5);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(-1, -9, 3, 4);
      ctx.fillStyle = b.t < 0.4 ? '#ff4d2b' : '#ffb84d';
      ctx.fillRect(-2, -12, 5, 4);
      // blink faster as it nears explosion
      ctx.globalAlpha = b.t < 0.4 ? (0.5 + 0.5 * Math.sin(t * 30)) : 1;
      ctx.fillRect(-2, -12, 5, 4);
      ctx.restore();
    },

    /* ---------------- barrels ---------------- */
    updateBarrels(game, room, dt) {
      for (const b of room.barrels) {
        if (b.dead) continue;
        if (b.flash > 0) b.flash -= dt;
        const decay = Math.pow(0.0001, dt);
        b.kbx = (b.kbx || 0) * decay; b.kby = (b.kby || 0) * decay;
        b.x += (b.kbx || 0) * dt; b.y += (b.kby || 0) * dt;
        const res = game.resolveSolids(b.x, b.y, b.r);
        b.x = res.x; b.y = res.y;
        // explode if damaged to 0
        if (b.hp <= 0) this.explodeBarrel(game, b, room);
      }
    },

    explodeBarrel(game, b, room) {
      if (b.dead) return;
      b.dead = true;
      VR.fx.shake(0.5);
      VR.fx.flash('#ffb84d', 0.15);
      VR.audio.play('explosion');
      VR.fx.burst({ x: b.x, y: b.y, color: '#ffb84d', count: 30, speed: 260, life: 0.5, size: 3.5 });
      VR.fx.burst({ x: b.x, y: b.y, color: '#ff5c7a', count: 16, speed: 200, life: 0.4, size: 3 });
      VR.fx.ring(b.x, b.y, '#ffb84d', 100, 1);
      const R = 95;
      for (const e of game.enemies.slice()) {
        if (e.dead) continue;
        if (VR.dist2(b.x, b.y, e.x, e.y) < R * R) {
          VR.combat.damageEnemy(e, 55, { knockback: 500, source: null });
        }
      }
      if (game.player && VR.dist2(b.x, b.y, game.player.x, game.player.y) < (R + game.player.radius) ** 2) {
        VR.combat.damagePlayer(28, { source: null });
      }
      // chain reaction
      for (const o of room.barrels) {
        if (o === b || o.dead) continue;
        if (VR.dist2(b.x, b.y, o.x, o.y) < (R + o.r) ** 2) {
          o.hp = 0;
        }
      }
      game.barrels = game.barrels.filter((x) => x !== b);
    },

    renderBarrel(ctx, b) {
      if (b.dead) return;
      const t = (VR.game && VR.game.time) || 0;
      const pulse = 0.5 + 0.3 * Math.sin(t * 6 + b.x);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.globalAlpha = 0.5 + 0.3 * pulse * 0.4;
      ctx.fillStyle = '#ff5c7a';
      ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 12 * pulse;
      ctx.beginPath(); ctx.arc(0, 0, b.r + 3, 0, VR.TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = b.flash > 0 ? '#ffffff' : '#3a2a18';
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, VR.TAU); ctx.fill();
      ctx.strokeStyle = '#6a4a22';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, VR.TAU); ctx.stroke();
      ctx.fillStyle = '#c8a84a';
      ctx.fillRect(-b.r * 0.7, -2, b.r * 1.4, 4);
      ctx.fillStyle = '#ffb84d';
      ctx.fillRect(-2, -b.r - 4, 4, 4);
      ctx.restore();
    },

    /* ---------------- pickups ---------------- */
    renderPickup(ctx, pk) {
      const t = (VR.game && VR.game.time) || 0;
      const bob = Math.sin(t * 4 + pk.x * 0.01) * 2;
      ctx.save();
      ctx.translate(pk.x, pk.y + bob);
      if (pk.type === 'xp' || pk.type === 'gold') {
        const s = pk.type === 'gold' ? 11 : 7;
        ctx.save();
        ctx.rotate(Math.sin(t * 3 + pk.x) * 0.4);
        VR.pixel.coin(ctx, 0, 0, s);
        ctx.restore();
      } else if (pk.type === 'health') {
        VR.pixel.icon(ctx, 'potion', -9, -9, 18);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 5);
        ctx.fillStyle = '#7dff9e';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.restore();
      } else if (pk.type === 'bomb') {
        VR.pixel.icon(ctx, 'bomb', -9, -9, 18);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 6);
        ctx.fillStyle = '#ff8a3d';
        ctx.fillRect(-11, -11, 22, 22);
        ctx.restore();
      } else if (pk.type === 'key') {
        ctx.save();
        ctx.rotate(Math.sin(t * 2.5 + pk.x) * 0.2);
        VR.pixel.icon(ctx, 'key', -9, -9, 18);
        ctx.restore();
      } else if (pk.type === 'shard') {
        ctx.save();
        ctx.rotate(t * 1.5);
        VR.pixel.icon(ctx, 'gem', -8, -8, 16);
        ctx.restore();
      } else if (pk.type === 'power') {
        VR.pixel.icon(ctx, 'skull', -9, -9, 18);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 7);
        ctx.fillStyle = '#ff5c1f';
        ctx.fillRect(-11, -11, 22, 22);
        ctx.restore();
      }
      ctx.restore();
    }
  };

  VR.arena = arena;
})();
