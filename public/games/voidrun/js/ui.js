/* ui.js — DOM overlay management. */
(function () {
  'use strict';
  const VR = window.VR;

  const $ = (id) => document.getElementById(id);

  const PRESET_COLORS = ['#43e6ff', '#a06bff', '#ff4dd8', '#ffb84d', '#7dff9e', '#ff5c7a', '#4d9fff', '#f0e68c', '#ffffff'];

  const COLOR_SLOTS = [
    { key: 'ears', label: 'Ears' },
    { key: 'hair', label: 'Fur' },
    { key: 'face', label: 'Muzzle / paws' },
    { key: 'outfit', label: 'Outfit' },
    { key: 'belt', label: 'Belt' },
    { key: 'glow', label: 'Aura / effects' },
    { key: 'shield', label: 'Shield bubble' },
    { key: 'trail', label: 'Dash trail' },
    { key: 'trail2', label: 'Dash trail 2' }
  ];

  const HAIR_STYLE_LABELS = ['LONG EARS', 'LOP EARS', 'SHORT EARS'];

  const ui = {
    settingsFrom: 'menu',
    previewRAF: null,
    hoverFx() { VR.audio.play('uiHover'); },

    init() {
      // menu
      $('btn-play').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showWeaponSelect(false); };
      $('btn-daily').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showWeaponSelect(true); };
      $('btn-customize').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showCustomize(); };
      $('btn-upgrades').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showShop(); };
      $('btn-achievements').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showAchievements(); };
      $('btn-codex').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showCodex(); };
      $('btn-leaderboard').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showLeaderboard(); };
      $('btn-settings').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.showSettings('menu'); };

      // customize
      $('btn-cust-back').onclick = () => { VR.audio.play('uiBack'); this.showMenu(); };
      $('btn-cust-reset').onclick = () => {
        VR.audio.play('uiClick');
        VR.saveData.appearance = {
          ears: '#a06bff', hair: '#efe4cf', face: '#ffe9d6', outfit: '#8a4a2b',
          belt: '#5a2a1e', glow: '#ffb84d', shield: '#43e6ff', trail: '#ffb84d', trail2: '#ff4d2b', hairStyle: 0
        };
        VR.save.write();
        this.rebuildCustomize();
      };
      $('btn-credits').onclick = () => { VR.audio.init(); VR.audio.play('uiClick'); this.show('credits'); };
      $('btn-quit').onclick = () => { VR.audio.play('uiBack'); window.close(); };
      $('btn-credits-back').onclick = () => { VR.audio.play('uiBack'); this.showMenu(); };

      // weapon select
      $('btn-start-run').onclick = () => {
        VR.audio.play('uiClick');
        if (VR.ui._selectedWeapon) {
          if (VR.ui._daily) {
            VR.game.newRun(VR.ui._selectedWeapon, { daily: true, seed: VR.dailySeed(), dateKey: VR.game.todayKey(), difficulty: 'medium' });
          } else {
            VR.game.newRun(VR.ui._selectedWeapon, { difficulty: VR.ui._difficulty });
          }
        }
      };

      // meta screens
      $('btn-ach-back').onclick = () => { VR.audio.play('uiBack'); this.showMenu(); };
      $('btn-codex-back').onclick = () => { VR.audio.play('uiBack'); this.showMenu(); };
      $('btn-lb-back').onclick = () => { VR.audio.play('uiBack'); this.showMenu(); };
      $('btn-rshop-depart').onclick = () => { VR.audio.play('uiClick'); VR.game.resume(); };

      // pause
      $('btn-resume').onclick = () => { VR.audio.play('uiClick'); VR.game.resume(); };
      $('btn-pause-settings').onclick = () => { VR.audio.play('uiClick'); this.showSettings('pause'); };
      $('btn-restart').onclick = () => { VR.audio.play('uiClick'); VR.game.restartRun(); };
      $('btn-quit-menu').onclick = () => { VR.audio.play('uiBack'); VR.game.toMenu(); };

      // settings
      $('btn-settings-back').onclick = () => {
        VR.audio.play('uiBack');
        this.applySettingsFromDOM();
        if (this.settingsFrom === 'pause') { this.showPause(); VR.audio.setMusic('menu'); }
        else VR.game.toMenu();
      };

      // shop
      $('btn-shop-back').onclick = () => { VR.audio.play('uiBack'); VR.game.toMenu(); };

      // end screen
      $('btn-retry').onclick = () => { VR.audio.play('uiClick'); VR.game.restartRun(); };
      $('btn-end-menu').onclick = () => { VR.audio.play('uiBack'); VR.game.toMenu(); };

      // tutorial
      $('btn-tutorial').onclick = () => {
        VR.audio.play('uiClick');
        VR.saveData.tutorialDone = true;
        VR.save.write();
        this.hide('tutorial');
        VR.game.resolvePendingBranch && VR.game.resolvePendingBranch();
      };

      // settings controls
      this.bindSettings();

      // hover sounds on all buttons
      document.querySelectorAll('.btn').forEach((b) => {
        b.addEventListener('mouseenter', () => this.hoverFx());
      });
      document.querySelectorAll('.card, .shop-cost').forEach((b) => {
        b.addEventListener('mouseenter', () => this.hoverFx());
      });
    },

    show(id) {
      // reveal the UI layer (it starts hidden so the page boots to a blank canvas)
      $('ui-root').classList.remove('hidden');
      $('menu').classList.add('hidden');
      $('pause').classList.add('hidden');
      $('settings').classList.add('hidden');
      $('shop').classList.add('hidden');
      $('weapon-select').classList.add('hidden');
      $('levelup').classList.add('hidden');
      $('end-screen').classList.add('hidden');
      $('reward').classList.add('hidden');
      $('credits').classList.add('hidden');
      $('tutorial').classList.add('hidden');
      $('customize').classList.add('hidden');
      $('branch').classList.add('hidden');
      $('rshop').classList.add('hidden');
      $('achievements').classList.add('hidden');
      $('codex').classList.add('hidden');
      $('leaderboard').classList.add('hidden');
      $(id).classList.remove('hidden');
    },
    hide(id) { $(id).classList.add('hidden'); },
    hideAll() {
      ['menu', 'pause', 'settings', 'shop', 'weapon-select', 'levelup', 'end-screen', 'reward', 'credits', 'tutorial', 'customize', 'branch', 'rshop', 'achievements', 'codex', 'leaderboard', 'boss-banner', 'wave-banner'].forEach((id) => this.hide(id));
    },

    /* ---------------- menu ---------------- */
    showMenu() {
      $('menu-shards-val').textContent = VR.save.get().shards;
      this.show('menu');
      this.hideHints();
    },

    /* ---------------- weapon select ---------------- */
    showWeaponSelect(daily) {
      this._daily = !!daily;
      const save = VR.save.get();
      const wrap = $('weapon-cards');
      wrap.innerHTML = '';
      this._selectedWeapon = null;

      for (const w of VR.data.weapons) {
        const owned = save.unlockedWeapons.includes(w.id);
        if (!this._selectedWeapon && owned) this._selectedWeapon = w.id;
        const card = document.createElement('div');
        card.className = 'card weapon-card' + (owned ? '' : ' locked');
        card.innerHTML = `
          <span class="card-icon" style="color:${w.color}">${w.icon}</span>
          <div class="card-name">${w.name}</div>
          <div class="card-desc">${w.blurb}</div>
          <div class="stat-line">${w.stats.map((s) => '<b>' + s + '</b>').join(' &nbsp;·&nbsp; ')}</div>
          ${owned ? '<div class="card-stack">READY</div>' : '<div class="card-stack">🔒 UNLOCK IN SHOP — 💠 ' + w.unlockCost + '</div>'}`;
        if (owned) {
          card.onclick = () => {
            VR.audio.play('uiClick');
            wrap.querySelectorAll('.card').forEach((c) => c.style.outline = '');
            card.style.outline = '2px solid ' + w.color;
            this._selectedWeapon = w.id;
          };
          if (this._selectedWeapon === w.id) card.style.outline = '2px solid ' + w.color;
        }
        wrap.appendChild(card);
      }
      document.querySelector('#weapon-select h2').textContent = this._daily ? 'DAILY RUN' : 'CHOOSE YOUR WEAPON';
      document.querySelector('#weapon-select .sub').textContent = this._daily
        ? 'One shot at today\'s dungeon. Same seed, MEDIUM difficulty — post your best time.'
        : 'Black Rabbit is fully equipped. Pick your primary.';
      $('btn-start-run').textContent = this._daily ? '⚡ START DAILY RUN' : '⚡ ENTER THE ARENA';
      this.renderDiffPicker();
      this.show('weapon-select');
    },

    /* ---------------- difficulty picker ---------------- */
    renderDiffPicker() {
      const picker = $('diff-picker');
      if (this._daily) {
        this._difficulty = 'medium';
        picker.innerHTML = '<div class="diff-locked">🟡 DAILY RUNS ARE ALWAYS MEDIUM — one seed for everyone</div>';
        return;
      }
      this._difficulty = VR.saveData.settings.difficulty || 'medium';
      picker.innerHTML = '';
      const cur = this._difficulty;
      for (const d of VR.data.difficulties) {
        const b = document.createElement('button');
        b.className = 'diff-btn' + (cur === d.id ? ' selected' : '');
        b.style.borderColor = cur === d.id ? d.color : '';
        b.style.color = cur === d.id ? d.color : '';
        b.innerHTML = `
          <span class="diff-icon" style="color:${d.color}">${d.icon}</span>
          <div class="diff-name" style="color:${cur === d.id ? d.color : ''}">${d.name}</div>
          <div class="diff-desc">${d.desc}</div>`;
        b.onclick = () => {
          VR.audio.play('uiClick');
          VR.saveData.settings.difficulty = d.id;
          VR.save.write();
          this._difficulty = d.id;
          this.renderDiffPicker();
        };
        picker.appendChild(b);
      }
    },

    /* ---------------- branch choice ---------------- */
    showBranch(player, roomIndex) {
      const wrap = $('branch-cards');
      wrap.innerHTML = '';
      const opts = VR.arena.branchOptions();
      const meta = {
        combat: { icon: '⚔', name: 'ARENA', color: '#c8a84a', desc: 'Standard waves. Balanced pace and loot.', warn: 'none' },
        pillar: { icon: '⬛', name: 'MAZE', color: '#9fb4c8', desc: 'Dense pillar field — cover for you, and for them.', warn: 'medium' },
        hazard: { icon: '⚡', name: 'GAUNTLET', color: '#ff8a3d', desc: 'Lasers, spike traps, barrels and moving walls.', warn: 'high' },
        elite: { icon: '⭐', name: 'ELITE', color: '#ff5c7a', desc: 'Champion waves. Relic chance and two chests.', warn: 'high' },
        cursed: { icon: '☠', name: 'CURSED', color: '#a06bff', desc: 'A dark gauntlet of hazards and stronger foes. +10 gold bounty.', warn: 'extreme' },
        treasure: { icon: '🎁', name: 'TREASURE', color: '#ffcf4d', desc: 'No waves. Chests, a relic choice and gold.', warn: 'none' },
        shop: { icon: '🛒', name: 'SHOP', color: '#4d9fff', desc: 'Spend gold on potions, bombs, keys and relics.', warn: 'none' }
      };
      let chosen = false;
      for (const t of opts) {
        const m = meta[t];
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <span class="card-icon" style="color:${m.color}">${m.icon}</span>
          <div class="card-name">${m.name}</div>
          <div class="card-desc">${m.desc}</div>
          ${m.warn !== 'none' ? `<div class="card-rarity" style="color:${m.color}">${m.warn.toUpperCase()}</div>` : ''}`;
        card.onclick = () => {
          if (chosen) return;
          chosen = true;
          VR.audio.play('uiClick');
          VR.game.chooseBranch(t);
        };
        wrap.appendChild(card);
      }
      document.querySelector('#branch h2').textContent = 'CHOOSE YOUR PATH';
      document.querySelector('#branch .sub').textContent = 'SECTOR ' + (roomIndex + 1) + ' — pick the next room';
      this.show('branch');
    },

    /* ---------------- run shop ---------------- */
    showRunShop(player) {
      const wrap = $('rshop-list');
      const render = () => {
        wrap.innerHTML = '';
        const g = VR.game.run.gold;
        $('rshop-gold').textContent = g;
        const items = [
          { kind: 'heal', icon: '❤', name: 'RESTORE', desc: 'Heal 40 HP.', cost: 18 },
          { kind: 'potion', icon: '🧪', name: 'POTION CACHE', desc: '+2 health potions.', cost: 20 },
          { kind: 'bomb', icon: '💣', name: 'BOMB CACHE', desc: '+2 bombs.', cost: 15 },
          { kind: 'key', icon: '🗝', name: 'SKELETON KEY', desc: '+1 key.', cost: 25 },
          { kind: 'relic', icon: '🎁', name: 'VOID RELIC', desc: 'A random passive relic (needs pouch space).', cost: 50 }
        ];
        for (const it of items) {
          const row = document.createElement('div');
          row.className = 'shop-item';
          const afford = g >= it.cost;
          row.innerHTML = `
            <span class="shop-icon">${it.icon}</span>
            <div class="shop-info"><div class="shop-name">${it.name}</div><div class="shop-desc">${it.desc}</div></div>
            <div class="shop-cost" style="${afford ? '' : 'opacity:0.35'}">💰 ${it.cost}</div>`;
          row.querySelector('.shop-cost').onclick = () => {
            if (VR.game.buyRunShopItem(it.kind)) render();
          };
          wrap.appendChild(row);
        }
      };
      render();
      this.show('rshop');
    },

    /* ---------------- achievements ---------------- */
    showAchievements() {
      const save = VR.save.get();
      const wrap = $('ach-list');
      wrap.innerHTML = '';
      let earned = 0, total = 0;
      for (const a of VR.data.achievements) {
        total++;
        const got = !!save.achievements[a.id];
        if (got) earned++;
        const item = document.createElement('div');
        item.className = 'ach-item' + (got ? ' earned' : '');
        item.innerHTML = `
          <span class="ach-icon">${got ? a.icon : '🔒'}</span>
          <div class="ach-info">
            <div class="ach-name">${a.name}</div>
            <div class="ach-desc">${a.desc}</div>
          </div>
          <div class="ach-reward">${got ? '✓ 💠' + a.reward : '💠 ' + a.reward}</div>`;
        wrap.appendChild(item);
      }
      $('ach-count').textContent = earned + ' / ' + total;
      this.show('achievements');
    },

    /* ---------------- codex ---------------- */
    showCodex(tab) {
      tab = tab || this._codexTab || 'enemies';
      this._codexTab = tab;
      const save = VR.save.get();
      const wrap = $('codex-list');
      wrap.innerHTML = '';
      const tabs = $('codex-tabs');
      tabs.innerHTML = '';
      const mkTab = (id, label) => {
        const b = document.createElement('button');
        b.className = 'codex-tab' + (tab === id ? ' active' : '');
        b.textContent = label;
        b.onclick = () => { VR.audio.play('uiClick'); this.showCodex(id); };
        tabs.appendChild(b);
      };
      mkTab('enemies', 'ENEMIES');
      mkTab('weapons', 'WEAPONS');
      mkTab('bosses', 'BOSSES');
      const card = (icon, color, name, sub, lore, seen) => {
        const el = document.createElement('div');
        el.className = 'codex-card' + (seen ? '' : ' locked');
        el.innerHTML = `
          <span class="card-icon" style="color:${color}">${icon}</span>
          <div class="codex-body">
            <div class="codex-name">${seen ? name : '???'}</div>
            <div class="codex-sub">${seen ? sub : 'UNKNOWN ENTRY'}</div>
            <div class="codex-lore">${seen ? lore : 'Keep delving to reveal this entry.'}</div>
          </div>`;
        return el;
      };
      const ENEMY_ICONS = { drone: '🟢', swarm: '🦇', shooter: '🏹', charger: '🐂', shield: '🛡', splitter: '💎', exploder: '💥', brute: '🗿' };
      if (tab === 'enemies') {
        for (const e of VR.data.enemies) {
          const seen = !!save.codex.enemies[e.id];
          const sub = seen ? (e.tier || 'creature').toUpperCase() + ' · HP ' + e.hp + ' · SPD ' + e.speed : '';
          wrap.appendChild(card(ENEMY_ICONS[e.behavior] || '👾', e.color, e.name, sub, e.lore || '', seen));
        }
      } else if (tab === 'weapons') {
        for (const w of VR.data.weapons) {
          const seen = !!save.codex.weapons[w.id];
          const sub = seen ? w.type.toUpperCase() + ' · DMG ' + w.damage : '';
          wrap.appendChild(card(w.icon, w.color, w.name, sub, w.lore || '', seen));
        }
      } else {
        for (const id in VR.BOSS_DEFS) {
          const bd = VR.BOSS_DEFS[id];
          const seen = !!save.codex.bosses[id];
          wrap.appendChild(card('💀', bd.color, bd.name, 'SECTOR FINAL', bd.lore, seen));
        }
      }
      this.show('codex');
    },

    /* ---------------- leaderboard ---------------- */
    showLeaderboard() {
      const save = VR.save.get();
      const wrap = $('lb-list');
      const days = Object.keys(save.dailyScores || {}).sort().reverse();
      let html = '';
      if (!days.length) {
        html = '<div class="lb-empty">No daily runs yet. Try the DAILY RUN — same seed for everyone.</div>';
      }
      for (const d of days) {
        const s = save.dailyScores[d];
        const wd = VR.data.weaponById[s.weapon];
        html += `<div class="lb-row">
          <span class="lb-date">${d}</span>
          <span class="lb-weapon">${wd ? wd.icon + ' ' + wd.name : s.weapon}</span>
          <span class="lb-time">${s.won ? '🏆 ' : ''}${VR.formatTime(s.time)}</span>
          <span class="lb-kills">${s.kills} kills</span>
          <span class="lb-depth">${s.won ? 'WON' : 'DEPTH ' + s.depth}</span>
        </div>`;
      }
      wrap.innerHTML = html;
      const br = save.bestRun;
      const brDiff = br ? VR.data.difficultyById[br.difficulty] : null;
      $('lb-best').innerHTML = br
        ? 'Best win — <b>' + VR.formatTime(br.time) + '</b> with <b>' + (VR.data.weaponById[br.weapon] ? VR.data.weaponById[br.weapon].name : br.weapon) + '</b>' + (brDiff ? ' on <b>' + brDiff.name + '</b>' : '') + ' · ' + br.date
        : 'No wins recorded yet. The void waits.';
      this.show('leaderboard');
    },

    showAchievementToast(name, reward, icon) {
      const el = document.createElement('div');
      el.className = 'ach-toast';
      el.innerHTML = `<span class="at-icon">${icon || '🏅'}</span><div class="at-body"><div class="at-title">ACHIEVEMENT UNLOCKED</div><div class="at-name">${name}</div></div><div class="at-reward">+${reward} 💠</div>`;
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 400);
      }, 3200);
    },

    /* ---------------- level up / upgrade cards ---------------- */
    showLevelUp(player, source) {
      source = source || 'level';
      const wrap = $('upgrade-cards');
      wrap.innerHTML = '';
      const picks = VR.data.rollUpgrades(player, 3);
      if (!picks.length) {
        VR.game.resume();
        return;
      }
      let chosen = false;
      for (const u of picks) {
        const stacks = player.upgrades.get(u.id) || 0;
        const card = document.createElement('div');
        card.className = 'card rarity-' + u.rarity;
        card.innerHTML = `
          <span class="card-rarity">${u.rarity.toUpperCase()}</span>
          <span class="card-icon" style="color:${this.rarityColor(u.rarity)}">${u.icon}</span>
          <div class="card-name">${u.name}</div>
          <div class="card-desc">${u.desc(stacks + 1)}</div>
          ${stacks > 0 ? '<span class="card-stack">STACK ' + stacks + ' → ' + (stacks + 1) + '</span>' : ''}`;
        card.onclick = () => {
          if (chosen) return;
          chosen = true;
          VR.audio.play('uiClick');
          VR.game.applyUpgrade(player, u);
          VR.game.resume();
        };
        wrap.appendChild(card);
      }
      this.show('levelup');
      if (source === 'relic') {
        document.querySelector('#levelup h2').textContent = 'VOID RELIC';
        document.querySelector('#levelup .sub').textContent = 'A corrupted artifact grants power';
      } else {
        document.querySelector('#levelup h2').textContent = 'LEVEL UP';
        document.querySelector('#levelup .sub').textContent = 'Choose an upgrade';
      }
    },

    rarityColor(r) {
      return ({ common: '#9fb4c8', rare: '#4d9fff', epic: '#a06bff', legendary: '#ffb84d' })[r] || '#fff';
    },

    /* ---------------- pause ---------------- */
    showPause() { this.show('pause'); },

    /* ---------------- customize ---------------- */
    showCustomize() {
      this.rebuildCustomize();
      this.show('customize');
      this.startPreview();
    },

    rebuildCustomize() {
      const app = VR.saveData.appearance;
      if (!app || typeof app !== 'object') VR.saveData.appearance = app = {};

      // hair style buttons with live thumbnails
      const shapesWrap = $('cust-shapes');
      shapesWrap.innerHTML = '';
      for (let i = 0; i < Object.keys(VR.pixel.HAIR_STYLES).length; i++) {
        const btn = document.createElement('button');
        btn.className = 'shape-btn' + ((app.hairStyle || 0) === i ? ' selected' : '');
        const cv = document.createElement('canvas');
        cv.width = 48; cv.height = 48;
        btn.appendChild(cv);
        btn.title = HAIR_STYLE_LABELS[i] || 'STYLE ' + (i + 1);
        btn.onclick = () => {
          VR.audio.play('uiClick');
          app.hairStyle = i;
          VR.save.write();
          this.rebuildCustomize();
        };
        shapesWrap.appendChild(btn);
      }
      this.renderShapeThumbs();

      // color slots
      const colorsWrap = $('cust-colors');
      colorsWrap.innerHTML = '';
      for (const slot of COLOR_SLOTS) {
        const row = document.createElement('div');
        row.className = 'color-row';
        const label = document.createElement('span');
        label.className = 'color-name';
        label.textContent = slot.label;
        const swatches = document.createElement('span');
        swatches.className = 'swatches';
        for (const c of PRESET_COLORS) {
          const s = document.createElement('span');
          s.className = 'swatch';
          s.style.background = c;
          s.style.color = c;
          s.onclick = () => {
            VR.audio.play('uiClick');
            app[slot.key] = c;
            VR.save.write();
            this.renderShapeThumbs();
            row.querySelector('input').value = c;
          };
          swatches.appendChild(s);
        }
        const input = document.createElement('input');
        input.type = 'color';
        input.value = app[slot.key] || '#43e6ff';
        input.addEventListener('input', () => {
          app[slot.key] = input.value;
          VR.save.write();
          this.renderShapeThumbs();
        });
        row.appendChild(label);
        row.appendChild(swatches);
        row.appendChild(input);
        colorsWrap.appendChild(row);
      }
    },

    renderShapeThumbs() {
      const app = VR.saveData.appearance;
      const buttons = document.querySelectorAll('#cust-shapes .shape-btn canvas');
      buttons.forEach((cv, i) => {
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.save();
        ctx.translate(cv.width / 2, cv.height / 2 - 3);
        VR.pixel.character(ctx, app, i, 1.8);
        ctx.restore();
      });
    },

    startPreview() {
      if (this.previewRAF) return;
      const cv = $('cust-canvas');
      const loop = () => {
        const overlay = $('customize');
        if (!overlay || overlay.classList.contains('hidden')) {
          this.previewRAF = null;
          return;
        }
        this.drawPreview(cv);
        this.previewRAF = requestAnimationFrame(loop);
      };
      this.previewRAF = requestAnimationFrame(loop);
    },

    drawPreview(cv) {
      const ctx = cv.getContext('2d');
      const app = VR.saveData.appearance;
      const t = (VR.game ? VR.game.time : 0) * 0.9;
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);

      // faint grid
      ctx.strokeStyle = 'rgba(67,230,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 23) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 23) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // shield bubble behind ship
      if (app.shield) {
        ctx.save();
        ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 3);
        ctx.strokeStyle = app.shield;
        ctx.lineWidth = 2;
        ctx.shadowColor = app.shield;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 + 4, 34, 0, VR.TAU);
        ctx.stroke();
        ctx.restore();
      }

      // trail wisps
      for (let i = 0; i < 3; i++) {
        const tt = (t * 0.7 + i * 0.35) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - tt) * 0.5;
        ctx.fillStyle = i % 2 === 0 ? (app.trail || '#ffb84d') : (app.trail2 || '#ff4d2b');
        ctx.fillRect(w / 2 - 3 + tt * 30, h / 2 + 6 + Math.sin(t + i) * 16, 6 - tt * 3, 6 - tt * 3);
        ctx.restore();
      }

      // the rabbit, slowly swaying
      ctx.save();
      ctx.translate(w / 2, h / 2 + 8);
      ctx.rotate(Math.sin(t * 0.8) * 0.3 - 0.3);
      VR.pixel.character(ctx, app, app.hairStyle || 0, 2.1);
      ctx.restore();
    },

    /* ---------------- settings ---------------- */
    bindSettings() {
      const s = VR.saveData.settings;
      const set = (id, val) => { const el = $(id); if (el) el.value = val; };
      set('set-master', Math.round(s.masterVol * 100));
      set('set-music', Math.round(s.musicVol * 100));
      set('set-sfx', Math.round(s.sfxVol * 100));
      $('set-shake').checked = s.screenShake;
      $('set-dmg').checked = s.damageNumbers;
      $('set-fullscreen').checked = s.fullscreen;

      const applyImmediately = () => { this.applySettingsFromDOM(); };
      ['set-master', 'set-music', 'set-sfx'].forEach((id) => $(id).addEventListener('input', applyImmediately));
      ['set-shake', 'set-dmg', 'set-fullscreen'].forEach((id) => $(id).addEventListener('change', applyImmediately));
    },

    applySettingsFromDOM() {
      const s = VR.saveData.settings;
      s.masterVol = ($('set-master').value || 80) / 100;
      s.musicVol = ($('set-music').value || 70) / 100;
      s.sfxVol = ($('set-sfx').value || 90) / 100;
      s.screenShake = $('set-shake').checked;
      s.damageNumbers = $('set-dmg').checked;
      s.fullscreen = $('set-fullscreen').checked;
      VR.audio.applyVolumes();
      VR.save.write();
      if (s.fullscreen) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen && document.exitFullscreen();
      }
    },

    showSettings(from) {
      this.settingsFrom = from || 'menu';
      this.show('settings');
    },

    /* ---------------- shop ---------------- */
    showShop() {
      const wrap = $('shop-list');
      wrap.innerHTML = '';
      const save = VR.save.get();

      const render = () => {
        wrap.innerHTML = '';
        $('shop-shards').textContent = save.shards;
        for (const m of VR.data.meta) {
          const level = save.meta[m.id] || 0;
          const maxed = level >= m.max;
          const item = document.createElement('div');
          item.className = 'shop-item';
          if (m.weaponUnlock) {
            const unlocked = save.unlockedWeapons.includes(m.weaponId);
            item.innerHTML = `
              <span class="shop-icon">${m.icon}</span>
              <div class="shop-info">
                <div class="shop-name">${m.name}</div>
                <div class="shop-desc">${m.desc(level)}</div>
                <div class="shop-level">${unlocked ? 'UNLOCKED' : 'WEAPON'}</div>
              </div>
              <div class="shop-cost ${unlocked || save.shards < m.baseCost ? '' : ''}" style="${unlocked ? 'color:var(--text-dim);border-color:rgba(120,170,210,0.2);cursor:default' : ''}">${unlocked ? '✓' : '💠 ' + m.baseCost}</div>`;
            if (!unlocked) {
              item.querySelector('.shop-cost').onclick = () => {
                if (save.shards >= m.baseCost) {
                  VR.save.spendShards(m.baseCost);
                  save.unlockedWeapons.push(m.weaponId);
                  VR.save.write();
                  VR.audio.play('upgrade');
                  render();
                } else {
                  VR.audio.play('uiBack');
                }
              };
            }
          } else {
            const cost = maxed ? 0 : VR.data.metaCost(m, level);
            item.innerHTML = `
              <span class="shop-icon">${m.icon}</span>
              <div class="shop-info">
                <div class="shop-name">${m.name}</div>
                <div class="shop-desc">${m.desc(level + 1)}</div>
                <div class="shop-level">LV ${level} / ${m.max}</div>
              </div>
              <div class="shop-cost ${maxed ? 'maxed' : ''}">${maxed ? 'MAX' : '💠 ' + cost}</div>`;
            if (!maxed) {
              item.querySelector('.shop-cost').onclick = () => {
                if (save.shards >= cost) {
                  VR.save.spendShards(cost);
                  save.meta[m.id] = level + 1;
                  VR.save.write();
                  VR.audio.play('upgrade');
                  render();
                } else {
                  VR.audio.play('uiBack');
                }
              };
            }
          }
          wrap.appendChild(item);
        }
      };
      render();
      this.show('shop');
    },

    /* ---------------- end screen ---------------- */
    showEndScreen(victory, run) {
      const title = $('end-title');
      title.textContent = victory ? 'ARENA PURGED' : 'RUN TERMINATED';
      title.style.background = victory
        ? 'linear-gradient(90deg, #ffcf4d, #ffb84d)'
        : 'linear-gradient(90deg, #ff5c7a, #ff5c1f)';
      title.style.webkitBackgroundClip = 'text';
      title.style.backgroundClip = 'text';
      title.style.webkitTextFillColor = 'transparent';
      $('end-sub').textContent = victory
        ? 'The Null Warden is broken. The void recedes.'
        : 'The corruption consumed another operative.';
      const diff = VR.data.difficultyById[run.difficulty];
      const stats = [
        ['Difficulty', diff ? diff.icon + ' ' + diff.name : '—'],
        ['Run Duration', VR.formatTime(run.time)],
        ['Enemies Defeated', run.kills],
        ['Level Reached', VR.game.player ? VR.game.player.level : 1],
        ['Damage Dealt', VR.formatNum(run.damageDealt)],
        ['Upgrades Obtained', run.upgradesTaken.length],
        ['Void Shards Earned', '💠 ' + run.shardsEarned]
      ];
      const grid = $('end-stats');
      grid.innerHTML = stats.map(([k, v]) => `<div class="stat"><span>${k}</span><span>${v}</span></div>`).join('');
      $('end-shards-val').textContent = run.shardsEarned;
      $('end-shards').textContent = '💠 +' + run.shardsEarned + ' VOID SHARDS';
      this.show('end-screen');
    },

    /* ---------------- reward room ---------------- */
    showReward(player) {
      const wrap = $('reward-cards');
      wrap.innerHTML = '';
      const options = [
        {
          icon: '🧪', name: 'POTION CACHE', color: '#7dff9e', desc: 'Gain 3 health potions.',
          act() { player.items.potions = Math.min(99, player.items.potions + 3); VR.fx.floatText(player.x, player.y - 26, '+3 POTIONS', '#7dff9e'); }
        },
        {
          icon: '🎁', name: 'VOID RELIC', color: '#a06bff', desc: 'Gain a random passive relic.',
          act() {
            const relic = VR.data.rollRelic(player);
            if (relic) VR.game.giveRelic(relic);
            else { VR.game.run.gold += 15; VR.audio.play('coin'); }
          }
        },
        {
          icon: '💰', name: 'GOLD CACHE', color: '#ffcf4d', desc: 'Gain 30 gold (converts to shards).',
          act() { VR.game.run.gold += 30; VR.audio.play('coin'); }
        }
      ];
      let chosen = false;
      for (const o of options) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <span class="card-icon" style="color:${o.color}">${o.icon}</span>
          <div class="card-name">${o.name}</div>
          <div class="card-desc">${o.desc}</div>`;
        card.onclick = () => {
          if (chosen) return;
          chosen = true;
          VR.audio.play('uiClick');
          o.act();
          if (VR.game.state === 'reward') VR.game.resume();
        };
        wrap.appendChild(card);
      }
      this.show('reward');
    },

    /* ---------------- banners / hints / tutorial ---------------- */
    showBossBanner(title, sub) {
      $('boss-banner').innerHTML = `<div class="bb-title">${title}</div><div class="bb-sub">${sub}</div>`;
      $('boss-banner').classList.remove('hidden');
      setTimeout(() => this.hide('boss-banner'), 2400);
    },

    showWaveBanner(text, dur) {
      $('wave-banner').textContent = text;
      $('wave-banner').classList.remove('hidden');
      setTimeout(() => this.hide('wave-banner'), (dur || 1.6) * 1000);
    },

    showHints(text, sec) {
      $('hint-bar').textContent = text;
      $('hint-bar').classList.remove('hidden');
      VR.game.hintTimer = sec || 5;
    },
    hideHints() { $('hint-bar').classList.add('hidden'); },

    showTutorial() {
      this.show('tutorial');
      VR.audio.play('levelup');
    }
  };

  VR.ui = ui;
})();
