<script setup>
import { ref, computed } from 'vue'
import ShopItem from './ShopItem.vue'
import { TOWERS, TOWER_BASE_HP } from '../../game/config/towers.js'
import { HERO_LIST, RARITY, HERO_SLOTS } from '../../game/config/heroes.js'
import { typeLabel } from '../../game/config/damage.js'
import { TILE } from '../../game/config/maps.js'
import { t } from '../../i18n/index.js'

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
  allowed: { type: Array, default: null }, // restrict towers (puzzles)
  heroesLocked: { type: Boolean, default: false },
})
const emit = defineEmits(['pick'])

const tab = ref('towers')

const allTowers = Object.entries(TOWERS).map(([key, def]) => ({ key, ...def }))
const towers = computed(() => (props.allowed ? allTowers.filter((t) => props.allowed.includes(t.key)) : allTowers))
const heroes = HERO_LIST.map((h) => ({ ...h, rarityColor: RARITY[h.rarity].color, rarityLabel: RARITY[h.rarity].label }))

const heroSlots = HERO_SLOTS
const deployedCount = computed(() => props.deployed.length)
const isDeployed = (key) => props.deployed.includes(key)
</script>

<template>
  <div class="build-shop">
    <div class="tabs">
      <button :class="{ on: tab === 'towers' }" @click="tab = 'towers'">{{ t('shop.towers') }}</button>
      <button v-if="!heroesLocked" :class="{ on: tab === 'heroes' }" @click="tab = 'heroes'">
        {{ t('shop.heroes') }} {{ deployedCount }}/{{ heroSlots }}
      </button>
    </div>

    <div v-show="tab === 'towers'" class="shop">
      <ShopItem
        v-for="tw in towers" :key="tw.key"
        :color="tw.color" :name="tw.name" :badge="`💰${tw.cost}`" :stats="towerStat(tw)"
        icon-kind="tower" :icon-key="tw.key"
        :active="activeKey === tw.key" :dim="money < tw.cost"
        @select="emit('pick', 'tower', tw.key)"
      ><b>{{ tw.dtype ? typeLabel(tw.dtype) : t('shop.support') }}</b> · {{ tw.desc }}</ShopItem>
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
