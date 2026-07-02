// Colour helpers shared by the renderer.

/**
 * Darken (amt < 0) or lighten (amt > 0) a #rrggbb colour.
 * @param {string} hex - colour like "#1a2b3c"
 * @param {number} amt - -100..100
 * @returns {string} an rgb(...) string
 */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const f = amt / 100
  const adj = (c) => Math.max(0, Math.min(255, Math.round(c + (f < 0 ? c : 255 - c) * f)))
  const r = adj((n >> 16) & 255)
  const g = adj((n >> 8) & 255)
  const b = adj(n & 255)
  return `rgb(${r},${g},${b})`
}
