<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import TopBar from '../game/TopBar.vue'
import BuildShop from '../game/BuildShop.vue'
import SkillBar from '../game/SkillBar.vue'
import SelectedPanel from '../game/SelectedPanel.vue'
import ResultOverlay from '../game/ResultOverlay.vue'
import DraftOverlay from '../game/DraftOverlay.vue'
import AppButton from '../ui/AppButton.vue'
import { useGame } from '../../composables/useGame.js'
import { useProgress } from '../../composables/useProgress.js'
import { levelService } from '../../services/level.service.js'
import { storageService } from '../../services/storage.service.js'
import { WIDTH, HEIGHT } from '../../game/config/maps.js'
import { t } from '../../i18n/index.js'

const props = defineProps({
  level: { type: Number, required: true },
  mode: { type: String, default: '' }, // '' | 'endless' | 'bossrush'
})
const emit = defineEmits(['exit', 'change-level'])

const { unlock, recordStars } = useProgress()
const {
  state, activeBuild, muted, mount, destroy,
  pickBuild, onPointerDown, onPointerMove, onPointerLeave,
  chooseModifier, startWave, upgrade, fuse, sell, useSkill, toggleSpeed, toggleMute, restart,
} = useGame()

const canvasRef = ref(null)
const maxLevel = levelService.MAX_LEVEL

const startLabel = computed(() => {
  if (state.status === 'won') return t('game.victory')
  if (state.status === 'lost') return t('game.defeated')
  if (state.waveActive) return t('game.waveGoing', { n: state.wave + 1 })
  return t('game.startWave', { n: Math.min(state.wave + 1, state.totalWaves) })
})

const activeKey = computed(() => (activeBuild.value ? activeBuild.value.key : null))

function levelConfig() {
  if (props.mode === 'endless') return levelService.getEndless()
  if (props.mode === 'bossrush') return levelService.getBossRush()
  if (props.mode === 'puzzle') return levelService.getPuzzle(props.level)
  return levelService.getConfig(props.level)
}

watch(() => state.status, (s) => {
  if (s === 'playing') return
  if (props.mode === 'puzzle') { if (s === 'won') storageService.markPuzzle(props.level); return }
  if (props.mode) { storageService.setBest(props.mode, state.wave); return }
  if (s === 'won') { unlock(props.level + 1); recordStars(props.level, state.stars) }
})

onMounted(() => mount(canvasRef.value, levelConfig()))
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

        <div v-if="state.combo >= 4" class="combo">
          🔥 {{ state.combo }} COMBO <span>+{{ Math.round((state.comboMult - 1) * 100) }}% gold</span>
        </div>

        <div v-if="state.announce.text" class="announce" :key="state.announce.id" aria-hidden="true">
          <span class="announce__text" v-accent="state.announce.color">{{ state.announce.text }}</span>
        </div>

        <DraftOverlay v-if="state.drafting" :choices="state.draftChoices" @pick="chooseModifier" />

        <div class="hud-top">
          <button class="hud-btn" @click="toggleMute">{{ muted ? '🔇' : '🔊' }}</button>
          <button class="hud-btn" @click="toggleSpeed">{{ state.speed }}×</button>
        </div>

        <ResultOverlay
          v-if="state.status !== 'playing'"
          :status="state.status" :level="props.level" :kills="state.kills" :stars="state.stars"
          :wave="state.wave" :total-waves="state.totalWaves" :max-level="maxLevel" :mode="mode"
          @next="emit('change-level', state.level + 1)"
          @retry="restart"
          @menu="emit('exit')"
        />
      </div>

      <aside class="panel">
        <AppButton
          variant="wave"
          :disabled="state.waveActive || state.status !== 'playing' || state.drafting"
          @click="startWave"
        >{{ state.drafting ? t('game.pickMod') : startLabel }}</AppButton>

        <BuildShop
          :money="state.money" :deployed="state.deployed" :active-key="activeKey"
          :allowed="state.allowed" :heroes-locked="state.heroesLocked"
          @pick="pickBuild"
        />

        <SelectedPanel
          v-if="state.selectedInfo"
          :info="state.selectedInfo"
          @upgrade="upgrade" @fuse="fuse" @sell="sell"
        />

        <p class="panel__hint">{{ t('game.hint') }}</p>
      </aside>
    </div>
  </div>
</template>
