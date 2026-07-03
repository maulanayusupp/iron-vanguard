// ---------------------------------------------------------------------------
// Grid geometry + map layouts + biome themes.
// Paths are axis-aligned lists of TILE-coordinate waypoints. The first point
// sits off-screen (the spawn), the last point sits off-screen (the base).
// ---------------------------------------------------------------------------

export const TILE = 64
export const COLS = 16
export const ROWS = 9
export const WIDTH = COLS * TILE // 1024
export const HEIGHT = ROWS * TILE // 576

// ---------------------------------------------------------------------------
// Multi-lane maps. Each map has 2–5 incoming lanes so your towers must cover
// several fronts at once. Lanes are generated (axis-aligned, converging to one
// shared base) so it's fully DYNAMIC & CONFIGURABLE — just change `lanes`.
// ---------------------------------------------------------------------------

// Evenly spread `count` integer tracks between lo..hi.
function spread(count, lo, hi) {
  if (count <= 1) return [Math.round((lo + hi) / 2)]
  const out = []
  for (let i = 0; i < count; i++) out.push(Math.round(lo + (i * (hi - lo)) / (count - 1)))
  return out
}

// Generate `count` lanes. axis 'h' = enter from the left → base at right-middle;
// axis 'v' = enter from the top → base at bottom-middle. Lanes merge near base.
export function generateLanes(count, axis = 'h') {
  const paths = []
  if (axis === 'v') {
    const baseX = 8, joinY = 6, baseY = 9
    for (const c of spread(count, 1, 14)) paths.push([{ x: c, y: -1 }, { x: c, y: joinY }, { x: baseX, y: joinY }, { x: baseX, y: baseY }])
  } else {
    const baseY = 4, joinX = 13, baseX = 16
    for (const r of spread(count, 1, 7)) paths.push([{ x: -1, y: r }, { x: joinX, y: r }, { x: joinX, y: baseY }, { x: baseX, y: baseY }])
  }
  return paths
}

// name, lanes (default 2, up to 5), axis. Edit freely — everything is generated.
export const MAPS = [
  { name: 'Twin Approach', lanes: 2, axis: 'h' },
  { name: 'Serpent Split', lanes: 2, axis: 'v' },
  { name: 'Trident', lanes: 3, axis: 'h' },
  { name: 'Gauntlet', lanes: 2, axis: 'h' },
  { name: 'Three Rivers', lanes: 3, axis: 'v' },
  { name: 'Crossfire', lanes: 4, axis: 'h' },
  { name: 'Delta', lanes: 3, axis: 'h' },
  { name: 'Five Fronts', lanes: 5, axis: 'v' },
].map((m) => ({ ...m, paths: generateLanes(m.lanes, m.axis) }))

// Biome themes cycle by "zone" (every 25 levels). Each gives the map a look.
export const THEMES = [
  { name: 'Desert', ground: '#2a2416', grid: '#3a3320', road: '#4a4130', accent: '#d97706' },
  { name: 'Forest', ground: '#12241a', grid: '#1c3326', road: '#243a2a', accent: '#22c55e' },
  { name: 'Tundra', ground: '#1b2836', grid: '#26384a', road: '#33465c', accent: '#93c5fd' },
  { name: 'Urban', ground: '#171a21', grid: '#242833', road: '#2b3040', accent: '#94a3b8' },
  { name: 'Volcano', ground: '#241414', grid: '#361d1d', road: '#3a2222', accent: '#f97316' },
  { name: 'Toxic', ground: '#1a2410', grid: '#26361a', road: '#2f3d1c', accent: '#84cc16' },
  { name: 'Nightfall', ground: '#0d1526', grid: '#182238', road: '#1e2a44', accent: '#818cf8' },
  { name: 'The Void', ground: '#1a1226', grid: '#281a3a', road: '#2c1f42', accent: '#c084fc' },
]
