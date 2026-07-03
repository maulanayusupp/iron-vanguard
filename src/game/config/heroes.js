import { TILE } from './maps.js'

// ---------------------------------------------------------------------------
// Heroes. Deploy up to HERO_SLOTS on the map. Each hero:
//   • has its own basic ATTACK (like a tower, but stronger — see `attack`)
//   • gives a PASSIVE aura to nearby (or all) towers
//   • has one ACTIVE skill on a cooldown
//
// attack:  { mode:'projectile'|'hitscan', range, damage, fireRate,
//            projSpeed?, splash?, slow?, dot?, chain? }  — hits ground & air.
// passive: { radius (0 = global), damageMult, fireMult, rangeMult }
// skill:   { name, cooldown, desc, effect }  (effect types handled in Game)
// ---------------------------------------------------------------------------

export const HERO_SLOTS = 3

export const RARITY = {
  ultimate: { label: 'Ultimate', color: '#fde047', order: -1 },
  normal: { label: 'Normal', color: '#94a3b8', order: 0 },
  epic: { label: 'Epic', color: '#a855f7', order: 1 },
  legend: { label: 'Legend', color: '#f59e0b', order: 2 },
  mythic: { label: 'Mythic', color: '#ef4444', order: 3 },
}

export const HEROES = {
  // ---- Ultimate (boss-sized commander) ----
  overlord: {
    name: 'Overlord', rarity: 'ultimate', sprite: 'hero_mech', color: '#fbbf24', size: 1.6,
    attack: { mode: 'projectile', dtype: 'explosive', range: 3.6 * TILE, damage: 120, fireRate: 1.4, projSpeed: 470, splash: 72 },
    passive: { radius: 0, damageMult: 1.2, fireMult: 1.1 }, // global aura
    skill: { name: 'Cataclysm', cooldown: 50, desc: '900 damage to ALL enemies + freeze 2.5s.', effect: { type: 'orbital', amount: 900, dur: 2.5 } },
  },

  // ---- Normal ----
  rifleman: {
    name: 'Rifleman', rarity: 'normal', sprite: 'hero_rifle', color: '#84cc16',
    attack: { mode: 'projectile', dtype: 'kinetic', range: 2.7 * TILE, damage: 16, fireRate: 2.8, projSpeed: 640 },
    passive: { radius: 2.4 * TILE, damageMult: 1.1 },
    skill: { name: 'Focus Fire', cooldown: 18, desc: '+45% tower damage for 5s.', effect: { type: 'buff_towers', damageMult: 1.45, fireMult: 1, dur: 5 } },
  },
  grenadier: {
    name: 'Grenadier', rarity: 'normal', sprite: 'hero_grenade', color: '#f59e0b',
    attack: { mode: 'projectile', dtype: 'explosive', range: 2.6 * TILE, damage: 24, fireRate: 1.2, projSpeed: 430, splash: 46 },
    passive: { radius: 2.2 * TILE, fireMult: 1.08 },
    skill: { name: 'Frag Grenade', cooldown: 12, desc: 'Blast 140 damage around the hero.', effect: { type: 'aoe_damage', amount: 140, radius: 2.2 * TILE } },
  },
  // ---- Epic ----
  sharpshooter: {
    name: 'Sharpshooter', rarity: 'epic', sprite: 'hero_rifle', color: '#22d3ee',
    attack: { mode: 'hitscan', dtype: 'kinetic', range: 3.6 * TILE, damage: 62, fireRate: 1.1 },
    passive: { radius: 3 * TILE, rangeMult: 1.15, damageMult: 1.08 },
    skill: { name: 'Headshot', cooldown: 16, desc: 'Deal 500 damage to the leading enemy.', effect: { type: 'kill_strong', amount: 500 } },
  },
  engineer: {
    name: 'Engineer', rarity: 'epic', sprite: 'hero_engineer', color: '#38bdf8',
    attack: { mode: 'projectile', dtype: 'kinetic', range: 2.8 * TILE, damage: 26, fireRate: 2.4, projSpeed: 560 },
    passive: { radius: 3 * TILE, fireMult: 1.2 },
    skill: { name: 'Field Repair', cooldown: 26, desc: 'Restore 6 base HP.', effect: { type: 'heal_base', amount: 6 } },
  },
  pyromancer: {
    name: 'Pyromancer', rarity: 'epic', sprite: 'hero_mage', color: '#f97316',
    attack: { mode: 'projectile', dtype: 'fire', range: 2.5 * TILE, damage: 14, fireRate: 2.0, projSpeed: 470, dot: { dps: 22, dur: 3 } },
    passive: { radius: 2.6 * TILE, damageMult: 1.12 },
    skill: { name: 'Napalm', cooldown: 20, desc: 'Ignite all enemies: 30 dps for 6s.', effect: { type: 'dot_all', dps: 30, dur: 6 } },
  },
  // ---- Legend ----
  frostqueen: {
    name: 'Frost Queen', rarity: 'legend', sprite: 'hero_mage', color: '#60a5fa',
    attack: { mode: 'projectile', dtype: 'frost', range: 3 * TILE, damage: 22, fireRate: 1.9, projSpeed: 500, slow: { factor: 0.4, dur: 1.4 } },
    passive: { radius: 3 * TILE, damageMult: 1.15, fireMult: 1.1 },
    skill: { name: 'Absolute Zero', cooldown: 30, desc: 'Freeze every enemy for 2.5s.', effect: { type: 'freeze_all', dur: 2.5 } },
  },
  warlord: {
    name: 'Warlord', rarity: 'legend', sprite: 'hero_engineer', color: '#f59e0b',
    attack: { mode: 'projectile', dtype: 'explosive', range: 3 * TILE, damage: 54, fireRate: 1.4, projSpeed: 470, splash: 52 },
    passive: { radius: 3.4 * TILE, damageMult: 1.22, fireMult: 1.12 },
    skill: { name: 'Rally', cooldown: 34, desc: '+60% damage & +40% fire rate for 6s.', effect: { type: 'buff_towers', damageMult: 1.6, fireMult: 1.4, dur: 6 } },
  },
  bombardier: {
    name: 'Bombardier', rarity: 'legend', sprite: 'hero_grenade', color: '#f97316',
    attack: { mode: 'projectile', dtype: 'explosive', range: 3 * TILE, damage: 44, fireRate: 1.3, projSpeed: 440, splash: 56 },
    passive: { radius: 3 * TILE, damageMult: 1.15 },
    skill: { name: 'Carpet Bomb', cooldown: 28, desc: 'Rain explosions across the leading enemies.', effect: { type: 'carpet_bomb', amount: 260, count: 6, radius: 72 } },
  },
  stormcaller: {
    name: 'Stormcaller', rarity: 'legend', sprite: 'hero_mage', color: '#a78bfa',
    attack: { mode: 'hitscan', dtype: 'energy', range: 3 * TILE, damage: 36, fireRate: 1.6, chain: { jumps: 4, range: 110 } },
    passive: { radius: 3 * TILE, fireMult: 1.18 },
    skill: { name: 'Thunderstorm', cooldown: 26, desc: 'Chain 220 damage across many enemies.', effect: { type: 'chain_all', amount: 220, jumps: 10 } },
  },
  // ---- Mythic ----
  titanhero: {
    name: 'Titan', rarity: 'mythic', sprite: 'hero_mech', color: '#ef4444',
    attack: { mode: 'projectile', dtype: 'explosive', range: 3.4 * TILE, damage: 92, fireRate: 1.3, projSpeed: 430, splash: 64 },
    passive: { radius: 0, damageMult: 1.15 },
    skill: { name: 'Orbital Strike', cooldown: 42, desc: '600 damage to all + freeze 2s.', effect: { type: 'orbital', amount: 600, dur: 2 } },
  },
  chronos: {
    name: 'Chronos', rarity: 'mythic', sprite: 'hero_mage', color: '#c084fc',
    attack: { mode: 'hitscan', dtype: 'energy', range: 3.4 * TILE, damage: 72, fireRate: 2.0 },
    passive: { radius: 0, fireMult: 1.12 },
    skill: { name: 'Time Warp', cooldown: 38, desc: 'Slow every enemy 75% for 5s.', effect: { type: 'slow_all', factor: 0.75, dur: 5 } },
  },
  phoenix: {
    name: 'Phoenix', rarity: 'mythic', sprite: 'hero_mech', color: '#fb923c',
    attack: { mode: 'projectile', dtype: 'fire', range: 3 * TILE, damage: 42, fireRate: 1.9, projSpeed: 490, splash: 48, dot: { dps: 30, dur: 3 } },
    passive: { radius: 0, damageMult: 1.1, fireMult: 1.08 },
    skill: { name: 'Rebirth', cooldown: 55, desc: 'Heal 10 base HP + burn all (45 dps/6s).', effect: { type: 'rebirth', heal: 10, dps: 45, dur: 6 } },
  },
}

export const HERO_LIST = Object.entries(HEROES)
  .map(([key, h]) => ({ key, ...h }))
  .sort((a, b) => RARITY[a.rarity].order - RARITY[b.rarity].order)
