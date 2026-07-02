// ---------------------------------------------------------------------------
// Enemy roster — a mix of military hardware and monsters.
//   class : 'ground' | 'air' (air needs anti-air / energy towers)
//   armor : flat fraction of KINETIC damage negated (other types ignore it)
//   res   : damage-type multipliers, e.g. { fire: 1.6, kinetic: 0.6 }
//           (>1 = extra damage taken / weakness, <1 = resistant)
//   abilities:
//     regen, enrage{below,speedMult}, heal{radius,amount}, buff{radius,speedMult},
//     split{into,count}, siege{range,dps}  ← siege enemies ATTACK your towers.
// ---------------------------------------------------------------------------

export const ENEMIES = {
  // ---- infantry / flesh ----
  infantry: {
    name: 'Infantry', class: 'ground', hp: 46, speed: 70, reward: 10, damage: 1, radius: 12,
    armor: 0, res: { explosive: 1.3, fire: 1.3 }, sprite: 'soldier', color: '#7a8b4a', accent: '#3f4a24',
  },
  scout: {
    name: 'Scout', class: 'ground', hp: 30, speed: 145, reward: 10, damage: 1, radius: 10,
    armor: 0, res: { explosive: 1.4, fire: 1.3, frost: 1.2 }, sprite: 'soldier', color: '#a3b06a', accent: '#4a5528',
  },
  heavy: {
    name: 'Heavy Trooper', class: 'ground', hp: 120, speed: 58, reward: 16, damage: 2, radius: 14,
    armor: 0.2, res: { kinetic: 0.7, explosive: 1.4 }, sprite: 'soldier_heavy', color: '#6b7280', accent: '#374151',
  },
  shield: {
    name: 'Riot Shield', class: 'ground', hp: 100, speed: 54, reward: 18, damage: 2, radius: 14,
    armor: 0.45, res: { kinetic: 0.4, energy: 0.7, explosive: 1.5, fire: 1.3 }, sprite: 'shield', color: '#475569', accent: '#94a3b8',
  },
  medic: {
    name: 'Medic', class: 'ground', hp: 80, speed: 66, reward: 22, damage: 1, radius: 13,
    armor: 0, res: { fire: 1.4 }, sprite: 'medic', color: '#e5e7eb', accent: '#ef4444',
    abilities: { heal: { radius: 96, amount: 14 } },
  },
  berserker: {
    name: 'Berserker', class: 'ground', hp: 170, speed: 72, reward: 26, damage: 3, radius: 15,
    armor: 0.1, res: { fire: 1.3, frost: 1.3 }, sprite: 'soldier_heavy', color: '#b91c1c', accent: '#450a0a',
    abilities: { enrage: { below: 0.5, speedMult: 2.1 } },
  },
  regen: {
    name: 'Regenerator', class: 'ground', hp: 240, speed: 56, reward: 30, damage: 3, radius: 16,
    armor: 0.15, res: { toxic: 1.8, fire: 1.4 }, sprite: 'soldier_heavy', color: '#15803d', accent: '#052e16',
    abilities: { regen: 26 },
  },

  // ---- vehicles / machines ----
  jeep: {
    name: 'War Jeep', class: 'ground', hp: 95, speed: 118, reward: 18, damage: 2, radius: 15,
    armor: 0.05, res: { explosive: 1.4, fire: 1.3 }, sprite: 'jeep', color: '#8a6d3b', accent: '#4a3a1e',
  },
  apc: {
    name: 'APC', class: 'ground', hp: 190, speed: 50, reward: 28, damage: 3, radius: 18,
    armor: 0.25, res: { kinetic: 0.6, explosive: 1.5, energy: 1.2 }, sprite: 'apc', color: '#556b2f', accent: '#333f1c',
    abilities: { split: { into: 'infantry', count: 3 } },
  },
  lighttank: {
    name: 'Light Tank', class: 'ground', hp: 320, speed: 48, reward: 36, damage: 4, radius: 20,
    armor: 0.3, res: { kinetic: 0.6, explosive: 1.5, energy: 1.2 }, sprite: 'tank', color: '#5b6650', accent: '#2f362a',
  },
  heavytank: {
    name: 'Heavy Tank', class: 'ground', hp: 700, speed: 40, reward: 58, damage: 6, radius: 24,
    armor: 0.42, res: { kinetic: 0.5, fire: 0.7, explosive: 1.6, energy: 1.2 }, sprite: 'tank_heavy', color: '#4b5563', accent: '#1f2937',
  },
  drone: {
    name: 'Recon Drone', class: 'air', hp: 64, speed: 122, reward: 16, damage: 2, radius: 12,
    armor: 0, res: { energy: 1.7, fire: 0.7, explosive: 1.2 }, sprite: 'drone', color: '#38bdf8', accent: '#0369a1',
  },
  heli: {
    name: 'Gunship Heli', class: 'air', hp: 380, speed: 84, reward: 46, damage: 5, radius: 22,
    armor: 0.1, res: { kinetic: 0.7, energy: 1.6, explosive: 1.3 }, sprite: 'heli', color: '#334155', accent: '#0ea5e9',
  },
  sapper: {
    name: 'Sapper', class: 'ground', hp: 220, speed: 62, reward: 34, damage: 2, radius: 16,
    armor: 0.2, res: { kinetic: 0.6, energy: 1.6, explosive: 1.4 }, sprite: 'sapper', color: '#a16207', accent: '#fca5a5',
    abilities: { siege: { range: 1.5 * 64, dps: 30 } }, // destroys your towers!
  },

  // ---- monsters ----
  spider: {
    name: 'Spider', class: 'ground', hp: 55, speed: 128, reward: 12, damage: 1, radius: 13,
    armor: 0.05, res: { fire: 1.6, explosive: 1.4, kinetic: 0.85 }, sprite: 'spider', color: '#4c1d95', accent: '#c4b5fd',
  },
  hound: {
    name: 'Hell Hound', class: 'ground', hp: 90, speed: 150, reward: 16, damage: 2, radius: 14,
    armor: 0, res: { frost: 1.5, fire: 1.3 }, sprite: 'hound', color: '#7f1d1d', accent: '#f59e0b',
  },
  slime: {
    name: 'Slime', class: 'ground', hp: 140, speed: 60, reward: 18, damage: 2, radius: 16,
    armor: 0, res: { fire: 1.8, kinetic: 0.5, explosive: 1.2 }, sprite: 'slime', color: '#16a34a', accent: '#bbf7d0',
    abilities: { split: { into: 'spider', count: 2 } },
  },
  wasp: {
    name: 'Wasp Swarm', class: 'air', hp: 70, speed: 138, reward: 16, damage: 2, radius: 12,
    armor: 0, res: { fire: 1.5, energy: 1.5, explosive: 1.3 }, sprite: 'wasp', color: '#ca8a04', accent: '#1c1917',
  },
  brute: {
    name: 'Brute', class: 'ground', hp: 520, speed: 46, reward: 44, damage: 5, radius: 22,
    armor: 0.15, res: { fire: 1.7, kinetic: 0.7 }, sprite: 'brute', color: '#166534', accent: '#052e16',
  },
  wraith: {
    name: 'Wraith', class: 'ground', hp: 260, speed: 80, reward: 40, damage: 4, radius: 16,
    armor: 0, res: { kinetic: 0.35, explosive: 0.6, energy: 1.9, fire: 1.2 }, sprite: 'wraith', color: '#6d28d9', accent: '#e9d5ff',
    abilities: { regen: 18 },
  },

  // ---- bosses ----
  mech: {
    name: 'Battle Mech', class: 'ground', hp: 1500, speed: 42, reward: 130, damage: 10, radius: 28,
    armor: 0.34, res: { kinetic: 0.6, explosive: 1.4, energy: 1.2 }, sprite: 'mech', color: '#7c3aed', accent: '#2e1065', boss: true,
    abilities: { buff: { radius: 130, speedMult: 1.35 } },
  },
  commander: {
    name: 'Commander', class: 'ground', hp: 2400, speed: 38, reward: 200, damage: 12, radius: 30,
    armor: 0.3, res: { kinetic: 0.6, explosive: 1.35, energy: 1.2 }, sprite: 'mech', color: '#dc2626', accent: '#450a0a', boss: true,
    abilities: { buff: { radius: 150, speedMult: 1.3 } },
  },
  titan: {
    name: 'Titan', class: 'ground', hp: 7000, speed: 34, reward: 500, damage: 20, radius: 34,
    armor: 0.4, res: { kinetic: 0.6, explosive: 1.3, energy: 1.15 }, sprite: 'mech', color: '#f59e0b', accent: '#451a03', boss: true,
    abilities: { buff: { radius: 170, speedMult: 1.25 }, regen: 60, siege: { range: 1.7 * 64, dps: 45 } },
  },
}
