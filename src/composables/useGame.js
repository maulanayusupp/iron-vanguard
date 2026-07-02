import { reactive, ref } from 'vue'
import { Game } from '../game/Game.js'
import { audioService } from '../services/audio.service.js'

// Encapsulates the engine instance, its reactive HUD state, and every action
// the UI can trigger. Components stay presentational and call these methods.
export function useGame() {
  const state = reactive({
    level: 1, chapter: 1, themeName: '', mapName: '',
    money: 0, baseHp: 0, maxBaseHp: 0, wave: 0, totalWaves: 0, kills: 0,
    status: 'playing', waveActive: false, speed: 1, selectedInfo: null,
    heroSkills: [], deployed: [],
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

  function startWave() { audioService.resume(); activeBuild.value = null; game.setBuild(null, null); game.startWave() }
  function upgrade() { game.upgradeSelected() }
  function sell() { game.sellSelected() }
  function useSkill(key) { audioService.resume(); game.useSkill(key) }
  function toggleSpeed() { game.setSpeed(state.speed === 1 ? 2 : 1) }
  function toggleMute() { muted.value = audioService.toggleMute() }
  function restart() { game.restart(); activeBuild.value = null }

  return {
    state, activeBuild, muted,
    mount, destroy,
    pickBuild, onPointerDown, onPointerMove, onPointerLeave,
    startWave, upgrade, sell, useSkill, toggleSpeed, toggleMute, restart,
  }
}
