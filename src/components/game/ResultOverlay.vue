<script setup>
import AppButton from '../ui/AppButton.vue'

const props = defineProps({
  status: { type: String, required: true }, // 'won' | 'lost'
  level: { type: Number, required: true },
  kills: { type: Number, required: true },
  stars: { type: Number, default: 0 },
  wave: { type: Number, required: true },
  totalWaves: { type: Number, required: true },
  maxLevel: { type: Number, required: true },
})
defineEmits(['next', 'retry', 'menu'])
</script>

<template>
  <div class="overlay">
    <div class="overlay__card">
      <h2>{{ status === 'won' ? '🏆 Victory!' : '💥 Base Destroyed' }}</h2>
      <div v-if="status === 'won'" class="overlay__stars">
        <i v-for="s in 3" :key="s" :class="{ on: s <= stars }">★</i>
      </div>
      <p v-if="status === 'won'">Level {{ level }} cleared — {{ kills }} kills.</p>
      <p v-else class="muted">You held {{ wave }} / {{ totalWaves }} waves.</p>
      <div class="overlay__actions">
        <AppButton v-if="status === 'won' && level < maxLevel" variant="primary" @click="$emit('next')">
          Next Level →
        </AppButton>
        <AppButton @click="$emit('retry')">↻ Retry</AppButton>
        <AppButton variant="ghost" @click="$emit('menu')">Menu</AppButton>
      </div>
    </div>
  </div>
</template>
