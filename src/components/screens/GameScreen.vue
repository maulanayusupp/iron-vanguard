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
import { addCoins } from '../../composables/useBarracks.js'
import { runCoins } from '../../game/config/barracks.js'
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
  if (state.prep > 0) return `⏩ ${t('game.sendEarly')} (${Math.ceil(state.prep)}s)`
  return t('game.startWave', { n: Math.min(state.wave + 1, state.totalWaves) })
})

const activeKey = computed(() => (activeBuild.value ? activeBuild.value.key : null))

function levelConfig() {
  if (props.mode === 'endless') return levelService.getEndless()
  if (props.mode === 'bossrush') return levelService.getBossRush()
  if (props.mode === 'puzzle') return levelService.getPuzzle(props.level)
  return levelService.getConfig(props.level)
}

const earnedCoins = ref(0)

watch(() => state.status, (s) => {
  if (s === 'playing') return
  earnedCoins.value = runCoins(state)      // coins every run, win or lose
  addCoins(earnedCoins.value)
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

        <div v-if="state.event" class="event-badge" :class="{ bad: state.event.bad }" v-accent="state.event.color">
          <span class="event-badge__icon">{{ state.event.icon }}</span>
          <span class="event-badge__body">
            <b>{{ state.event.name }}</b>
            <span class="event-badge__bar"><i :style="{ width: (state.event.timeLeft / state.event.dur * 100) + '%' }"></i></span>
          </span>
        </div>

        <div v-if="state.odActive" class="overdrive">
          <span class="overdrive__label">⚡ OVERDRIVE ×2</span>
          <span class="overdrive__bar"><i :style="{ width: state.overdrive * 100 + '%' }"></i></span>
        </div>

        <DraftOverlay v-if="state.drafting" :choices="state.draftChoices" @pick="chooseModifier" />

        <div class="hud-top">
          <button class="hud-btn" @click="toggleMute">{{ muted ? '🔇' : '🔊' }}</button>
          <button class="hud-btn" @click="toggleSpeed">{{ state.speed }}×</button>
        </div>

        <ResultOverlay
          v-if="state.status !== 'playing'"
          :status="state.status" :level="props.level" :kills="state.kills" :stars="state.stars"
          :wave="state.wave" :total-waves="state.totalWaves" :max-level="maxLevel" :mode="mode" :coins="earnedCoins"
          @next="emit('change-level', state.level + 1)"
          @retry="restart"
          @menu="emit('exit')"
        />
      </div>

      <aside class="panel">
        <div v-if="state.nextWave && !state.waveActive && !state.drafting" class="preview">
          <span class="preview__label">{{ t('game.next') }}</span>
          <span class="preview__units">
            <span v-for="u in state.nextWave.types" :key="u.key" class="preview__unit">
              <i v-accent="u.color"></i>{{ u.count }}
            </span>
          </span>
          <span v-if="state.nextWave.boss" class="preview__tag preview__tag--boss">☠</span>
          <span v-if="state.nextWave.air" class="preview__tag preview__tag--air">✈</span>
        </div>

        <AppButton
          variant="wave"
          :disabled="state.waveActive || state.status !== 'playing' || state.drafting"
          @click="startWave"
        >{{ state.drafting ? t('game.pickMod') : startLabel }}</AppButton>
        <div v-if="state.prep > 0" class="prep-bar"><i :style="{ width: (state.prep / 6 * 100) + '%' }"></i></div>

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
