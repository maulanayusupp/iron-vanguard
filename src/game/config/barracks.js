// Permanent meta-upgrades bought with coins earned every run (win OR lose).
// `perLevel` is the effect gained per level; the engine reads the resolved
// totals from barracksService.effects().
export const UPGRADES = [
  { id: 'towerDmg', name: 'Weapons R&D', icon: '⚔️', max: 10, cost: (l) => 60 + l * 55,
    desc: (l) => `All towers +${l * 4}% damage`, perLevel: 0.04, apply: 'towerDmg' },
  { id: 'towerFire', name: 'Autoloaders', icon: '⚙️', max: 8, cost: (l) => 70 + l * 60,
    desc: (l) => `All towers +${l * 3}% fire rate`, perLevel: 0.03, apply: 'towerFire' },
  { id: 'startGold', name: 'War Funds', icon: '💰', max: 10, cost: (l) => 50 + l * 45,
    desc: (l) => `Start each level with +${l * 40} gold`, perLevel: 40, apply: 'startGold' },
  { id: 'baseHp', name: 'Fortifications', icon: '🛡️', max: 10, cost: (l) => 60 + l * 50,
    desc: (l) => `Base +${l * 3} HP`, perLevel: 3, apply: 'baseHp' },
  { id: 'sell', name: 'Salvage Crew', icon: '♻️', max: 4, cost: (l) => 80 + l * 70,
    desc: (l) => `Sell refund +${l * 5}% (base 60%)`, perLevel: 0.05, apply: 'sell' },
  { id: 'cooldown', name: 'Command Uplink', icon: '📡', max: 6, cost: (l) => 90 + l * 80,
    desc: (l) => `Hero skill cooldown −${l * 4}%`, perLevel: 0.04, apply: 'cooldown' },
  { id: 'income', name: 'Bounty Network', icon: '🎯', max: 8, cost: (l) => 70 + l * 65,
    desc: (l) => `+${l * 4}% gold per kill`, perLevel: 0.04, apply: 'income' },
  { id: 'heroSlot', name: 'Command Tent', icon: '🎖️', max: 1, cost: () => 500,
    desc: () => 'Unlock a 4th hero slot', perLevel: 1, apply: 'heroSlot' },
]

// Coins awarded for a finished run.
export function runCoins(state) {
  const base = 8 + (state.kills || 0) * 0.5 + (state.wave || 0) * 6
  const win = state.status === 'won' ? 40 : 0
  return Math.round(base + win)
}
