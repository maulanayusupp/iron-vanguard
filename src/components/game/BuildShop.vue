<script setup>
import { ref, computed } from 'vue'
import ShopItem from './ShopItem.vue'
import { TOWERS } from '../../game/config/towers.js'
import { HERO_LIST, RARITY, HERO_SLOTS } from '../../game/config/heroes.js'
import { typeLabel } from '../../game/config/damage.js'

const props = defineProps({
  money: { type: Number, required: true },
  deployed: { type: Array, required: true },
  activeKey: { type: String, default: null },
})
const emit = defineEmits(['pick'])

const tab = ref('towers')

const towers = Object.entries(TOWERS).map(([key, def]) => ({ key, ...def }))
const heroes = HERO_LIST.map((h) => ({ ...h, rarityColor: RARITY[h.rarity].color, rarityLabel: RARITY[h.rarity].label }))

const heroSlots = HERO_SLOTS
const deployedCount = computed(() => props.deployed.length)
const isDeployed = (key) => props.deployed.includes(key)
</script>

<template>
  <div class="build-shop">
    <div class="tabs">
      <button :class="{ on: tab === 'towers' }" @click="tab = 'towers'">🔫 Towers</button>
      <button :class="{ on: tab === 'heroes' }" @click="tab = 'heroes'">
        🦸 Heroes {{ deployedCount }}/{{ heroSlots }}
      </button>
    </div>

    <div v-show="tab === 'towers'" class="shop">
      <ShopItem
        v-for="t in towers" :key="t.key"
        :color="t.color" :name="t.name" :badge="`💰${t.cost}`"
        :active="activeKey === t.key" :dim="money < t.cost"
        @select="emit('pick', 'tower', t.key)"
      ><b>{{ typeLabel(t.dtype) }}</b> · {{ t.desc }}</ShopItem>
    </div>

    <div v-show="tab === 'heroes'" class="shop">
      <ShopItem
        v-for="h in heroes" :key="h.key"
        :color="h.rarityColor" :name="h.name" :badge="h.rarityLabel" badge-accent
        :active="activeKey === h.key" :dim="isDeployed(h.key)" :disabled="isDeployed(h.key)"
        @select="emit('pick', 'hero', h.key)"
      ><b>{{ h.skill.name }}:</b> {{ h.skill.desc }}</ShopItem>
    </div>
  </div>
</template>
