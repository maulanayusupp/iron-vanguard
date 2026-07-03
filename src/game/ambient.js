// Lightweight ambient "battle diorama" for the home screen. It reuses the real
// game sprites (drawEnemy / drawTower) so the menu shows an authentic, living
// preview: enemies march a winding road, turrets track & fire tracers, a giant
// wave boss appears now and then. It runs its own rAF loop; call stop() to end.

import { drawEnemy, drawTower } from './sprites.js'
import { TOWERS } from './config/towers.js'
import { ENEMIES } from './config/enemies.js'

const PATH = [
  [-0.06, 0.3], [0.26, 0.3], [0.26, 0.72], [0.55, 0.72], [0.55, 0.28], [0.82, 0.28], [1.06, 0.55],
]
const TOWER_SPOTS = [
  [0.15, 0.58, 'machinegun'], [0.4, 0.5, 'tesla'], [0.55, 0.52, 'rocket'],
  [0.7, 0.5, 'sniper'], [0.4, 0.92, 'cannon'],
]
const POOL = ['soldier', 'soldier_heavy', 'spider', 'hound', 'tank', 'drone', 'wasp', 'slime', 'brute', 'jeep', 'golem', 'mech']
const BOSS_POOL = ['brute', 'mech', 'golem']
const rnd = () => Math.random()
const pick = (a) => a[Math.floor(rnd() * a.length)]

export class AmbientScene {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.enemies = []; this.beams = []; this.parts = []; this.towers = []; this.pathPx = []
    this.spawnT = 0.4; this.bossT = 5; this.time = 0; this.last = 0
    this.w = 1; this.h = 1; this.dpr = 1; this.running = false
    this._loop = this._loop.bind(this)
  }

  resize() {
    const r = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height)
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.pathPx = PATH.map(([fx, fy]) => ({ x: fx * this.w, y: fy * this.h }))
    this.towers = TOWER_SPOTS.map(([fx, fy, key]) => ({ key, x: fx * this.w, y: fy * this.h, level: 2, angle: 0, recoil: 0, cd: rnd() }))
  }

  start() {
    if (this.running) return
    this.running = true
    this.resize()
    if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.canvas) }
    requestAnimationFrame(this._loop)
  }
  stop() { this.running = false; if (this.ro) this.ro.disconnect() }

  _loop(ts) {
    if (!this.running) return
    if (!this.last) this.last = ts
    let dt = (ts - this.last) / 1000; this.last = ts
    if (dt > 0.05) dt = 0.05
    this.time += dt
    this.update(dt); this.render()
    requestAnimationFrame(this._loop)
  }

  _spawn(boss) {
    const key = boss ? pick(BOSS_POOL) : pick(POOL)
    const def = ENEMIES[key]
    const scale = this.w / 900
    this.enemies.push({
      type: key, sprite: def.sprite, class: def.class, color: def.color, accent: def.accent,
      radius: def.radius * (boss ? 1.5 : 0.95) * Math.max(0.7, Math.min(1.2, scale)),
      champion: false, waveBoss: !!boss,
      x: this.pathPx[0].x, y: this.pathPx[0].y, seg: 1, dist: 0, angle: 0,
      hp: boss ? 90 : 16, maxHp: boss ? 90 : 16, speed: def.speed * (boss ? 0.5 : 0.72) * scale,
      dead: false, done: false,
    })
  }

  update(dt) {
    this.spawnT -= dt
    if (this.spawnT <= 0) { this.spawnT = 0.7 + rnd() * 0.8; this._spawn(false) }
    this.bossT -= dt
    if (this.bossT <= 0) { this.bossT = 11 + rnd() * 6; this._spawn(true) }

    for (const e of this.enemies) {
      const tgt = this.pathPx[e.seg]
      if (!tgt) { e.done = true; continue }
      const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy) || 1
      e.angle = Math.atan2(dy, dx)
      const mv = e.speed * dt
      if (d <= mv) { e.x = tgt.x; e.y = tgt.y; e.seg++; e.dist += d } else { e.x += (dx / d) * mv; e.y += (dy / d) * mv; e.dist += mv }
    }
    this.enemies = this.enemies.filter((e) => !e.done && !e.dead)

    for (const t of this.towers) {
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 7)
      t.cd -= dt
      const range = 0.34 * this.w
      let best = null, bd = range
      for (const e of this.enemies) { const dd = Math.hypot(e.x - t.x, e.y - t.y); if (dd <= bd) { bd = dd; best = e } }
      if (best) { t.angle = Math.atan2(best.y - t.y, best.x - t.x); if (t.cd <= 0) { t.cd = 0.24 + rnd() * 0.22; t.recoil = 1; this._fire(t, TOWERS[t.key], best) } }
    }

    for (const p of this.parts) { p.life -= dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9 } }
    this.parts = this.parts.filter((p) => p.life > 0)
    for (const b of this.beams) b.life -= dt
    this.beams = this.beams.filter((b) => b.life > 0)
  }

  _fire(t, def, e) {
    const bx = t.x + Math.cos(t.angle) * 16, by = t.y + Math.sin(t.angle) * 16
    this.beams.push({ a: [bx, by], b: [e.x, e.y], c: def.color, life: 0.06 })
    this.parts.push({ type: 'flash', x: bx, y: by, c: def.color, life: 0.08, max: 0.08 })
    e.hp -= e.waveBoss ? 5 : 7
    for (let i = 0; i < 4; i++) { const a = rnd() * 7, s = 40 + rnd() * 90; this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: def.color, life: 0.25, max: 0.25, size: 2 }) }
    if (e.hp <= 0 && !e.dead) {
      e.dead = true
      for (let i = 0; i < 9; i++) { const a = rnd() * 7, s = 50 + rnd() * 130; this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: e.color, life: 0.4, max: 0.4, size: 2 + rnd() * 2 }) }
    }
  }

  render() {
    const ctx = this.ctx, W = this.w, H = this.h
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#0e1c31'); g.addColorStop(1, '#0a1020')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

    // road
    const trace = () => { ctx.beginPath(); this.pathPx.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))) }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.strokeStyle = '#1b2942'; ctx.lineWidth = Math.max(22, H * 0.13); trace(); ctx.stroke()
    ctx.setLineDash([10, 14]); ctx.strokeStyle = 'rgba(34,211,238,0.3)'; ctx.lineWidth = 3; trace(); ctx.stroke(); ctx.setLineDash([])

    for (const t of this.towers) drawTower(ctx, t, TOWERS[t.key], t.angle, this.time)
    for (const e of this.enemies) drawEnemy(ctx, e, this.time)

    for (const b of this.beams) { ctx.strokeStyle = b.c; ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.a[0], b.a[1]); ctx.lineTo(b.b[0], b.b[1]); ctx.stroke(); ctx.globalAlpha = 1 }

    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.max)
      if (p.type === 'flash') {
        ctx.save(); ctx.globalAlpha = a
        const rg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 12)
        rg.addColorStop(0, '#fff'); rg.addColorStop(0.4, p.c); rg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p.x, p.y, 10 * a + 3, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        continue
      }
      ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, (p.size || 2) * a + 0.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
    }
  }
}
