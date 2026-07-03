// Endless "battle diorama" for the home screen. Reuses the real game sprites
// (drawEnemy / drawTower / drawHero) so the menu shows a never-ending war:
// waves of varied monsters march a winding road while turrets AND heroes
// (including the giant Overlord) blast them, with bosses, beams and explosions.
// Runs its own rAF loop; call stop() to end.

import { drawEnemy, drawTower, drawHero } from './sprites.js'
import { TOWERS } from './config/towers.js'
import { ENEMIES } from './config/enemies.js'
import { HEROES, RARITY } from './config/heroes.js'

const PATH = [
  [-0.06, 0.28], [0.24, 0.28], [0.24, 0.72], [0.52, 0.72], [0.52, 0.26], [0.8, 0.26], [1.06, 0.55],
]
// [fx, fy, kind, key]
const DEFENDERS = [
  [0.15, 0.55, 'tower', 'machinegun'], [0.38, 0.5, 'tower', 'tesla'],
  [0.52, 0.52, 'tower', 'railgun'], [0.68, 0.48, 'tower', 'plasma'],
  [0.38, 0.92, 'tower', 'cannon'], [0.82, 0.5, 'tower', 'sniper'],
  [0.3, 0.72, 'hero', 'overlord'], [0.62, 0.7, 'hero', 'frostqueen'],
]
const POOL = ['infantry', 'heavy', 'spider', 'hound', 'raptor', 'lighttank', 'drone', 'wasp', 'slime', 'brute', 'jeep', 'golem', 'imp', 'sapper', 'charger']
const BOSS_POOL = ['brute', 'juggernaut', 'golem', 'mech']
const rnd = () => Math.random()
const pick = (a) => a[Math.floor(rnd() * a.length)]

export class AmbientScene {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.enemies = []; this.beams = []; this.parts = []; this.defenders = []; this.pathPx = []
    this.spawnT = 0.3; this.bossT = 4; this.time = 0; this.last = 0
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
    this.defenders = DEFENDERS.map(([fx, fy, kind, key]) => ({
      kind, key, x: fx * this.w, y: fy * this.h, angle: 0, recoil: 0, cd: rnd(), level: 2,
      range: (kind === 'hero' ? 0.42 : 0.34) * this.w,
    }))
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
    const scale = Math.max(0.7, Math.min(1.25, this.w / 900))
    this.enemies.push({
      type: key, sprite: def.sprite, class: def.class, color: def.color, accent: def.accent,
      radius: def.radius * (boss ? 1.55 : 0.95) * scale, champion: false, waveBoss: !!boss,
      x: this.pathPx[0].x, y: this.pathPx[0].y, seg: 1, dist: 0, angle: 0,
      hp: boss ? 130 : 16, maxHp: boss ? 130 : 16, speed: def.speed * (boss ? 0.5 : 0.75) * scale,
      dead: false, done: false,
    })
  }

  update(dt) {
    // endless, dense stream
    this.spawnT -= dt
    if (this.spawnT <= 0 && this.enemies.length < 28) { this.spawnT = 0.45 + rnd() * 0.55; this._spawn(false) }
    this.bossT -= dt
    if (this.bossT <= 0) { this.bossT = 9 + rnd() * 6; this._spawn(true) }

    for (const e of this.enemies) {
      const tgt = this.pathPx[e.seg]
      if (!tgt) { e.done = true; continue }
      const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy) || 1
      e.angle = Math.atan2(dy, dx)
      const mv = e.speed * dt
      if (d <= mv) { e.x = tgt.x; e.y = tgt.y; e.seg++; e.dist += d } else { e.x += (dx / d) * mv; e.y += (dy / d) * mv; e.dist += mv }
    }
    this.enemies = this.enemies.filter((e) => !e.done && !e.dead)

    for (const t of this.defenders) {
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 7)
      t.cd -= dt
      let best = null, bd = t.range
      for (const e of this.enemies) { const dd = Math.hypot(e.x - t.x, e.y - t.y); if (dd <= bd) { bd = dd; best = e } }
      if (best) {
        t.angle = Math.atan2(best.y - t.y, best.x - t.x)
        const rate = t.kind === 'hero' ? 0.5 : 0.28
        if (t.cd <= 0) { t.cd = rate + rnd() * 0.15; t.recoil = 1; this._fire(t, best) }
      }
    }

    for (const p of this.parts) { p.life -= dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9 } }
    this.parts = this.parts.filter((p) => p.life > 0)
    for (const b of this.beams) b.life -= dt
    this.beams = this.beams.filter((b) => b.life > 0)
  }

  _fire(t, e) {
    const col = t.kind === 'hero' ? HEROES[t.key].color : TOWERS[t.key].color
    const bx = t.x + Math.cos(t.angle) * 18, by = t.y + Math.sin(t.angle) * 18
    this.beams.push({ a: [bx, by], b: [e.x, e.y], c: col, life: 0.06, w: t.kind === 'hero' ? 3 : 2 })
    this.parts.push({ type: 'flash', x: bx, y: by, c: col, life: 0.08, max: 0.08 })
    e.hp -= t.kind === 'hero' ? 9 : e.waveBoss ? 4 : 7
    for (let i = 0; i < 4; i++) { const a = rnd() * 7, s = 40 + rnd() * 90; this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: col, life: 0.25, max: 0.25, size: 2 }) }
    if (e.hp <= 0 && !e.dead) {
      e.dead = true
      this.parts.push({ type: 'ring', x: e.x, y: e.y, r: e.radius * (e.waveBoss ? 2.4 : 1.4), c: e.waveBoss ? '#f43f5e' : e.color, life: 0.34, max: 0.34 })
      for (let i = 0; i < (e.waveBoss ? 14 : 8); i++) { const a = rnd() * 7, s = 50 + rnd() * 140; this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: e.color, life: 0.4, max: 0.4, size: 2 + rnd() * 2 }) }
    }
  }

  render() {
    const ctx = this.ctx, W = this.w, H = this.h
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#0e1c31'); g.addColorStop(1, '#0a1020')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

    const trace = () => { ctx.beginPath(); this.pathPx.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))) }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.strokeStyle = '#1b2942'; ctx.lineWidth = Math.max(22, H * 0.13); trace(); ctx.stroke()
    ctx.setLineDash([10, 14]); ctx.strokeStyle = 'rgba(34,211,238,0.3)'; ctx.lineWidth = 3; trace(); ctx.stroke(); ctx.setLineDash([])

    for (const t of this.defenders) {
      if (t.kind === 'hero') drawHero(ctx, t, HEROES[t.key], RARITY[HEROES[t.key].rarity].color, this.time)
      else drawTower(ctx, t, TOWERS[t.key], t.angle, this.time)
    }
    for (const e of this.enemies) drawEnemy(ctx, e, this.time)

    for (const b of this.beams) { ctx.strokeStyle = b.c; ctx.globalAlpha = 0.9; ctx.lineWidth = b.w || 2; ctx.beginPath(); ctx.moveTo(b.a[0], b.a[1]); ctx.lineTo(b.b[0], b.b[1]); ctx.stroke(); ctx.globalAlpha = 1 }

    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.max)
      if (p.type === 'flash') {
        ctx.save(); ctx.globalAlpha = a
        const rg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 12)
        rg.addColorStop(0, '#fff'); rg.addColorStop(0.4, p.c); rg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p.x, p.y, 10 * a + 3, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        continue
      }
      if (p.type === 'ring') {
        const tt = 1 - a
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = p.c; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * tt + 4, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
        continue
      }
      ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, (p.size || 2) * a + 0.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
    }
  }
}
