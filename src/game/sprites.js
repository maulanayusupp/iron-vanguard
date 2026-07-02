// ---------------------------------------------------------------------------
// Vector sprite drawing (top-down). Drawn with canvas paths + gradients — no
// image assets. Units face +x by default and are rotated toward their heading
// (enemies) or their target (towers/heroes). `spin` is a shared animation phase.
// ---------------------------------------------------------------------------

import { roundRect as rr } from '../helpers/canvas.js'
import { shade } from '../helpers/color.js'

const TAU = Math.PI * 2

// ---- ENEMY UNITS ----------------------------------------------------------

function soldier(ctx, r, color, accent, heavy) {
  const dk = shade(color, -32)
  const lt = shade(color, 18)
  // backpack
  ctx.fillStyle = dk
  rr(ctx, -r * 0.72, -r * 0.42, r * 0.42, r * 0.84, r * 0.16); ctx.fill()
  // torso (gradient for volume)
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.78, 0, 0, TAU); ctx.fill()
  // shoulders
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(-r * 0.08, -r * 0.6, r * 0.22, r * 0.3, 0, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.ellipse(-r * 0.08, r * 0.6, r * 0.22, r * 0.3, 0, 0, TAU); ctx.fill()
  // arms reaching to the weapon
  ctx.strokeStyle = dk; ctx.lineWidth = r * 0.26; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.4); ctx.lineTo(r * 0.55, -r * 0.12); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-r * 0.05, r * 0.4); ctx.lineTo(r * 0.55, r * 0.12); ctx.stroke()
  // rifle
  ctx.fillStyle = '#0b0e14'; rr(ctx, r * 0.12, -r * 0.15, r * 0.28, r * 0.3, r * 0.06); ctx.fill()
  ctx.fillStyle = '#111827'; ctx.fillRect(r * 0.3, -r * 0.08, r * (heavy ? 1.35 : 1.12), r * 0.16)
  // helmet
  const hg = ctx.createRadialGradient(r * 0.02, -r * 0.12, 1, r * 0.06, 0, r * 0.46)
  hg.addColorStop(0, shade(accent, 38)); hg.addColorStop(1, accent)
  ctx.fillStyle = hg
  ctx.beginPath(); ctx.arc(r * 0.08, 0, r * 0.44, 0, TAU); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath(); ctx.arc(r * 0.0, -r * 0.14, r * 0.14, 0, TAU); ctx.fill()
  if (heavy) {
    ctx.strokeStyle = dk; ctx.lineWidth = r * 0.1
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.78, 0, 0, TAU); ctx.stroke()
  }
}

function medic(ctx, r, color) {
  soldier(ctx, r, '#e5e7eb', '#f3f4f6', false)
  ctx.fillStyle = '#dc2626'
  ctx.fillRect(-r * 0.07, -r * 0.24, r * 0.14, r * 0.48)
  ctx.fillRect(-r * 0.24, -r * 0.07, r * 0.48, r * 0.14)
}

function shieldUnit(ctx, r, color, accent) {
  soldier(ctx, r, color, accent, true)
  const g = ctx.createLinearGradient(r * 0.55, 0, r * 0.95, 0)
  g.addColorStop(0, shade(accent, 10)); g.addColorStop(1, shade(accent, -20))
  ctx.fillStyle = g
  rr(ctx, r * 0.55, -r * 0.85, r * 0.36, r * 1.7, r * 0.1); ctx.fill()
  ctx.strokeStyle = 'rgba(226,232,240,0.7)'; ctx.lineWidth = 2; ctx.stroke()
}

function tracks(ctx, r) {
  ctx.fillStyle = '#12151c'
  rr(ctx, -r * 0.95, -r * 0.98, r * 1.9, r * 0.4, r * 0.1); ctx.fill()
  rr(ctx, -r * 0.95, r * 0.58, r * 1.9, r * 0.4, r * 0.1); ctx.fill()
  ctx.fillStyle = '#232a37'
  for (let i = -4; i <= 4; i++) {
    ctx.fillRect(i * r * 0.22 - r * 0.04, -r * 0.98, r * 0.07, r * 0.4)
    ctx.fillRect(i * r * 0.22 - r * 0.04, r * 0.58, r * 0.07, r * 0.4)
  }
}

function tank(ctx, r, color, accent, heavy) {
  const dk = shade(color, -35)
  const lt = shade(color, 16)
  tracks(ctx, r)
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g
  rr(ctx, -r * 0.8, -r * 0.6, r * 1.6, r * 1.2, r * 0.18); ctx.fill()
  // turret
  ctx.fillStyle = shade(color, -12)
  ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.5, 0, TAU); ctx.fill()
  ctx.fillStyle = lt
  ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.3, 0, TAU); ctx.fill()
  // barrel(s)
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(r * 0.2, -r * 0.1, r * (heavy ? 1.42 : 1.15), r * 0.2)
  if (heavy) {
    ctx.fillRect(r * 0.2, -r * 0.34, r * 1.1, r * 0.13)
    ctx.fillRect(r * 0.2, r * 0.21, r * 1.1, r * 0.13)
  }
}

function jeep(ctx, r, color, accent) {
  const dk = shade(color, -30)
  ctx.fillStyle = '#0b0e14'
  for (const wx of [-r * 0.55, r * 0.55]) {
    for (const wy of [-r * 0.72, r * 0.72]) {
      rr(ctx, wx - r * 0.2, wy - r * 0.14, r * 0.4, r * 0.28, r * 0.08); ctx.fill()
    }
  }
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, shade(color, 14)); g.addColorStop(1, dk)
  ctx.fillStyle = g
  rr(ctx, -r * 0.75, -r * 0.56, r * 1.5, r * 1.12, r * 0.18); ctx.fill()
  // cabin
  ctx.fillStyle = dk
  rr(ctx, -r * 0.5, -r * 0.4, r * 0.68, r * 0.8, r * 0.12); ctx.fill()
  // windshield
  ctx.fillStyle = 'rgba(150,200,255,0.45)'
  rr(ctx, r * 0.04, -r * 0.4, r * 0.16, r * 0.8, r * 0.05); ctx.fill()
  // mounted MG
  ctx.fillStyle = '#111827'; ctx.fillRect(-r * 0.1, -r * 0.06, r * 0.95, r * 0.12)
}

function apc(ctx, r, color, accent) {
  const dk = shade(color, -30)
  const lt = shade(color, 12)
  ctx.fillStyle = '#0b0e14'
  for (const wx of [-r * 0.58, 0, r * 0.58]) {
    for (const wy of [-r * 0.74, r * 0.74]) {
      rr(ctx, wx - r * 0.16, wy - r * 0.13, r * 0.32, r * 0.26, r * 0.07); ctx.fill()
    }
  }
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g
  rr(ctx, -r * 0.85, -r * 0.6, r * 1.7, r * 1.2, r * 0.16); ctx.fill()
  ctx.fillStyle = lt
  rr(ctx, r * 0.32, -r * 0.48, r * 0.5, r * 0.96, r * 0.12); ctx.fill() // sloped front
  ctx.fillStyle = dk
  ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.28, 0, TAU); ctx.fill() // hatch
  ctx.fillStyle = '#111827'; ctx.fillRect(r * 0.1, -r * 0.06, r * 0.85, r * 0.12)
}

function drone(ctx, r, color, accent, spin) {
  ctx.strokeStyle = shade(color, -25); ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7)
  ctx.moveTo(-r * 0.7, r * 0.7); ctx.lineTo(r * 0.7, -r * 0.7)
  ctx.stroke()
  ctx.fillStyle = 'rgba(200,220,255,0.16)'
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.beginPath(); ctx.arc(ox * r * 0.7, oy * r * 0.7, r * 0.46, 0, TAU); ctx.fill()
  }
  ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = r * 0.06
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.save(); ctx.translate(ox * r * 0.7, oy * r * 0.7); ctx.rotate(spin * 22)
    ctx.beginPath(); ctx.moveTo(-r * 0.42, 0); ctx.lineTo(r * 0.42, 0); ctx.stroke(); ctx.restore()
  }
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.5)
  g.addColorStop(0, shade(color, 25)); g.addColorStop(1, color)
  ctx.fillStyle = g
  rr(ctx, -r * 0.4, -r * 0.3, r * 0.8, r * 0.6, r * 0.2); ctx.fill()
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.15, 0, r * 0.16, 0, TAU); ctx.fill()
}

function heli(ctx, r, color, accent, spin) {
  const dk = shade(color, -25)
  // tail boom
  ctx.fillStyle = dk
  rr(ctx, -r * 1.5, -r * 0.1, r * 1.1, r * 0.2, r * 0.08); ctx.fill()
  ctx.save(); ctx.translate(-r * 1.5, 0)
  ctx.fillStyle = dk; ctx.fillRect(-r * 0.1, -r * 0.3, r * 0.16, r * 0.6)
  ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = r * 0.05; ctx.rotate(spin * 26)
  ctx.beginPath(); ctx.moveTo(0, -r * 0.34); ctx.lineTo(0, r * 0.34); ctx.stroke(); ctx.restore()
  // fuselage
  const g = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6)
  g.addColorStop(0, shade(color, 18)); g.addColorStop(1, dk)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(r * 0.1, 0, r * 0.85, r * 0.5, 0, 0, TAU); ctx.fill()
  // cockpit
  ctx.fillStyle = 'rgba(140,200,255,0.55)'
  ctx.beginPath(); ctx.ellipse(r * 0.6, 0, r * 0.26, r * 0.32, 0, 0, TAU); ctx.fill()
  // skids
  ctx.strokeStyle = '#0b0e14'; ctx.lineWidth = r * 0.07
  ctx.beginPath()
  ctx.moveTo(-r * 0.3, -r * 0.6); ctx.lineTo(r * 0.5, -r * 0.6)
  ctx.moveTo(-r * 0.3, r * 0.6); ctx.lineTo(r * 0.5, r * 0.6); ctx.stroke()
  // main rotor
  ctx.save(); ctx.translate(r * 0.1, 0); ctx.rotate(spin * 13)
  ctx.fillStyle = 'rgba(200,220,255,0.10)'
  ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, TAU); ctx.fill()
  ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.lineWidth = r * 0.1
  ctx.beginPath()
  ctx.moveTo(-r * 1.25, 0); ctx.lineTo(r * 1.25, 0)
  ctx.moveTo(0, -r * 1.25); ctx.lineTo(0, r * 1.25); ctx.stroke()
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, TAU); ctx.fill()
  ctx.restore()
}

function mech(ctx, r, color, accent, spin) {
  const dk = shade(color, -38)
  const lt = shade(color, 18)
  // legs + feet
  ctx.fillStyle = dk
  rr(ctx, -r * 0.3, -r * 0.95, r * 0.55, r * 0.5, r * 0.12); ctx.fill()
  rr(ctx, -r * 0.3, r * 0.45, r * 0.55, r * 0.5, r * 0.12); ctx.fill()
  ctx.fillStyle = shade(color, -48)
  rr(ctx, r * 0.15, -r * 0.98, r * 0.38, r * 0.45, r * 0.1); ctx.fill()
  rr(ctx, r * 0.15, r * 0.53, r * 0.38, r * 0.45, r * 0.1); ctx.fill()
  // shoulder cannons
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(r * 0.1, -r * 0.95, r * 1.25, r * 0.28)
  ctx.fillRect(r * 0.1, r * 0.67, r * 1.25, r * 0.28)
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 1.35, -r * 0.81, r * 0.1, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 1.35, r * 0.81, r * 0.1, 0, TAU); ctx.fill()
  // torso
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, lt); g.addColorStop(1, dk)
  ctx.fillStyle = g
  rr(ctx, -r * 0.55, -r * 0.7, r * 1.15, r * 1.4, r * 0.24); ctx.fill()
  // cockpit
  ctx.fillStyle = shade(color, -16)
  rr(ctx, r * 0.22, -r * 0.32, r * 0.48, r * 0.64, r * 0.18); ctx.fill()
  // glowing core
  const pulse = 0.55 + 0.45 * Math.sin(spin * 7)
  const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.4)
  cg.addColorStop(0, accent); cg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = pulse; ctx.fillStyle = cg
  ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
  ctx.fillStyle = shade(accent, 40)
  ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, TAU); ctx.fill()
}

// ---- MONSTERS -------------------------------------------------------------

function legs(ctx, r, color, pairs, spin, spread) {
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round'
  const wig = Math.sin(spin * 14) * r * 0.12
  for (let i = 0; i < pairs; i++) {
    const px = (-0.5 + i / (pairs - 1)) * r * spread
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(px, s * r * 0.2)
      ctx.lineTo(px + wig * s, s * r * 0.7)
      ctx.lineTo(px - r * 0.15 + wig * s, s * r * 1.0)
      ctx.stroke()
    }
  }
}

function spider(ctx, r, color, accent, spin) {
  legs(ctx, r, shade(color, 10), 4, spin, 1.1)
  // abdomen
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.2, 1, -r * 0.4, 0, r * 0.8)
  g.addColorStop(0, shade(color, 25)); g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(-r * 0.35, 0, r * 0.6, r * 0.55, 0, 0, TAU); ctx.fill()
  // cephalothorax
  ctx.fillStyle = shade(color, -10)
  ctx.beginPath(); ctx.ellipse(r * 0.4, 0, r * 0.4, r * 0.36, 0, 0, TAU); ctx.fill()
  // eyes + fangs
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.6, -r * 0.14, r * 0.08, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.6, r * 0.14, r * 0.08, 0, TAU); ctx.fill()
}

function hound(ctx, r, color, accent, spin) {
  const wig = Math.sin(spin * 16) * r * 0.15
  // legs
  ctx.strokeStyle = shade(color, -20); ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'
  for (const lx of [-r * 0.4, r * 0.4]) {
    ctx.beginPath(); ctx.moveTo(lx, -r * 0.3); ctx.lineTo(lx + wig, -r * 0.75); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(lx, r * 0.3); ctx.lineTo(lx - wig, r * 0.75); ctx.stroke()
  }
  // body
  const g = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5)
  g.addColorStop(0, shade(color, 16)); g.addColorStop(1, shade(color, -20))
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.7, r * 0.42, 0, 0, TAU); ctx.fill()
  // tail
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.12
  ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.lineTo(-r * 1.1, -r * 0.2 + wig); ctx.stroke()
  // head
  ctx.fillStyle = shade(color, -8)
  ctx.beginPath(); ctx.ellipse(r * 0.6, 0, r * 0.34, r * 0.3, 0, 0, TAU); ctx.fill()
  // ears + glowing eyes
  ctx.fillStyle = shade(color, -25)
  ctx.beginPath(); ctx.moveTo(r * 0.45, -r * 0.25); ctx.lineTo(r * 0.55, -r * 0.55); ctx.lineTo(r * 0.65, -r * 0.25); ctx.fill()
  ctx.beginPath(); ctx.moveTo(r * 0.45, r * 0.25); ctx.lineTo(r * 0.55, r * 0.55); ctx.lineTo(r * 0.65, r * 0.25); ctx.fill()
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.8, -r * 0.1, r * 0.07, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.8, r * 0.1, r * 0.07, 0, TAU); ctx.fill()
}

function brute(ctx, r, color, accent, spin) {
  const dk = shade(color, -30)
  // fists forward
  ctx.fillStyle = dk
  ctx.beginPath(); ctx.arc(r * 0.7, -r * 0.6, r * 0.32, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.7, r * 0.6, r * 0.32, 0, TAU); ctx.fill()
  // arms
  ctx.strokeStyle = shade(color, -10); ctx.lineWidth = r * 0.34; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(r * 0.7, -r * 0.6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(r * 0.7, r * 0.6); ctx.stroke()
  // hulking torso
  const g = ctx.createRadialGradient(0, -r * 0.2, 1, 0, 0, r)
  g.addColorStop(0, shade(color, 22)); g.addColorStop(1, dk)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(-r * 0.05, 0, r * 0.72, r * 0.92, 0, 0, TAU); ctx.fill()
  // small head
  ctx.fillStyle = shade(color, -18)
  ctx.beginPath(); ctx.arc(r * 0.45, 0, r * 0.28, 0, TAU); ctx.fill()
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.1, r * 0.06, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.55, r * 0.1, r * 0.06, 0, TAU); ctx.fill()
}

function wasp(ctx, r, color, accent, spin) {
  // wings (blurred)
  ctx.fillStyle = 'rgba(226,232,240,0.28)'
  const w = 0.7 + 0.3 * Math.abs(Math.sin(spin * 30))
  ctx.beginPath(); ctx.ellipse(0, -r * 0.7, r * 0.5, r * 0.28 * w, -0.4, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.ellipse(0, r * 0.7, r * 0.5, r * 0.28 * w, 0.4, 0, TAU); ctx.fill()
  // striped abdomen
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(-r * 0.4, 0, r * 0.6, r * 0.32, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = accent
  for (let i = 0; i < 3; i++) ctx.fillRect(-r * 0.75 + i * r * 0.3, -r * 0.3, r * 0.12, r * 0.6)
  // thorax + head + stinger
  ctx.fillStyle = shade(color, -12)
  ctx.beginPath(); ctx.arc(r * 0.3, 0, r * 0.3, 0, TAU); ctx.fill()
  ctx.fillStyle = '#111827'
  ctx.beginPath(); ctx.moveTo(-r, -r * 0.12); ctx.lineTo(-r * 1.3, 0); ctx.lineTo(-r, r * 0.12); ctx.fill()
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.16, 0, TAU); ctx.fill()
}

function slime(ctx, r, color, accent, spin) {
  const wob = 1 + 0.08 * Math.sin(spin * 8)
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 1, 0, 0, r)
  g.addColorStop(0, shade(color, 35)); g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.9 * wob, r * 0.75 / wob, 0, 0, TAU); ctx.fill()
  // glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.25, r * 0.16, -0.4, 0, TAU); ctx.fill()
  // eyes
  ctx.fillStyle = '#0b1120'
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, r * 0.1, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.25, r * 0.28, r * 0.1, 0, TAU); ctx.fill()
}

function wraith(ctx, r, color, accent, spin) {
  const sway = Math.sin(spin * 5) * r * 0.15
  ctx.globalAlpha = 0.85
  // tattered tail
  const g = ctx.createLinearGradient(r * 0.4, 0, -r, 0)
  g.addColorStop(0, shade(color, 20)); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(r * 0.4, -r * 0.5)
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.3 + sway, -r * 1.1, sway)
  ctx.quadraticCurveTo(-r * 0.6, r * 0.3 - sway, r * 0.4, r * 0.5)
  ctx.closePath(); ctx.fill()
  // hood
  ctx.fillStyle = shade(color, 10)
  ctx.beginPath(); ctx.arc(r * 0.25, 0, r * 0.5, 0, TAU); ctx.fill()
  // dark face + glowing eyes
  ctx.fillStyle = '#0b0620'
  ctx.beginPath(); ctx.arc(r * 0.38, 0, r * 0.32, 0, TAU); ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.13, r * 0.09, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.45, r * 0.13, r * 0.09, 0, TAU); ctx.fill()
}

function sapper(ctx, r, color, accent, spin) {
  legs(ctx, r, '#3f3f46', 3, spin, 1.0)
  // chassis
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, shade(color, 20)); g.addColorStop(1, shade(color, -25))
  ctx.fillStyle = g
  rr(ctx, -r * 0.6, -r * 0.55, r * 1.2, r * 1.1, r * 0.22); ctx.fill()
  // bomb / drill up front
  ctx.fillStyle = '#111827'
  ctx.beginPath(); ctx.arc(r * 0.6, 0, r * 0.3, 0, TAU); ctx.fill()
  // blinking warning light
  const blink = 0.4 + 0.6 * Math.abs(Math.sin(spin * 9))
  ctx.globalAlpha = blink; ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(-r * 0.15, 0, r * 0.18, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
}

const ENEMY_ROUTINES = {
  soldier: (c, r, col, ac) => soldier(c, r, col, ac, false),
  soldier_heavy: (c, r, col, ac) => soldier(c, r, col, ac, true),
  medic, shield: shieldUnit,
  tank: (c, r, col, ac) => tank(c, r, col, ac, false),
  tank_heavy: (c, r, col, ac) => tank(c, r, col, ac, true),
  jeep, apc, drone, heli, mech,
  spider, hound, brute, wasp, slime, wraith, sapper,
}

export function drawEnemy(ctx, e, spin) {
  const flying = e.class === 'air'
  ctx.save()
  ctx.translate(e.x, e.y)
  // shadow
  ctx.save()
  ctx.translate(0, flying ? e.radius * 1.0 : e.radius * 0.55)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath(); ctx.ellipse(0, 0, e.radius * 0.95, e.radius * 0.45, 0, 0, TAU); ctx.fill()
  ctx.restore()
  if (flying) ctx.translate(0, -e.radius * 0.6)
  // champion (enemy hero) golden aura
  if (e.champion) {
    const pulse = 0.5 + 0.3 * Math.sin(spin * 5)
    ctx.save(); ctx.globalAlpha = pulse
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(0, 0, e.radius * 1.35, 0, TAU); ctx.stroke()
    ctx.restore()
  }
  ctx.save()
  ctx.rotate(e.angle || 0)
  ;(ENEMY_ROUTINES[e.sprite] || ENEMY_ROUTINES.soldier)(ctx, e.radius, e.color, e.accent, spin)
  ctx.restore()
  // crown marker (unrotated, above)
  if (e.champion) {
    ctx.fillStyle = '#fbbf24'; ctx.font = `bold ${Math.round(e.radius)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('♛', 0, -e.radius * 1.5)
  }
  ctx.restore()
}

// ---- TOWERS ---------------------------------------------------------------

function towerBase(ctx, s, color) {
  // octagonal emplacement
  ctx.fillStyle = '#0b1120'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8
    const x = Math.cos(a) * s, y = Math.sin(a) * s
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.closePath(); ctx.fill()
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, s * 0.85)
  g.addColorStop(0, '#20304a'); g.addColorStop(1, '#16233a')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(0, 0, s * 0.78, 0, TAU); ctx.fill()
  ctx.strokeStyle = shade(color, -10); ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(0, 0, s * 0.78, 0, TAU); ctx.stroke()
}

function towerHead(ctx, s, sprite, color, spin) {
  const dk = shade(color, -22)
  ctx.fillStyle = color
  switch (sprite) {
    case 'machinegun':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(s * 0.2, -s * 0.3, s * 1.2, s * 0.18)
      ctx.fillRect(s * 0.2, s * 0.12, s * 1.2, s * 0.18)
      break
    case 'cannon':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.58, 0, TAU); ctx.fill()
      ctx.fillStyle = dk; ctx.beginPath(); ctx.arc(0, 0, s * 0.36, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; rr(ctx, s * 0.3, -s * 0.22, s * 1.1, s * 0.44, s * 0.1); ctx.fill()
      break
    case 'cryo': {
      ctx.fillStyle = color
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.rotate((i / 5) * TAU)
        ctx.beginPath(); ctx.moveTo(0, -s * 0.16); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s * 0.16); ctx.closePath(); ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = shade(color, 40); ctx.beginPath(); ctx.arc(0, 0, s * 0.28, 0, TAU); ctx.fill()
      break
    }
    case 'sniper':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, TAU); ctx.fill()
      ctx.fillStyle = '#0f172a'; ctx.fillRect(s * 0.2, -s * 0.07, s * 1.75, s * 0.14)
      ctx.fillStyle = dk; rr(ctx, -s * 0.1, -s * 0.24, s * 0.5, s * 0.48, s * 0.1); ctx.fill()
      break
    case 'rocket':
      rr(ctx, -s * 0.35, -s * 0.52, s * 0.95, s * 1.04, s * 0.18); ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(s * 0.4, -s * 0.42, s * 0.95, s * 0.26)
      ctx.fillRect(s * 0.4, s * 0.16, s * 0.95, s * 0.26)
      ctx.fillStyle = '#fca5a5'
      ctx.beginPath(); ctx.arc(s * 1.3, -s * 0.29, s * 0.08, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.arc(s * 1.3, s * 0.29, s * 0.08, 0, TAU); ctx.fill()
      break
    case 'flamethrower':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill()
      ctx.fillStyle = dk; rr(ctx, s * 0.3, -s * 0.24, s * 0.9, s * 0.48, s * 0.16); ctx.fill()
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(s * 1.2, 0, s * 0.15, 0, TAU); ctx.fill()
      break
    case 'tesla': {
      ctx.strokeStyle = color; ctx.lineWidth = s * 0.12
      for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 0, s * 0.2 * i, 0, TAU); ctx.stroke() }
      const gl = 0.5 + 0.5 * Math.sin(spin * 10)
      ctx.globalAlpha = gl; ctx.fillStyle = shade(color, 45)
      ctx.beginPath(); ctx.arc(0, 0, s * 0.24, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
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
  for (let i = 0; i < t.level; i++) {
    ctx.fillStyle = '#fde68a'
    ctx.fillRect(-s * 0.7 + i * 7, s * 0.6, 5, 5)
  }
  ctx.rotate(angle)
  towerHead(ctx, s, def.sprite, def.color, spin)
  ctx.restore()
}

// ---- HEROES ---------------------------------------------------------------

function mage(ctx, r, color) {
  const dk = shade(color, -30)
  // cloak
  const g = ctx.createLinearGradient(-r, 0, r, 0)
  g.addColorStop(0, dk); g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.moveTo(r * 0.7, 0); ctx.lineTo(-r * 0.6, -r * 0.7); ctx.lineTo(-r * 0.3, 0); ctx.lineTo(-r * 0.6, r * 0.7); ctx.closePath(); ctx.fill()
  // hood
  ctx.fillStyle = shade(color, 20); ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.38, 0, TAU); ctx.fill()
  ctx.fillStyle = '#0b1120'; ctx.beginPath(); ctx.arc(r * 0.14, 0, r * 0.2, 0, TAU); ctx.fill()
  // staff orb at front
  ctx.fillStyle = '#111827'; ctx.fillRect(r * 0.2, -r * 0.05, r * 0.9, r * 0.1)
  const og = ctx.createRadialGradient(r * 1.05, 0, 1, r * 1.05, 0, r * 0.28)
  og.addColorStop(0, '#fff'); og.addColorStop(1, color)
  ctx.fillStyle = og; ctx.beginPath(); ctx.arc(r * 1.05, 0, r * 0.22, 0, TAU); ctx.fill()
}

export function drawHero(ctx, h, def, rarityColor, spin) {
  const r = 20
  const angle = h.angle || 0
  ctx.save()
  ctx.translate(h.x, h.y)
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath(); ctx.ellipse(0, r * 0.5, r * 0.95, r * 0.4, 0, 0, TAU); ctx.fill()
  // rarity ring (does not rotate)
  const gl = 0.4 + 0.25 * Math.sin(spin * 4)
  ctx.strokeStyle = rarityColor; ctx.globalAlpha = gl; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1
  ctx.fillStyle = '#0b1120'; ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, TAU); ctx.fill()
  // character faces the target
  ctx.rotate(angle)
  const c = def.color
  switch (def.sprite) {
    case 'hero_mech': mech(ctx, r * 0.8, c, rarityColor, spin); break
    case 'hero_mage': mage(ctx, r * 0.85, c); break
    case 'hero_engineer':
      soldier(ctx, r * 0.85, c, shade(c, -30), true)
      ctx.fillStyle = rarityColor; ctx.beginPath(); ctx.arc(-r * 0.1, 0, r * 0.12, 0, TAU); ctx.fill()
      break
    case 'hero_grenade':
      soldier(ctx, r * 0.85, c, shade(c, -25), true)
      ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(r * 0.95, 0, r * 0.2, 0, TAU); ctx.fill()
      break
    default: soldier(ctx, r * 0.85, c, shade(c, -28), true) // hero_rifle
  }
  ctx.restore()
}
