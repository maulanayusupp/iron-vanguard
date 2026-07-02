<script setup>
defineProps({
  chapter: { type: Object, required: true },
  active: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<template>
  <button
    v-accent="chapter.theme.accent"
    class="chapter-chip"
    :class="{ active, locked: !chapter.unlocked }"
    :disabled="!chapter.unlocked"
    @click="$emit('select')"
  >
    <b>Ch. {{ chapter.n }}</b>
    <small>{{ chapter.theme.name }}</small>
    <small>{{ chapter.start }}–{{ chapter.end }}</small>
  </button>
</template>
