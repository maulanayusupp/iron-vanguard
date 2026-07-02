<script setup>
import { ref } from 'vue'
import HomeScreen from './components/screens/HomeScreen.vue'
import LevelSelect from './components/screens/LevelSelect.vue'
import GameScreen from './components/screens/GameScreen.vue'

const screen = ref('home') // 'home' | 'select' | 'game'
const currentLevel = ref(1)

function play(level) {
  currentLevel.value = level
  screen.value = 'game'
}
</script>

<template>
  <HomeScreen
    v-if="screen === 'home'"
    @continue="play"
    @select="screen = 'select'"
    @restart="play(1)"
  />

  <LevelSelect
    v-else-if="screen === 'select'"
    @back="screen = 'home'"
    @play="play"
  />

  <GameScreen
    v-else
    :key="currentLevel"
    :level="currentLevel"
    @exit="screen = 'home'"
    @change-level="play"
  />
</template>
