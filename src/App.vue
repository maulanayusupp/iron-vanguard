<script setup>
import { ref, onMounted } from 'vue'
import HomeScreen from './components/screens/HomeScreen.vue'
import LevelSelect from './components/screens/LevelSelect.vue'
import GameScreen from './components/screens/GameScreen.vue'
import BestiaryScreen from './components/screens/BestiaryScreen.vue'
import PuzzleScreen from './components/screens/PuzzleScreen.vue'
import BarracksScreen from './components/screens/BarracksScreen.vue'
import SettingsModal from './components/game/SettingsModal.vue'
import { levelService } from './services/level.service.js'

const screen = ref('home') // 'home' | 'select' | 'game' | 'bestiary'
const currentLevel = ref(1)
const currentMode = ref('') // '' | 'endless' | 'bossrush'
const showSettings = ref(false)

function play(level, mode = '') {
  currentLevel.value = level
  currentMode.value = mode
  screen.value = 'game'
}

// Deep link: ?mode=endless|bossrush  or  ?level=N  (shared seed)
onMounted(() => {
  const p = new URLSearchParams(window.location.search)
  const m = p.get('mode')
  const lv = parseInt(p.get('level'), 10)
  if (m === 'endless' || m === 'bossrush') play(1, m)
  else if (Number.isFinite(lv) && lv >= 1) play(Math.min(lv, levelService.MAX_LEVEL), '')
})
</script>

<template>
  <HomeScreen
    v-if="screen === 'home'"
    @continue="play"
    @select="screen = 'select'"
    @restart="play(1)"
    @endless="play(1, 'endless')"
    @bossrush="play(1, 'bossrush')"
    @puzzles="screen = 'puzzles'"
    @barracks="screen = 'barracks'"
    @bestiary="screen = 'bestiary'"
    @settings="showSettings = true"
  />

  <LevelSelect v-else-if="screen === 'select'" @back="screen = 'home'" @play="play" />
  <BestiaryScreen v-else-if="screen === 'bestiary'" @back="screen = 'home'" />
  <PuzzleScreen v-else-if="screen === 'puzzles'" @back="screen = 'home'" @play="(id) => play(id, 'puzzle')" />
  <BarracksScreen v-else-if="screen === 'barracks'" @back="screen = 'home'" />

  <GameScreen
    v-else
    :key="currentMode + '-' + currentLevel"
    :level="currentLevel"
    :mode="currentMode"
    @exit="screen = 'home'"
    @change-level="play"
  />

  <SettingsModal v-if="showSettings" @close="showSettings = false" />
</template>
