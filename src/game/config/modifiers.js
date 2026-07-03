// Roguelite "draft" modifiers — before each level the player picks 1 of 3.
// Each has a clear upside AND downside. Multiplier fields the engine reads:
//   hp, spd, reward   → applied to every spawned enemy
//   towerCost, towerDmg, towerFire → applied to your towers
//   money  → flat bonus starting gold
//   baseHp → flat base-HP change   baseHpMult → base-HP multiplier
export const MODIFIERS = [
  { id: 'blitz', name: 'Blitzkrieg', icon: '⚡', desc: 'Enemies +25% speed, but +40% gold per kill.', spd: 1.25, reward: 1.4 },
  { id: 'fortified', name: 'Fortified', icon: '🛡️', desc: '+15 base HP, but enemies +20% HP.', baseHp: 15, hp: 1.2 },
  { id: 'warchest', name: 'War Chest', icon: '💰', desc: '+260 starting gold, enemies +15% HP.', money: 260, hp: 1.15 },
  { id: 'surplus', name: 'Surplus', icon: '🏷️', desc: 'Towers −25% cost, but −6 base HP.', towerCost: 0.75, baseHp: -6 },
  { id: 'glass', name: 'Glass Cannon', icon: '💥', desc: 'Towers +40% damage, base HP halved.', towerDmg: 1.4, baseHpMult: 0.5 },
  { id: 'overcharge', name: 'Overcharge', icon: '🔧', desc: 'Towers +25% fire rate, enemies +10% HP.', towerFire: 1.25, hp: 1.1 },
  { id: 'bounty', name: 'Bounty Hunt', icon: '🎯', desc: '+60% gold per kill, enemies +20% HP.', reward: 1.6, hp: 1.2 },
  { id: 'juggernauts', name: 'Juggernauts', icon: '🦣', desc: 'Enemies +40% HP, but +55% gold.', hp: 1.4, reward: 1.55 },
]

// Pick `n` distinct modifiers at random.
export function draftModifiers(n = 3) {
  const pool = MODIFIERS.slice()
  const out = []
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  return out
}
