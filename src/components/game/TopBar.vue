<script setup>
import StatBadge from '../ui/StatBadge.vue'

const props = defineProps({ state: { type: Object, required: true } })
defineEmits(['menu'])
</script>

<template>
  <header class="topbar">
    <button class="btn ghost sm" @click="$emit('menu')">☰</button>
    <div class="topbar__stats">
      <StatBadge icon="💰" :value="state.money" />
      <StatBadge icon="🛡️" :value="`${state.baseHp}/${state.maxBaseHp}`" :danger="state.baseHp <= 5" />
      <StatBadge icon="🌊" :value="`${Math.min(state.wave + 1, state.totalWaves)}/${state.totalWaves}`" />
      <StatBadge icon="💀" :value="state.kills" />
    </div>
    <div class="lvl-pill">
      Lv {{ state.level }}
      <small>{{ state.themeName }} · {{ state.mapName }}</small>
    </div>
  </header>
</template>
