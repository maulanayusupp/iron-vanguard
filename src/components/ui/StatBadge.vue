<script setup>
defineProps({
  icon: { type: String, required: true },
  value: { type: [String, Number], required: true },
  danger: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stat" :class="{ danger }">
    <span class="stat__ico">{{ icon }}</span>{{ value }}
  </div>
</template>
