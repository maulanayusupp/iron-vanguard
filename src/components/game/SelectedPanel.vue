<script setup>
import AppButton from '../ui/AppButton.vue'

defineProps({ info: { type: Object, required: true } })
defineEmits(['upgrade', 'sell'])
</script>

<template>
  <div class="selected">
    <!-- Tower -->
    <template v-if="info.kind === 'tower'">
      <h3 class="selected__title">
        <span class="selected__dot" v-accent="info.color"></span>
        {{ info.name }}
        <em class="selected__tag">Lv {{ info.level }}</em>
      </h3>
      <div class="selected__rows">
        <div v-if="info.dps"><span>Damage</span><b>{{ info.dps }}/s</b></div>
        <div v-if="info.range"><span>Range</span><b>{{ info.range }}</b></div>
        <div><span>Tower HP</span><b>{{ info.hp }}/{{ info.maxHp }}</b></div>
        <div><span>Type</span><b v-accent="info.dtypeColor" class="selected__type">{{ info.dtype }}</b></div>
      </div>
      <p class="selected__skill">{{ info.note || ('Strong vs ' + info.strongVs + '.') }}</p>
      <div class="selected__actions">
        <AppButton :disabled="!info.canUpgrade || !info.canAfford" @click="$emit('upgrade')">
          {{ info.canUpgrade ? `Upgrade 💰${info.upgradeCost}` : 'Max level' }}
        </AppButton>
        <AppButton variant="ghost" @click="$emit('sell')">Sell 💰{{ info.sellValue }}</AppButton>
      </div>
    </template>

    <!-- Hero -->
    <template v-else>
      <h3 class="selected__title">
        <span class="selected__dot" v-accent="info.color"></span>
        {{ info.name }}
        <em class="selected__tag" v-accent="info.rarityColor">{{ info.rarity }}</em>
      </h3>
      <p class="selected__skill">
        Attack: <b v-accent="info.dtypeColor" class="selected__type">{{ info.dtype }}</b> · <b>{{ info.dps }}/s</b><br />
        <b>{{ info.skillName }}:</b> {{ info.desc }}
      </p>
      <div class="selected__actions">
        <AppButton variant="ghost" @click="$emit('sell')">Recall Hero</AppButton>
      </div>
    </template>
  </div>
</template>
