// Small numeric helpers.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by)

/** Deterministic PRNG (mulberry32) — same seed always yields the same stream. */
export function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
