<script setup>
import AppButton from '../ui/AppButton.vue'
import { useProgress } from '../../composables/useProgress.js'
import { levelService } from '../../services/level.service.js'
import { APP_NAME_LEAD, APP_NAME_ACCENT, APP_TAGLINE } from '../../constants/app.js'

const { progress } = useProgress()
const emit = defineEmits(['continue', 'select', 'restart'])

const maxLevel = levelService.MAX_LEVEL
const chapters = levelService.chapterCount
const nameLead = APP_NAME_LEAD
const nameAccent = APP_NAME_ACCENT
const tagline = APP_TAGLINE
</script>

<template>
  <div class="home">
    <div class="home__inner">
      <h1 class="home__logo">{{ nameLead }} <span>{{ nameAccent }}</span></h1>
      <p class="home__tag">{{ tagline }} Across {{ maxLevel }} levels.</p>

      <AppButton variant="primary big" @click="emit('continue', progress)">
        ▶ Continue — Level {{ progress }}
      </AppButton>
      <AppButton variant="big" @click="emit('select')">🗺️ Select Level</AppButton>
      <AppButton variant="big" @click="emit('restart')">↻ Play from Level 1</AppButton>

      <p class="home__hint">Best: Level {{ progress }} • {{ chapters }} chapters</p>
    </div>
  </div>
</template>
