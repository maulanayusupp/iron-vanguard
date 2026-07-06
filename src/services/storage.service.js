// Thin wrapper around localStorage so persistence lives in one place and can be
// swapped later (e.g. for a backend) without touching components.
// Guarded so it's a harmless no-op in non-browser (headless/test) contexts.

const mem = {}
const store = (typeof localStorage !== 'undefined') ? localStorage : {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v) },
}

const PROGRESS_KEY = 'wir_progress'
const STARS_KEY = 'wir_stars'
const SETTINGS_KEY = 'wir_settings'

export const storageService = {
  getProgress() {
    const v = Number(store.getItem(PROGRESS_KEY))
    return Number.isFinite(v) && v >= 1 ? v : 1
  },
  setProgress(level) {
    store.setItem(PROGRESS_KEY, String(level))
  },

  // stars: a { [level]: 1..3 } map of the best rating achieved per level.
  getStars() {
    try {
      return JSON.parse(store.getItem(STARS_KEY)) || {}
    } catch (e) {
      return {}
    }
  },
  setStars(map) {
    store.setItem(STARS_KEY, JSON.stringify(map))
  },

  // settings: { locale, volume, reduceMotion }
  getSettings() {
    try { return JSON.parse(store.getItem(SETTINGS_KEY)) || {} } catch (e) { return {} }
  },
  setSettings(s) {
    store.setItem(SETTINGS_KEY, JSON.stringify(s))
  },

  // best score per mode ('endless' | 'bossrush') — waves cleared
  getBest(mode) {
    const v = Number(store.getItem('wir_best_' + mode))
    return Number.isFinite(v) ? v : 0
  },
  setBest(mode, waves) {
    if (waves > this.getBest(mode)) store.setItem('wir_best_' + mode, String(waves))
  },

  getSolvedPuzzles() {
    try { return JSON.parse(store.getItem('wir_puzzles')) || [] } catch (e) { return [] }
  },
  markPuzzle(id) {
    const s = this.getSolvedPuzzles()
    if (!s.includes(id)) { s.push(id); store.setItem('wir_puzzles', JSON.stringify(s)) }
  },

  // meta-progression
  getCoins() { const v = Number(store.getItem('wir_coins')); return Number.isFinite(v) ? v : 0 },
  setCoins(v) { store.setItem('wir_coins', String(Math.max(0, Math.round(v)))) },
  getBarracks() { try { return JSON.parse(store.getItem('wir_barracks')) || {} } catch (e) { return {} } },
  setBarracks(m) { store.setItem('wir_barracks', JSON.stringify(m)) },
}
