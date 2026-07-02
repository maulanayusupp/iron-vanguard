<script setup>
// Reusable button. `variant` is a space-separated list of style modifiers
// (e.g. "primary big", "ghost", "wave"). Styling lives in styles/_buttons.scss.
defineProps({
  variant: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button class="btn" :class="variant" :disabled="disabled">
    <slot />
  </button>
</template>
