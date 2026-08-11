/* achievements.js — meta achievements with shard rewards. */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * achievement def:
   *  id, name, icon, desc, reward (shards), test(save, ctx) -> bool
   * ctx: { victory, run } when called from run end; otherwise { kill }
   */
  const A = [];
  function def(a) { A.push(a); return a; }

  def({
    id: 'firstblood', name: 'FIRST BLOOD', icon: '🗡', reward: 10,
    desc: 'Defeat 50 enemies (lifetime).',
    test: (s) => s.totalKills >= 50
  });
  def({
    id: 'butcher', name: 'BUTCHER OF THE VOID', icon: '☠', reward: 40,
    desc: 'Defeat 1,000 enemies (lifetime).',
    test: (s) => s.totalKills >= 1000
  });
  def({
    id: 'survivor', name: 'SURVIVOR', icon: '🩹', reward: 10,
    desc: 'Complete 10 runs.',
    test: (s) => s.runsCompleted >= 10
  });
  def({
    id: 'victor', name: 'VOIDBREAKER', icon: '👑', reward: 25,
    desc: 'Win your first run.',
    test: (s) => s.runsWon >= 1
  });
  def({
    id: 'legend', name: 'LEGEND OF THE HOLLOW', icon: '🌟', reward: 60,
    desc: 'Win 5 runs.',
    test: (s) => s.runsWon >= 5
  });
  def({
    id: 'deepdelve', name: 'DEEP DELVER', icon: '🕳', reward: 20,
    desc: 'Reach the final sector.',
    test: (s) => s.bestDepth >= 8
  });
  def({
    id: 'hoarder', name: 'SHARD HOARDER', icon: '💠', reward: 30,
    desc: 'Earn 500 Void Shards (lifetime).',
    test: (s) => s.shardsEarnedTotal >= 500
  });
  def({
    id: 'arsenal', name: 'COMPLETE ARSENAL', icon: '🧰', reward: 40,
    desc: 'Unlock every weapon.',
    test: (s) => VR.data.weapons.every((w) => s.unlockedWeapons.includes(w.id))
  });
  def({
    id: 'eliteslayer', name: 'ELITE SLAYER', icon: '⭐', reward: 25,
    desc: 'Defeat 25 elite enemies.',
    test: (s) => s.eliteKills >= 25
  });
  def({
    id: 'warboss', name: 'EXECUTIONER', icon: '💀', reward: 50,
    desc: 'Defeat both bosses.',
    test: (s) => (s.bossesKilled.warden || 0) >= 1 && (s.bossesKilled.razor || 0) >= 1
  });
  def({
    id: 'speedrun', name: 'LIGHTNING RABBIT', icon: '⚡', reward: 35,
    desc: 'Win a run in under 12 minutes.',
    test: (s, ctx) => !!(ctx.victory && ctx.run && ctx.run.time < 720)
  });
  def({
    id: 'dailywin', name: 'DAILY DRIFTER', icon: '📅', reward: 30,
    desc: 'Win a daily run.',
    test: (s, ctx) => !!(ctx.victory && ctx.run && ctx.run.daily)
  });
  def({
    id: 'hardwin', name: 'HARD ASCENSION', icon: '🟠', reward: 30,
    desc: 'Win a run on HARD or IMPOSSIBLE.',
    test: (s, ctx) => !!(ctx.victory && ctx.run && (ctx.run.difficulty === 'hard' || ctx.run.difficulty === 'impossible'))
  });
  def({
    id: 'impossiblewin', name: 'IMPOSSIBLE ASCENSION', icon: '🔴', reward: 80,
    desc: 'Win a run on IMPOSSIBLE.',
    test: (s, ctx) => !!(ctx.victory && ctx.run && ctx.run.difficulty === 'impossible')
  });
  def({
    id: 'noheal', name: 'STOIC', icon: '🧊', reward: 45,
    desc: 'Win a run without drinking a potion.',
    test: (s, ctx) => !!(ctx.victory && ctx.run && ctx.run.potionsUsed === 0)
  });
  def({
    id: 'reliccollector', name: 'RELIC COLLECTOR', icon: '🎁', reward: 30,
    desc: 'Hold 4 relics at once.',
    test: (s, ctx) => !!(ctx.run && VR.game.player && VR.game.player.relics.length >= 4)
  });
  // per-weapon mastery
  for (const w of VR.data.weapons) {
    def({
      id: 'master_' + w.id, name: 'MASTER: ' + w.name, icon: w.icon, reward: 15,
      desc: 'Win a run with the ' + w.name + '.',
      test: (s) => (s.winsByWeapon[w.id] || 0) >= 1
    });
  }

  VR.data.achievements = A;
  VR.data.achievementById = {};
  for (const a of A) VR.data.achievementById[a.id] = a;

  /** Check all locked achievements; unlock + reward + toast any newly earned. */
  VR.achievements = {
    checkAll(ctx) {
      ctx = ctx || {};
      const save = VR.save.get();
      let unlocked = 0;
      for (const a of A) {
        if (save.achievements[a.id]) continue;
        let ok = false;
        try { ok = a.test(save, ctx); } catch (e) { ok = false; }
        if (!ok) continue;
        save.achievements[a.id] = true;
        VR.save.addShards(a.reward);
        VR.save.write();
        unlocked++;
        VR.ui && VR.ui.showAchievementToast(a.name, a.reward, a.icon);
      }
      return unlocked;
    }
  };
})();
