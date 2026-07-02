<script setup>
import { ref, computed } from 'vue'
import AppButton from '../ui/AppButton.vue'
import ChapterChip from '../select/ChapterChip.vue'
import LevelCell from '../select/LevelCell.vue'
import { useProgress } from '../../composables/useProgress.js'
import { levelService } from '../../services/level.service.js'

const emit = defineEmits(['back', 'play'])
const { progress, stars, totalStars } = useProgress()

const selectedChapter = ref(levelService.chapterOf(progress.value))

const chapters = computed(() => levelService.chapters(progress.value))
const levels = computed(() => levelService.levelsInChapter(selectedChapter.value, progress.value, stars.value))
</script>

<template>
  <div class="select">
    <header class="select__head">
      <AppButton variant="ghost" @click="emit('back')">← Back</AppButton>
      <h2>Select Level</h2>
      <span class="select__stars">⭐ {{ totalStars }}</span>
    </header>

    <div class="chapter-row">
      <ChapterChip
        v-for="c in chapters" :key="c.n"
        :chapter="c" :active="selectedChapter === c.n"
        @select="selectedChapter = c.n"
      />
    </div>

    <div class="level-grid">
      <LevelCell
        v-for="lv in levels" :key="lv.n"
        :level="lv" @play="emit('play', lv.n)"
      />
    </div>
  </div>
</template>
