<script setup>
import UnitIcon from '../game/UnitIcon.vue'
import AppButton from '../ui/AppButton.vue'
import { ENEMIES } from '../../game/config/enemies.js'
import { DAMAGE_TYPES } from '../../game/config/damage.js'
import { t } from '../../i18n/index.js'

defineEmits(['back'])

const list = Object.entries(ENEMIES).map(([key, e]) => {
  const weak = [], resist = []
  if (e.res) for (const k in e.res) (e.res[k] > 1 ? weak : resist).push(k)
  return { key, ...e, weak, resist }
})
</script>

<template>
  <div class="bestiary">
    <header class="bestiary__head">
      <AppButton variant="ghost" @click="$emit('back')">{{ t('common.back') }}</AppButton>
      <h2>{{ t('best.title') }} <small>· {{ list.length }}</small></h2>
      <span class="bestiary__spacer"></span>
    </header>

    <div class="bestiary__grid">
      <div v-for="e in list" :key="e.key" class="beast">
        <UnitIcon kind="enemy" :item-key="e.key" />
        <div class="beast__info">
          <div class="beast__name">
            {{ e.name }}
            <i v-if="e.class === 'air'" title="Flying">✈</i>
            <i v-if="e.boss" class="beast__boss">☠</i>
          </div>
          <div class="beast__stats">
            {{ t('best.hp') }} {{ e.hp }}
            <template v-if="e.armor"> · {{ t('best.armor') }} {{ Math.round(e.armor * 100) }}%</template>
          </div>
          <div class="beast__tags">
            <span v-for="k in e.weak" :key="'w' + k" class="dt dt--weak" v-accent="DAMAGE_TYPES[k].color">▲ {{ DAMAGE_TYPES[k].label }}</span>
            <span v-for="k in e.resist" :key="'r' + k" class="dt dt--res" v-accent="DAMAGE_TYPES[k].color">▼ {{ DAMAGE_TYPES[k].label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
