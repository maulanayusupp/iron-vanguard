<script setup>
import { t } from '../../i18n/index.js'
defineProps({ choices: { type: Array, required: true } })
defineEmits(['pick'])
</script>

<template>
  <div class="overlay">
    <div class="draft">
      <h2 class="draft__title">{{ t('draft.title') }}</h2>
      <p class="draft__sub">{{ t('draft.sub') }}</p>
      <div class="draft__cards">
        <button v-for="m in choices" :key="m.id" class="draft-card" @click="$emit('pick', m.id)">
          <span class="draft-card__icon">{{ m.icon }}</span>
          <span class="draft-card__name">{{ m.name }}</span>
          <span class="draft-card__desc">{{ m.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
