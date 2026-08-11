/* save.js — persistent progression + settings with validation. */
(function () {
  'use strict';
  const VR = window.VR;

  const KEY = 'voidrun_save_v1';

  const DEFAULTS = {
    version: 1,
    shards: 0,
    shardsSpent: 0,
    meta: {},                    // id -> level
    unlockedWeapons: ['pulse'],  // weapon ids
    tutorialDone: false,
    runsCompleted: 0,
    runsWon: 0,
    bestDepth: 0,
    totalKills: 0,
    eliteKills: 0,               // cumulative elite kills
    shardsEarnedTotal: 0,        // lifetime shards earned (before spending)
    winsByWeapon: {},            // weaponId -> wins
    dailyWins: 0,
    bossesKilled: {},            // bossId -> count
    achievements: {},            // id -> true
    codex: { enemies: {}, weapons: {}, bosses: {} },  // seen flags
    dailyScores: {},             // 'YYYY-MM-DD' -> {time, kills, depth, won, weapon}
    bestRuns: [],                // last ~12 completed runs for leaderboard
    bestRun: null,               // all-time best {time, kills, weapon, won, date}
    appearance: {
      ears: '#a06bff',      // rabbit ears
      hair: '#efe4cf',      // fur
      face: '#ffe9d6',      // muzzle / paws
      outfit: '#8a4a2b',    // tunic
      belt: '#5a2a1e',      // belt / dagger handle
      glow: '#ffb84d',      // aura / effects
      shield: '#43e6ff',    // shield bubble
      trail: '#ffb84d',     // dash trail
      trail2: '#ff4d2b',    // dash trail 2
      hairStyle: 0
    },
    settings: {
      masterVol: 0.8,
      musicVol: 0.7,
      sfxVol: 0.9,
      screenShake: true,
      shakeIntensity: 1,
      damageNumbers: true,
      fullscreen: false,
      debugMode: true,
      difficulty: 'medium'
    }
  };

  function deepMerge(base, extra) {
    const out = { ...base };
    for (const k in extra) {
      if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k])) {
        out[k] = deepMerge(base[k] && typeof base[k] === 'object' ? base[k] : {}, extra[k]);
      } else {
        out[k] = extra[k];
      }
    }
    return out;
  }

  let data = deepMerge(DEFAULTS, {});

  const save = {
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || parsed.version !== DEFAULTS.version) {
          // version mismatch -> keep shards, reset structure (graceful)
          data = deepMerge(DEFAULTS, { shards: typeof parsed.shards === 'number' ? parsed.shards : 0 });
          return;
        }
        data = deepMerge(DEFAULTS, parsed);
        // sanitize
        if (!Array.isArray(data.unlockedWeapons)) data.unlockedWeapons = ['pulse'];
        if (typeof data.meta !== 'object' || !data.meta) data.meta = {};
      } catch (e) {
        console.warn('Save data corrupted — starting fresh.', e);
        data = deepMerge(DEFAULTS, {});
      }
    },
    write() {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not write save data.', e);
      }
    },
    reset() {
      data = deepMerge(DEFAULTS, {});
      save.write();
    },
    get() { return data; },
    /** Add shards (positive only) and persist. */
    addShards(n) {
      if (n > 0) { data.shards += Math.floor(n); save.write(); }
    },
    spendShards(n) {
      if (data.shards >= n) { data.shards -= n; save.write(); return true; }
      return false;
    },
    /** Is an upgrade already at max level? */
    metaLevel(id) { return data.meta[id] || 0; }
  };

  VR.save = save;
  VR.saveData = data; // live reference (mutations visible immediately)
})();
