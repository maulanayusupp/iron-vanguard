import { TILE } from './maps.js'

// ---------------------------------------------------------------------------
// Tower (weapon) catalogue.
//   dtype     : damage type (see config/damage.js) — drives strong/weak matchups
//   strongVs  : short hint shown in the UI
//   mode      : 'projectile' fires a homing shot | 'hitscan' hits instantly
//   splash / slow / dot / chain / ramp / groundOnly / minRange — effects
// ---------------------------------------------------------------------------

export const MAX_LEVEL = 4
export const TOWER_BASE_HP = 120
export const TOWER_HP_PER_LEVEL = 60
export const damageAtLevel = (base, lvl) => base * (1 + 0.45 * (lvl - 1))
export const rangeAtLevel = (base, lvl) => base * (1 + 0.12 * (lvl - 1))
export const fireRateAtLevel = (base, lvl) => base * (1 + 0.15 * (lvl - 1))

export const TOWERS = {
  machinegun: {
    name: 'Machine Gun', cost: 50, mode: 'projectile', dtype: 'kinetic', strongVs: 'light infantry & swarms',
    range: 2.6 * TILE, damage: 9, fireRate: 4.2, projSpeed: 620, color: '#5eead4', sprite: 'machinegun',
    desc: 'Cheap, very fast-firing. Hits ground & air.',
  },
  cannon: {
    name: 'Cannon', cost: 120, mode: 'projectile', dtype: 'explosive', strongVs: 'armor & clustered foes',
    range: 2.8 * TILE, damage: 40, fireRate: 0.95, projSpeed: 420, splash: 48, color: '#fbbf24', sprite: 'cannon',
    desc: 'Heavy splash. Ignores armor.',
  },
  cryo: {
    name: 'Cryo Tower', cost: 95, mode: 'projectile', dtype: 'frost', strongVs: 'fast enemies (slows them)',
    range: 2.4 * TILE, damage: 6, fireRate: 1.8, projSpeed: 480, slow: { factor: 0.5, dur: 1.6 },
    color: '#60a5fa', sprite: 'cryo', desc: 'Chills enemies, slowing them down.',
  },
  sniper: {
    name: 'Sniper Nest', cost: 160, mode: 'hitscan', dtype: 'kinetic', strongVs: 'single tough targets',
    range: 5.2 * TILE, damage: 75, fireRate: 0.6, color: '#f472b6', sprite: 'sniper',
    desc: 'Extreme range, big single-target hit.',
  },
  rocket: {
    name: 'Rocket Pod', cost: 180, mode: 'projectile', dtype: 'explosive', strongVs: 'armor & aircraft',
    range: 3.0 * TILE, damage: 34, fireRate: 1.1, projSpeed: 340, splash: 58, color: '#fb7185', sprite: 'rocket',
    desc: 'Splash + strong vs air. Great against flyers.',
  },
  flamethrower: {
    name: 'Flamethrower', cost: 110, mode: 'hitscan', dtype: 'fire', strongVs: 'monsters & flesh',
    range: 1.9 * TILE, damage: 7, fireRate: 6, dot: { dps: 14, dur: 2.5 }, splash: 34, groundOnly: true,
    color: '#f97316', sprite: 'flamethrower', desc: 'Short range, sets flesh ablaze.',
  },
  tesla: {
    name: 'Tesla Coil', cost: 200, mode: 'hitscan', dtype: 'energy', strongVs: 'machines, air & spirits',
    range: 2.6 * TILE, damage: 22, fireRate: 1.6, chain: { jumps: 4, range: 96 }, color: '#a78bfa', sprite: 'tesla',
    desc: 'Lightning arcs between multiple enemies.',
  },
  mortar: {
    name: 'Mortar', cost: 150, mode: 'projectile', dtype: 'explosive', strongVs: 'armored clusters',
    range: 5.8 * TILE, minRange: 2.2 * TILE, damage: 55, fireRate: 0.5, projSpeed: 300, splash: 78, groundOnly: true,
    color: '#facc15', sprite: 'mortar', desc: 'Lobs shells at long range. Blind up close.',
  },
  poison: {
    name: 'Toxin Sprayer', cost: 130, mode: 'projectile', dtype: 'toxic', strongVs: 'regenerators & bosses',
    range: 2.7 * TILE, damage: 8, fireRate: 1.4, projSpeed: 400, dot: { dps: 20, dur: 4 }, color: '#84cc16',
    sprite: 'poison', desc: 'Weak hit, brutal damage-over-time.',
  },
  laser: {
    name: 'Laser Array', cost: 240, mode: 'hitscan', dtype: 'energy', strongVs: 'machines & aircraft',
    range: 3.2 * TILE, damage: 10, fireRate: 8, ramp: 2.6, color: '#ef4444', sprite: 'laser',
    desc: 'Continuous beam that ramps up on a locked target.',
  },

  // ---- advanced towers ----
  railgun: {
    name: 'Railgun', cost: 230, mode: 'hitscan', dtype: 'energy', strongVs: 'lines of enemies (pierces)',
    range: 5 * TILE, damage: 95, fireRate: 0.75, pierce: true, pierceW: 22, color: '#38bdf8', sprite: 'railgun',
    desc: 'Piercing beam hits EVERY enemy in a line.',
  },
  plasma: {
    name: 'Plasma Cannon', cost: 220, mode: 'projectile', dtype: 'energy', strongVs: 'tough clusters',
    range: 2.9 * TILE, damage: 60, fireRate: 1.35, projSpeed: 470, splash: 46, color: '#c084fc', sprite: 'plasma',
    desc: 'Searing energy bolts with a heavy splash.',
  },
  glacier: {
    name: 'Glacier', cost: 175, mode: 'pulse', dtype: 'frost', strongVs: 'swarms (AoE slow)',
    range: 2.3 * TILE, damage: 16, fireRate: 1.2, slow: { factor: 0.55, dur: 1.8 }, color: '#7dd3fc', sprite: 'glacier',
    desc: 'Pulses freezing waves around itself — no aiming.',
  },
  sentry: {
    name: 'Multi Sentry', cost: 200, mode: 'projectile', dtype: 'kinetic', strongVs: 'many targets at once',
    range: 2.7 * TILE, damage: 16, fireRate: 2.6, projSpeed: 620, multishot: 3, color: '#fbbf24', sprite: 'sentry',
    desc: 'Fires at up to 3 different enemies per volley.',
  },
  obelisk: {
    name: 'Command Obelisk', cost: 210, mode: 'support', dtype: 'energy', strongVs: 'buffs nearby towers',
    range: 2.6 * TILE, buff: { damageMult: 1.3, fireMult: 1.15 }, color: '#f472b6', sprite: 'obelisk',
    desc: 'No attack — boosts nearby towers +30% dmg, +15% rate.',
  },
  bank: {
    name: 'Gold Bank', cost: 160, mode: 'income', income: 24, incomeInterval: 4, color: '#facc15', sprite: 'bank',
    strongVs: 'your economy', desc: 'No attack — mints gold over time.',
  },
}
