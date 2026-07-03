<script setup>
import AppButton from '../ui/AppButton.vue'
import { t } from '../../i18n/index.js'

defineProps({ info: { type: Object, required: true } })
defineEmits(['upgrade', 'fuse', 'sell'])
</script>

<template>
  <div class="selected">
    <!-- Tower -->
    <template v-if="info.kind === 'tower'">
      <h3 class="selected__title">
        <span class="selected__dot" v-accent="info.color"></span>
        {{ info.name }}
        <em class="selected__tag">{{ info.fused ? '★ FUSED' : 'Lv ' + info.level }}<template v-if="info.vet"> · {{ info.vetName }}</template></em>
      </h3>
      <div class="selected__rows">
        <div v-if="info.dps"><span>{{ t('sel.damage') }}</span><b>{{ info.dps }}/s</b></div>
        <div v-if="info.range"><span>{{ t('sel.range') }}</span><b>{{ info.range }}</b></div>
        <div><span>{{ t('sel.towerHp') }}</span><b>{{ info.hp }}/{{ info.maxHp }}</b></div>
        <div><span>{{ t('sel.type') }}</span><b v-accent="info.dtypeColor" class="selected__type">{{ info.dtype }}</b></div>
      </div>
      <p class="selected__skill">{{ info.note || t('sel.strongVs', { x: info.strongVs }) }}</p>
      <div class="selected__actions">
        <AppButton v-if="info.canUpgrade" :disabled="!info.canAfford" @click="$emit('upgrade')">
          {{ t('sel.upgrade') }} 💰{{ info.upgradeCost }}
        </AppButton>
        <AppButton v-else-if="info.canFuse" variant="primary" @click="$emit('fuse')">{{ t('sel.fuse') }}</AppButton>
        <AppButton v-else disabled>{{ info.fused ? t('sel.fused') : t('sel.maxLevel') }}</AppButton>
        <AppButton variant="ghost" @click="$emit('sell')">{{ t('sel.sell') }} 💰{{ info.sellValue }}</AppButton>
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
        {{ t('sel.attack') }}: <b v-accent="info.dtypeColor" class="selected__type">{{ info.dtype }}</b> · <b>{{ info.dps }}/s</b><br />
        <b>{{ info.skillName }}:</b> {{ info.desc }}
      </p>
      <div class="selected__actions">
        <AppButton variant="ghost" @click="$emit('sell')">{{ t('sel.recall') }}</AppButton>
      </div>
    </template>
  </div>
</template>
