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
export const ULTIMATE_SLOTS = 3

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
  singularity: {
    name: 'Nyx', rarity: 'ultimate', sprite: 'hero_void', color: '#7c3aed', size: 1.6,
    // Fires collapsing black holes that SUCK enemies in and crush them.
    attack: { mode: 'blackhole', dtype: 'energy', range: 3.6 * TILE, damage: 0, fireRate: 0.5, well: { life: 2.4, radius: 78, dps: 75, pull: 150 } },
    passive: { radius: 0, damageMult: 1.12, fireMult: 1.08 },
    skill: { name: 'Event Horizon', cooldown: 55, desc: 'A giant singularity pulls & crushes ALL enemies for 4s.', effect: { type: 'blackhole_all', dps: 130, dur: 4 } },
  },
  prisma: {
    name: 'Prisma', rarity: 'ultimate', sprite: 'hero_prism', color: '#22d3ee', size: 1.6,
    // A constantly ROTATING death-ray that shreds anything it sweeps across.
    attack: { mode: 'sweep', dtype: 'energy', range: 3.2 * TILE, damage: 110, fireRate: 1, rot: 2.6, width: 15 },
    passive: { radius: 0, fireMult: 1.15 },
    skill: { name: 'Supernova', cooldown: 48, desc: '700 damage to ALL + blinding flash.', effect: { type: 'orbital', amount: 700, dur: 1.5 } },
  },
  warden: {
    name: 'Kael', rarity: 'ultimate', sprite: 'hero_chakram', color: '#f59e0b', size: 1.6,
    // Hurls a spinning blade that flies out and RETURNS, cutting twice.
    attack: { mode: 'boomerang', dtype: 'kinetic', range: 4 * TILE, damage: 85, fireRate: 0.9, projSpeed: 520 },
    passive: { radius: 0, damageMult: 1.15 },
    skill: { name: 'Blade Cyclone', cooldown: 38, desc: '450 kinetic damage to ALL enemies.', effect: { type: 'damage_all', amount: 450, dtype: 'kinetic' } },
  },
  reaper: {
    name: 'Mortis', rarity: 'ultimate', sprite: 'hero_reaper', color: '#16a34a', size: 1.6,
    // Toxic scythe that also REAPS a % of the target's max HP — melts bosses.
    attack: { mode: 'projectile', dtype: 'toxic', range: 3.4 * TILE, damage: 55, fireRate: 1.6, projSpeed: 520, execute: 0.08 },
    passive: { radius: 0, damageMult: 1.1 },
    skill: { name: 'Harvest', cooldown: 45, desc: 'Reap 15% of every enemy’s max HP at once.', effect: { type: 'reap_all', pct: 0.15 } },
  },
  hive: {
    name: 'Vespa', rarity: 'ultimate', sprite: 'hero_hive', color: '#eab308', size: 1.6,
    // Looses a SWARM of 7 homing fire-drones every volley.
    attack: { mode: 'projectile', dtype: 'fire', range: 3.4 * TILE, damage: 26, fireRate: 1.5, projSpeed: 520, multishot: 7, dot: { dps: 12, dur: 2.5 }, splash: 20 },
    passive: { radius: 0, damageMult: 1.08, fireMult: 1.08 },
    skill: { name: 'Nanoplague', cooldown: 40, desc: 'Infect ALL enemies: 40 dps for 6s + slow.', effect: { type: 'plague_all', dps: 40, dur: 6, factor: 0.4 } },
  },
  tecton: {
    name: 'Tecton', rarity: 'ultimate', sprite: 'hero_tecton', color: '#a16207', size: 1.6,
    attack: { mode: 'projectile', dtype: 'explosive', range: 3.2 * TILE, damage: 72, fireRate: 1.1, projSpeed: 420, splash: 62, groundOnly: true },
    passive: { radius: 0, damageMult: 1.12 },
    skill: { name: 'Earthquake', cooldown: 46, desc: 'Quake: 500 dmg to all GROUND enemies + stun 2s.', effect: { type: 'quake_all', amount: 500, dur: 2 } },
  },
  maelstrom: {
    name: 'Maelstrom', rarity: 'ultimate', sprite: 'hero_wave', color: '#0ea5e9', size: 1.6,
    attack: { mode: 'projectile', dtype: 'frost', range: 3.2 * TILE, damage: 34, fireRate: 1.6, projSpeed: 520, slow: { factor: 0.45, dur: 1.6 } },
    passive: { radius: 0, fireMult: 1.12 },
    skill: { name: 'Tsunami', cooldown: 44, desc: 'A tidal wave hurls ALL enemies back + 400 dmg + chill.', effect: { type: 'tsunami', amount: 400 } },
  },
  fulgor: {
    name: 'Fulgor', rarity: 'ultimate', sprite: 'hero_storm2', color: '#38bdf8', size: 1.6,
    attack: { mode: 'hitscan', dtype: 'energy', range: 3.2 * TILE, damage: 40, fireRate: 1.8, chain: { jumps: 5, range: 120 } },
    passive: { radius: 0, damageMult: 1.1, fireMult: 1.08 },
    skill: { name: 'Thunderstorm', cooldown: 40, desc: 'Lightning strikes rain down for 4s (90/strike).', effect: { type: 'storm', dmg: 90, dur: 4 } },
  },
  ignis: {
    name: 'Ignis', rarity: 'ultimate', sprite: 'hero_volcano', color: '#ef4444', size: 1.6,
    attack: { mode: 'projectile', dtype: 'fire', range: 3 * TILE, damage: 44, fireRate: 1.5, projSpeed: 470, splash: 52, dot: { dps: 20, dur: 3 } },
    passive: { radius: 0, damageMult: 1.12 },
    skill: { name: 'Meteor Rain', cooldown: 42, desc: 'Meteors bombard the field for 4s (120 blast).', effect: { type: 'meteor', dmg: 120, radius: 62, dur: 4 } },
  },
  aegis: {
    name: 'Aegis', rarity: 'ultimate', sprite: 'hero_aegis', color: '#22d3ee', size: 1.6,
    attack: { mode: 'projectile', dtype: 'kinetic', range: 3.2 * TILE, damage: 62, fireRate: 1.6, projSpeed: 600 },
    passive: { radius: 0, fireMult: 1.1 },
    skill: { name: 'Bastion', cooldown: 50, desc: 'Base INVULNERABLE 6s + towers +50% dmg + heal 8 HP.', effect: { type: 'bastion', dur: 6, heal: 8 } },
  },
  necron: {
    name: 'Necron', rarity: 'ultimate', sprite: 'hero_necron', color: '#4d7c0f', size: 1.6,
    attack: { mode: 'projectile', dtype: 'toxic', range: 3 * TILE, damage: 30, fireRate: 1.5, projSpeed: 480, dot: { dps: 22, dur: 3 } },
    passive: { radius: 0, damageMult: 1.1 },
    skill: { name: 'Pandemic', cooldown: 40, desc: 'A contagion infects ALL — it spreads on death (35 dps/6s).', effect: { type: 'pandemic', dps: 35, dur: 6 } },
  },
  gaia: {
    name: 'Gaia', rarity: 'ultimate', sprite: 'hero_gaia', color: '#16a34a', size: 1.6,
    attack: { mode: 'projectile', dtype: 'frost', range: 3 * TILE, damage: 36, fireRate: 1.7, projSpeed: 500, slow: { factor: 0.4, dur: 1.4 } },
    passive: { radius: 0, damageMult: 1.1, fireMult: 1.05 },
    skill: { name: 'Entangle', cooldown: 42, desc: 'Roots snare ALL enemies for 3s + 30 dps.', effect: { type: 'entangle', dur: 3, dps: 30 } },
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

const ALL_HEROES = Object.entries(HEROES).map(([key, h]) => ({ key, ...h }))

// Regular heroes (Normal→Mythic) — separate from Ultimates.
export const HERO_LIST = ALL_HEROES
  .filter((h) => h.rarity !== 'ultimate')
  .sort((a, b) => RARITY[a.rarity].order - RARITY[b.rarity].order)

// Ultimates get their own tab & slot pool.
export const ULTIMATE_LIST = ALL_HEROES.filter((h) => h.rarity === 'ultimate')

export const isUltimate = (key) => HEROES[key] && HEROES[key].rarity === 'ultimate'
