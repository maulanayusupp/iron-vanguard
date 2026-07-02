<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import TopBar from '../game/TopBar.vue'
import BuildShop from '../game/BuildShop.vue'
import SkillBar from '../game/SkillBar.vue'
import SelectedPanel from '../game/SelectedPanel.vue'
import ResultOverlay from '../game/ResultOverlay.vue'
import AppButton from '../ui/AppButton.vue'
import { useGame } from '../../composables/useGame.js'
import { useProgress } from '../../composables/useProgress.js'
import { levelService } from '../../services/level.service.js'
import { WIDTH, HEIGHT } from '../../game/config/maps.js'

const props = defineProps({ level: { type: Number, required: true } })
const emit = defineEmits(['exit', 'change-level'])

const { unlock, recordStars } = useProgress()
const {
  state, activeBuild, muted, mount, destroy,
  pickBuild, onPointerDown, onPointerMove, onPointerLeave,
  startWave, upgrade, sell, useSkill, toggleSpeed, toggleMute, restart,
} = useGame()

const canvasRef = ref(null)
const maxLevel = levelService.MAX_LEVEL

const startLabel = computed(() => {
  if (state.status === 'won') return 'Victory!'
  if (state.status === 'lost') return 'Defeated'
  if (state.waveActive) return `Wave ${state.wave + 1}…`
  return `▶ Start Wave ${Math.min(state.wave + 1, state.totalWaves)}`
})

const activeKey = computed(() => (activeBuild.value ? activeBuild.value.key : null))

watch(() => state.status, (s) => {
  if (s === 'won') { unlock(props.level + 1); recordStars(props.level, state.stars) }
})

onMounted(() => mount(canvasRef.value, levelService.getConfig(props.level)))
onUnmounted(destroy)
</script>

<template>
  <div class="game">
    <TopBar :state="state" @menu="emit('exit')" />

    <div class="stage">
      <div class="canvas-wrap">
        <canvas
          ref="canvasRef" :width="WIDTH" :height="HEIGHT"
          @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerleave="onPointerLeave"
        ></canvas>

        <SkillBar :skills="state.heroSkills" @use="useSkill" />

        <div class="hud-top">
          <button class="hud-btn" @click="toggleMute">{{ muted ? '🔇' : '🔊' }}</button>
          <button class="hud-btn" @click="toggleSpeed">{{ state.speed }}×</button>
        </div>

        <ResultOverlay
          v-if="state.status !== 'playing'"
          :status="state.status" :level="state.level" :kills="state.kills" :stars="state.stars"
          :wave="state.wave" :total-waves="state.totalWaves" :max-level="maxLevel"
          @next="emit('change-level', state.level + 1)"
          @retry="restart"
          @menu="emit('exit')"
        />
      </div>

      <aside class="panel">
        <AppButton
          variant="wave"
          :disabled="state.waveActive || state.status !== 'playing'"
          @click="startWave"
        >{{ startLabel }}</AppButton>

        <BuildShop
          :money="state.money" :deployed="state.deployed" :active-key="activeKey"
          @pick="pickBuild"
        />

        <SelectedPanel
          v-if="state.selectedInfo"
          :info="state.selectedInfo"
          @upgrade="upgrade" @sell="sell"
        />

        <p class="panel__hint">
          Pick a tower/hero, then tap a dark tile to place. Tap a placed unit to
          upgrade / sell. Heroes give an aura + an active skill.
        </p>
      </aside>
    </div>
  </div>
</template>
