<script setup>
import { ref, computed } from 'vue'
import ShopItem from './ShopItem.vue'
import { TOWERS, TOWER_BASE_HP } from '../../game/config/towers.js'
import { HERO_LIST, RARITY, HERO_SLOTS } from '../../game/config/heroes.js'
import { typeLabel } from '../../game/config/damage.js'
import { TILE } from '../../game/config/maps.js'

const tiles = (px) => (px / TILE).toFixed(1) + 't'
function towerStat(t) {
  if (t.mode === 'income') return `💰 +$${t.income}/${t.incomeInterval}s · ❤ ${TOWER_BASE_HP}`
  if (t.mode === 'support') return `▲ +${Math.round((t.buff.damageMult - 1) * 100)}% dmg · ◎ ${tiles(t.range)} · ❤ ${TOWER_BASE_HP}`
  const dps = Math.round((t.damage || 0) * (t.fireRate || 0) * (t.multishot || 1))
  return `⚔ ${dps}/s · ◎ ${tiles(t.range)} · ❤ ${TOWER_BASE_HP}`
}
const heroStat = (h) => `⚔ ${Math.round(h.attack.damage * h.attack.fireRate)}/s · ◎ ${tiles(h.attack.range)}`

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
        :color="t.color" :name="t.name" :badge="`💰${t.cost}`" :stats="towerStat(t)"
        icon-kind="tower" :icon-key="t.key"
        :active="activeKey === t.key" :dim="money < t.cost"
        @select="emit('pick', 'tower', t.key)"
      ><b>{{ t.dtype ? typeLabel(t.dtype) : 'Support' }}</b> · {{ t.desc }}</ShopItem>
    </div>

    <div v-show="tab === 'heroes'" class="shop">
      <ShopItem
        v-for="h in heroes" :key="h.key"
        :color="h.rarityColor" :name="h.name" :badge="h.rarityLabel" badge-accent :stats="heroStat(h)"
        icon-kind="hero" :icon-key="h.key"
        :active="activeKey === h.key" :dim="isDeployed(h.key)" :disabled="isDeployed(h.key)"
        @select="emit('pick', 'hero', h.key)"
      ><b>{{ h.skill.name }}:</b> {{ h.skill.desc }}</ShopItem>
    </div>
  </div>
</template>
