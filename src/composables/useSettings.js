import { ref } from 'vue'
import { storageService } from '../services/storage.service.js'
import { audioService } from '../services/audio.service.js'
import { locale, setLocale as i18nSetLocale } from '../i18n/index.js'

// Shared settings singleton — persisted to localStorage, applied to audio & DOM.
const saved = storageService.getSettings()
const volume = ref(typeof saved.volume === 'number' ? saved.volume : 0.6)
const reduceMotion = ref(!!saved.reduceMotion)

audioService.setVolume(volume.value)
applyReduce()

function persist() {
  storageService.setSettings({ locale: locale.value, volume: volume.value, reduceMotion: reduceMotion.value })
}
function applyReduce() {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('reduce-motion', reduceMotion.value)
}

export function useSettings() {
  function setVolume(v) { volume.value = Math.max(0, Math.min(1, v)); audioService.setVolume(volume.value); persist() }
  function setLocale(l) { i18nSetLocale(l); persist() }
  function setReduceMotion(on) { reduceMotion.value = !!on; applyReduce(); persist() }
  return { locale, volume, reduceMotion, setVolume, setLocale, setReduceMotion }
}
