<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppButton from '../ui/AppButton.vue'
import { useProgress } from '../../composables/useProgress.js'
import { levelService } from '../../services/level.service.js'
import { AmbientScene } from '../../game/ambient.js'
import { APP_NAME_LEAD, APP_NAME_ACCENT, APP_TAGLINE } from '../../constants/app.js'

const { progress, totalStars } = useProgress()
const emit = defineEmits(['continue', 'select', 'restart'])

const maxLevel = levelService.MAX_LEVEL
const chapters = levelService.chapterCount
const nameLead = APP_NAME_LEAD
const nameAccent = APP_NAME_ACCENT
const tagline = APP_TAGLINE

const sceneRef = ref(null)
let scene = null
onMounted(() => { scene = new AmbientScene(sceneRef.value); scene.start() })
onUnmounted(() => { if (scene) scene.stop() })
</script>

<template>
  <div class="home">
    <canvas ref="sceneRef" class="home__scene" aria-hidden="true"></canvas>
    <div class="home__veil" aria-hidden="true"></div>

    <div class="home__inner">
      <div class="emblem">
        <span class="emblem__radar"></span>
        <span class="emblem__ring"></span>
        <svg class="emblem__mark" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="hsShield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#5eead4" />
              <stop offset="1" stop-color="#0891b2" />
            </linearGradient>
          </defs>
          <path d="M32 8 L52 15 L52 33 C52 45 43 53 32 57 C21 53 12 45 12 33 L12 15 Z" fill="url(#hsShield)" />
          <path d="M22 26 L32 45 L42 26" fill="none" stroke="#071018" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="32" cy="20" r="3.2" fill="#071018" />
        </svg>
      </div>

      <h1 class="home__logo">{{ nameLead }} <span>{{ nameAccent }}</span></h1>
      <p class="home__tag">{{ tagline }}</p>

      <div class="home__stats">
        <div class="chip"><b>Lv {{ progress }}</b><small>Progress</small></div>
        <div class="chip"><b>⭐ {{ totalStars }}</b><small>Stars</small></div>
        <div class="chip"><b>{{ chapters }}</b><small>Chapters</small></div>
      </div>

      <div class="home__actions">
        <AppButton variant="primary big" @click="emit('continue', progress)">
          ▶ Continue — Level {{ progress }}
        </AppButton>
        <AppButton variant="big" @click="emit('select')">🗺️ Select Level</AppButton>
        <AppButton variant="big" @click="emit('restart')">↻ Play from Level 1</AppButton>
      </div>

      <p class="home__hint">Across {{ maxLevel }} levels of escalating warfare.</p>
    </div>
  </div>
</template>
