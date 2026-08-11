/* meta.js — permanent progression (Void Shards) definitions. */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * meta def:
   *  id, name, icon, max (max level), baseCost, costGrowth,
   *  desc(level) -> string, apply(runStats) -> mutates starting run modifiers
   *
   * runStats fields set before a run:
   *  hpMult, dmgMult, xpMult, shieldStart, moveMult, dashCdMult, pickupMult, armorFlat
   */
  const M = [];
  function def(m) { M.push(m); return m; }

  def({
    id: 'vitality', name: 'VOID VITALITY', icon: '❤', max: 5, baseCost: 40, costGrowth: 1.5,
    desc: (l) => `+6% max health per level (now +${l * 6}%)`,
    apply: (r) => { r.hpMult = (r.hpMult || 1) * 1.06; }
  });
  def({
    id: 'firepower', name: 'VOID FIREPOWER', icon: '⚔', max: 5, baseCost: 40, costGrowth: 1.5,
    desc: (l) => `+6% damage per level (now +${l * 6}%)`,
    apply: (r) => { r.dmgMult = (r.dmgMult || 1) * 1.06; }
  });
  def({
    id: 'attunement', name: 'VOID ATTUNEMENT', icon: '💠', max: 5, baseCost: 35, costGrowth: 1.45,
    desc: (l) => `+6% XP gain per level (now +${l * 6}%)`,
    apply: (r) => { r.xpMult = (r.xpMult || 1) * 1.06; }
  });
  def({
    id: 'reactor', name: 'SHIELD REACTOR', icon: '🔮', max: 3, baseCost: 45, costGrowth: 1.6,
    desc: (l) => `Start each run with +25 shield (now +${l * 25})`,
    apply: (r) => { r.shieldStart = (r.shieldStart || 0) + 25; }
  });
  def({
    id: 'momentum', name: 'VOID MOMENTUM', icon: '👟', max: 5, baseCost: 35, costGrowth: 1.45,
    desc: (l) => `+5% movement speed per level (now +${l * 5}%)`,
    apply: (r) => { r.moveMult = (r.moveMult || 1) * 1.05; }
  });
  def({
    id: 'magnet', name: 'VOID MAGNET', icon: '🧲', max: 3, baseCost: 30, costGrowth: 1.5,
    desc: (l) => `+30% pickup radius per level (now +${l * 30}%)`,
    apply: (r) => { r.pickupMult = (r.pickupMult || 1) * 1.3; }
  });
  def({
    id: 'dashcore', name: 'DASH CORE', icon: '🌀', max: 3, baseCost: 40, costGrowth: 1.6,
    desc: (l) => `-8% dash cooldown per level (now -${l * 8}%)`,
    apply: (r) => { r.dashCdMult = (r.dashCdMult || 1) * 0.92; }
  });

  // Weapon unlocks are special: level 0 = locked, 1 = unlocked
  const weapons = VR.data.weapons;
  for (const w of weapons) {
    if (w.unlockCost > 0) {
      def({
        id: 'unlock_' + w.id, name: w.name + ' UNLOCK', icon: w.icon, max: 1, baseCost: w.unlockCost, costGrowth: 1,
        weaponId: w.id, weaponUnlock: true,
        desc: (l) => l === 1 ? 'Unlocked' : 'Unlocks the ' + w.name + ' for future runs',
        apply: () => {}
      });
    }
  }

  VR.data.meta = M;
  VR.data.metaById = {};
  for (const m of M) VR.data.metaById[m.id] = m;

  /** Cost for buying level `level` (0-indexed next purchase) of meta upgrade m. */
  VR.data.metaCost = function (m, level) {
    return Math.round(m.baseCost * Math.pow(m.costGrowth, level));
  };
})();
