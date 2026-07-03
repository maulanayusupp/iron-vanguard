<script setup>
import AppButton from '../ui/AppButton.vue'
import { levelService } from '../../services/level.service.js'
import { storageService } from '../../services/storage.service.js'
import { t } from '../../i18n/index.js'

defineEmits(['back', 'play'])
const solved = storageService.getSolvedPuzzles()
const puzzles = levelService.PUZZLES.map((p) => ({ ...p, done: solved.includes(p.id) }))
</script>

<template>
  <div class="puzzles">
    <header class="puzzles__head">
      <AppButton variant="ghost" @click="$emit('back')">{{ t('common.back') }}</AppButton>
      <h2>{{ t('home.puzzles') }}</h2>
      <span class="puzzles__spacer"></span>
    </header>

    <div class="puzzles__list">
      <button v-for="p in puzzles" :key="p.id" class="puzzle-card" @click="$emit('play', p.id)">
        <span class="puzzle-card__no">{{ p.id + 1 }}</span>
        <span class="puzzle-card__body">
          <b>{{ p.name }}</b>
          <small>💰 {{ p.startMoney }} · 🛡️ {{ p.baseHp }} · {{ p.allowed.length }} {{ t('shop.towers') }}</small>
        </span>
        <span v-if="p.done" class="puzzle-card__done">✓</span>
      </button>
    </div>
  </div>
</template>
