<script setup>
defineProps({ skills: { type: Array, required: true } })
defineEmits(['use'])
</script>

<template>
  <div class="skills">
    <button
      v-for="s in skills" :key="s.key"
      v-accent="s.rarityColor"
      class="skill-btn"
      :class="{ ready: s.ready }"
      :disabled="!s.ready"
      @click="$emit('use', s.key)"
    >
      <span class="skill-btn__name">{{ s.skillName }}</span>
      <span class="skill-btn__cd">{{ s.ready ? 'READY' : Math.ceil(s.cooldownLeft) + 's' }}</span>
    </button>
  </div>
</template>
