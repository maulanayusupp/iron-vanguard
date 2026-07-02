import { ref, computed } from 'vue'
import { storageService } from '../services/storage.service.js'

// Module-level singletons so every screen shares the same progress + stars.
const progress = ref(storageService.getProgress())
const stars = ref(storageService.getStars())

export function useProgress() {
  function unlock(level) {
    if (level > progress.value) {
      progress.value = level
      storageService.setProgress(level)
    }
  }
  function recordStars(level, count) {
    if (count > (stars.value[level] || 0)) {
      stars.value = { ...stars.value, [level]: count }
      storageService.setStars(stars.value)
    }
  }
  const totalStars = computed(() => Object.values(stars.value).reduce((a, b) => a + b, 0))
  const starsFor = (level) => stars.value[level] || 0

  return { progress, stars, unlock, recordStars, totalStars, starsFor }
}
