<script setup>
import { ref } from 'vue'
import AppButton from '../ui/AppButton.vue'
import { storageService } from '../../services/storage.service.js'
import { t } from '../../i18n/index.js'

const props = defineProps({
  status: { type: String, required: true }, // 'won' | 'lost'
  level: { type: Number, required: true },
  kills: { type: Number, required: true },
  stars: { type: Number, default: 0 },
  wave: { type: Number, required: true },
  totalWaves: { type: Number, required: true },
  maxLevel: { type: Number, required: true },
  mode: { type: String, default: '' },
  coins: { type: Number, default: 0 },
})
defineEmits(['next', 'retry', 'menu'])

const copied = ref(false)
function share() {
  const base = window.location.origin + window.location.pathname
  const url = props.mode ? `${base}?mode=${props.mode}` : `${base}?level=${props.level}`
  const text = `Iron Vanguard — ${props.mode || 'Level ' + props.level}! ${url}`
  const done = () => { copied.value = true; setTimeout(() => (copied.value = false), 1800) }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done)
  else done()
}
const best = props.mode ? storageService.getBest(props.mode) : 0
</script>

<template>
  <div class="overlay">
    <div class="overlay__card">
      <h2>{{ status === 'won' ? t('result.victory') : t('result.defeat') }}</h2>

      <template v-if="mode">
        <p>{{ t('result.waves', { n: wave }) }} <span class="muted">/ {{ totalWaves }}</span></p>
        <p class="muted">{{ t('result.best', { n: Math.max(best, wave) }) }} · 💀 {{ kills }}</p>
      </template>
      <template v-else>
        <div v-if="status === 'won'" class="overlay__stars"><i v-for="s in 3" :key="s" :class="{ on: s <= stars }">★</i></div>
        <p v-if="status === 'won'">{{ t('result.cleared', { n: level, k: kills }) }}</p>
        <p v-else class="muted">{{ t('result.held', { w: wave, t: totalWaves }) }}</p>
      </template>

      <p v-if="coins" class="overlay__coins">🪙 +{{ coins }} coins earned</p>

      <div class="overlay__actions">
        <AppButton v-if="!mode && status === 'won' && level < maxLevel" variant="primary" @click="$emit('next')">{{ t('result.next') }}</AppButton>
        <AppButton @click="$emit('retry')">{{ t('result.retry') }}</AppButton>
        <AppButton variant="ghost" @click="share">{{ copied ? t('result.copied') : t('result.share') }}</AppButton>
        <AppButton variant="ghost" @click="$emit('menu')">{{ t('result.menu') }}</AppButton>
      </div>
    </div>
  </div>
</template>
