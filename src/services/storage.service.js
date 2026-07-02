// Thin wrapper around localStorage so persistence lives in one place and can be
// swapped later (e.g. for a backend) without touching components.

const PROGRESS_KEY = 'wir_progress'
const STARS_KEY = 'wir_stars'

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
}
