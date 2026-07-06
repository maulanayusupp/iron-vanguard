<script setup>
import { ref, computed } from 'vue'
import ShopItem from './ShopItem.vue'
import { TOWERS, TOWER_BASE_HP } from '../../game/config/towers.js'
import { HERO_LIST, ULTIMATE_LIST, RARITY, HERO_SLOTS, ULTIMATE_SLOTS, isUltimate } from '../../game/config/heroes.js'
import { typeLabel } from '../../game/config/damage.js'
import { TILE } from '../../game/config/maps.js'
import { t } from '../../i18n/index.js'
import { barracksEffects } from '../../composables/useBarracks.js'

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
const withRarity = (h) => ({ ...h, rarityColor: RARITY[h.rarity].color, rarityLabel: RARITY[h.rarity].label })
const heroes = HERO_LIST.map(withRarity)
const ultimates = ULTIMATE_LIST.map(withRarity)

const heroSlots = HERO_SLOTS + (barracksEffects().heroSlot || 0)
const ultSlots = ULTIMATE_SLOTS
const deployedHeroes = computed(() => props.deployed.filter((k) => !isUltimate(k)).length)
const deployedUlts = computed(() => props.deployed.filter((k) => isUltimate(k)).length)
const isDeployed = (key) => props.deployed.includes(key)
const heroesFull = computed(() => deployedHeroes.value >= heroSlots)
const ultsFull = computed(() => deployedUlts.value >= ultSlots)
</script>

<template>
  <div class="build-shop">
    <div class="tabs">
      <button :class="{ on: tab === 'towers' }" @click="tab = 'towers'">{{ t('shop.towers') }}</button>
      <button v-if="!heroesLocked" :class="{ on: tab === 'heroes' }" @click="tab = 'heroes'">
        {{ t('shop.heroes') }} {{ deployedHeroes }}/{{ heroSlots }}
      </button>
      <button v-if="!heroesLocked" :class="{ on: tab === 'ultimates' }" @click="tab = 'ultimates'">
        {{ t('shop.ultimates') }} {{ deployedUlts }}/{{ ultSlots }}
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
        :active="activeKey === h.key" :dim="isDeployed(h.key) || heroesFull" :disabled="isDeployed(h.key) || heroesFull"
        @select="emit('pick', 'hero', h.key)"
      ><b>{{ h.skill.name }}:</b> {{ h.skill.desc }}</ShopItem>
    </div>

    <div v-show="tab === 'ultimates'" class="shop">
      <ShopItem
        v-for="h in ultimates" :key="h.key"
        :color="h.rarityColor" :name="h.name" :badge="h.rarityLabel" badge-accent :stats="heroStat(h)"
        icon-kind="hero" :icon-key="h.key"
        :active="activeKey === h.key" :dim="isDeployed(h.key) || ultsFull" :disabled="isDeployed(h.key) || ultsFull"
        @select="emit('pick', 'hero', h.key)"
      ><b>{{ h.skill.name }}:</b> {{ h.skill.desc }}</ShopItem>
    </div>
  </div>
</template>
