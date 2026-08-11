/* relics.js — passive relics found in chests, treasure rooms and the shop. */
(function () {
  'use strict';
  const VR = window.VR;

  VR.data = VR.data || {};

  /**
   * relic def:
   *  id, name, icon, color, desc, apply(player) mutates stats/items
   * The player can hold RELIC_SLOTS (4) relics per run.
   */
  VR.data.RELIC_SLOTS = 4;

  const R = [];
  function def(r) { R.push(r); return r; }

  def({
    id: 'thorns', name: 'THORNBOUND VINES', icon: '🌿', color: '#7dff9e',
    desc: 'Reflect 12 damage to attackers when you are hit.',
    apply: (p) => { p.stats.thorns = (p.stats.thorns || 0) + 1; }
  });
  def({
    id: 'fangs', name: 'VAMPIRE FANGS', icon: '🦇', color: '#ff5c7a',
    desc: 'Kills restore 3 HP.',
    apply: (p) => { p.stats.lifesteal += 3; }
  });
  def({
    id: 'quiver', name: 'PHANTOM QUIVER', icon: '🏹', color: '#4d9fff',
    desc: '+1 projectile per shot.',
    apply: (p) => { p.stats.projCount += 1; }
  });
  def({
    id: 'glasscannon', name: 'GLASS CANNON', icon: '💎', color: '#ffb84d',
    desc: '+35% damage, but -20% max health.',
    apply: (p) => {
      p.stats.damage *= 1.35;
      p.stats.maxHp = Math.max(30, Math.round(p.stats.maxHp * 0.8));
      p.hp = Math.min(p.hp, p.stats.maxHp);
    }
  });
  def({
    id: 'greed', name: 'GREED AMULET', icon: '💰', color: '#ffcf4d',
    desc: '+50% gold from pickups.',
    apply: (p) => { p.stats.goldMult = (p.stats.goldMult || 1) * 1.5; }
  });
  def({
    id: 'windsprint', name: 'WINDSPRINT BOOTS', icon: '👟', color: '#43e6ff',
    desc: '+14% movement speed.',
    apply: (p) => { p.stats.moveSpeed *= 1.14; }
  });
  def({
    id: 'voidheart', name: 'VOID HEART', icon: '❤', color: '#ff4dd8',
    desc: '+50 max health.',
    apply: (p) => { p.stats.maxHp += 50; p.hp += 50; p.maxHp += 50; }
  });
  def({
    id: 'timewarp', name: 'TIME DISTORTION', icon: '⏳', color: '#a06bff',
    desc: '+20% attack speed.',
    apply: (p) => { p.stats.attackSpeed *= 1.2; }
  });
  def({
    id: 'ironhide', name: 'IRON HIDE', icon: '🛡', color: '#9fb4c8',
    desc: '+20 armor (reduces damage taken).',
    apply: (p) => { p.stats.armor += 20; }
  });
  def({
    id: 'satchel', name: 'POCKET SATCHEL', icon: '🎒', color: '#c8a84a',
    desc: 'Start stocked: +2 bombs and +1 key.',
    apply: (p) => { p.items.bombs = Math.min(99, p.items.bombs + 2); p.items.keys = Math.min(9, p.items.keys + 1); }
  });
  def({
    id: 'wildfire', name: 'WILDFIRE CORE', icon: '🔥', color: '#ff8a3d',
    desc: 'Dash leaves a burning wake that scorches enemies.',
    apply: (p) => { p.stats.fireWake = (p.stats.fireWake || 0) + 1; }
  });

  VR.data.relics = R;
  VR.data.relicById = {};
  for (const r of R) VR.data.relicById[r.id] = r;

  /** Roll a random relic not already held. Returns def or null if all held. */
  VR.data.rollRelic = function (player) {
    const held = new Set(player.relics.map((r) => r.id));
    const pool = R.filter((r) => !held.has(r.id));
    if (!pool.length) return null;
    return VR.choose(pool);
  };
})();
