import { MAPS, THEMES } from './maps.js'

// Handcrafted puzzles: fixed budget, limited towers, no income — solve it exactly.
// (rewardMult 0 = kills give no gold; the engine also skips wave bonuses.)
export const PUZZLES = [
  {
    id: 0, name: 'First Stand', map: 0, theme: 3, startMoney: 200, baseHp: 8,
    allowed: ['machinegun', 'cannon'],
    waves: [
      [{ type: 'infantry', count: 8, interval: 0.8 }],
      [{ type: 'heavy', count: 6, interval: 0.9 }, { type: 'infantry', count: 8, interval: 0.6, delay: 3 }],
    ],
  },
  {
    id: 1, name: 'Armor Column', map: 2, theme: 4, startMoney: 340, baseHp: 8,
    allowed: ['cannon', 'rocket', 'cryo'], // explosive beats armor — kinetic is resisted
    waves: [
      [{ type: 'lighttank', count: 5, interval: 1.2 }],
      [{ type: 'apc', count: 4, interval: 1.4 }, { type: 'heavy', count: 8, interval: 0.6, delay: 3 }],
      [{ type: 'heavytank', count: 3, interval: 1.8 }],
    ],
  },
  {
    id: 2, name: 'Sky & Swarm', map: 4, theme: 6, startMoney: 420, baseHp: 10,
    allowed: ['rocket', 'tesla', 'machinegun'], // energy/explosive for flyers
    waves: [
      [{ type: 'drone', count: 12, interval: 0.4 }],
      [{ type: 'wasp', count: 14, interval: 0.35 }, { type: 'scout', count: 12, interval: 0.4, delay: 3 }],
      [{ type: 'heli', count: 3, interval: 1.6 }, { type: 'drone', count: 12, interval: 0.4, delay: 2 }],
    ],
  },
]

export function getPuzzleConfig(id) {
  const p = PUZZLES[id] || PUZZLES[0]
  return {
    n: 'P' + (p.id + 1), mode: 'puzzle', puzzleId: p.id, chapter: 0, zone: 0,
    map: MAPS[p.map], theme: THEMES[p.theme],
    hpMult: 1, spdMult: 1, rewardMult: 0, startMoney: p.startMoney, baseHp: p.baseHp,
    allowed: p.allowed, waves: p.waves, isBoss: false, totalWaves: p.waves.length,
  }
}
