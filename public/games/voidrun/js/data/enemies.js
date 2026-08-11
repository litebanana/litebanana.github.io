/* enemies.js — data-driven enemy definitions. */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * enemy def:
   *  id, name, behavior, hp, speed, radius, contact (contact damage),
   *  xp, shardChance, color, depth (first depth where it can spawn),
   *  weight (spawn weight for wave composition)
   *  shooter: fireRate, projSpeed, projDmg, keepDist
   *  charger: chargeSpeed, telegraph, chargeDmg, cooldown
   *  shield: shieldArc (deg half-width)
   */
  VR.data.enemies = [
    {
      id: 'drone', name: 'SLIME', behavior: 'drone',
      hp: 26, speed: 150, radius: 15, contact: 10, xp: 3, shardChance: 0.04,
      color: '#5fbf6a', depth: 0, weight: 6, tier: 'basic',
      lore: 'Dungeon slime. It oozes, it follows, it dissolves. Purely ornamental malice.'
    },
    {
      id: 'swarm', name: 'BATLING', behavior: 'swarm',
      hp: 12, speed: 235, radius: 10, contact: 7, xp: 2, shardChance: 0.02,
      color: '#8a5fbf', depth: 0, weight: 5, tier: 'basic',
      lore: 'A bat born wrong — too many teeth, too little sense. Hunts in shrieking clouds.'
    },
    {
      id: 'shooter', name: 'BONE ARCHER', behavior: 'shooter',
      hp: 34, speed: 105, radius: 16, contact: 12, xp: 5, shardChance: 0.06,
      color: '#e8d5b5', depth: 1, weight: 4, tier: 'ranged',
      fireRate: 2.1, projSpeed: 330, projDmg: 9, keepDist: [360, 520],
      lore: 'It draws a bow made of its own rib. It never misses the floor.'
    },
    {
      id: 'charger', name: 'RAMPAGE', behavior: 'charger',
      hp: 60, speed: 118, radius: 18, contact: 14, xp: 6, shardChance: 0.08,
      color: '#c26a4a', depth: 2, weight: 3, tier: 'elite-ish',
      chargeSpeed: 640, chargeDmg: 22, telegraph: 0.75, cooldown: 2.6,
      lore: 'A bull-headed brute with a short temper and a longer run-up.'
    },
    {
      id: 'shield', name: 'STONE GOLEM', behavior: 'shield',
      hp: 80, speed: 85, radius: 19, contact: 13, xp: 7, shardChance: 0.1,
      color: '#9a8f7d', depth: 3, weight: 2, tier: 'defender',
      shieldArc: 120,
      lore: 'Animated masonry that forgot it was a wall. Carries the shield it once guarded.'
    },
    {
      id: 'splitter', name: 'FRACTURE', behavior: 'splitter',
      hp: 30, speed: 155, radius: 14, contact: 8, xp: 4, shardChance: 0.05,
      color: '#6fd9c0', depth: 1, weight: 4, tier: 'basic',
      split: { id: 'splitter', count: 2, hpMult: 0.5, radiusMult: 0.72 }, splitMax: 1,
      lore: 'A crystal creature that splits instead of dying. Kill it twice, or thrice, or forever.'
    },
    {
      id: 'exploder', name: 'FUSE SPORE', behavior: 'exploder',
      hp: 40, speed: 112, radius: 16, contact: 0, xp: 5, shardChance: 0.05,
      color: '#ff6a4a', depth: 2, weight: 3, tier: 'ranged',
      explodeRange: 150, explodeDmg: 26, fuseDist: 130, telegraph: 0.85,
      lore: 'A walking cask of unstable sap. Do not stand so it can say goodbye.'
    },
    {
      id: 'brute', name: 'GRAVEBORN TITAN', behavior: 'brute',
      hp: 120, speed: 72, radius: 24, contact: 16, xp: 9, shardChance: 0.1,
      color: '#a8804f', depth: 3, weight: 2, tier: 'elite-ish',
      slamRange: 210, slamDmg: 20, slamCd: 3.2, kbResist: 0.28,
      lore: 'Buried with honors, exhumed without them. It stamps the floor and the floor answers.'
    }
  ];

  VR.data.enemyById = {};
  for (const e of VR.data.enemies) VR.data.enemyById[e.id] = e;
})();
