import { reactive, ref } from 'vue'
import { Game } from '../game/Game.js'
import { audioService } from '../services/audio.service.js'

// Encapsulates the engine instance, its reactive HUD state, and every action
// the UI can trigger. Components stay presentational and call these methods.
export function useGame() {
  // NOTE: keep every field the template reads defined here — the game screen
  // renders BEFORE the engine's reset() runs (reset happens in onMounted), so
  // any missing field (e.g. announce.text) would crash the first render.
  const state = reactive({
    level: 1, chapter: 1, themeName: '', mapName: '',
    money: 0, baseHp: 0, maxBaseHp: 0, wave: 0, totalWaves: 0, kills: 0,
    status: 'playing', waveActive: false, speed: 1, selectedInfo: null,
    heroSkills: [], deployed: [], stars: 0,
    combo: 0, comboMult: 1, announce: { id: 0, text: '', color: '#e2e8f0' },
    drafting: false, modName: '', draftChoices: [],
    allowed: null, heroesLocked: false,
    event: null, overdrive: 0, odActive: false,
    prep: 0, nextWave: null,
  })
  const activeBuild = ref(null) // { kind, key } | null
  const muted = ref(audioService.muted)
  let game = null

  function mount(canvasEl, level) {
    if (game) game.stop()
    game = new Game(canvasEl, state, level)
    game.start()
    activeBuild.value = null
  }
  function destroy() { if (game) game.stop() }

  function pickBuild(kind, key) {
    audioService.resume()
    const cur = activeBuild.value
    if (cur && cur.kind === kind && cur.key === key) {
      activeBuild.value = null
      game.setBuild(null, null)
    } else {
      activeBuild.value = { kind, key }
      game.setBuild(kind, key)
    }
  }

  function onPointerDown(e) {
    audioService.resume()
    game.handlePointer(e.clientX, e.clientY)
    if (!game.build) activeBuild.value = null // consumed / deselected
  }
  function onPointerMove(e) { if (game) game.handleMove(e.clientX, e.clientY) }
  function onPointerLeave() { if (game) game.handleLeave() }

  function chooseModifier(id) { audioService.resume(); game.chooseModifier(id) }
  function startWave() { audioService.resume(); activeBuild.value = null; game.setBuild(null, null); game.startWave() }
  function upgrade() { game.upgradeSelected() }
  function fuse() { game.fuseSelected() }
  function sell() { game.sellSelected() }
  function useSkill(key) { audioService.resume(); game.useSkill(key) }
  function toggleSpeed() { game.setSpeed(state.speed === 1 ? 2 : 1) }
  function toggleMute() { muted.value = audioService.toggleMute() }
  function restart() { game.restart(); activeBuild.value = null }

  return {
    state, activeBuild, muted,
    mount, destroy,
    pickBuild, onPointerDown, onPointerMove, onPointerLeave,
    chooseModifier, startWave, upgrade, fuse, sell, useSkill, toggleSpeed, toggleMute, restart,
  }
}
