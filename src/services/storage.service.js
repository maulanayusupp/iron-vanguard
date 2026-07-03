// Thin wrapper around localStorage so persistence lives in one place and can be
// swapped later (e.g. for a backend) without touching components.

const PROGRESS_KEY = 'wir_progress'
const STARS_KEY = 'wir_stars'
const SETTINGS_KEY = 'wir_settings'

export const storageService = {
  getProgress() {
    const v = Number(localStorage.getItem(PROGRESS_KEY))
    return Number.isFinite(v) && v >= 1 ? v : 1
  },
  setProgress(level) {
    localStorage.setItem(PROGRESS_KEY, String(level))
  },

  // stars: a { [level]: 1..3 } map of the best rating achieved per level.
  getStars() {
    try {
      return JSON.parse(localStorage.getItem(STARS_KEY)) || {}
    } catch (e) {
      return {}
    }
  },
  setStars(map) {
    localStorage.setItem(STARS_KEY, JSON.stringify(map))
  },

  // settings: { locale, volume, reduceMotion }
  getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {} } catch (e) { return {} }
  },
  setSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  },

  // best score per mode ('endless' | 'bossrush') — waves cleared
  getBest(mode) {
    const v = Number(localStorage.getItem('wir_best_' + mode))
    return Number.isFinite(v) ? v : 0
  },
  setBest(mode, waves) {
    if (waves > this.getBest(mode)) localStorage.setItem('wir_best_' + mode, String(waves))
  },

  getSolvedPuzzles() {
    try { return JSON.parse(localStorage.getItem('wir_puzzles')) || [] } catch (e) { return [] }
  },
  markPuzzle(id) {
    const s = this.getSolvedPuzzles()
    if (!s.includes(id)) { s.push(id); localStorage.setItem('wir_puzzles', JSON.stringify(s)) }
  },
}
