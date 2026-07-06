// Random mid-wave events — fire periodically during a live wave to shake things
// up. Each has a duration; `mods` are temporary multipliers the engine applies,
// `instant` runs once. Good/bad mix keeps every run a story.
export const EVENTS = [
  { id: 'sandstorm', name: 'Sandstorm', icon: '🌪️', color: '#d97706', dur: 9, bad: true,
    desc: 'Tower range −25%', mods: { towerRange: 0.75 } },
  { id: 'overclock', name: 'Overclock', icon: '⚙️', color: '#22d3ee', dur: 9, bad: false,
    desc: 'Towers +35% fire rate', mods: { towerFire: 1.35 } },
  { id: 'fog', name: 'Fog of War', icon: '🌫️', color: '#94a3b8', dur: 8, bad: true,
    desc: 'Tower range −20%, enemies +10% speed', mods: { towerRange: 0.8, enemySpeed: 1.1 } },
  { id: 'adrenaline', name: 'Adrenaline', icon: '💉', color: '#22c55e', dur: 9, bad: false,
    desc: 'Towers +25% damage', mods: { towerDmg: 1.25 } },
  { id: 'frenzy', name: 'Enemy Frenzy', icon: '😡', color: '#ef4444', dur: 8, bad: true,
    desc: 'Enemies +30% speed', mods: { enemySpeed: 1.3 } },
  { id: 'goldrush', name: 'Gold Rush', icon: '💰', color: '#facc15', dur: 10, bad: false,
    desc: '+80% gold per kill', mods: { reward: 1.8 } },
  { id: 'cargo', name: 'Cargo Drop', icon: '📦', color: '#fbbf24', instant: true, bad: false,
    desc: 'Instant +250 gold', instantMoney: 250 },
  { id: 'reinforcements', name: 'Reinforcements', icon: '🚁', color: '#f43f5e', instant: true, bad: true,
    desc: 'A sudden extra swarm!', spawnBurst: { count: 10 } },
]

export function rollEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)]
}
