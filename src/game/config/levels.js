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
  { from: 14, keys: ['sapper'] },
  { from: 16, keys: ['lighttank'] },
  { from: 18, keys: ['brute'] },
  { from: 22, keys: ['berserker', 'regen'] },
  { from: 26, keys: ['wraith'] },
  { from: 30, keys: ['heli'] },
  { from: 40, keys: ['heavytank'] },
]

function availableEnemies(n) {
  const keys = []
  for (const u of UNLOCKS) if (n >= u.from) keys.push(...u.keys)
  return keys
}

export function getLevelConfig(n) {
  n = clamp(Math.round(n), 1, MAX_LEVEL)
  const rand = makeRng(Math.imul(n, 2654435761) ^ 0x9e3779b9)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]

  const map = MAPS[(n - 1) % MAPS.length]
  const zone = Math.floor((n - 1) / 25)
  const theme = THEMES[zone % THEMES.length]
  const chapter = Math.floor((n - 1) / CHAPTER_SIZE) + 1

  const hpMult = 1 + (n - 1) * 0.04
  const spdMult = 1 + Math.min(0.7, (n - 1) * 0.0035)
  const rewardMult = 1 + (n - 1) * 0.015

  const pool = availableEnemies(n)
  const waveCount = clamp(4 + Math.floor(n / 6), 4, 12)

  const waves = []
  for (let i = 0; i < waveCount; i++) {
    const groupCount = 1 + (rand() < 0.55 ? 1 : 0) + (n > 12 && rand() < 0.4 ? 1 : 0)
    const groups = []
    for (let g = 0; g < groupCount; g++) {
      const type = pick(pool)
      const def = ENEMIES[type]
      const fast = def.speed > 100
      const tanky = def.hp > 300
      let count = Math.round((6 + i * 1.4) * (fast ? 1.3 : 1) / (tanky ? 3 : 1))
      count = clamp(count, 3, 40)
      const interval = clamp((1.0 - i * 0.045) * (fast ? 0.7 : 1), 0.28, 1.1)
      groups.push({ type, count, interval, delay: +(g * (1 + rand() * 3)).toFixed(2) })
    }
    // Random champion (enemy hero): a single elite reinforcement.
    if (n >= 8 && rand() < 0.4) {
      groups.push({ type: pick(pool), count: 1, interval: 1, delay: +(2 + rand() * 4).toFixed(2), champion: true })
    }
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
      { type: pick(pool), count: clamp(6 + Math.floor(n / 20), 6, 30), interval: 0.5, delay: 3 },
    ])
  }

  const startMoney = clamp(220 + Math.floor(n / 4) * 8, 220, 700)
  const baseHp = 20 + Math.floor(n / 40) * 5

  return {
    n, chapter, zone, map, theme,
    hpMult, spdMult, rewardMult,
    startMoney, baseHp, waves, isBoss,
    totalWaves: waves.length,
  }
}
