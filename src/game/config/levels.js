import { MAPS, THEMES } from './maps.js'
import { ENEMIES } from './enemies.js'
import { clamp, makeRng } from '../../helpers/math.js'

// ---------------------------------------------------------------------------
// Procedural level system. Levels 1..MAX_LEVEL are generated deterministically
// from the level number (seeded RNG) so a given level is always identical.
// Difficulty, enemy variety and wave count scale with the level. Boss every
// 10th level; commander every 50th; titan every 100th. Raise MAX_LEVEL freely.
// ---------------------------------------------------------------------------

export const MAX_LEVEL = 2000
export const CHAPTER_SIZE = 100
export const chapterCount = Math.ceil(MAX_LEVEL / CHAPTER_SIZE)

// Which enemy types are available at a given level.
const UNLOCKS = [
  { from: 1, keys: ['infantry', 'scout'] },
  { from: 2, keys: ['spider'] },
  { from: 3, keys: ['heavy'] },
  { from: 4, keys: ['hound'] },
  { from: 5, keys: ['jeep', 'shield'] },
  { from: 6, keys: ['wasp'] },
  { from: 8, keys: ['medic'] },
  { from: 9, keys: ['slime'] },
  { from: 12, keys: ['drone', 'apc'] },
  { from: 7, keys: ['bomber', 'raptor'] },
  { from: 10, keys: ['imp'] },
  { from: 35, keys: ['goliath'] },
  { from: 14, keys: ['sapper'] },
  { from: 16, keys: ['lighttank'] },
  { from: 18, keys: ['brute'] },
  { from: 20, keys: ['artillery'] },
  { from: 22, keys: ['berserker', 'regen'] },
  { from: 24, keys: ['summoner'] },
  { from: 26, keys: ['wraith'] },
  { from: 9, keys: ['charger'] },
  { from: 28, keys: ['necromancer'] },
  { from: 30, keys: ['heli'] },
  { from: 32, keys: ['wyvern'] },
  { from: 34, keys: ['golem'] },
  { from: 38, keys: ['hydra'] },
  { from: 40, keys: ['heavytank'] },
  { from: 42, keys: ['juggernaut'] },
  { from: 46, keys: ['behemoth'] },
  { from: 55, keys: ['colossus'] },
]

function availableEnemies(n) {
  const keys = []
  for (const u of UNLOCKS) if (n >= u.from) keys.push(...u.keys)
  return keys
}

// The giant mini-boss that leads EVERY wave — bigger & tougher as levels rise.
function pickWaveBoss(n, rand) {
  const pool = n < 6 ? ['heavy', 'brute'] : n < 12 ? ['brute', 'juggernaut'] : n < 25 ? ['juggernaut', 'golem', 'goliath']
    : n < 45 ? ['behemoth', 'colossus', 'goliath', 'mech'] : ['colossus', 'goliath', 'mech', 'commander']
  return pool[Math.floor(rand() * pool.length)]
}

export function getLevelConfig(n) {
  n = clamp(Math.round(n), 1, MAX_LEVEL)
  const rand = makeRng(Math.imul(n, 2654435761) ^ 0x9e3779b9)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]

  const map = MAPS[(n - 1) % MAPS.length]
  const zone = Math.floor((n - 1) / 25)
  const theme = THEMES[zone % THEMES.length]
  const chapter = Math.floor((n - 1) / CHAPTER_SIZE) + 1

  // Steep curve: fair at level 1, brutal by level 8+ (≈5-10x by the 30s-40s).
  // Real strategy, upgrades, damage-type matching and hero skills are mandatory.
  const hpMult = 1 + (n - 1) * 0.12
  const spdMult = 1 + Math.min(0.85, (n - 1) * 0.0045)
  const rewardMult = 1.2 + (n - 1) * 0.022 // a bit more gold per kill

  const pool = availableEnemies(n)
  // More waves per level → longer, more enjoyable runs.
  const waveCount = clamp(6 + Math.floor(n / 4), 6, 18)

  const waves = []
  for (let i = 0; i < waveCount; i++) {
    // More groups per wave — hordes get thicker as the run goes on.
    const groupCount = 2 + (rand() < 0.6 ? 1 : 0) + (n > 10 && rand() < 0.5 ? 1 : 0) + (n > 30 && rand() < 0.4 ? 1 : 0)
    const groups = []
    for (let g = 0; g < groupCount; g++) {
      const type = pick(pool)
      const def = ENEMIES[type]
      const fast = def.speed > 100
      const tanky = def.hp > 500
      // Swarms ramp with BOTH the wave index and the level number: gentle at
      // first, brutal later. A couple of towers won't hold for long.
      const nScale = 1 + Math.min(1.7, (n - 1) * 0.028)
      // Ramps hard WITHIN the level: gentle first wave, overwhelming finale.
      // Faster stream in later waves means more enemies on screen at once.
      let count = Math.round((8 + i * 4.8) * nScale * (fast ? 1.4 : 1) / (tanky ? 2.6 : 1))
      count = clamp(count, 7, 240)
      const interval = clamp((0.78 - i * 0.035) * (fast ? 0.6 : 1), 0.19, 0.78)
      groups.push({ type, count, interval, delay: +(g * (0.8 + rand() * 2.4)).toFixed(2) })
    }
    // Random champion(s) (enemy heroes): elite reinforcements.
    if (n >= 8 && rand() < 0.35) {
      const champs = n > 40 && rand() < 0.4 ? 2 : 1
      groups.push({ type: pick(pool), count: champs, interval: 2, delay: +(2 + rand() * 4).toFixed(2), champion: true })
    }
    // Every wave is led by a giant WAVE BOSS that grows stronger each wave and
    // rips your turrets apart.
    groups.push({ type: pickWaveBoss(n, rand), count: 1, interval: 1, delay: +(1.5 + i * 0.4 + rand() * 2).toFixed(2), waveBoss: true, tier: i })
    waves.push(groups)
  }

  // Boss wave.
  const isBoss = n % 10 === 0
  if (isBoss) {
    const bossType = n % 100 === 0 ? 'titan' : n % 50 === 0 ? 'commander' : 'mech'
    const count = n % 100 === 0 ? 1 : 1 + Math.floor(n / 300)
    waves.push([
      { type: bossType, count, interval: 2.2, delay: 0 },
      // escort
      { type: pick(pool), count: clamp(12 + Math.floor(n / 12), 12, 50), interval: 0.4, delay: 3 },
      { type: pick(pool), count: clamp(10 + Math.floor(n / 16), 10, 40), interval: 0.45, delay: 7 },
    ])
  }

  const startMoney = clamp(260 + Math.floor(n / 4) * 9, 260, 780)
  const baseHp = 26 + Math.floor(n / 25) * 6

  return {
    n, chapter, zone, map, theme,
    hpMult, spdMult, rewardMult,
    startMoney, baseHp, waves, isBoss,
    totalWaves: waves.length,
  }
}
