<script setup>
// A single buyable entry (tower or hero). Colour comes in via v-accent (--c).
defineProps({
  color: { type: String, required: true },
  name: { type: String, required: true },
  badge: { type: String, default: '' },
  badgeAccent: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  dim: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<template>
  <button
    v-accent="color"
    class="shop-item"
    :class="{ active, poor: dim }"
    :disabled="disabled"
    @click="$emit('select')"
  >
    <span class="shop-item__dot"></span>
    <span class="shop-item__name">{{ name }}</span>
    <span class="shop-item__badge" :class="{ 'shop-item__badge--accent': badgeAccent }">{{ badge }}</span>
    <span class="shop-item__desc"><slot /></span>
  </button>
</template>
