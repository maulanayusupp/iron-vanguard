<script setup>
import UnitIcon from './UnitIcon.vue'
// A single buyable entry (tower or hero). Colour comes in via v-accent (--c).
defineProps({
  color: { type: String, required: true },
  name: { type: String, required: true },
  iconKind: { type: String, default: '' },
  iconKey: { type: String, default: '' },
  badge: { type: String, default: '' },
  badgeAccent: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  dim: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  stats: { type: String, default: '' },
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
    <UnitIcon v-if="iconKey" :kind="iconKind" :item-key="iconKey" />
    <span v-else class="shop-item__dot"></span>
    <span class="shop-item__name">{{ name }}</span>
    <span class="shop-item__badge" :class="{ 'shop-item__badge--accent': badgeAccent }">{{ badge }}</span>
    <span v-if="stats" class="shop-item__stats">{{ stats }}</span>
    <span class="shop-item__desc"><slot /></span>
  </button>
</template>
