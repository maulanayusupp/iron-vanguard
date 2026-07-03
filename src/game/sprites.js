// ---------------------------------------------------------------------------
// Vector sprite drawing (top-down), no image assets. Units face +x and are
// rotated to their heading/target. Animation is driven by `anim`:
//   anim.spin  – global time phase (idle wobble, rotors, glow)
//   anim.walk  – distance-based phase (leg/gait cycles, treads)
// Towers/heroes read a `recoil` value (0..1) from their object to kick back.
// ---------------------------------------------------------------------------

import { roundRect as rr } from '../helpers/canvas.js'
import { shade } from '../helpers/color.js'

const TAU = Math.PI * 2

// Body drawing wrapper. Kept as a hook (shadowBlur was too costly with large
// hordes, so separation now comes from each unit's ground-shadow ellipse).
function outline(ctx, draw) {
  draw()
}

// Two-segment articulated limb from (x,y) to foot, bending at a knee.
function limb(ctx, x, y, footX, footY, bend, w, color) {
  const mx = (x + footX) / 2 + bend, my = (y + footY) / 2 + bend * 0.2
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(mx, my); ctx.lineTo(footX, footY); ctx.stroke()
}

// ---- HUMANS ---------------------------------------------------------------

function soldier(ctx, r, color, accent, heavy, anim) {
  const dk = shade(color, -34), lt = shade(color, 18)
  const w = anim ? anim.walk : 0
  const stride = Math.sin(w * 1.4) * r * 0.28
  // legs (walking)
  ctx.strokeStyle = dk; ctx.lineWidth = r * 0.24; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.3); ctx.lineTo(-r * 0.1 + stride, -r * 0.72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-r * 0.1, r * 0.3); ctx.lineTo(-r * 0.1 - stride, r * 0.72); ctx.stroke()
  // backpack
  ctx.fillStyle = dk; rr(ctx, -r * 0.72, -r * 0.4, r * 0.4, r * 0.8, r * 0.16); ctx.fill()
  // torso
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.56, r * 0.72, 0, 0, TAU); ctx.fill()
  // arms holding the rifle
  ctx.strokeStyle = shade(color, -10); ctx.lineWidth = r * 0.22
  ctx.beginPath(); ctx.moveTo(0, -r * 0.4); ctx.lineTo(r * 0.5, -r * 0.14); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, r * 0.4); ctx.lineTo(r * 0.5, r * 0.14); ctx.stroke()
  // rifle
  ctx.fillStyle = '#0b0e14'; rr(ctx, r * 0.1, -r * 0.14, r * 0.28, r * 0.28, r * 0.06); ctx.fill()
  ctx.fillStyle = '#111827'; ctx.fillRect(r * 0.3, -r * 0.07, r * (heavy ? 1.35 : 1.1), r * 0.14)
  // helmet + face shadow
  const hg = ctx.createRadialGradient(r * 0.02, -r * 0.12, 1, r * 0.06, 0, r * 0.44)
  hg.addColorStop(0, shade(accent, 40)); hg.addColorStop(1, accent)
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(r * 0.08, 0, r * 0.42, 0, TAU); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(r * 0.22, 0, r * 0.16, 0, TAU); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(-r * 0.04, -r * 0.14, r * 0.12, 0, TAU); ctx.fill()
  if (heavy) { ctx.strokeStyle = dk; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.56, r * 0.72, 0, 0, TAU); ctx.stroke() }
}

function medic(ctx, r, color, accent, anim) {
  soldier(ctx, r, '#e5e7eb', '#f3f4f6', false, anim)
  ctx.fillStyle = '#dc2626'
  ctx.fillRect(-r * 0.07, -r * 0.22, r * 0.14, r * 0.44)
  ctx.fillRect(-r * 0.22, -r * 0.07, r * 0.44, r * 0.14)
}

function shieldUnit(ctx, r, color, accent, anim) {
  soldier(ctx, r, color, accent, true, anim)
  const g = ctx.createLinearGradient(r * 0.55, 0, r * 0.95, 0)
  g.addColorStop(0, shade(accent, 12)); g.addColorStop(1, shade(accent, -22))
  ctx.fillStyle = g; rr(ctx, r * 0.55, -r * 0.85, r * 0.34, r * 1.7, r * 0.1); ctx.fill()
  ctx.strokeStyle = 'rgba(226,232,240,0.75)'; ctx.lineWidth = 2; ctx.stroke()
}

// ---- VEHICLES -------------------------------------------------------------

function treads(ctx, r, walk) {
  ctx.fillStyle = '#0f131b'
  rr(ctx, -r * 0.98, -r * 0.98, r * 1.96, r * 0.42, r * 0.12); ctx.fill()
  rr(ctx, -r * 0.98, r * 0.56, r * 1.96, r * 0.42, r * 0.12); ctx.fill()
  ctx.fillStyle = '#2a3140'
  const off = (walk * r * 0.5) % (r * 0.28)
  for (let i = -4; i <= 4; i++) {
    const x = i * r * 0.28 - off
    if (x > -r * 0.95 && x < r * 0.9) {
      ctx.fillRect(x, -r * 0.96, r * 0.09, r * 0.38)
      ctx.fillRect(x, r * 0.58, r * 0.09, r * 0.38)
    }
  }
}

function tank(ctx, r, color, accent, heavy, anim) {
  const dk = shade(color, -35), lt = shade(color, 16)
  treads(ctx, r, anim ? anim.walk : 0)
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g; rr(ctx, -r * 0.8, -r * 0.58, r * 1.6, r * 1.16, r * 0.18); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; rr(ctx, -r * 0.7, -r * 0.48, r * 1.2, r * 0.3, r * 0.1); ctx.fill()
  ctx.fillStyle = shade(color, -12); ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.5, 0, TAU); ctx.fill()
  ctx.fillStyle = lt; ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.3, 0, TAU); ctx.fill()
  ctx.fillStyle = '#0b0e14'; ctx.fillRect(r * 0.2, -r * 0.1, r * (heavy ? 1.42 : 1.15), r * 0.2)
  if (heavy) { ctx.fillRect(r * 0.2, -r * 0.34, r * 1.1, r * 0.13); ctx.fillRect(r * 0.2, r * 0.21, r * 1.1, r * 0.13) }
}

function jeep(ctx, r, color, accent, anim) {
  const dk = shade(color, -30)
  const spin = (anim ? anim.walk : 0) * 6
  ctx.fillStyle = '#0b0e14'
  for (const wx of [-r * 0.55, r * 0.55]) for (const wy of [-r * 0.72, r * 0.72]) {
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(spin)
    rr(ctx, -r * 0.2, -r * 0.14, r * 0.4, r * 0.28, r * 0.08); ctx.fill()
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.12, 0); ctx.lineTo(r * 0.12, 0); ctx.stroke()
    ctx.restore()
  }
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, shade(color, 14)); g.addColorStop(1, dk)
  ctx.fillStyle = g; rr(ctx, -r * 0.75, -r * 0.56, r * 1.5, r * 1.12, r * 0.18); ctx.fill()
  ctx.fillStyle = dk; rr(ctx, -r * 0.5, -r * 0.4, r * 0.68, r * 0.8, r * 0.12); ctx.fill()
  ctx.fillStyle = 'rgba(150,200,255,0.5)'; rr(ctx, r * 0.04, -r * 0.4, r * 0.16, r * 0.8, r * 0.05); ctx.fill()
  ctx.fillStyle = '#111827'; ctx.fillRect(-r * 0.1, -r * 0.06, r * 0.95, r * 0.12)
}

function apc(ctx, r, color, accent, anim) {
  const dk = shade(color, -30), lt = shade(color, 12)
  const spin = (anim ? anim.walk : 0) * 6
  ctx.fillStyle = '#0b0e14'
  for (const wx of [-r * 0.58, 0, r * 0.58]) for (const wy of [-r * 0.74, r * 0.74]) {
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(spin)
    rr(ctx, -r * 0.16, -r * 0.13, r * 0.32, r * 0.26, r * 0.07); ctx.fill(); ctx.restore()
  }
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g; rr(ctx, -r * 0.85, -r * 0.6, r * 1.7, r * 1.2, r * 0.16); ctx.fill()
  ctx.fillStyle = lt; rr(ctx, r * 0.32, -r * 0.48, r * 0.5, r * 0.96, r * 0.12); ctx.fill()
  ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.28, 0, TAU); ctx.fill()
  ctx.fillStyle = '#111827'; ctx.fillRect(r * 0.1, -r * 0.06, r * 0.85, r * 0.12)
}

function drone(ctx, r, color, accent, anim) {
  const spin = (anim ? anim.spin : 0) * 24
  ctx.strokeStyle = shade(color, -25); ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.moveTo(-r * 0.7, r * 0.7); ctx.lineTo(r * 0.7, -r * 0.7); ctx.stroke()
  ctx.fillStyle = 'rgba(200,220,255,0.16)'
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(ox * r * 0.7, oy * r * 0.7, r * 0.46, 0, TAU); ctx.fill() }
  ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = r * 0.06
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.save(); ctx.translate(ox * r * 0.7, oy * r * 0.7); ctx.rotate(spin)
    ctx.beginPath(); ctx.moveTo(-r * 0.42, 0); ctx.lineTo(r * 0.42, 0); ctx.stroke(); ctx.restore()
  }
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.5); g.addColorStop(0, shade(color, 25)); g.addColorStop(1, color)
  ctx.fillStyle = g; rr(ctx, -r * 0.4, -r * 0.3, r * 0.8, r * 0.6, r * 0.2); ctx.fill()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.15, 0, r * 0.16, 0, TAU); ctx.fill()
}

function heli(ctx, r, color, accent, anim) {
  const spin = (anim ? anim.spin : 0) * 14
  const dk = shade(color, -25)
  ctx.fillStyle = dk; rr(ctx, -r * 1.5, -r * 0.1, r * 1.1, r * 0.2, r * 0.08); ctx.fill()
  ctx.save(); ctx.translate(-r * 1.5, 0); ctx.fillStyle = dk; ctx.fillRect(-r * 0.1, -r * 0.3, r * 0.16, r * 0.6)
  ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = r * 0.05; ctx.rotate(spin * 2)
  ctx.beginPath(); ctx.moveTo(0, -r * 0.34); ctx.lineTo(0, r * 0.34); ctx.stroke(); ctx.restore()
  const g = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6); g.addColorStop(0, shade(color, 18)); g.addColorStop(1, dk)
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(r * 0.1, 0, r * 0.85, r * 0.5, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = 'rgba(140,200,255,0.55)'; ctx.beginPath(); ctx.ellipse(r * 0.6, 0, r * 0.26, r * 0.32, 0, 0, TAU); ctx.fill()
  ctx.strokeStyle = '#0b0e14'; ctx.lineWidth = r * 0.07
  ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.6); ctx.lineTo(r * 0.5, -r * 0.6); ctx.moveTo(-r * 0.3, r * 0.6); ctx.lineTo(r * 0.5, r * 0.6); ctx.stroke()
  ctx.save(); ctx.translate(r * 0.1, 0); ctx.rotate(spin)
  ctx.fillStyle = 'rgba(200,220,255,0.10)'; ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, TAU); ctx.fill()
  ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.lineWidth = r * 0.1
  ctx.beginPath(); ctx.moveTo(-r * 1.25, 0); ctx.lineTo(r * 1.25, 0); ctx.moveTo(0, -r * 1.25); ctx.lineTo(0, r * 1.25); ctx.stroke()
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, TAU); ctx.fill(); ctx.restore()
}

function mech(ctx, r, color, accent, anim) {
  const spin = anim ? anim.spin : 0
  const w = anim ? anim.walk : 0
  const dk = shade(color, -38), lt = shade(color, 18)
  const step = Math.sin(w) * r * 0.18
  // legs step
  ctx.fillStyle = dk
  rr(ctx, -r * 0.3 + step, -r * 0.95, r * 0.5, r * 0.55, r * 0.12); ctx.fill()
  rr(ctx, -r * 0.3 - step, r * 0.4, r * 0.5, r * 0.55, r * 0.12); ctx.fill()
  ctx.fillStyle = shade(color, -48)
  rr(ctx, r * 0.15 + step, -r * 0.98, r * 0.38, r * 0.45, r * 0.1); ctx.fill()
  rr(ctx, r * 0.15 - step, r * 0.53, r * 0.38, r * 0.45, r * 0.1); ctx.fill()
  // shoulder cannons
  ctx.fillStyle = '#0b0e14'; ctx.fillRect(r * 0.1, -r * 0.95, r * 1.25, r * 0.28); ctx.fillRect(r * 0.1, r * 0.67, r * 1.25, r * 0.28)
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 1.35, -r * 0.81, r * 0.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 1.35, r * 0.81, r * 0.1, 0, TAU); ctx.fill()
  // torso
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g; rr(ctx, -r * 0.55, -r * 0.7, r * 1.15, r * 1.4, r * 0.24); ctx.fill()
  ctx.fillStyle = shade(color, -16); rr(ctx, r * 0.22, -r * 0.32, r * 0.48, r * 0.64, r * 0.18); ctx.fill()
  const pulse = 0.55 + 0.45 * Math.sin(spin * 7)
  const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.4); cg.addColorStop(0, accent); cg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = pulse; ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
  ctx.fillStyle = shade(accent, 40); ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, TAU); ctx.fill()
}

// ---- MONSTERS -------------------------------------------------------------

function spider(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0
  const legc = shade(color, -25)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const ax = (-0.35 + i * 0.22) * r
      const ph = w * 1.6 + i * 1.1 + (side < 0 ? Math.PI : 0)
      const step = Math.sin(ph) * r * 0.22
      const footX = ax + r * 0.55 + step
      const footY = side * (r * 1.05 + Math.cos(ph) * r * 0.12)
      limb(ctx, ax, side * r * 0.2, footX, footY, side * r * 0.35, r * 0.1, legc)
    }
  }
  // abdomen
  const g = ctx.createRadialGradient(-r * 0.45, -r * 0.2, 1, -r * 0.4, 0, r * 0.8)
  g.addColorStop(0, shade(color, 30)); g.addColorStop(1, color)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-r * 0.35, 0, r * 0.62, r * 0.55, 0, 0, TAU); ctx.fill() })
  ctx.strokeStyle = accent; ctx.lineWidth = r * 0.06
  ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.1, r * 0.2); ctx.moveTo(-r * 0.6, r * 0.2); ctx.lineTo(-r * 0.1, -r * 0.2); ctx.stroke()
  // cephalothorax
  ctx.fillStyle = shade(color, -12); ctx.beginPath(); ctx.ellipse(r * 0.42, 0, r * 0.4, r * 0.34, 0, 0, TAU); ctx.fill()
  // mandibles
  ctx.strokeStyle = accent; ctx.lineWidth = r * 0.08
  ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.12); ctx.lineTo(r * 0.95, -r * 0.02); ctx.moveTo(r * 0.75, r * 0.12); ctx.lineTo(r * 0.95, r * 0.02); ctx.stroke()
  // eyes
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.14, r * 0.07, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.55, r * 0.14, r * 0.07, 0, TAU); ctx.fill()
}

function hound(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0
  const dk = shade(color, -25)
  const g1 = Math.sin(w * 2) * r * 0.35, g2 = Math.sin(w * 2 + Math.PI) * r * 0.35
  // legs (gallop)
  ctx.strokeStyle = dk; ctx.lineWidth = r * 0.13; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(r * 0.35, -r * 0.3); ctx.lineTo(r * 0.35 + g1, -r * 0.78); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.3); ctx.lineTo(r * 0.35 + g1, r * 0.78); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 0.3); ctx.lineTo(-r * 0.45 + g2, -r * 0.78); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-r * 0.45, r * 0.3); ctx.lineTo(-r * 0.45 + g2, r * 0.78); ctx.stroke()
  // tail
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.12
  ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(-r * 1.1, -r * 0.2, -r * 1.2, g1 * 0.4); ctx.stroke()
  // body
  const g = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5); g.addColorStop(0, shade(color, 18)); g.addColorStop(1, dk)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.72, r * 0.4, 0, 0, TAU); ctx.fill() })
  // neck + head with snout
  ctx.fillStyle = shade(color, -6); ctx.beginPath(); ctx.ellipse(r * 0.58, 0, r * 0.36, r * 0.3, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(r * 0.85, -r * 0.14); ctx.lineTo(r * 1.15, 0); ctx.lineTo(r * 0.85, r * 0.14); ctx.fill()
  // ears
  ctx.fillStyle = dk
  ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.28); ctx.lineTo(r * 0.62, -r * 0.6); ctx.lineTo(r * 0.72, -r * 0.28); ctx.fill()
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.28); ctx.lineTo(r * 0.62, r * 0.6); ctx.lineTo(r * 0.72, r * 0.28); ctx.fill()
  // glowing eyes
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.78, -r * 0.1, r * 0.07, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.78, r * 0.1, r * 0.07, 0, TAU); ctx.fill()
}

function brute(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0
  const dk = shade(color, -30), sw = Math.sin(w) * r * 0.2
  // stomping legs
  ctx.fillStyle = shade(color, -40)
  rr(ctx, -r * 0.35 + sw, -r * 0.9, r * 0.4, r * 0.5, r * 0.12); ctx.fill()
  rr(ctx, -r * 0.35 - sw, r * 0.4, r * 0.4, r * 0.5, r * 0.12); ctx.fill()
  // massive arms + fists swinging
  ctx.strokeStyle = shade(color, -12); ctx.lineWidth = r * 0.36; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(r * 0.7 + sw, -r * 0.6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(r * 0.7 - sw, r * 0.6); ctx.stroke()
  ctx.fillStyle = dk
  ctx.beginPath(); ctx.arc(r * 0.75 + sw, -r * 0.6, r * 0.3, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.75 - sw, r * 0.6, r * 0.3, 0, TAU); ctx.fill()
  // hulking torso
  const g = ctx.createRadialGradient(0, -r * 0.2, 1, 0, 0, r); g.addColorStop(0, shade(color, 24)); g.addColorStop(1, dk)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-r * 0.05, 0, r * 0.7, r * 0.9, 0, 0, TAU); ctx.fill() })
  // muscle striations
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = r * 0.05
  ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.5, -0.6, 0.6); ctx.stroke()
  // small head + jaw
  ctx.fillStyle = shade(color, -18); ctx.beginPath(); ctx.arc(r * 0.42, 0, r * 0.26, 0, TAU); ctx.fill()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.09, r * 0.06, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.5, r * 0.09, r * 0.06, 0, TAU); ctx.fill()
  ctx.fillStyle = '#f8fafc'
  for (let i = -1; i <= 1; i++) { ctx.fillRect(r * 0.58, i * r * 0.1 - r * 0.03, r * 0.06, r * 0.06) }
}

function wasp(ctx, r, color, accent, anim) {
  const flap = 0.5 + 0.5 * Math.abs(Math.sin((anim ? anim.spin : 0) * 34))
  ctx.fillStyle = 'rgba(226,232,240,0.3)'
  ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.65 * flap, r * 0.55, r * 0.24, -0.5, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.65 * flap, r * 0.55, r * 0.24, 0.5, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.ellipse(r * 0.15, -r * 0.5 * flap, r * 0.4, r * 0.18, -0.5, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.ellipse(r * 0.15, r * 0.5 * flap, r * 0.4, r * 0.18, 0.5, 0, TAU); ctx.fill()
  // striped abdomen
  outline(ctx, () => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(-r * 0.4, 0, r * 0.62, r * 0.3, 0, 0, TAU); ctx.fill() })
  ctx.fillStyle = accent
  for (let i = 0; i < 3; i++) ctx.fillRect(-r * 0.78 + i * r * 0.3, -r * 0.28, r * 0.12, r * 0.56)
  ctx.fillStyle = shade(color, -12); ctx.beginPath(); ctx.arc(r * 0.28, 0, r * 0.3, 0, TAU); ctx.fill()
  ctx.fillStyle = '#0b0e14'; ctx.beginPath(); ctx.moveTo(-r, -r * 0.1); ctx.lineTo(-r * 1.35, 0); ctx.lineTo(-r, r * 0.1); ctx.fill()
  ctx.fillStyle = shade(color, -20); ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.2, 0, TAU); ctx.fill()
  ctx.strokeStyle = '#0b0e14'; ctx.lineWidth = r * 0.05
  ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.1); ctx.lineTo(r * 0.95, -r * 0.28); ctx.moveTo(r * 0.7, r * 0.1); ctx.lineTo(r * 0.95, r * 0.28); ctx.stroke()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.6, -r * 0.08, r * 0.06, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.6, r * 0.08, r * 0.06, 0, TAU); ctx.fill()
}

function slime(ctx, r, color, accent, anim) {
  const s = anim ? anim.spin : 0
  const wob = 1 + 0.1 * Math.sin(s * 7)
  ctx.globalAlpha = 0.9
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r)
  g.addColorStop(0, shade(color, 40)); g.addColorStop(0.7, color); g.addColorStop(1, shade(color, -20))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, r * 0.15, r * 0.92 * wob, r * 0.78 / wob, 0, 0, TAU); ctx.fill()
  // drips
  ctx.beginPath(); ctx.arc(-r * 0.5, r * 0.55, r * 0.16 * wob, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.45, r * 0.6, r * 0.12 / wob, 0, TAU); ctx.fill()
  ctx.globalAlpha = 1
  // nucleus
  ctx.fillStyle = shade(color, -30); ctx.globalAlpha = 0.6
  ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.22, r * 0.13, -0.4, 0, TAU); ctx.fill()
  // eyes
  ctx.fillStyle = '#0b1120'
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.02, r * 0.1, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.2, r * 0.3, r * 0.1, 0, TAU); ctx.fill()
}

function wraith(ctx, r, color, accent, anim) {
  const s = anim ? anim.spin : 0
  const sway = Math.sin(s * 4) * r * 0.16
  ctx.globalAlpha = 0.55
  const g = ctx.createLinearGradient(r * 0.4, 0, -r * 1.2, 0)
  g.addColorStop(0, shade(color, 25)); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(r * 0.4, -r * 0.55)
  ctx.quadraticCurveTo(-r * 0.7, -r * 0.35 + sway, -r * 1.25, sway)
  ctx.quadraticCurveTo(-r * 0.7, r * 0.35 - sway, r * 0.4, r * 0.55)
  ctx.closePath(); ctx.fill()
  ctx.globalAlpha = 0.9
  // wispy arms
  ctx.strokeStyle = shade(color, 20); ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, -r * 0.35); ctx.quadraticCurveTo(r * 0.5, -r * 0.5 - sway, r * 0.7, -r * 0.15); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, r * 0.35); ctx.quadraticCurveTo(r * 0.5, r * 0.5 + sway, r * 0.7, r * 0.15); ctx.stroke()
  // hooded head
  ctx.fillStyle = shade(color, 10); ctx.beginPath(); ctx.arc(r * 0.22, 0, r * 0.5, 0, TAU); ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#0b0620'; ctx.beginPath(); ctx.arc(r * 0.36, 0, r * 0.34, 0, TAU); ctx.fill()
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.13, r * 0.09, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.45, r * 0.13, r * 0.09, 0, TAU); ctx.fill()
}

function sapper(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0, s = anim ? anim.spin : 0
  const legc = '#3f3f46'
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ax = (-0.3 + i * 0.3) * r
      const step = Math.sin(w * 1.6 + i + (side < 0 ? Math.PI : 0)) * r * 0.18
      limb(ctx, ax, side * r * 0.3, ax + step + r * 0.3, side * r * 0.95, side * r * 0.25, r * 0.1, legc)
    }
  }
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, shade(color, 22)); g.addColorStop(1, shade(color, -26))
  outline(ctx, () => { ctx.fillStyle = g; rr(ctx, -r * 0.6, -r * 0.55, r * 1.2, r * 1.1, r * 0.22); ctx.fill() })
  // hazard stripes
  ctx.fillStyle = '#111827'; ctx.fillRect(-r * 0.55, -r * 0.15, r * 1.1, r * 0.12)
  // drill up front
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.32); ctx.lineTo(r * 1.0, 0); ctx.lineTo(r * 0.5, r * 0.32); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.15); ctx.lineTo(r * 0.9, 0); ctx.lineTo(r * 0.55, r * 0.15); ctx.stroke()
  // blinking warning light
  const blink = 0.35 + 0.65 * Math.abs(Math.sin(s * 9))
  ctx.globalAlpha = blink; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 0.18, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
}

function imp(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0, dk = shade(color, -30)
  const step = Math.sin(w * 2) * r * 0.3
  ctx.strokeStyle = dk; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, -r * 0.3); ctx.lineTo(step, -r * 0.72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, r * 0.3); ctx.lineTo(-step, r * 0.72); ctx.stroke()
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.1
  ctx.beginPath(); ctx.moveTo(-r * 0.4, 0); ctx.quadraticCurveTo(-r * 0.9, step * 0.5, -r * 0.85, -r * 0.4); ctx.stroke()
  const g = ctx.createRadialGradient(-r * 0.1, -r * 0.2, 1, 0, 0, r * 0.7); g.addColorStop(0, shade(color, 25)); g.addColorStop(1, color)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.55, r * 0.5, 0, 0, TAU); ctx.fill() })
  ctx.fillStyle = shade(color, -8); ctx.beginPath(); ctx.arc(r * 0.4, 0, r * 0.34, 0, TAU); ctx.fill()
  ctx.strokeStyle = accent; ctx.lineWidth = r * 0.09
  ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.25); ctx.lineTo(r * 0.82, -r * 0.46); ctx.moveTo(r * 0.5, r * 0.25); ctx.lineTo(r * 0.82, r * 0.46); ctx.stroke()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.1, r * 0.08, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.5, r * 0.1, r * 0.08, 0, TAU); ctx.fill()
}

function golem(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0, dk = shade(color, -30), lt = shade(color, 18)
  const step = Math.sin(w) * r * 0.12
  ctx.fillStyle = dk
  rr(ctx, -r * 0.15 + step, -r * 0.95, r * 0.5, r * 0.5, r * 0.1); ctx.fill()
  rr(ctx, -r * 0.15 - step, r * 0.45, r * 0.5, r * 0.5, r * 0.1); ctx.fill()
  ctx.fillStyle = lt
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.72, r * 0.3, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.2, r * 0.72, r * 0.3, 0, TAU); ctx.fill()
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  outline(ctx, () => {
    ctx.fillStyle = g; ctx.beginPath()
    ctx.moveTo(-r * 0.6, -r * 0.3); ctx.lineTo(-r * 0.2, -r * 0.78); ctx.lineTo(r * 0.5, -r * 0.5)
    ctx.lineTo(r * 0.72, r * 0.1); ctx.lineTo(r * 0.3, r * 0.72); ctx.lineTo(-r * 0.4, r * 0.6); ctx.lineTo(-r * 0.72, r * 0.1)
    ctx.closePath(); ctx.fill()
  })
  ctx.strokeStyle = accent; ctx.lineWidth = r * 0.06; ctx.globalAlpha = 0.85
  ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.3); ctx.lineTo(0, 0); ctx.lineTo(-r * 0.1, r * 0.4); ctx.moveTo(0, 0); ctx.lineTo(r * 0.4, r * 0.05); ctx.stroke(); ctx.globalAlpha = 1
  ctx.fillStyle = shade(color, -14); ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.24, 0, TAU); ctx.fill()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.6, -r * 0.08, r * 0.05, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.6, r * 0.08, r * 0.05, 0, TAU); ctx.fill()
}

function bomber(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0, s = anim ? anim.spin : 0
  const step = Math.sin(w * 1.6) * r * 0.25
  ctx.strokeStyle = '#1f2937'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, -r * 0.3); ctx.lineTo(step, -r * 0.75); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, r * 0.3); ctx.lineTo(-step, r * 0.75); ctx.stroke()
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 1, 0, 0, r * 0.75); g.addColorStop(0, shade(color, 34)); g.addColorStop(1, '#18181b')
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, TAU); ctx.fill() })
  ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU); ctx.stroke()
  ctx.fillStyle = '#52525b'; ctx.fillRect(r * 0.3, -r * 0.12, r * 0.25, r * 0.24)
  ctx.strokeStyle = '#a16207'; ctx.lineWidth = r * 0.06
  ctx.beginPath(); ctx.moveTo(r * 0.55, 0); ctx.quadraticCurveTo(r * 0.82, -r * 0.2, r * 0.75, -r * 0.42); ctx.stroke()
  const blink = 0.4 + 0.6 * Math.abs(Math.sin(s * 12))
  ctx.globalAlpha = blink; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.75, -r * 0.44, r * 0.12, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
  ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.15, r * 0.07, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.2, r * 0.15, r * 0.07, 0, TAU); ctx.fill()
}

function artillery(ctx, r, color, accent, anim) {
  const spin = (anim ? anim.walk : 0) * 6, dk = shade(color, -28), lt = shade(color, 14)
  ctx.fillStyle = '#0b0e14'
  for (const wx of [-r * 0.5, r * 0.4]) for (const wy of [-r * 0.7, r * 0.7]) {
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(spin); rr(ctx, -r * 0.24, -r * 0.24, r * 0.48, r * 0.48, r * 0.1); ctx.fill(); ctx.restore()
  }
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  outline(ctx, () => { ctx.fillStyle = g; rr(ctx, -r * 0.7, -r * 0.5, r * 1.3, r * 1.0, r * 0.16); ctx.fill() })
  ctx.save(); ctx.translate(r * 0.1, 0); ctx.rotate(-0.5)
  ctx.fillStyle = '#111827'; rr(ctx, 0, -r * 0.22, r * 1.1, r * 0.44, r * 0.1); ctx.fill()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 1.1, 0, r * 0.12, 0, TAU); ctx.fill()
  ctx.restore()
  ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(-r * 0.5, 0, r * 0.28, 0, TAU); ctx.fill()
}

function summoner(ctx, r, color, accent, anim) {
  const s = anim ? anim.spin : 0, dk = shade(color, -25)
  ctx.save(); ctx.rotate(s * 2); ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.lineWidth = r * 0.06
  ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, TAU); ctx.stroke()
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); ctx.stroke() }
  ctx.globalAlpha = 1; ctx.restore()
  const g = ctx.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, dk); g.addColorStop(1, color)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(r * 0.55, 0); ctx.lineTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r * 0.3, 0); ctx.lineTo(-r * 0.5, r * 0.6); ctx.closePath(); ctx.fill() })
  ctx.fillStyle = shade(color, 18); ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.35, 0, TAU); ctx.fill()
  ctx.fillStyle = '#0b0620'; ctx.beginPath(); ctx.arc(r * 0.14, 0, r * 0.2, 0, TAU); ctx.fill()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.08, r * 0.06, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.2, r * 0.08, r * 0.06, 0, TAU); ctx.fill()
  const pulse = 0.6 + 0.4 * Math.sin(s * 6)
  const og = ctx.createRadialGradient(r * 0.8, 0, 1, r * 0.8, 0, r * 0.28); og.addColorStop(0, '#fff'); og.addColorStop(1, accent)
  ctx.globalAlpha = pulse; ctx.fillStyle = og; ctx.beginPath(); ctx.arc(r * 0.8, 0, r * 0.22, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
}

function wyvern(ctx, r, color, accent, anim) {
  const s = anim ? anim.spin : 0, dk = shade(color, -25)
  const flap = Math.sin(s * 8) * r * 0.5
  // membranous wings (flapping)
  ctx.fillStyle = shade(color, -12); ctx.globalAlpha = 0.95
  ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.2); ctx.quadraticCurveTo(-r * 0.9, -r * 0.9 - flap, -r * 1.35, -r * 0.2 - flap * 0.5); ctx.quadraticCurveTo(-r * 0.7, -r * 0.1, -r * 0.1, -r * 0.2); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(-r * 0.1, r * 0.2); ctx.quadraticCurveTo(-r * 0.9, r * 0.9 + flap, -r * 1.35, r * 0.2 + flap * 0.5); ctx.quadraticCurveTo(-r * 0.7, r * 0.1, -r * 0.1, r * 0.2); ctx.closePath(); ctx.fill()
  ctx.globalAlpha = 1
  // tail
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-r * 0.3, 0); ctx.quadraticCurveTo(-r * 1.0, r * 0.15, -r * 1.15, -r * 0.2); ctx.stroke()
  // body + neck + head
  const g = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5); g.addColorStop(0, shade(color, 20)); g.addColorStop(1, dk)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.4, 0, 0, TAU); ctx.fill() })
  ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(r * 0.62, 0, r * 0.35, r * 0.24, 0, 0, TAU); ctx.fill()
  ctx.strokeStyle = accent; ctx.lineWidth = r * 0.08
  ctx.beginPath(); ctx.moveTo(r * 0.72, -r * 0.15); ctx.lineTo(r * 0.98, -r * 0.32); ctx.moveTo(r * 0.72, r * 0.15); ctx.lineTo(r * 0.98, r * 0.32); ctx.stroke()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.78, -r * 0.08, r * 0.06, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.78, r * 0.08, r * 0.06, 0, TAU); ctx.fill()
}

function juggernaut(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0, s = anim ? anim.spin : 0, dk = shade(color, -35), lt = shade(color, 16)
  const step = Math.sin(w) * r * 0.14
  ctx.fillStyle = dk
  for (const sx of [-0.3, 0.35]) for (const sy of [-1, 1]) { rr(ctx, sx * r + (sy < 0 ? step : -step), sy * r * 0.6, r * 0.3, r * 0.48, r * 0.08); ctx.fill() }
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lt); g.addColorStop(1, dk)
  outline(ctx, () => { ctx.fillStyle = g; rr(ctx, -r * 0.75, -r * 0.7, r * 1.5, r * 1.4, r * 0.2); ctx.fill() })
  ctx.fillStyle = shade(color, -10); rr(ctx, -r * 0.5, -r * 0.5, r * 0.9, r * 1.0, r * 0.16); ctx.fill()
  // front ram/plow
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.moveTo(r * 0.6, -r * 0.62); ctx.lineTo(r * 1.12, 0); ctx.lineTo(r * 0.6, r * 0.62); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * 0.72, -r * 0.35); ctx.lineTo(r * 0.98, 0); ctx.lineTo(r * 0.72, r * 0.35); ctx.stroke()
  const pulse = 0.5 + 0.5 * Math.sin(s * 6)
  ctx.globalAlpha = pulse; ctx.fillStyle = accent; ctx.fillRect(-r * 0.1, -r * 0.28, r * 0.3, r * 0.56); ctx.globalAlpha = 1
}

function raptor(ctx, r, color, accent, anim) {
  const w = anim ? anim.walk : 0, dk = shade(color, -25)
  const g1 = Math.sin(w * 3) * r * 0.4, g2 = Math.sin(w * 3 + Math.PI) * r * 0.4
  // powerful hind legs + small forelimbs
  ctx.strokeStyle = dk; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.28); ctx.lineTo(-r * 0.2 + g1, -r * 0.82); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.28); ctx.lineTo(-r * 0.2 + g1, r * 0.82); ctx.stroke()
  ctx.lineWidth = r * 0.09
  ctx.beginPath(); ctx.moveTo(r * 0.35, -r * 0.15); ctx.lineTo(r * 0.35 + g2 * 0.4, -r * 0.5); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.15); ctx.lineTo(r * 0.35 + g2 * 0.4, r * 0.5); ctx.stroke()
  // long tail
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.14
  ctx.beginPath(); ctx.moveTo(-r * 0.55, 0); ctx.quadraticCurveTo(-r * 1.15, g1 * 0.4, -r * 1.35, -r * 0.1); ctx.stroke()
  // sleek body
  const g = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4); g.addColorStop(0, shade(color, 20)); g.addColorStop(1, dk)
  outline(ctx, () => { ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-r * 0.05, 0, r * 0.62, r * 0.34, 0, 0, TAU); ctx.fill() })
  // head with jaws
  ctx.fillStyle = shade(color, -6); ctx.beginPath(); ctx.ellipse(r * 0.62, 0, r * 0.34, r * 0.24, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(r * 0.85, -r * 0.1); ctx.lineTo(r * 1.15, 0); ctx.lineTo(r * 0.85, r * 0.1); ctx.fill()
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(r * 0.9, -r * 0.05, r * 0.14, r * 0.04); ctx.fillRect(r * 0.9, r * 0.02, r * 0.14, r * 0.04)
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.72, -r * 0.09, r * 0.07, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.72, r * 0.09, r * 0.07, 0, TAU); ctx.fill()
}

const ENEMY_ROUTINES = {
  raptor,
  soldier: (c, r, col, ac, a) => soldier(c, r, col, ac, false, a),
  soldier_heavy: (c, r, col, ac, a) => soldier(c, r, col, ac, true, a),
  medic, shield: shieldUnit,
  tank: (c, r, col, ac, a) => tank(c, r, col, ac, false, a),
  tank_heavy: (c, r, col, ac, a) => tank(c, r, col, ac, true, a),
  jeep, apc, drone, heli, mech,
  spider, hound, brute, wasp, slime, wraith, sapper,
  imp, golem, bomber, artillery, summoner,
  wyvern, juggernaut,
}

export function drawEnemy(ctx, e, spin) {
  const flying = e.class === 'air'
  const anim = { spin, walk: e.dist * 0.06 }
  ctx.save()
  ctx.translate(e.x, e.y)
  // shadow
  ctx.save()
  ctx.translate(0, flying ? e.radius * 1.0 : e.radius * 0.55)
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath(); ctx.ellipse(0, 0, e.radius * 0.95, e.radius * 0.42, 0, 0, TAU); ctx.fill()
  ctx.restore()
  if (flying) ctx.translate(0, -e.radius * 0.6 + Math.sin(spin * 3) * e.radius * 0.12)
  if (e.waveBoss) {
    const pulse = 0.5 + 0.35 * Math.sin(spin * 5)
    ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.32, 0, TAU); ctx.stroke()
    ctx.globalAlpha = pulse * 0.5; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.6, 0, TAU); ctx.stroke()
    ctx.restore()
  } else if (e.champion) {
    const pulse = 0.5 + 0.3 * Math.sin(spin * 5)
    ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.35, 0, TAU); ctx.stroke(); ctx.restore()
  }
  ctx.save()
  ctx.rotate(e.angle || 0)
  ;(ENEMY_ROUTINES[e.sprite] || ENEMY_ROUTINES.soldier)(ctx, e.radius, e.color, e.accent, anim)
  ctx.restore()
  if (e.waveBoss) {
    ctx.fillStyle = '#f43f5e'; ctx.font = `bold ${Math.round(e.radius * 0.9)}px sans-serif`; ctx.textAlign = 'center'
    ctx.fillText('☠', 0, -e.radius * 1.5)
  } else if (e.champion) {
    ctx.fillStyle = '#fbbf24'; ctx.font = `bold ${Math.round(e.radius)}px sans-serif`; ctx.textAlign = 'center'
    ctx.fillText('♛', 0, -e.radius * 1.5)
  }
  ctx.restore()
}

// ---- TOWERS ---------------------------------------------------------------

function towerBase(ctx, s, color) {
  ctx.fillStyle = '#0b1120'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; const x = Math.cos(a) * s, y = Math.sin(a) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
  ctx.closePath(); ctx.fill()
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, s * 0.85); g.addColorStop(0, '#22334e'); g.addColorStop(1, '#16233a')
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.78, 0, TAU); ctx.fill()
  ctx.strokeStyle = shade(color, -10); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * 0.78, 0, TAU); ctx.stroke()
  // rivets
  ctx.fillStyle = '#0b1120'
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62, 1.5, 0, TAU); ctx.fill() }
}

function towerHead(ctx, s, sprite, color, spin) {
  const dk = shade(color, -22)
  ctx.fillStyle = color
  switch (sprite) {
    case 'machinegun':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; ctx.fillRect(s * 0.2, -s * 0.3, s * 1.2, s * 0.18); ctx.fillRect(s * 0.2, s * 0.12, s * 1.2, s * 0.18)
      break
    case 'cannon':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.58, 0, TAU); ctx.fill()
      ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(0, 0, s * 0.36, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; rr(ctx, s * 0.3, -s * 0.22, s * 1.1, s * 0.44, s * 0.1); ctx.fill()
      break
    case 'cryo':
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((i / 5) * TAU); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -s * 0.16); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s * 0.16); ctx.closePath(); ctx.fill(); ctx.restore() }
      ctx.fillStyle = shade(color, 40); ctx.beginPath(); ctx.arc(0, 0, s * 0.28, 0, TAU); ctx.fill()
      break
    case 'sniper':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; ctx.fillRect(s * 0.2, -s * 0.07, s * 1.75, s * 0.14)
      ctx.fillStyle = dk; rr(ctx, -s * 0.1, -s * 0.24, s * 0.5, s * 0.48, s * 0.1); ctx.fill()
      break
    case 'rocket':
      rr(ctx, -s * 0.35, -s * 0.52, s * 0.95, s * 1.04, s * 0.18); ctx.fill()
      ctx.fillStyle = '#0f172a'; ctx.fillRect(s * 0.4, -s * 0.42, s * 0.95, s * 0.26); ctx.fillRect(s * 0.4, s * 0.16, s * 0.95, s * 0.26)
      ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(s * 1.3, -s * 0.29, s * 0.08, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(s * 1.3, s * 0.29, s * 0.08, 0, TAU); ctx.fill()
      break
    case 'flamethrower':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill()
      ctx.fillStyle = dk; rr(ctx, s * 0.3, -s * 0.24, s * 0.9, s * 0.48, s * 0.16); ctx.fill()
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(s * 1.2, 0, s * 0.15, 0, TAU); ctx.fill()
      break
    case 'tesla': {
      ctx.strokeStyle = color; ctx.lineWidth = s * 0.12
      for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 0, s * 0.2 * i, 0, TAU); ctx.stroke() }
      const gl = 0.5 + 0.5 * Math.sin(spin * 10); ctx.globalAlpha = gl; ctx.fillStyle = shade(color, 45); ctx.beginPath(); ctx.arc(0, 0, s * 0.24, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
      break
    }
    case 'mortar':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.58, 0, TAU); ctx.fill()
      ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0, TAU); ctx.fill()
      break
    case 'poison':
      rr(ctx, -s * 0.45, -s * 0.5, s * 0.9, s * 1.0, s * 0.3); ctx.fill()
      ctx.fillStyle = shade(color, 28); ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, TAU); ctx.fill()
      ctx.fillStyle = '#1a2e05'; ctx.fillRect(s * 0.3, -s * 0.09, s * 0.9, s * 0.18)
      break
    case 'laser':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill()
      ctx.fillStyle = '#111827'; rr(ctx, s * 0.2, -s * 0.14, s * 1.2, s * 0.28, s * 0.06); ctx.fill()
      ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(s * 1.35, 0, s * 0.14, 0, TAU); ctx.fill()
      break
    default:
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; ctx.fillRect(s * 0.2, -s * 0.12, s * 1.1, s * 0.24)
  }
}

export function drawTower(ctx, t, def, angle, spin) {
  const s = 20
  ctx.save()
  ctx.translate(t.x, t.y)
  towerBase(ctx, s, def.color)
  for (let i = 0; i < t.level; i++) { ctx.fillStyle = '#fde68a'; ctx.fillRect(-s * 0.7 + i * 7, s * 0.6, 5, 5) }
  ctx.rotate(angle)
  if (t.recoil) ctx.translate(-t.recoil * 6, 0) // barrel kick
  towerHead(ctx, s, def.sprite, def.color, spin)
  ctx.restore()
}

// ---- HEROES ---------------------------------------------------------------

function mage(ctx, r, color) {
  const dk = shade(color, -30)
  const g = ctx.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, dk); g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.moveTo(r * 0.7, 0); ctx.lineTo(-r * 0.6, -r * 0.7); ctx.lineTo(-r * 0.3, 0); ctx.lineTo(-r * 0.6, r * 0.7); ctx.closePath(); ctx.fill()
  ctx.fillStyle = shade(color, 20); ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.38, 0, TAU); ctx.fill()
  ctx.fillStyle = '#0b1120'; ctx.beginPath(); ctx.arc(r * 0.14, 0, r * 0.2, 0, TAU); ctx.fill()
  ctx.fillStyle = '#111827'; ctx.fillRect(r * 0.2, -r * 0.05, r * 0.9, r * 0.1)
  const og = ctx.createRadialGradient(r * 1.05, 0, 1, r * 1.05, 0, r * 0.28); og.addColorStop(0, '#fff'); og.addColorStop(1, color)
  ctx.fillStyle = og; ctx.beginPath(); ctx.arc(r * 1.05, 0, r * 0.22, 0, TAU); ctx.fill()
}

export function drawHero(ctx, h, def, rarityColor, spin) {
  const r = 20
  const angle = h.angle || 0
  ctx.save()
  ctx.translate(h.x, h.y)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, r * 0.5, r * 0.95, r * 0.4, 0, 0, TAU); ctx.fill()
  const gl = 0.4 + 0.25 * Math.sin(spin * 4)
  ctx.strokeStyle = rarityColor; ctx.globalAlpha = gl; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1
  ctx.fillStyle = '#0b1120'; ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, TAU); ctx.fill()
  ctx.rotate(angle)
  if (h.recoil) ctx.translate(-h.recoil * 4, 0)
  const c = def.color
  const anim = { spin, walk: spin * 4 }
  switch (def.sprite) {
    case 'hero_mech': mech(ctx, r * 0.8, c, rarityColor, anim); break
    case 'hero_mage': mage(ctx, r * 0.85, c); break
    case 'hero_engineer':
      soldier(ctx, r * 0.85, c, shade(c, -30), true, anim)
      ctx.fillStyle = rarityColor; ctx.beginPath(); ctx.arc(-r * 0.1, 0, r * 0.12, 0, TAU); ctx.fill()
      break
    case 'hero_grenade':
      soldier(ctx, r * 0.85, c, shade(c, -25), true, anim)
      ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(r * 0.95, 0, r * 0.2, 0, TAU); ctx.fill()
      break
    default: soldier(ctx, r * 0.85, c, shade(c, -28), true, anim)
  }
  ctx.restore()
}
