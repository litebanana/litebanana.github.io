/* weapons.js — data-driven weapon definitions. */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * weapon def fields:
   *  id, name, icon, color, type ('auto'|'burst'|'chain'|'melee'|'boomerang'|'deploy'|'orbit'),
   *  fireRate (s between shots), damage, projSpeed, projCount, spread (deg),
   *  pellets (per shot), pierce, knockback, size, lifetime (s),
   *  chainCount, chainRange, arc (deg, melee), range (melee), unlockCost
   *  auto: hold to fire. burst: single shots per click.
   *  boomerang: projectile returns to the player. deploy: spawns a sentinel turret.
   *  orbit: summons a void orb that circles the player.
   */
  VR.data.weapons = [
    {
      id: 'pulse', name: 'CROSSBOW', icon: '🏹', color: '#c8a84a',
      type: 'auto', fireRate: 0.105, damage: 12, projSpeed: 640,
      projCount: 1, spread: 3.5, pellets: 1, pierce: 0, knockback: 170,
      size: 4.5, lifetime: 1.15, auto: true, unlockCost: 0,
      blurb: 'Reliable auto-fire bolts. Balanced in any fight.',
      stats: ['DPS: balanced', 'Range: long', 'Accuracy: high'],
      lore: 'The crossbow of the first delver. It never jams, never lies, never runs dry.'
    },
    {
      id: 'scatter', name: 'BLAST WAND', icon: '✸', color: '#ff8a3d',
      type: 'burst', fireRate: 0.52, damage: 9, projSpeed: 520,
      projCount: 6, spread: 19, pellets: 6, pierce: 0, knockback: 320,
      size: 4, lifetime: 0.62, auto: false, unlockCost: 250,
      blurb: 'A wand that spits a spread of fire bolts. Devastating up close.',
      stats: ['DPS: burst', 'Range: short', 'Knockback: huge'],
      lore: 'Carved from the femur of a magma wyrm, still warm to the touch.'
    },
    {
      id: 'arc', name: 'ARC TOME', icon: '⚡', color: '#a06bff',
      type: 'chain', fireRate: 0.3, damage: 20, projSpeed: 600,
      projCount: 1, spread: 2, pellets: 1, pierce: 0, knockback: 90,
      size: 5, lifetime: 1.0, chainCount: 4, chainRange: 300, auto: true, unlockCost: 500,
      blurb: 'Fires an arcane bolt that jumps between enemies.',
      stats: ['DPS: medium', 'Chains: 4 targets', 'Range: medium'],
      lore: 'Its pages are blank until violence is near, then they fill with lightning.'
    },
    {
      id: 'blade', name: 'BLACK DAGGER', icon: '🗡', color: '#cfd6dd',
      type: 'melee', fireRate: 0.34, damage: 34, projSpeed: 0,
      projCount: 1, spread: 0, pellets: 1, pierce: 0, knockback: 520,
      size: 0, lifetime: 0, arc: 150, range: 125, auto: false, unlockCost: 800,
      blurb: 'Wide dagger arc with brutal knockback. Up close, all power.',
      stats: ['DPS: high', 'Range: melee', 'Knockback: massive'],
      lore: "The rabbit's own tooth, honed over a thousand hunts."
    },
    {
      id: 'boomerang', name: 'ECHO BOOMERANG', icon: '🪃', color: '#7dff9e',
      type: 'boomerang', fireRate: 0.78, damage: 27, projSpeed: 640,
      projCount: 1, spread: 0, pellets: 1, pierce: 0, knockback: 210,
      size: 6, lifetime: 2.6, auto: false, unlockCost: 400,
      blurb: 'A whistling blade that returns to the hand — every enemy it passes takes the hit twice.',
      stats: ['DPS: 2-pass', 'Range: returns', 'Pierce: all'],
      lore: 'Tossed into the void, it always comes back. The void never forgives debts.'
    },
    {
      id: 'sentinel', name: 'SENTINEL TURRET', icon: '🛰', color: '#4d9fff',
      type: 'deploy', fireRate: 0.6, damage: 12, projSpeed: 560,
      projCount: 1, spread: 0, pellets: 1, pierce: 0, knockback: 130,
      size: 4, lifetime: 14, auto: false, unlockCost: 700,
      blurb: 'Deploy an autonomous sentinel at the cursor. It shreds anything in range. Max 3.',
      stats: ['Turret: 14s', 'Range: long', 'Stacks: 3'],
      lore: 'Rebuilt from the gears of a thousand dead clockwork knights.'
    },
    {
      id: 'orbit', name: 'VOID ORBITS', icon: '🔮', color: '#a06bff',
      type: 'orbit', fireRate: 0.7, damage: 19, projSpeed: 0,
      projCount: 1, spread: 0, pellets: 1, pierce: 0, knockback: 100,
      size: 8, lifetime: 12, auto: false, unlockCost: 1100,
      blurb: 'Summon void orbs that circle you, shredding anything they touch. Max 5.',
      stats: ['Orbs: 5 max', 'Damage: touch', 'Range: close'],
      lore: 'Stolen light from a dying star, tamed into a halo of teeth.'
    }
  ];

  VR.data.weaponById = {};
  for (const w of VR.data.weapons) VR.data.weaponById[w.id] = w;
})();
