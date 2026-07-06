import { ref, computed } from 'vue'
import { storageService } from '../services/storage.service.js'
import { UPGRADES } from '../game/config/barracks.js'

// Shared meta-progression singleton: coins + permanent upgrade levels.
const coins = ref(storageService.getCoins())
const levels = ref(storageService.getBarracks())

function persist() { storageService.setCoins(coins.value); storageService.setBarracks(levels.value) }

// Resolve upgrade levels into flat effect totals the engine applies.
export function barracksEffects() {
  const lv = storageService.getBarracks()
  const e = { towerDmg: 1, towerFire: 1, startGold: 0, baseHp: 0, sell: 0.6, cooldown: 1, income: 1, heroSlot: 0 }
  for (const u of UPGRADES) {
    const l = lv[u.id] || 0
    if (!l) continue
    if (u.apply === 'towerDmg') e.towerDmg += u.perLevel * l
    else if (u.apply === 'towerFire') e.towerFire += u.perLevel * l
    else if (u.apply === 'startGold') e.startGold += u.perLevel * l
    else if (u.apply === 'baseHp') e.baseHp += u.perLevel * l
    else if (u.apply === 'sell') e.sell += u.perLevel * l
    else if (u.apply === 'cooldown') e.cooldown -= u.perLevel * l
    else if (u.apply === 'income') e.income += u.perLevel * l
    else if (u.apply === 'heroSlot') e.heroSlot += l
  }
  return e
}

export function addCoins(n) { coins.value += n; storageService.setCoins(coins.value) }

export function useBarracks() {
  const items = computed(() => UPGRADES.map((u) => {
    const level = levels.value[u.id] || 0
    const maxed = level >= u.max
    const cost = maxed ? 0 : u.cost(level)
    return { ...u, level, maxed, cost, canBuy: !maxed && coins.value >= cost, descNext: u.desc(Math.min(level + 1, u.max)), descCur: u.desc(level) }
  }))

  function buy(id) {
    const u = UPGRADES.find((x) => x.id === id)
    const level = levels.value[id] || 0
    if (!u || level >= u.max) return
    const cost = u.cost(level)
    if (coins.value < cost) return
    coins.value -= cost
    levels.value = { ...levels.value, [id]: level + 1 }
    persist()
  }

  return { coins, items, buy }
}
