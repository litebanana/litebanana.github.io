/* difficulties.js — run difficulty definitions (easy / medium / hard / impossible). */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * difficulty def:
   *  id, name, icon, color, desc
   *  hpMult / dmgMult      — enemy & boss strength (stacked on depth scaling)
   *  xpMult               — player XP gain
   *  goldMult             — gold from pickups and room clears
   *  healBonus            — bonus max HP at run start (friendlier modes)
   *  budgetMult           — wave budget (enemy count) multiplier
   *  bossHp / bossDmg     — final boss scaling
   *  shardMult            — end-of-run Void Shard multiplier (risk vs reward)
   *  eliteExtra           — guarantee elites woven into normal waves
   *  metaMult             — how much permanent meta power applies (1 = full)
   *  healMult             — multiplier on ALL player healing (potions, lifesteal, leech)
   *  enemySpeedMult       — enemy move / charge / projectile speed
   *  enemyCdMult          — enemy contact/attack cooldown multiplier (lower = faster hits)
   */
  VR.data.difficulties = [
    {
      id: 'easy', name: 'EASY', icon: '🟢', color: '#7dff9e',
      hpMult: 0.75, dmgMult: 0.6, xpMult: 1.3, goldMult: 1.4, healBonus: 30,
      budgetMult: 0.85, bossHp: 0.75, bossDmg: 0.6, shardMult: 0.8, eliteExtra: false,
      metaMult: 1.15, healMult: 1.3, enemySpeedMult: 0.9, enemyCdMult: 1.15,
      desc: 'Softer, slower foes. +30% healing, faster levels, more gold. Best for learning the void.'
    },
    {
      id: 'medium', name: 'MEDIUM', icon: '🟡', color: '#ffcf4d',
      hpMult: 1, dmgMult: 1, xpMult: 1, goldMult: 1, healBonus: 0,
      budgetMult: 1, bossHp: 1, bossDmg: 1, shardMult: 1, eliteExtra: false,
      metaMult: 1, healMult: 1, enemySpeedMult: 1, enemyCdMult: 1,
      desc: 'The standard descent. Balanced risk and reward.'
    },
    {
      id: 'hard', name: 'HARD', icon: '🟠', color: '#ff8a3d',
      hpMult: 1.4, dmgMult: 1.3, xpMult: 0.95, goldMult: 1.15, healBonus: 0,
      budgetMult: 1.2, bossHp: 1.35, bossDmg: 1.25, shardMult: 1.25, eliteExtra: false,
      metaMult: 0.75, healMult: 0.85, enemySpeedMult: 1.12, enemyCdMult: 0.85,
      desc: 'Thicker, faster enemies. -25% meta power, -15% healing. +25% shards.'
    },
    {
      id: 'impossible', name: 'IMPOSSIBLE', icon: '🔴', color: '#ff5c7a',
      hpMult: 2.0, dmgMult: 1.6, xpMult: 0.9, goldMult: 1.3, healBonus: 0,
      budgetMult: 1.4, bossHp: 1.7, bossDmg: 1.5, shardMult: 1.6, eliteExtra: true,
      metaMult: 0.5, healMult: 0.6, enemySpeedMult: 1.28, enemyCdMult: 0.7,
      desc: '2× foes that hunt 28% faster. Half your meta power, 40% less healing, elites in every wave. +60% shards.'
    }
  ];

  VR.data.difficultyById = {};
  for (const d of VR.data.difficulties) VR.data.difficultyById[d.id] = d;

  /** Resolve a difficulty id with safe fallbacks (daily runs force medium). */
  VR.data.resolveDifficulty = function (id, force) {
    if (force) return VR.data.difficultyById.medium;
    return VR.data.difficultyById[id] || VR.data.difficultyById.medium;
  };
})();
