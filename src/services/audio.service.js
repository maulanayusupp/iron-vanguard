// Procedural sound effects via the Web Audio API — no audio files needed.
// Everything is guarded so importing/using it in a non-browser (test) env is a
// harmless no-op. The AudioContext is created lazily on first use and must be
// resumed from a user gesture (browsers block autoplay), so call resume() from
// click/pointer handlers.

let ctx = null
let master = null
let noise = null
let muted = false
let lastShot = 0

function ensure() {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.5
    master.connect(ctx.destination)
    const len = Math.floor(ctx.sampleRate * 0.5)
    noise = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  } catch (e) {
    ctx = null
  }
  return ctx
}

function tone(type, f0, f1, dur, gain, t) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const audioService = {
  get muted() { return muted },

  resume() {
    const c = ensure()
    if (c && c.state === 'suspended') c.resume().catch(() => {})
  },

  toggleMute() {
    muted = !muted
    if (master) master.gain.value = muted ? 0 : 0.5
    return muted
  },

  shoot(freq = 420) {
    if (muted) return
    const c = ensure()
    if (!c) return
    const t = c.currentTime
    if (t - lastShot < 0.03) return // throttle machine-gun spam
    lastShot = t
    tone('square', freq, freq * 0.55, 0.07, 0.05, t)
  },

  explosion() {
    if (muted) return
    const c = ensure()
    if (!c) return
    const t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = noise
    const g = c.createGain()
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(1000, t)
    f.frequency.exponentialRampToValueAtTime(120, t + 0.3)
    g.gain.setValueAtTime(0.3, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
    src.connect(f)
    f.connect(g)
    g.connect(master)
    src.start(t)
    src.stop(t + 0.36)
  },

  skill() {
    if (muted) return
    const c = ensure()
    if (!c) return
    tone('sawtooth', 200, 1200, 0.35, 0.12, c.currentTime)
  },

  end(win) {
    if (muted) return
    const c = ensure()
    if (!c) return
    const t = c.currentTime
    const notes = win ? [523, 659, 784, 1046] : [392, 330, 262, 180]
    notes.forEach((f, i) => tone('triangle', f, f, 0.3, 0.16, t + i * 0.12))
  },
}
