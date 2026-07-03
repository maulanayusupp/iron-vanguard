<script setup>
// Renders a small thumbnail of a tower/hero using the real in-game sprite
// (drawTower / drawHero), so the shop shows actual unit shapes, not just dots.
import { ref, onMounted, watch } from 'vue'
import { drawTower, drawHero } from '../../game/sprites.js'
import { TOWERS } from '../../game/config/towers.js'
import { HEROES, RARITY } from '../../game/config/heroes.js'

const props = defineProps({
  kind: { type: String, required: true }, // 'tower' | 'hero'
  itemKey: { type: String, required: true },
})
const el = ref(null)

function render() {
  const c = el.value
  if (!c) return
  const size = 42
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = size * dpr
  c.height = size * dpr
  const ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.scale(0.52, 0.52) // fit the ~s=20 sprite (long barrels included) into the tile
  if (props.kind === 'tower') {
    drawTower(ctx, { x: 0, y: 0, level: 1, recoil: 0 }, TOWERS[props.itemKey], -Math.PI / 6, 0.6)
  } else {
    const def = HEROES[props.itemKey]
    drawHero(ctx, { x: 0, y: 0, angle: -Math.PI / 6, recoil: 0, key: props.itemKey }, def, RARITY[def.rarity].color, 0.6)
  }
  ctx.restore()
}

onMounted(render)
watch(() => [props.kind, props.itemKey], render)
</script>

<template>
  <canvas ref="el" class="unit-icon"></canvas>
</template>
