/* upgrades.js — data-driven in-run upgrades (25 total). */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * upgrade def:
   *  id, name, icon, rarity ('common'|'rare'|'epic'|'legendary'),
   *  max (max stacks), apply(player) mutates player.stats,
   *  desc(stacks) returns current-effect description
   */
  const U = [];
  function def(u) { U.push(u); return u; }

  // ---------------- COMMON ----------------
  def({
    id: 'rending', name: 'RENDING CHARGE', icon: '⚔', rarity: 'common', max: 5,
    apply: (p) => { p.stats.damage *= 1.10; },
    desc: (s) => `+10% damage${s > 1 ? ' (stacks ×' + s + ')' : ''}`
  });
  def({
    id: 'overclock', name: 'OVERCLOCK', icon: '⚙', rarity: 'common', max: 5,
    apply: (p) => { p.stats.attackSpeed *= 1.12; },
    desc: (s) => `+12% attack speed${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'fleet', name: 'FLEET FOOTING', icon: '👟', rarity: 'common', max: 4,
    apply: (p) => { p.stats.moveSpeed *= 1.08; },
    desc: (s) => `+8% movement speed${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'vital', name: 'VOID CORE', icon: '❤', rarity: 'common', max: 5,
    apply: (p) => { p.maxHp += 20; p.stats.maxHp += 20; p.hp += 20; },
    desc: (s) => `+20 max health${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'rail', name: 'RAIL COILS', icon: '➹', rarity: 'common', max: 4,
    apply: (p) => { p.stats.projSpeed *= 1.15; },
    desc: (s) => `+15% projectile speed${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'attractor', name: 'GRAVITY WELL', icon: '🧲', rarity: 'common', max: 3,
    apply: (p) => { p.stats.pickupRadius *= 1.5; },
    desc: (s) => `+50% pickup radius${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'leech', name: 'HARVESTER', icon: '🩸', rarity: 'common', max: 4,
    apply: (p) => { p.stats.lifesteal += 1; },
    desc: (s) => `Kills restore ${s} HP`
  });
  def({
    id: 'precision', name: 'PRECISION TARGETING', icon: '◎', rarity: 'common', max: 4,
    apply: (p) => { p.stats.critChance += 0.06; },
    desc: (s) => `+6% critical chance${s > 1 ? ' (×' + s + ')' : ''}`
  });

  // ---------------- RARE ----------------
  def({
    id: 'rupture', name: 'RUPTURE CORE', icon: '💥', rarity: 'rare', max: 1,
    apply: (p) => { p.stats.explosionCrit = true; },
    desc: () => 'Critical hits cause an explosion'
  });
  def({
    id: 'executioner', name: 'EXECUTIONER', icon: '🎯', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.critDamage *= 1.35; },
    desc: (s) => `+35% critical damage${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'splitter', name: 'SPLITTER ARRAY', icon: '✦', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.projCount += 1; },
    desc: (s) => `+1 projectile per shot${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'plating', name: 'CARBON PLATING', icon: '🛡', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.armor += 8; },
    desc: (s) => `+8 armor (reduces damage taken)${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'phase', name: 'PHASE MODULATOR', icon: '🌀', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.dashCd *= 0.85; },
    desc: (s) => `-15% dash cooldown${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'reach', name: 'EDGE REACH', icon: '📏', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.meleeRange *= 1.25; },
    desc: (s) => `+25% melee range${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'pierce', name: 'REND TALONS', icon: '🗡', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.pierce += 1; },
    desc: (s) => `Projectiles pierce +${s} enemies`
  });
  def({
    id: 'focus', name: 'FOCUS CRYSTAL', icon: '💠', rarity: 'rare', max: 3,
    apply: (p) => { p.stats.xpGain *= 1.15; },
    desc: (s) => `+15% XP gain${s > 1 ? ' (×' + s + ')' : ''}`
  });

  // ---------------- EPIC ----------------
  def({
    id: 'voidstep', name: 'VOIDSTEP', icon: '💨', rarity: 'epic', max: 1,
    apply: (p) => { p.stats.dashDamage = true; },
    desc: () => 'Dash damages enemies you pass through'
  });
  def({
    id: 'echo', name: 'ECHO CHARGE', icon: '⚡', rarity: 'epic', max: 2,
    apply: (p) => { p.stats.dashCharges += 1; },
    desc: (s) => `+1 dash charge${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'aegis', name: 'AEGIS FIELD', icon: '🔮', rarity: 'epic', max: 2,
    apply: (p) => {
      p.stats.maxShield += 40; p.stats.shieldRegenMult *= 2.5;
      p.shield = Math.min(p.stats.maxShield, p.shield + 40);
    },
    desc: (s) => `+40 max shield, 2.5× shield regen${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'berserk', name: 'BERSERK PROTOCOL', icon: '🔥', rarity: 'epic', max: 2,
    apply: (p) => { p.stats.lowHpBonus *= 1.3; },
    desc: () => 'Below 50% HP, deal +30% damage'
  });
  def({
    id: 'voltaic', name: 'VOLTAIC LENS', icon: '⚡', rarity: 'epic', max: 2,
    apply: (p) => { p.stats.chainChance += 0.3; p.stats.chainCount += 3; },
    desc: (s) => `30% chance projectiles chain${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'concussive', name: 'CONCUSSIVE ROUNDS', icon: '👊', rarity: 'epic', max: 2,
    apply: (p) => { p.stats.knockbackMult = (p.stats.knockbackMult || 1) * 1.6; p.stats.damage *= 1.08; },
    desc: (s) => `+60% knockback, +8% damage${s > 1 ? ' (×' + s + ')' : ''}`
  });

  // ---------------- LEGENDARY ----------------
  def({
    id: 'annihilator', name: 'ANNIHILATOR', icon: '☄', rarity: 'legendary', max: 2,
    apply: (p) => { p.stats.damage *= 1.45; p.stats.critChance += 0.08; },
    desc: (s) => `+45% damage, +8% crit chance${s > 1 ? ' (×' + s + ')' : ''}`
  });
  def({
    id: 'voidengine', name: 'VOID ENGINE', icon: '🌀', rarity: 'legendary', max: 1,
    apply: (p) => {
      p.stats.dashCd *= 0.7; p.stats.moveSpeed *= 1.15; p.stats.dashCharges += 1; p.stats.dashDist *= 1.2;
    },
    desc: () => '-30% dash cooldown, +15% speed, +1 dash charge, +20% dash distance'
  });
  def({
    id: 'apocalypse', name: 'APOCALYPSE PROTOCOL', icon: '🌋', rarity: 'legendary', max: 1,
    apply: (p) => {
      p.stats.attackSpeed *= 1.3; p.stats.projCount += 1; p.stats.explosionCrit = true;
    },
    desc: () => '+30% attack speed, +1 projectile, crits explode'
  });
  def({
    id: 'bloodorb', name: 'BLOOD ORB', icon: '🩸', rarity: 'legendary', max: 2,
    apply: (p) => { p.stats.critLeech = (p.stats.critLeech || 0) + 0.4; },
    desc: (s) => `Critical hits heal for ${Math.round(s * 40)}% of damage dealt`
  });
  def({
    id: 'cascade', name: 'CASCADE CORE', icon: '☄', rarity: 'legendary', max: 1,
    apply: (p) => { p.stats.killExplode = true; },
    desc: () => 'Kills detonate enemies, dealing 60% of the kill damage in a blast'
  });
  def({
    id: 'overdrive', name: 'OVERDRIVE', icon: '⚡', rarity: 'legendary', max: 3,
    apply: (p) => { p.stats.doubleFire = (p.stats.doubleFire || 0) + 0.25; },
    desc: (s) => `${Math.round(s * 25)}% chance to fire twice`
  });

  VR.data.upgrades = U;
  VR.data.upgradeById = {};
  for (const u of U) VR.data.upgradeById[u.id] = u;

  /** Rarity → display weight for random card generation. */
  VR.data.rarityWeight = (level) => ({
    common: 55,
    rare: 30 + Math.min(15, level),
    epic: 12 + Math.min(12, level * 2),
    legendary: 3 + Math.min(10, Math.floor(level * 0.8))
  });

  /** Returns N distinct random upgrades not already at max stacks. */
  VR.data.rollUpgrades = function (player, n) {
    const taken = player.upgrades; // Map id -> stacks
    const pool = VR.data.upgrades.filter((u) => (taken.get(u.id) || 0) < u.max);
    const weights = VR.data.rarityWeight(player.level);
    const chosen = [];
    const poolCopy = pool.slice();
    while (chosen.length < n && poolCopy.length) {
      const pick = VR.weightedPick(poolCopy, (u) => weights[u.rarity] || 1);
      chosen.push(pick);
      poolCopy.splice(poolCopy.indexOf(pick), 1);
    }
    return chosen;
  };
})();
