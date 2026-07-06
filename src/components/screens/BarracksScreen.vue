<script setup>
import AppButton from '../ui/AppButton.vue'
import { useBarracks } from '../../composables/useBarracks.js'
import { t } from '../../i18n/index.js'

defineEmits(['back'])
const { coins, items, buy } = useBarracks()
</script>

<template>
  <div class="barracks">
    <header class="barracks__head">
      <AppButton variant="ghost" @click="$emit('back')">{{ t('common.back') }}</AppButton>
      <h2>{{ t('home.barracks') }}</h2>
      <span class="barracks__coins">🪙 {{ coins }}</span>
    </header>

    <p class="barracks__sub">{{ t('barracks.sub') }}</p>

    <div class="barracks__grid">
      <div v-for="u in items" :key="u.id" class="up-card" :class="{ maxed: u.maxed }">
        <span class="up-card__icon">{{ u.icon }}</span>
        <div class="up-card__body">
          <div class="up-card__head">
            <b>{{ u.name }}</b>
            <span class="up-card__lv">{{ u.level }}/{{ u.max }}</span>
          </div>
          <span class="up-card__desc">{{ u.maxed ? u.descCur : u.descNext }}</span>
          <span class="up-card__pips">
            <i v-for="n in u.max" :key="n" :class="{ on: n <= u.level }"></i>
          </span>
        </div>
        <button
          class="up-card__buy"
          :class="{ ok: u.canBuy }"
          :disabled="u.maxed || !u.canBuy"
          @click="buy(u.id)"
        >{{ u.maxed ? '✓' : '🪙 ' + u.cost }}</button>
      </div>
    </div>
  </div>
</template>
