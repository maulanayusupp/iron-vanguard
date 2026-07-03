<script setup>
import AppButton from '../ui/AppButton.vue'
import { useSettings } from '../../composables/useSettings.js'
import { t, LOCALES } from '../../i18n/index.js'

const { locale, volume, reduceMotion, setVolume, setLocale, setReduceMotion } = useSettings()
defineEmits(['close'])
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="settings">
      <h2 class="settings__title">{{ t('set.title') }}</h2>

      <div class="settings__row">
        <span>{{ t('set.language') }}</span>
        <div class="seg">
          <button v-for="l in LOCALES" :key="l.id" :class="{ on: locale === l.id }" @click="setLocale(l.id)">{{ l.label }}</button>
        </div>
      </div>

      <div class="settings__row">
        <span>{{ t('set.volume') }}</span>
        <input class="slider" type="range" min="0" max="1" step="0.05" :value="volume" @input="setVolume(+$event.target.value)" />
      </div>

      <div class="settings__row">
        <span>{{ t('set.reduceMotion') }}</span>
        <div class="seg">
          <button :class="{ on: reduceMotion }" @click="setReduceMotion(true)">{{ t('set.on') }}</button>
          <button :class="{ on: !reduceMotion }" @click="setReduceMotion(false)">{{ t('set.off') }}</button>
        </div>
      </div>

      <AppButton variant="primary big" @click="$emit('close')">{{ t('set.close') }}</AppButton>
    </div>
  </div>
</template>
