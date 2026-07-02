// Damage types create a rock-paper-scissors layer: each tower/hero attack has a
// `dtype`, and each enemy has a `res` map of multipliers (e.g. { fire: 1.6 }
// means it takes 60% extra fire damage). Kinetic damage is additionally reduced
// by an enemy's flat `armor`; other types ignore armor (they punch through).
export const DAMAGE_TYPES = {
  kinetic: { label: 'Kinetic', color: '#e2e8f0' },
  explosive: { label: 'Explosive', color: '#fb923c' },
  energy: { label: 'Energy', color: '#a78bfa' },
  fire: { label: 'Fire', color: '#f97316' },
  frost: { label: 'Frost', color: '#60a5fa' },
  toxic: { label: 'Toxic', color: '#84cc16' },
}

export const typeLabel = (k) => (DAMAGE_TYPES[k] ? DAMAGE_TYPES[k].label : k)
export const typeColor = (k) => (DAMAGE_TYPES[k] ? DAMAGE_TYPES[k].color : '#e2e8f0')
