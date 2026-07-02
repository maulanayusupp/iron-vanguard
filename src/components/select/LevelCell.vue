<script setup>
defineProps({ level: { type: Object, required: true } })
defineEmits(['play'])
</script>

<template>
  <button
    class="level-cell"
    :class="{ locked: !level.unlocked, cleared: level.cleared, boss: level.boss }"
    :disabled="!level.unlocked"
    @click="$emit('play')"
  >
    <span v-if="!level.unlocked">🔒</span>
    <span v-else>{{ level.n }}</span>
    <i v-if="level.boss && level.unlocked" class="level-cell__boss">☠</i>
    <span v-if="level.stars" class="level-cell__stars">
      <i v-for="s in 3" :key="s" :class="{ on: s <= level.stars }">★</i>
    </span>
  </button>
</template>
