import { TILE, COLS, ROWS, WIDTH, HEIGHT } from './config/maps.js'
import { TOWERS, MAX_LEVEL as TOWER_MAX, TOWER_BASE_HP, TOWER_HP_PER_LEVEL, damageAtLevel, rangeAtLevel, fireRateAtLevel } from './config/towers.js'
import { ENEMIES } from './config/enemies.js'
import { HEROES, HERO_SLOTS, ULTIMATE_SLOTS, RARITY, isUltimate } from './config/heroes.js'
import { DAMAGE_TYPES } from './config/damage.js'
import { MODIFIERS, draftModifiers } from './config/modifiers.js'
import { drawEnemy, drawTower, drawHero } from './sprites.js'
import { pointerToCanvas } from '../helpers/canvas.js'
import { audioService } from '../services/audio.service.js'

const TAU = Math.PI * 2
const rand = () => Math.random()

// Visual style of a projectile, by damage type.
const PROJ_KIND = { kinetic: 'bullet', explosive: 'rocket', fire: 'fireball', frost: 'shard', toxic: 'glob', energy: 'bolt' }
// Which damage types render hitscan beams as jagged lightning.
const BOLT_TYPES = new Set(['energy'])

export class Game {
  constructor(canvas, state, level) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.state = state
    this._loop = this._loop.bind(this)
    this.running = false
    this.reset(level)
  }

  reset(level) {
    this.level = level
    this.pathsPx = level.map.paths.map((pp) => pp.map((p) => ({ x: p.x * TILE + TILE / 2, y: p.y * TILE + TILE / 2 })))
    this.blocked = this._computeBlocked(level.map.paths)
    this.basePt = this.pathsPx[0][this.pathsPx[0].length - 1] // shared exit

    this.turrets = []
    this.enemies = []
    this.projectiles = []
    this.enemyShots = []
    this.wells = []
    this.beams = []
    this.particles = []
    this.heroes = []
    this.buffs = []
    this.spawnExtra = []
    this.spawnQueue = []

    this.waveActive = false
    this.waveTimer = 0
    this.time = 0
    this.spin = 0
    this.speedMult = 1
    this.lastTime = 0
    this.shake = 0
    this.slowmo = 0
    this.combo = 0
    this.comboTimer = 0
    this.fx = []            // timed area effects (storms, meteor rain)
    this.baseInvulnTimer = 0
    this._annId = 0         // kill-streak announcement id
    this._annTier = -1
    this.mod = { hp: 1, spd: 1, reward: 1, towerCost: 1, towerDmg: 1, towerFire: 1 }

    this.build = null
    this.selected = null
    this.hover = null

    const s = this.state
    s.level = level.n
    s.chapter = level.chapter
    s.themeName = level.theme.name
    s.mapName = level.map.name
    s.money = level.startMoney
    s.baseHp = level.baseHp
    s.maxBaseHp = level.baseHp
    s.wave = 0
    s.totalWaves = level.totalWaves
    s.kills = 0
    s.status = 'playing'
    s.waveActive = false
    s.speed = 1
    s.stars = 0
    s.selectedInfo = null
    s.heroSkills = []
    s.deployed = []
    s.combo = 0
    s.comboMult = 1
    s.announce = { id: 0, text: '', color: '#e2e8f0' }
    s.modName = ''
    s.allowed = level.allowed || null
    s.heroesLocked = level.mode === 'puzzle'
    // puzzles have no roguelite draft (fixed challenge)
    s.drafting = level.mode !== 'puzzle'
    s.draftChoices = s.drafting ? draftModifiers(3) : []
  }

  chooseModifier(id) {
    const m = MODIFIERS.find((x) => x.id === id)
    if (!m || !this.state.drafting) return
    this.mod.hp *= m.hp || 1; this.mod.spd *= m.spd || 1; this.mod.reward *= m.reward || 1
    this.mod.towerCost *= m.towerCost || 1; this.mod.towerDmg *= m.towerDmg || 1; this.mod.towerFire *= m.towerFire || 1
    if (m.money) this.state.money += m.money
    if (m.baseHpMult) this.state.maxBaseHp = Math.round(this.state.maxBaseHp * m.baseHpMult)
    if (m.baseHp) this.state.maxBaseHp += m.baseHp
    this.state.baseHp = this.state.maxBaseHp
    this.state.modName = m.name
    this.state.drafting = false
  }

  start() { if (!this.running) { this.running = true; requestAnimationFrame(this._loop) } }
  stop() { this.running = false }
  restart(level) { this.reset(level || this.level) }

  // ---- map ---------------------------------------------------------------

  _computeBlocked(paths) {
    const set = new Set()
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1]
        const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y)
        let x = a.x, y = a.y
        while (true) {
          if (x >= 0 && x < COLS && y >= 0 && y < ROWS) set.add(`${x},${y}`)
          if (x === b.x && y === b.y) break
          x += dx; y += dy
        }
      }
    }
    return set
  }

  _occupied(col, row) {
    return this.turrets.some((t) => t.col === col && t.row === row) ||
      this.heroes.some((h) => h.col === col && h.row === row)
  }
  canBuild(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false
    if (this.blocked.has(`${col},${row}`)) return false
    return !this._occupied(col, row)
  }

  // ---- input -------------------------------------------------------------

  setBuild(kind, key) { this.build = key ? { kind, key } : null; this.selected = null; this.state.selectedInfo = null }
  clearBuild() { this.build = null }

  _toGrid(cx, cy) { const { x, y } = pointerToCanvas(this.canvas, cx, cy); return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) } }
  handleMove(cx, cy) { this.hover = this._toGrid(cx, cy) }
  handleLeave() { this.hover = null }

  handlePointer(cx, cy) {
    const { col, row } = this._toGrid(cx, cy)
    if (this.build) {
      if (this.build.kind === 'tower') this._placeTower(col, row)
      else this._deployHero(col, row)
      return
    }
    const ent = this.turrets.find((t) => t.col === col && t.row === row) || this.heroes.find((h) => h.col === col && h.row === row)
    if (ent) { this.selected = ent; this._refreshSelected() }
    else { this.selected = null; this.state.selectedInfo = null }
  }

  _placeTower(col, row) {
    const def = TOWERS[this.build.key]
    const cost = Math.round(def.cost * this.mod.towerCost)
    if (!def || !this.canBuild(col, row) || this.state.money < cost) return
    this.state.money -= cost
    this.turrets.push({
      kind: 'tower', key: this.build.key, col, row,
      x: col * TILE + TILE / 2, y: row * TILE + TILE / 2,
      level: 1, invested: cost, cooldown: 0, angle: -Math.PI / 2, recoil: 0,
      hp: TOWER_BASE_HP, maxHp: TOWER_BASE_HP, xp: 0, vet: 0,
      target: null, lockTarget: null, lockTime: 0,
    })
  }

  _deployHero(col, row) {
    const key = this.build.key
    if (!this.canBuild(col, row) || this.heroes.some((h) => h.key === key)) return
    const ult = isUltimate(key)
    const cap = ult ? ULTIMATE_SLOTS : HERO_SLOTS
    const cur = this.heroes.filter((h) => isUltimate(h.key) === ult).length
    if (cur >= cap) return
    this.heroes.push({
      kind: 'hero', key, col, row, x: col * TILE + TILE / 2, y: row * TILE + TILE / 2,
      cooldown: 0, atkCooldown: 0, angle: 0, recoil: 0, target: null, lockTarget: null, lockTime: 0,
    })
    this.state.deployed.push(key)
    this._syncHeroSkills()
    this.build = null
  }

  _syncHeroSkills() {
    this.state.heroSkills = this.heroes.map((h) => {
      const def = HEROES[h.key]
      return {
        key: h.key, name: def.name, skillName: def.skill.name, desc: def.skill.desc,
        color: def.color, rarity: def.rarity, rarityColor: RARITY[def.rarity].color,
        cooldown: def.skill.cooldown, cooldownLeft: h.cooldown, ready: h.cooldown <= 0,
      }
    })
  }

  _refreshSelected() {
    const e = this.selected
    if (!e) { this.state.selectedInfo = null; return }
    if (e.kind === 'tower') {
      const def = TOWERS[e.key]
      const up = Math.round(def.cost * e.level * this.mod.towerCost)
      const hasAtk = def.damage != null && def.fireRate != null
      const dps = hasAtk ? Math.round(damageAtLevel(def.damage, e.level) * fireRateAtLevel(def.fireRate, e.level) * (def.multishot || 1)) : 0
      this.state.selectedInfo = {
        kind: 'tower', name: def.name, color: def.color, level: e.level, maxLevel: TOWER_MAX,
        dps, hp: Math.round(e.hp), maxHp: e.maxHp,
        range: def.range ? Math.round(rangeAtLevel(def.range, e.level)) : 0,
        dtype: def.dtype ? DAMAGE_TYPES[def.dtype].label : '—', dtypeColor: def.dtype ? DAMAGE_TYPES[def.dtype].color : '#94a3b8',
        strongVs: def.strongVs,
        note: def.mode === 'income' ? `Mints +$${def.income} every ${def.incomeInterval}s`
          : def.mode === 'support' ? `Aura: +${Math.round((def.buff.damageMult - 1) * 100)}% dmg, +${Math.round((def.buff.fireMult - 1) * 100)}% rate` : '',
        canUpgrade: e.level < TOWER_MAX && hasAtk, upgradeCost: up, canAfford: this.state.money >= up, sellValue: Math.floor(e.invested * 0.6),
        fused: !!e.fused,
        canFuse: hasAtk && !e.fused && e.level >= TOWER_MAX && this.turrets.some((x) => x !== e && x.key === e.key && x.level >= TOWER_MAX && !x.fused),
        vet: e.vet || 0, vetName: ['', 'Veteran', 'Elite', 'Ace'][e.vet || 0],
      }
    } else {
      const def = HEROES[e.key]
      this.state.selectedInfo = {
        kind: 'hero', name: def.name, color: def.color, rarity: RARITY[def.rarity].label, rarityColor: RARITY[def.rarity].color,
        dtype: DAMAGE_TYPES[def.attack.dtype].label, dtypeColor: DAMAGE_TYPES[def.attack.dtype].color,
        dps: Math.round(def.attack.damage * def.attack.fireRate),
        skillName: def.skill.name, desc: def.skill.desc,
      }
    }
  }

  upgradeSelected() {
    const t = this.selected
    if (!t || t.kind !== 'tower' || t.level >= TOWER_MAX) return
    const cost = Math.round(TOWERS[t.key].cost * t.level * this.mod.towerCost)
    if (this.state.money < cost) return
    this.state.money -= cost
    t.level += 1; t.invested += cost
    t.maxHp = TOWER_BASE_HP + (t.level - 1) * TOWER_HP_PER_LEVEL; t.hp = t.maxHp
    this._refreshSelected()
  }

  // Merge two max-level towers of the same type into an evolved Lv5 super-tower.
  fuseSelected() {
    const t = this.selected
    if (!t || t.kind !== 'tower' || t.level < TOWER_MAX || t.fused) return
    const def = TOWERS[t.key]
    if (def.mode === 'support' || def.mode === 'income') return
    const other = this.turrets.find((x) => x !== t && x.key === t.key && x.level >= TOWER_MAX && !x.fused)
    if (!other) return
    this.turrets = this.turrets.filter((x) => x !== other)
    t.level = 5; t.fused = true; t.invested += other.invested
    t.maxHp += TOWER_HP_PER_LEVEL; t.hp = t.maxHp
    this._explosion(t.x, t.y, 46, def.color); audioService.explosion(); this._text(t.x, t.y - 12, 'FUSED!', '#fde047')
    this._refreshSelected()
  }

  sellSelected() {
    const e = this.selected
    if (!e) return
    if (e.kind === 'tower') { this.state.money += Math.floor(e.invested * 0.6); this.turrets = this.turrets.filter((x) => x !== e) }
    else { this.heroes = this.heroes.filter((x) => x !== e); this.state.deployed = this.state.deployed.filter((k) => k !== e.key); this._syncHeroSkills() }
    this.selected = null; this.state.selectedInfo = null
  }

  setSpeed(mult) { this.speedMult = mult; this.state.speed = mult }

  // ---- waves -------------------------------------------------------------

  startWave() {
    if (this.waveActive || this.state.status !== 'playing' || this.state.drafting) return
    const groups = this.level.waves[this.state.wave]
    if (!groups) return
    this.spawnQueue = []
    const lanes = this.pathsPx.length
    groups.forEach((g, gi) => {
      const delay = g.delay || 0
      const pathIndex = (g.lane != null ? g.lane : gi) % lanes // spread groups across lanes
      for (let i = 0; i < g.count; i++) this.spawnQueue.push({ type: g.type, time: delay + i * g.interval, champion: !!g.champion, waveBoss: !!g.waveBoss, tier: g.tier || 0, pathIndex })
    })
    this.spawnQueue.sort((a, b) => a.time - b.time)
    this.waveTimer = 0; this.waveActive = true; this.state.waveActive = true
  }

  _spawn(type, opts = {}) {
    const def = ENEMIES[type]
    let hp = def.hp * this.level.hpMult * this.mod.hp, radius = def.radius, reward = def.reward * this.level.rewardMult * this.mod.reward
    let speed = def.speed * this.level.spdMult * this.mod.spd, armor = def.armor || 0
    let abilities = def.abilities ? { ...def.abilities } : null
    const champion = !!opts.champion
    const waveBoss = !!opts.waveBoss
    let name = def.name
    if (champion) {
      hp *= 4.5; radius *= 1.4; reward *= 5; speed *= 0.92; name = 'Elite ' + def.name
      abilities = abilities ? { ...abilities } : {}
      const mod = ['swift', 'armored', 'regen', 'brute'][Math.floor(rand() * 4)]
      if (mod === 'swift') speed *= 1.4
      else if (mod === 'armored') armor = Math.max(armor, 0.5)
      else if (mod === 'regen') abilities.regen = (abilities.regen || 0) + 40
      else { hp *= 1.4; radius *= 1.1 }
    }
    if (waveBoss) {
      const tier = opts.tier || 0
      hp *= 3 + tier * 0.9   // much stronger, and grows every wave
      radius *= 1.6          // a giant
      reward *= 7; speed *= 0.9
      armor = Math.max(armor, 0.25)
      name = 'Boss ' + def.name
      abilities = abilities ? { ...abilities } : {}
      // always able to smash your turrets
      if (!abilities.siege) abilities.siege = { range: 1.7 * 64, dps: 50 + tier * 6 }
    }
    // Bosses get 2-3 unique active skills (see _bossSkill).
    let bossSkills = null, skillCd = 0
    if (waveBoss || def.boss) {
      const poolS = ['slam', 'barrage', 'summon', 'rage', 'shield']
      const cnt = waveBoss ? 2 : 3
      bossSkills = []
      const ps = poolS.slice()
      for (let k = 0; k < cnt && ps.length; k++) bossSkills.push(ps.splice(Math.floor(rand() * ps.length), 1)[0])
      skillCd = 3 + rand() * 2.5
    }
    const pathIndex = opts.pathIndex || 0
    const p = opts.at || this.pathsPx[pathIndex][0]
    this.enemies.push({
      type, name, class: def.class, sprite: def.sprite, color: def.color, accent: def.accent, radius, armor,
      abilities, boss: !!def.boss, champion, waveBoss, res: def.res || null,
      pathIndex, x: p.x, y: p.y, seg: opts.seg || 1, dist: 0, angle: 0,
      hp: Math.round(hp), maxHp: Math.round(hp), speed, reward: Math.round(reward), damage: def.damage,
      slowTimer: 0, slowFactor: 0, dotTimer: 0, dotDps: 0, dotType: 'fire', buffSpeed: 1, siegeTarget: null,
      artCd: abilities && abilities.artillery ? rand() * abilities.artillery.interval : 0,
      summonCd: abilities && abilities.summon ? abilities.summon.interval : 0,
      rageTimer: 0, shieldTimer: 0, leaping: 0,
      leapCd: abilities && abilities.leap ? rand() * abilities.leap.interval : 0,
      bossSkills, skillCd, skillIx: 0,
      dead: false, reached: false,
    })
    if (champion) this._text(p.x, p.y, 'ELITE!', '#fbbf24')
  }

  // ---- simulation --------------------------------------------------------

  update(dt) {
    if (this.state.status !== 'playing') return
    this.time += dt; this.spin += dt
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 60)
    if (this.baseInvulnTimer > 0) this.baseInvulnTimer -= dt
    if (this.fx.length) this._updateFx(dt)
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) { this.combo = 0; this._annTier = -1 } }
    this.state.combo = this.combo
    this.state.comboMult = 1 + Math.min(1.5, Math.floor(this.combo / 4) * 0.1)
    if (this.buffs.length) this.buffs = this.buffs.filter((b) => b.expire > this.time)

    if (this.waveActive) {
      this.waveTimer += dt
      while (this.spawnQueue.length && this.spawnQueue[0].time <= this.waveTimer) {
        const s = this.spawnQueue.shift(); this._spawn(s.type, { champion: s.champion, waveBoss: s.waveBoss, tier: s.tier, pathIndex: s.pathIndex })
      }
    }

    for (const e of this.enemies) e.buffSpeed = 1
    for (const e of this.enemies) {
      if (!e.abilities || e.dead) continue
      if (e.abilities.heal) {
        const { radius, amount } = e.abilities.heal
        for (const o of this.enemies) { if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) <= radius) o.hp = Math.min(o.maxHp, o.hp + amount * dt) }
      }
      if (e.abilities.buff) {
        const { radius, speedMult } = e.abilities.buff
        for (const o of this.enemies) { if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) <= radius) o.buffSpeed = Math.max(o.buffSpeed, speedMult) }
      }
    }

    for (const e of this.enemies) this._moveEnemy(e, dt)
    for (const e of this.enemies) this._updateBossSkills(e, dt)
    for (const e of this.enemies) { if (e.reached && !e.dead) { e.dead = true; if (this.baseInvulnTimer <= 0) this.state.baseHp -= e.damage } }

    for (const t of this.turrets) this._updateTower(t, dt)
    for (const h of this.heroes) this._updateHero(h, dt)
    for (const p of this.projectiles) this._updateProjectile(p, dt)
    for (const s of this.enemyShots) this._updateEnemyShot(s, dt)
    if (this.wells.length) this._updateWells(dt)
    this._updateParticles(dt)

    if (this.beams.length) { for (const b of this.beams) b.life -= dt; this.beams = this.beams.filter((b) => b.life > 0) }
    if (this.spawnExtra.length) { for (const s of this.spawnExtra) this._spawn(s.type, { at: s.at, pathIndex: s.pathIndex, seg: s.seg }); this.spawnExtra = [] }

    this.enemies = this.enemies.filter((e) => !e.dead)
    this.projectiles = this.projectiles.filter((p) => !p.dead)
    this.enemyShots = this.enemyShots.filter((s) => !s.dead)
    if (this.wells.length) this.wells = this.wells.filter((w) => w.life > 0)

    if (this.waveActive && !this.spawnQueue.length && !this.enemies.length) {
      this.waveActive = false; this.state.waveActive = false; this.state.wave += 1
      if (this.level.mode === 'endless') { this.level.hpMult *= 1.09; this.level.spdMult = Math.min(1.9, this.level.spdMult * 1.01) }
      if (this.level.mode !== 'puzzle') { // puzzles run on a fixed budget — no income
        const interest = Math.min(150, Math.floor(this.state.money * 0.08))
        this.state.money += 75 + this.state.wave * 16 + interest
        if (interest > 0) this._text(WIDTH / 2, HEIGHT / 2 + 42, '+💰' + interest + ' interest', '#facc15')
      }
      if (this.state.wave >= this.level.totalWaves) {
        const ratio = this.state.baseHp / this.state.maxBaseHp
        this.state.stars = ratio >= 0.9 ? 3 : ratio >= 0.5 ? 2 : 1
        this.state.status = 'won'; audioService.end(true)
      } else this._text(WIDTH / 2, HEIGHT / 2, 'WAVE CLEARED', '#22d3ee', true)
    }
    if (this.state.baseHp <= 0) { this.state.baseHp = 0; this.state.status = 'lost'; audioService.end(false) }
  }

  _moveEnemy(e, dt) {
    if (e.dotTimer > 0) { e.dotTimer -= dt; this._damage(e, e.dotDps * dt, e.dotType, true) }
    if (e.dead) return
    if (e.abilities && e.abilities.regen && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.abilities.regen * dt)
    if (e.slowTimer > 0) e.slowTimer -= dt
    if (e.rageTimer > 0) e.rageTimer -= dt
    if (e.shieldTimer > 0) e.shieldTimer -= dt
    // leap: charge, then dash forward in a fast burst
    if (e.abilities && e.abilities.leap) {
      if (e.leaping > 0) e.leaping -= dt
      else { e.leapCd -= dt; if (e.leapCd <= 0) { e.leapCd = e.abilities.leap.interval; e.leaping = 0.28; this._spark(e.x, e.y, e.accent || '#fde047', 6) } }
    }

    if (e.abilities && e.abilities.siege) {
      const { range, dps } = e.abilities.siege
      let tgt = null, td = range
      for (const t of this.turrets) { const d = Math.hypot(t.x - e.x, t.y - e.y); if (d <= td) { td = d; tgt = t } }
      e.siegeTarget = tgt
      if (tgt) {
        tgt.hp -= dps * dt
        if (this.spin % 0.4 < dt) this._spark(tgt.x, tgt.y, '#fca5a5', 3)
        if (tgt.hp <= 0) this._destroyTower(tgt)
        return
      }
    }

    // ranged siege: lob shells at towers from afar (keeps advancing)
    if (e.abilities && e.abilities.artillery) {
      e.artCd -= dt
      if (e.artCd <= 0) {
        const a = e.abilities.artillery
        let tgt = null, td = a.range
        for (const t of this.turrets) { const d = Math.hypot(t.x - e.x, t.y - e.y); if (d <= td) { td = d; tgt = t } }
        if (tgt) {
          e.artCd = a.interval
          this.enemyShots.push({ x: e.x, y: e.y, target: tgt, speed: 260, dmg: a.dmg, splash: a.splash, dead: false })
          this._muzzle(e.x, e.y, Math.atan2(tgt.y - e.y, tgt.x - e.x), '#fbbf24')
        }
      }
    }
    // summoner: periodically call reinforcements
    if (e.abilities && e.abilities.summon) {
      e.summonCd -= dt
      if (e.summonCd <= 0) {
        const s = e.abilities.summon
        e.summonCd = s.interval
        for (let i = 0; i < s.count; i++) this.spawnExtra.push({ type: s.into, at: { x: e.x + (i - s.count / 2) * 10, y: e.y }, pathIndex: e.pathIndex, seg: e.seg })
        this._shock(e.x, e.y, 40, e.accent); this._spark(e.x, e.y, e.accent, 6)
      }
    }

    const path = this.pathsPx[e.pathIndex] || this.pathsPx[0]
    const target = path[e.seg]
    if (!target) { e.reached = true; return }
    let enrage = 1
    if (e.abilities && e.abilities.enrage && e.hp / e.maxHp < e.abilities.enrage.below) enrage = e.abilities.enrage.speedMult
    const slow = e.slowTimer > 0 ? 1 - e.slowFactor : 1
    const leap = e.leaping > 0 ? e.abilities.leap.boost : 1
    const rageM = e.rageTimer > 0 ? 1.6 : 1
    const move = e.speed * enrage * e.buffSpeed * slow * leap * rageM * dt
    const dx = target.x - e.x, dy = target.y - e.y, d = Math.hypot(dx, dy)
    e.angle = Math.atan2(dy, dx)
    if (d <= move) { e.x = target.x; e.y = target.y; e.dist += d; e.seg += 1; if (e.seg >= path.length) e.reached = true }
    else { e.x += (dx / d) * move; e.y += (dy / d) * move; e.dist += move }
  }

  _destroyTower(t) {
    this._explosion(t.x, t.y, TILE * 0.7, TOWERS[t.key].color)
    audioService.explosion()
    this._text(t.x, t.y - 8, 'TOWER LOST', '#ef4444')
    this.turrets = this.turrets.filter((x) => x !== t)
    if (this.selected === t) { this.selected = null; this.state.selectedInfo = null }
  }

  // ---- combat ------------------------------------------------------------

  _towerStats(t) {
    const def = TOWERS[t.key]
    let dmg = 1, fire = 1, range = 1
    for (const h of this.heroes) {
      const p = HEROES[h.key].passive
      if (!p) continue
      if (p.radius === 0 || Math.hypot(h.x - t.x, h.y - t.y) <= p.radius) {
        if (p.damageMult) dmg *= p.damageMult
        if (p.fireMult) fire *= p.fireMult
        if (p.rangeMult) range *= p.rangeMult
      }
    }
    // Command Obelisk support-tower auras
    for (const s of this.turrets) {
      const sd = TOWERS[s.key]
      if (sd.mode === 'support' && sd.buff && s !== t && Math.hypot(s.x - t.x, s.y - t.y) <= rangeAtLevel(sd.range, s.level)) {
        dmg *= sd.buff.damageMult || 1; fire *= sd.buff.fireMult || 1
      }
    }
    for (const b of this.buffs) { dmg *= b.damageMult || 1; fire *= b.fireMult || 1 }
    dmg *= this.mod.towerDmg; fire *= this.mod.towerFire
    if (t.fused) { dmg *= 1.3; fire *= 1.15; range *= 1.1 } // fusion bonus on top of Lv5 stats
    if (t.vet) dmg *= 1 + t.vet * 0.08 // veterancy bonus
    const damage = damageAtLevel(def.damage || 0, t.level) * dmg
    return {
      mode: def.mode, dtype: def.dtype, range: rangeAtLevel(def.range || 0, t.level) * range, minRange: def.minRange || 0,
      damage, fireRate: fireRateAtLevel(def.fireRate || 1, t.level) * fire, projSpeed: def.projSpeed,
      splash: def.splash || 0, slow: def.slow || null, dot: def.dot || null, chain: def.chain || null,
      ramp: def.ramp || 0, groundOnly: !!def.groundOnly, color: def.color, pitch: this._pitch(damage),
      pierce: !!def.pierce, pierceW: def.pierceW || 20, multishot: def.multishot || 0,
    }
  }

  _heroStats(h) {
    const a = HEROES[h.key].attack
    return {
      mode: a.mode, dtype: a.dtype, range: a.range, minRange: 0, damage: a.damage, fireRate: a.fireRate,
      projSpeed: a.projSpeed, splash: a.splash || 0, slow: a.slow || null, dot: a.dot || null,
      chain: a.chain || null, ramp: 0, groundOnly: false, color: HEROES[h.key].color, pitch: this._pitch(a.damage),
      multishot: a.multishot || 0, execute: a.execute || 0, well: a.well || null, rot: a.rot || 0, width: a.width || 16, pierce: false,
    }
  }

  _pitch(damage) { return Math.max(150, Math.min(760, 720 - damage * 2.4)) }

  _acquire(unit, stats) {
    let best = null
    for (const e of this.enemies) {
      if (e.dead) continue
      if (stats.groundOnly && e.class === 'air') continue
      const d = Math.hypot(e.x - unit.x, e.y - unit.y)
      if (d > stats.range || (stats.minRange && d < stats.minRange)) continue
      if (!best || e.dist > best.dist) best = e
    }
    return best
  }

  _updateTower(t, dt) {
    if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 7)
    const def = TOWERS[t.key]
    t.cooldown -= dt

    if (def.mode === 'support') return // passive aura only (see _towerStats)
    if (def.mode === 'income') {
      if (t.cooldown <= 0) { t.cooldown = def.incomeInterval; this.state.money += def.income; this._text(t.x, t.y - 16, '+$' + def.income, '#facc15') }
      return
    }

    const stats = this._towerStats(t)
    if (def.mode === 'pulse') {
      if (t.cooldown <= 0) { t.cooldown = 1 / stats.fireRate; this._pulse(t, stats) }
      return
    }

    const target = this._acquire(t, stats)
    t.target = target
    if (!target) { t.lockTarget = null; t.lockTime = 0; return }
    t.angle = Math.atan2(target.y - t.y, target.x - t.x)
    if (t.cooldown <= 0) { t.cooldown = 1 / stats.fireRate; this._fire(t, stats, target) }
  }

  _pulse(t, stats) {
    this._gainXp(t)
    this.particles.push({ type: 'shock', x: t.x, y: t.y, r: stats.range, color: stats.color, life: 0.35, max: 0.35 })
    audioService.shoot(stats.pitch)
    for (const e of this.enemies) {
      if (e.dead) continue
      if (Math.hypot(e.x - t.x, e.y - t.y) <= stats.range) {
        this._damage(e, stats.damage, stats.dtype)
        if (stats.slow) { e.slowTimer = stats.slow.dur; e.slowFactor = stats.slow.factor }
        this._spark(e.x, e.y, stats.color, 2)
      }
    }
  }

  _acquireMany(unit, stats, n) {
    const list = []
    for (const e of this.enemies) {
      if (e.dead) continue
      if (stats.groundOnly && e.class === 'air') continue
      const d = Math.hypot(e.x - unit.x, e.y - unit.y)
      if (d > stats.range || (stats.minRange && d < stats.minRange)) continue
      list.push(e)
    }
    list.sort((a, b) => b.dist - a.dist)
    return list.slice(0, n)
  }

  _pierce(unit, stats, target, bx, by) {
    const ang = Math.atan2(target.y - by, target.x - bx)
    const dx = Math.cos(ang), dy = Math.sin(ang)
    for (const e of this.enemies) {
      if (e.dead) continue
      if (stats.groundOnly && e.class === 'air') continue
      const rx = e.x - bx, ry = e.y - by
      const proj = rx * dx + ry * dy
      if (proj < 0 || proj > stats.range) continue
      if (Math.abs(rx * dy - ry * dx) <= stats.pierceW + e.radius) { this._damage(e, stats.damage, stats.dtype); this._spark(e.x, e.y, stats.color, 4) }
    }
    this.beams.push({ segs: [[bx, by, bx + dx * stats.range, by + dy * stats.range]], color: stats.color, life: 0.1, width: 4, bolt: BOLT_TYPES.has(stats.dtype) })
  }

  _updateHero(h, dt) {
    if (h.recoil > 0) h.recoil = Math.max(0, h.recoil - dt * 7)
    if (h.cooldown > 0) { h.cooldown = Math.max(0, h.cooldown - dt); this._updateHeroCooldownUi() }
    const stats = this._heroStats(h)
    if (stats.mode === 'sweep') { this._heroSweep(h, stats, dt); return } // continuous rotating beam
    h.atkCooldown -= dt
    const target = this._acquire(h, stats)
    h.target = target
    if (!target) { h.lockTarget = null; h.lockTime = 0; return }
    h.angle = Math.atan2(target.y - h.y, target.x - h.x)
    if (h.atkCooldown > 0) return
    h.atkCooldown = 1 / stats.fireRate
    h.recoil = 1
    if (stats.mode === 'blackhole') this._spawnWell(target, stats)
    else if (stats.mode === 'boomerang') this._spawnBoomerang(h, stats, target)
    else this._fire(h, stats, target)
  }

  _heroSweep(h, stats, dt) {
    h.beamAngle = (h.beamAngle || 0) + stats.rot * dt
    h.angle = h.beamAngle
    const dx = Math.cos(h.beamAngle), dy = Math.sin(h.beamAngle)
    for (const e of this.enemies) {
      if (e.dead) continue
      const rx = e.x - h.x, ry = e.y - h.y
      const proj = rx * dx + ry * dy
      if (proj < 0 || proj > stats.range) continue
      if (Math.abs(rx * dy - ry * dx) <= stats.width + e.radius) {
        this._damage(e, stats.damage * dt, stats.dtype)
        if (rand() < 0.25) this._spark(e.x, e.y, stats.color, 1)
      }
    }
  }

  _spawnWell(pos, stats) {
    const w = stats.well
    this.wells.push({ x: pos.x, y: pos.y, life: w.life, max: w.life, radius: w.radius, dps: w.dps, pull: w.pull, color: stats.color })
    this._shock(pos.x, pos.y, w.radius, stats.color)
    audioService.shoot(stats.pitch)
  }

  _spawnBoomerang(h, stats, target) {
    const ang = Math.atan2(target.y - h.y, target.x - h.x)
    this._muzzle(h.x + Math.cos(ang) * 22, h.y + Math.sin(ang) * 22, ang, stats.color)
    audioService.shoot(stats.pitch)
    this.projectiles.push({
      boomerang: true, kind: 'chakram', x: h.x, y: h.y, ox: h.x, oy: h.y,
      dirX: Math.cos(ang), dirY: Math.sin(ang), range: stats.range, dist: 0, phase: 'out',
      speed: stats.projSpeed, damage: stats.damage, dtype: stats.dtype, color: stats.color,
      angle: 0, hit: new Set(), trail: [], dead: false,
    })
  }

  _updateBoomerang(p, dt) {
    const step = p.speed * dt
    if (p.phase === 'out') { p.x += p.dirX * step; p.y += p.dirY * step; p.dist += step; if (p.dist >= p.range) { p.phase = 'back'; p.hit.clear() } }
    else { const dx = p.ox - p.x, dy = p.oy - p.y, d = Math.hypot(dx, dy); if (d <= step) p.dead = true; else { p.x += (dx / d) * step; p.y += (dy / d) * step } }
    p.angle += 16 * dt
    p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 6) p.trail.shift()
    for (const e of this.enemies) {
      if (e.dead || p.hit.has(e)) continue
      if (Math.hypot(e.x - p.x, e.y - p.y) <= e.radius + 12) { this._damage(e, p.damage, p.dtype); this._spark(e.x, e.y, p.color, 4); p.hit.add(e) }
    }
  }

  _checkAnnounce() {
    const TIERS = [
      [3, 'TRIPLE KILL', '#22d3ee'], [5, 'RAMPAGE', '#a78bfa'], [8, 'KILLING SPREE', '#f59e0b'],
      [12, 'UNSTOPPABLE', '#fb923c'], [16, 'GODLIKE', '#ef4444'], [22, 'SAVAGE!', '#f43f5e'],
    ]
    let ti = -1
    for (let i = 0; i < TIERS.length; i++) if (this.combo >= TIERS[i][0]) ti = i
    if (ti > this._annTier) {
      this._annTier = ti
      this.state.announce = { id: ++this._annId, text: TIERS[ti][1], color: TIERS[ti][2] }
      audioService.combo(); this.shake = Math.max(this.shake, 7); this._flash('rgba(255,255,255,0.12)')
    }
  }

  _gainXp(t) {
    t.xp = (t.xp || 0) + 1
    const nv = t.xp >= 280 ? 3 : t.xp >= 120 ? 2 : t.xp >= 40 ? 1 : 0
    if (nv > (t.vet || 0)) {
      t.vet = nv
      this._text(t.x, t.y - 16, ['', 'VETERAN', 'ELITE', 'ACE'][nv], '#fde047'); this._spark(t.x, t.y, '#fde047', 6)
      if (this.selected === t) this._refreshSelected()
    }
  }

  _fire(unit, stats, target) {
    unit.recoil = 1
    if (unit.kind === 'tower') this._gainXp(unit)
    const bx = unit.x + Math.cos(unit.angle) * 22, by = unit.y + Math.sin(unit.angle) * 22
    this._muzzle(bx, by, unit.angle, stats.color)
    audioService.shoot(stats.pitch)
    if (stats.mode === 'projectile') {
      const targets = stats.multishot ? this._acquireMany(unit, stats, stats.multishot) : [target]
      for (const tg of targets) {
        if (!tg) continue
        this.projectiles.push({
          x: bx, y: by, px: bx, py: by, angle: Math.atan2(tg.y - by, tg.x - bx), kind: PROJ_KIND[stats.dtype] || 'bullet',
          target: tg, speed: stats.projSpeed, damage: stats.damage, dtype: stats.dtype,
          splash: stats.splash, slow: stats.slow, dot: stats.dot, execute: stats.execute, color: stats.color, trail: [], dead: false,
        })
      }
    } else if (stats.pierce) {
      this._pierce(unit, stats, target, bx, by)
    } else {
      this._hitscan(unit, stats, target, bx, by)
    }
  }

  _hitscan(unit, stats, target, bx, by) {
    let dmg = stats.damage
    if (stats.ramp) {
      if (unit.lockTarget === target) unit.lockTime = (unit.lockTime || 0) + 1 / stats.fireRate
      else { unit.lockTarget = target; unit.lockTime = 0 }
      dmg *= 1 + (stats.ramp - 1) * Math.min(1, unit.lockTime / 2)
    }
    const bolt = BOLT_TYPES.has(stats.dtype)
    if (stats.chain) {
      const hit = new Set([target]); let from = target
      this._damage(target, dmg, stats.dtype); this._spark(target.x, target.y, stats.color, 5)
      const segs = [[bx, by, target.x, target.y]]
      for (let j = 0; j < stats.chain.jumps; j++) {
        let next = null, nd = stats.chain.range
        for (const e of this.enemies) { if (e.dead || hit.has(e)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d <= nd) { nd = d; next = e } }
        if (!next) break
        segs.push([from.x, from.y, next.x, next.y]); this._damage(next, dmg * 0.8, stats.dtype); this._spark(next.x, next.y, stats.color, 4)
        hit.add(next); from = next
      }
      this.beams.push({ segs, color: stats.color, life: 0.1, width: 3, bolt: true })
      return
    }
    this._damage(target, dmg, stats.dtype)
    this._hitImpact(target.x, target.y, stats.color)
    if (stats.dot) { target.dotDps = stats.dot.dps; target.dotTimer = stats.dot.dur; target.dotType = stats.dtype }
    if (stats.splash) this._applySplash(target, dmg * 0.5, stats)
    this.beams.push({ segs: [[bx, by, target.x, target.y]], color: stats.color, life: bolt ? 0.09 : 0.06, width: stats.ramp ? 5 : 2, bolt })
  }

  _applySplash(center, dmg, stats) {
    this._explosion(center.x, center.y, stats.splash, stats.color)
    audioService.explosion()
    for (const o of this.enemies) {
      if (o === center || o.dead) continue
      if (Math.hypot(o.x - center.x, o.y - center.y) <= stats.splash) {
        this._damage(o, dmg, stats.dtype)
        if (stats.slow) { o.slowTimer = stats.slow.dur; o.slowFactor = stats.slow.factor }
        if (stats.dot) { o.dotDps = stats.dot.dps; o.dotTimer = stats.dot.dur; o.dotType = stats.dtype }
      }
    }
  }

  _updateProjectile(p, dt) {
    if (p.boomerang) { this._updateBoomerang(p, dt); return }
    const e = p.target
    if (!e || e.dead || e.reached) { p.dead = true; return }
    p.px = p.x; p.py = p.y
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy)
    p.angle = Math.atan2(dy, dx)
    const move = p.speed * dt
    if (d <= move + e.radius) {
      this._damage(e, p.damage, p.dtype)
      if (p.execute) this._damage(e, e.maxHp * p.execute, 'true') // reaper: % max HP
      if (p.slow) { e.slowTimer = p.slow.dur; e.slowFactor = p.slow.factor }
      if (p.dot) { e.dotDps = p.dot.dps; e.dotTimer = p.dot.dur; e.dotType = p.dtype }
      if (p.splash) this._applySplash(e, p.damage * 0.5, p)
      else this._hitImpact(e.x, e.y, p.color)
      p.dead = true
      return
    }
    p.x += (dx / d) * move; p.y += (dy / d) * move
    p.trail.push({ x: p.x, y: p.y })
    if (p.trail.length > 8) p.trail.shift()
    if ((p.kind === 'rocket' || p.kind === 'fireball') && rand() < 0.6) {
      this.particles.push({ type: 'smoke', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.4, max: 0.4, color: p.kind === 'fireball' ? '#f59e0b' : '#94a3b8', size: 3 })
    }
  }

  // Enemy artillery shell → damages a tower (and towers in splash).
  _updateEnemyShot(s, dt) {
    const t = s.target
    if (!t || t.hp <= 0 || !this.turrets.includes(t)) { s.dead = true; return }
    const dx = t.x - s.x, dy = t.y - s.y, d = Math.hypot(dx, dy), move = s.speed * dt
    if (d <= move + 6) {
      this._explosion(t.x, t.y, s.splash, '#fbbf24'); audioService.explosion()
      for (const o of this.turrets.slice()) {
        const dd = Math.hypot(o.x - t.x, o.y - t.y)
        if (dd <= s.splash) { o.hp -= o === t ? s.dmg : s.dmg * 0.5; if (o.hp <= 0) this._destroyTower(o) }
      }
      s.dead = true
    } else { s.x += (dx / d) * move; s.y += (dy / d) * move }
  }

  // Gravity wells (Nyx): pull enemies inward and crush them.
  _updateWells(dt) {
    for (const w of this.wells) {
      w.life -= dt
      for (const e of this.enemies) {
        if (e.dead) continue
        const dx = w.x - e.x, dy = w.y - e.y, d = Math.hypot(dx, dy)
        if (d <= w.radius) {
          this._damage(e, w.dps * dt, 'energy')
          if (d > 4) { const pull = Math.min(d, w.pull * dt); e.x += (dx / d) * pull; e.y += (dy / d) * pull }
        }
      }
    }
  }

  // Timed area effects: thunderstorm (repeated bolts) & meteor rain.
  _updateFx(dt) {
    for (const f of this.fx) {
      f.life -= dt; f.cd -= dt
      if (f.cd > 0) continue
      f.cd = f.cdMax
      const targets = this.enemies.filter((e) => !e.dead)
      if (f.kind === 'storm') {
        const e = targets[Math.floor(rand() * targets.length)]
        if (e) { this._damage(e, f.dmg, 'energy'); this.beams.push({ segs: [[e.x, -10, e.x, e.y]], color: '#a78bfa', life: 0.1, width: 3, bolt: true }); this._spark(e.x, e.y, '#c4b5fd', 6) }
      } else if (f.kind === 'meteor') {
        const e = targets[Math.floor(rand() * targets.length)]
        const x = e ? e.x : rand() * WIDTH, y = e ? e.y : rand() * HEIGHT * 0.8
        this._explosion(x, y, f.radius, '#f97316'); audioService.explosion(); this.shake = Math.max(this.shake, 5)
        for (const o of this.enemies) if (!o.dead && Math.hypot(o.x - x, o.y - y) <= f.radius) this._damage(o, f.dmg, 'fire')
      }
    }
    this.fx = this.fx.filter((f) => f.life > 0)
  }

  // dtype: DAMAGE_TYPES key or 'true' to bypass resist/armor.
  // isTick = true for damage-over-time ticks (skips elemental combos).
  _damage(e, dmg, dtype = 'kinetic', isTick = false) {
    if (e.dead) return
    // ---- elemental interactions (only on real hits) ----
    if (!isTick && dtype !== 'true') {
      const frozen = e.slowTimer > 0 && e.slowFactor >= 0.9
      const chilled = e.slowTimer > 0
      const burning = e.dotTimer > 0 && e.dotType === 'fire'
      const poisoned = e.dotTimer > 0 && e.dotType === 'toxic'
      if (dtype === 'explosive' && frozen) {
        dmg *= 1.7; e.slowTimer = 0 // shatter consumes the freeze
        this._spark(e.x, e.y, '#e0f2fe', 9); this._text(e.x, e.y, 'SHATTER!', '#bfdbfe')
      } else if (dtype === 'energy' && chilled) {
        dmg *= 1.4 // superconduct: chilled foes conduct — arc to a neighbour
        let n = null, nd = 90
        for (const o of this.enemies) { if (o === e || o.dead) continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < nd) { nd = d; n = o } }
        if (n) { this.beams.push({ segs: [[e.x, e.y, n.x, n.y]], color: '#a78bfa', life: 0.09, width: 2, bolt: true }); this._damage(n, dmg * 0.5, 'energy', true) }
        this._text(e.x, e.y, '⚡ CONDUCT', '#c4b5fd')
      } else if ((dtype === 'fire' && poisoned) || (dtype === 'toxic' && burning)) {
        const burst = Math.max(45, (e.dotDps || 0) * 2.6); dmg += burst; e.dotTimer = 0 // combust detonates the DoT
        this._explosion(e.x, e.y, 42, '#f97316'); this._text(e.x, e.y, 'COMBUST!', '#fb923c')
      }
    }
    if (dtype !== 'true') {
      if (e.res && e.res[dtype]) dmg *= e.res[dtype]
      if (dtype === 'kinetic') dmg *= 1 - e.armor
    }
    if (e.shieldTimer > 0) dmg *= 0.3 // active boss shield
    e.hp -= dmg
    if (e.hp <= 0) {
      e.dead = true; this.state.kills += 1
      // combo: fast successive kills pay escalating gold
      this.combo++; this.comboTimer = 2.5
      const cmult = 1 + Math.min(1.5, Math.floor(this.combo / 4) * 0.1)
      this.state.money += Math.round(e.reward * cmult)
      this._checkAnnounce()
      this._debris(e.x, e.y, e.color)
      if (e.champion) { this._explosion(e.x, e.y, e.radius * 1.6, '#fbbf24'); this._text(e.x, e.y, '+$' + Math.round(e.reward * cmult), '#fbbf24') }
      if (e.waveBoss) { this._explosion(e.x, e.y, e.radius * 2.2, '#f43f5e'); audioService.explosion(); this._text(e.x, e.y, 'BOSS DOWN', '#f43f5e', true); this.shake = 10; this.slowmo = Math.max(this.slowmo, 0.25) }
      if (e.boss) { this._explosion(e.x, e.y, e.radius * 2, e.color); audioService.explosion(); this.shake = 12; this.slowmo = Math.max(this.slowmo, 0.3) }
      if (e.abilities && e.abilities.deathBomb) {
        const { radius, dmg } = e.abilities.deathBomb
        this._explosion(e.x, e.y, radius, '#f97316'); audioService.explosion(); this._text(e.x, e.y - 6, 'BOOM!', '#f97316')
        for (const t of this.turrets.slice()) { if (Math.hypot(t.x - e.x, t.y - e.y) <= radius) { t.hp -= dmg; if (t.hp <= 0) this._destroyTower(t) } }
      }
      if (e.abilities && e.abilities.split) {
        const { into, count } = e.abilities.split
        for (let i = 0; i < count; i++) this.spawnExtra.push({ type: into, at: { x: e.x + (i - count / 2) * 8, y: e.y }, pathIndex: e.pathIndex, seg: e.seg })
      }
      if (e.contagious) { // Necron's Pandemic — spreads on death
        for (const o of this.enemies) {
          if (o === e || o.dead || o.contagious) continue
          if (Math.hypot(o.x - e.x, o.y - e.y) <= 70) { o.dotDps = Math.max(o.dotDps, 30); o.dotTimer = 5; o.dotType = 'toxic'; o.contagious = true }
        }
        this._spark(e.x, e.y, '#84cc16', 8)
      }
    }
  }

  // ---- boss skills (unique, with big visible effects) --------------------

  _updateBossSkills(e, dt) {
    if (!e.bossSkills || e.dead) return
    e.skillCd -= dt
    if (e.skillCd > 0) return
    e.skillCd = 5.5 + rand() * 3
    this._bossSkill(e, e.bossSkills[Math.floor(rand() * e.bossSkills.length)])
  }

  _bossSkill(e, sk) {
    switch (sk) {
      case 'slam': { // ground-pound shockwave that smashes nearby turrets
        this._explosion(e.x, e.y, 130, '#f43f5e'); this._shock(e.x, e.y, 155, '#f43f5e'); this._flash('rgba(244,63,94,0.18)')
        audioService.explosion(); this._text(e.x, e.y - e.radius, 'SLAM!', '#f43f5e', true); this.shake = 9
        for (const t of this.turrets.slice()) if (Math.hypot(t.x - e.x, t.y - e.y) <= 145) { t.hp -= 85; if (t.hp <= 0) this._destroyTower(t) }
        break
      }
      case 'barrage': { // volley of shells at your towers
        this._text(e.x, e.y - e.radius, 'BARRAGE!', '#fbbf24'); audioService.shoot(200)
        const targets = this.turrets.slice().sort(() => rand() - 0.5).slice(0, 5)
        for (const t of targets) this.enemyShots.push({ x: e.x, y: e.y, target: t, speed: 320, dmg: 60, splash: 44, dead: false })
        break
      }
      case 'summon': { // portal that spawns a burst of imps
        this._shock(e.x, e.y, 70, '#a78bfa'); this._spark(e.x, e.y, '#a78bfa', 12); this._text(e.x, e.y - e.radius, 'SUMMON!', '#a78bfa')
        for (let i = 0; i < 4; i++) this.spawnExtra.push({ type: 'imp', at: { x: e.x + (i - 2) * 12, y: e.y }, pathIndex: e.pathIndex, seg: e.seg })
        break
      }
      case 'rage': // temporary speed frenzy
        e.rageTimer = 3.5; this._flash('rgba(239,68,68,0.15)'); this._spark(e.x, e.y, '#ef4444', 12); this._text(e.x, e.y - e.radius, 'ENRAGE!', '#ef4444'); break
      case 'shield': // damage-reduction bubble
        e.shieldTimer = 5; this._shock(e.x, e.y, e.radius * 2.2, '#38bdf8'); this._text(e.x, e.y - e.radius, 'SHIELD!', '#38bdf8'); break
    }
  }

  // ---- hero skills -------------------------------------------------------

  _updateHeroCooldownUi() {
    for (const ui of this.state.heroSkills) { const h = this.heroes.find((x) => x.key === ui.key); if (h) { ui.cooldownLeft = h.cooldown; ui.ready = h.cooldown <= 0 } }
  }

  useSkill(key) {
    const h = this.heroes.find((x) => x.key === key)
    if (!h || h.cooldown > 0 || this.state.status !== 'playing') return
    const def = HEROES[key]
    audioService.skill()
    this._runEffect(h, def.skill.effect)
    h.cooldown = def.skill.cooldown
    this._updateHeroCooldownUi()
  }

  _leaders(n) {
    return [...this.enemies].sort((a, b) => b.dist - a.dist).slice(0, n)
  }

  _runEffect(h, ef) {
    switch (ef.type) {
      case 'aoe_damage':
        for (const e of this.enemies) if (Math.hypot(e.x - h.x, e.y - h.y) <= ef.radius) this._damage(e, ef.amount, 'explosive')
        this._explosion(h.x, h.y, ef.radius, '#f59e0b'); audioService.explosion(); break
      case 'dot_all':
        for (const e of this.enemies) { e.dotDps = ef.dps; e.dotTimer = ef.dur; e.dotType = 'fire' }
        for (const e of this._leaders(8)) this._explosion(e.x, e.y, 34, '#f97316')
        audioService.explosion(); break
      case 'freeze_all':
        for (const e of this.enemies) { e.slowTimer = ef.dur; e.slowFactor = 1; this._spark(e.x, e.y, '#bfdbfe', 6) }
        this._flash('rgba(96,165,250,0.28)'); this._shock(WIDTH / 2, HEIGHT / 2, WIDTH * 0.6, '#93c5fd'); break
      case 'slow_all':
        for (const e of this.enemies) { e.slowTimer = ef.dur; e.slowFactor = ef.factor }
        this._flash('rgba(192,132,252,0.2)')
        for (let i = 0; i < 3; i++) this._shock(WIDTH / 2, HEIGHT / 2, 160 + i * 180, '#c084fc'); break
      case 'buff_towers':
        this.buffs.push({ damageMult: ef.damageMult, fireMult: ef.fireMult, expire: this.time + ef.dur })
        for (const t of this.turrets) { this._shock(t.x, t.y, 34, '#fbbf24'); this._spark(t.x, t.y, '#fde68a', 4) }
        break
      case 'heal_base':
        this.state.baseHp = Math.min(this.state.maxBaseHp, this.state.baseHp + ef.amount)
        this._text(this.basePt.x, this.basePt.y - 20, '+' + ef.amount + ' HP', '#22c55e'); break
      case 'kill_strong': {
        const best = this._leaders(1)[0]
        if (best) {
          this._damage(best, ef.amount, 'true')
          this.beams.push({ segs: [[h.x, h.y, best.x, best.y]], color: '#22d3ee', life: 0.14, width: 3, bolt: false })
          this._explosion(best.x, best.y, 30, '#22d3ee'); this._text(best.x, best.y, 'CRIT!', '#22d3ee')
        }
        break
      }
      case 'chain_all': {
        const hit = new Set(); let from = h; const segs = []
        for (let j = 0; j < ef.jumps; j++) {
          let next = null, nd = 1e9
          for (const e of this.enemies) { if (e.dead || hit.has(e)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < nd) { nd = d; next = e } }
          if (!next) break
          segs.push([from.x, from.y, next.x, next.y]); this._damage(next, ef.amount, 'energy'); this._spark(next.x, next.y, '#a78bfa', 5)
          hit.add(next); from = next
        }
        if (segs.length) this.beams.push({ segs, color: '#a78bfa', life: 0.18, width: 3, bolt: true })
        this._flash('rgba(167,139,250,0.15)'); break
      }
      case 'orbital':
        for (const e of this.enemies) { this._damage(e, ef.amount, 'explosive'); e.slowTimer = ef.dur; e.slowFactor = 1 }
        this._flash('rgba(255,255,255,0.35)')
        for (const e of this._leaders(5)) { this._beam(e.x, e.y, '#f87171'); this._explosion(e.x, e.y, 70, '#ef4444') }
        audioService.explosion(); break
      case 'rebirth':
        this.state.baseHp = Math.min(this.state.maxBaseHp, this.state.baseHp + ef.heal)
        for (const e of this.enemies) { e.dotDps = ef.dps; e.dotTimer = ef.dur; e.dotType = 'fire' }
        for (const e of this._leaders(8)) this._explosion(e.x, e.y, 40, '#fb923c')
        this._flash('rgba(251,146,60,0.3)'); break
      case 'carpet_bomb':
        for (const c of this._leaders(ef.count)) {
          this._explosion(c.x, c.y, ef.radius, '#f97316')
          for (const e of this.enemies) if (Math.hypot(e.x - c.x, e.y - c.y) <= ef.radius) this._damage(e, ef.amount, 'explosive')
        }
        audioService.explosion(); this._flash('rgba(249,115,22,0.2)'); break
      case 'damage_all':
        for (const e of this.enemies) this._damage(e, ef.amount, ef.dtype || 'kinetic')
        for (const e of this._leaders(8)) this._spark(e.x, e.y, '#e2e8f0', 6)
        this._flash('rgba(226,232,240,0.14)'); break
      case 'blackhole_all':
        this.wells.push({ x: WIDTH / 2, y: HEIGHT / 2, life: ef.dur, max: ef.dur, radius: Math.max(WIDTH, HEIGHT), dps: ef.dps, pull: 140, color: '#a78bfa' })
        this._flash('rgba(124,58,237,0.28)'); this._shock(WIDTH / 2, HEIGHT / 2, WIDTH * 0.5, '#a78bfa'); break
      case 'reap_all':
        for (const e of this.enemies) this._damage(e, e.maxHp * ef.pct, 'true')
        for (const e of this._leaders(10)) this._explosion(e.x, e.y, 32, '#22c55e')
        this._flash('rgba(22,163,74,0.22)'); break
      case 'plague_all':
        for (const e of this.enemies) { e.dotDps = ef.dps; e.dotTimer = ef.dur; e.dotType = 'toxic'; e.slowTimer = ef.dur; e.slowFactor = ef.factor }
        this._flash('rgba(234,179,8,0.18)'); break
      case 'quake_all': // Tecton — Earthquake: hammer ground enemies + stun + fissures
        for (const e of this.enemies) { if (e.class !== 'air') { this._damage(e, ef.amount, 'explosive'); e.slowTimer = ef.dur; e.slowFactor = 1 } }
        this.shake = 16; this._flash('rgba(161,98,7,0.28)'); audioService.explosion()
        for (let i = 0; i < 6; i++) this._shock(rand() * WIDTH, rand() * HEIGHT, 60 + rand() * 90, '#a16207')
        this._text(WIDTH / 2, HEIGHT / 2, 'EARTHQUAKE', '#fbbf24', true); break
      case 'tsunami': { // Maelstrom — Tsunami: hurl enemies back + damage + chill
        this._flash('rgba(14,165,233,0.3)'); audioService.explosion(); this.shake = 8
        for (let i = 0; i < 5; i++) this._shock(WIDTH * (0.2 + i * 0.15), HEIGHT / 2, WIDTH * 0.3, '#38bdf8')
        for (const e of this.enemies) {
          this._damage(e, ef.amount, 'frost'); e.slowTimer = 2; e.slowFactor = 0.5
          e.seg = Math.max(1, e.seg - 1); e.dist *= 0.6
          const wp = (this.pathsPx[e.pathIndex] || this.pathsPx[0])[e.seg - 1]
          if (wp) { e.x = wp.x; e.y = wp.y }
        }
        this._text(WIDTH / 2, HEIGHT / 2, 'TSUNAMI', '#7dd3fc', true); break
      }
      case 'storm': // Fulgor — Thunderstorm: repeated strikes over time
        this.fx.push({ kind: 'storm', life: ef.dur, cd: 0, cdMax: 0.22, dmg: ef.dmg })
        this._flash('rgba(56,189,248,0.18)'); this._text(WIDTH / 2, HEIGHT / 2, 'THUNDERSTORM', '#38bdf8', true); break
      case 'meteor': // Ignis — Meteor Rain
        this.fx.push({ kind: 'meteor', life: ef.dur, cd: 0, cdMax: 0.32, dmg: ef.dmg, radius: ef.radius })
        this._text(WIDTH / 2, HEIGHT / 2, 'METEOR RAIN', '#f97316', true); break
      case 'bastion': // Aegis — base invulnerable + tower overcharge
        this.baseInvulnTimer = ef.dur
        this.state.baseHp = Math.min(this.state.maxBaseHp, this.state.baseHp + ef.heal)
        this.buffs.push({ damageMult: 1.5, fireMult: 1.3, expire: this.time + ef.dur })
        this._flash('rgba(34,211,238,0.22)'); for (const t of this.turrets) this._shock(t.x, t.y, 30, '#22d3ee')
        this._text(this.basePt.x, this.basePt.y - 24, '🛡 BASTION', '#22d3ee'); break
      case 'pandemic': // Necron — contagious plague
        for (const e of this.enemies) { e.dotDps = ef.dps; e.dotTimer = ef.dur; e.dotType = 'toxic'; e.contagious = true }
        this._flash('rgba(77,124,15,0.22)'); this._text(WIDTH / 2, HEIGHT / 2, 'PANDEMIC', '#84cc16', true); break
      case 'entangle': // Gaia — roots snare all
        for (const e of this.enemies) { e.slowTimer = ef.dur; e.slowFactor = 1; e.dotDps = Math.max(e.dotDps, ef.dps); e.dotTimer = ef.dur; e.dotType = 'toxic'; this._spark(e.x, e.y, '#22c55e', 4) }
        this._flash('rgba(22,163,74,0.2)'); this._text(WIDTH / 2, HEIGHT / 2, 'ENTANGLE', '#4ade80', true); break
    }
  }

  // ---- particles / effects ----------------------------------------------

  _muzzle(x, y, angle, color) {
    this.particles.push({ type: 'flash', x, y, angle, color, life: 0.08, max: 0.08 })
    for (let i = 0; i < 3; i++) { const a = angle + (rand() - 0.5) * 0.7, sp = 140 + rand() * 140; this.particles.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.16, max: 0.16, color, size: 2 }) }
    this.particles.push({ type: 'smoke', x, y, vx: Math.cos(angle) * 20, vy: Math.sin(angle) * 20, life: 0.3, max: 0.3, color: '#94a3b8', size: 3 })
  }
  _spark(x, y, color, n = 5) {
    for (let i = 0; i < n; i++) { const a = rand() * TAU, sp = 60 + rand() * 150; this.particles.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.24, max: 0.24, color, size: 2 }) }
  }
  _hitImpact(x, y, color) {
    this.particles.push({ type: 'flash', x, y, angle: 0, color, life: 0.06, max: 0.06 })
    this._spark(x, y, color, 5)
  }
  _explosion(x, y, r, color) {
    this.particles.push({ type: 'flash', x, y, angle: 0, color: '#fff', life: 0.09, max: 0.09 })
    this.particles.push({ type: 'shock', x, y, r: r + 20, color, life: 0.3, max: 0.3 })
    this.particles.push({ type: 'fireball', x, y, r, color, life: 0.26, max: 0.26 })
    for (let i = 0; i < 4; i++) { const a = rand() * TAU, d = rand() * r * 0.5; this.particles.push({ type: 'smoke', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20 - 10, life: 0.6, max: 0.6, color: '#6b7280', size: r * 0.28 }) }
    for (let i = 0; i < 12; i++) { const a = rand() * TAU, sp = 90 + rand() * 220; this.particles.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.32, max: 0.32, color, size: 2.5 }) }
  }
  _shock(x, y, r, color) { this.particles.push({ type: 'shock', x, y, r, color, life: 0.4, max: 0.4 }) }
  _beam(x, y, color) { this.particles.push({ type: 'beam', x, y, color, life: 0.45, max: 0.45 }) }
  _debris(x, y, color) {
    for (let i = 0; i < 6; i++) { const a = rand() * TAU, sp = 40 + rand() * 120; this.particles.push({ type: 'debris', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, max: 0.4, color, size: 2 + rand() * 2, rot: rand() * TAU }) }
  }
  _flash(color) { this.particles.push({ type: 'screen', color, life: 0.35, max: 0.35 }) }
  _text(x, y, text, color, big) { this.particles.push({ type: 'text', x, y, text, color, life: 1.1, max: 1.1, vy: -26, big: !!big }) }

  _updateParticles(dt) {
    if (!this.particles.length) return
    for (const p of this.particles) {
      p.life -= dt
      if (p.type === 'text') { p.y += p.vy * dt }
      else if (p.type === 'smoke') { p.x += p.vx * dt; p.y += p.vy * dt - 8 * dt; p.size += 26 * dt; p.vx *= 0.94; p.vy *= 0.94 }
      else if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; const f = 1 - Math.min(1, 3 * dt); p.vx *= f; p.vy *= f }
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    if (this.particles.length > 700) this.particles.splice(0, this.particles.length - 700)
  }

  // ---- loop + render -----------------------------------------------------

  _loop(ts) {
    if (!this.running) return
    if (!this.lastTime) this.lastTime = ts
    let dt = (ts - this.lastTime) / 1000
    this.lastTime = ts
    if (dt > 0.05) dt = 0.05
    const tscale = this.slowmo > 0 ? 0.4 : 1
    if (this.slowmo > 0) this.slowmo = Math.max(0, this.slowmo - dt)
    for (let i = 0; i < this.speedMult; i++) this.update(dt * tscale)
    this.render()
    requestAnimationFrame(this._loop)
  }

  render() {
    const ctx = this.ctx
    const th = this.level.theme
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.save()
    if (this.shake > 0.3) ctx.translate((rand() * 2 - 1) * this.shake, (rand() * 2 - 1) * this.shake)
    ctx.fillStyle = th.ground; ctx.fillRect(-24, -24, WIDTH + 48, HEIGHT + 48)

    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (this.blocked.has(`${c},${r}`)) continue; ctx.fillStyle = th.grid; ctx.fillRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2) }

    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    const trace = (pp) => { ctx.beginPath(); pp.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))) }
    // road bed (all lanes)
    ctx.strokeStyle = th.road; ctx.lineWidth = TILE * 0.72
    for (const pp of this.pathsPx) { trace(pp); ctx.stroke() }
    // centre dashes (all lanes)
    ctx.setLineDash([12, 16]); ctx.strokeStyle = th.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 4
    for (const pp of this.pathsPx) { trace(pp); ctx.stroke() }
    ctx.globalAlpha = 1; ctx.setLineDash([])

    const end = this.basePt
    ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(end.x, end.y, 24, 0, TAU); ctx.fill()
    ctx.fillStyle = '#0b1120'; ctx.beginPath(); ctx.arc(end.x, end.y, 13, 0, TAU); ctx.fill()
    ctx.fillStyle = th.accent; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', end.x, end.y + 5)

    this._renderPreview(ctx)
    this._renderSelectedRing(ctx)

    for (const e of this.enemies) if (e.siegeTarget) { ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.siegeTarget.x, e.siegeTarget.y); ctx.stroke() }

    if (this.wells.length) this._renderWells(ctx)
    for (const h of this.heroes) drawHero(ctx, h, HEROES[h.key], RARITY[HEROES[h.key].rarity].color, this.spin)
    for (const t of this.turrets) this._renderTower(ctx, t)
    for (const e of this.enemies) this._renderEnemy(ctx, e)
    this._renderProjectiles(ctx)
    this._renderEnemyShots(ctx)
    this._renderSweeps(ctx)
    this._renderBeams(ctx)
    this._renderParticles(ctx)
    ctx.restore()
  }

  _renderWells(ctx) {
    for (const w of this.wells) {
      const a = Math.max(0, w.life / w.max)
      const g = ctx.createRadialGradient(w.x, w.y, 1, w.x, w.y, w.radius)
      g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.55, 'rgba(30,20,60,0.5)'); g.addColorStop(1, 'rgba(124,58,237,0)')
      ctx.globalAlpha = Math.min(1, a + 0.2); ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, TAU); ctx.fill()
      // swirling ring
      ctx.strokeStyle = w.color; ctx.globalAlpha = a * 0.8; ctx.lineWidth = 3
      const sp = this.spin * 8
      for (let i = 0; i < 3; i++) { const rr2 = w.radius * (0.3 + i * 0.22); ctx.beginPath(); ctx.arc(w.x, w.y, rr2, sp + i, sp + i + 4); ctx.stroke() }
      ctx.globalAlpha = 1
    }
  }

  _renderSweeps(ctx) {
    for (const h of this.heroes) {
      const a = HEROES[h.key].attack
      if (a.mode !== 'sweep' || h.beamAngle == null) continue
      const ex = h.x + Math.cos(h.beamAngle) * a.range, ey = h.y + Math.sin(h.beamAngle) * a.range
      ctx.strokeStyle = a.dtype === 'energy' ? '#22d3ee' : HEROES[h.key].color
      ctx.globalAlpha = 0.25; ctx.lineWidth = (a.width || 15) * 1.6; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke()
      ctx.globalAlpha = 0.95; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'
      ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  _renderEnemyShots(ctx) {
    for (const s of this.enemyShots) {
      const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, 7)
      g.addColorStop(0, '#fff7ed'); g.addColorStop(0.5, '#fbbf24'); g.addColorStop(1, 'rgba(249,115,22,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, TAU); ctx.fill()
      ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, TAU); ctx.fill()
    }
  }

  _renderTower(ctx, t) {
    drawTower(ctx, t, TOWERS[t.key], t.angle, this.spin)
    if (t.hp < t.maxHp) {
      const w = 34, hpr = Math.max(0, t.hp / t.maxHp)
      ctx.fillStyle = '#0b1120'; ctx.fillRect(t.x - w / 2, t.y + 24, w, 4)
      ctx.fillStyle = hpr > 0.5 ? '#22c55e' : hpr > 0.25 ? '#f59e0b' : '#ef4444'; ctx.fillRect(t.x - w / 2, t.y + 24, w * hpr, 4)
    }
  }

  _renderPreview(ctx) {
    if (!this.build || !this.hover) return
    const { col, row } = this.hover
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return
    const isTower = this.build.kind === 'tower'
    const def = isTower ? TOWERS[this.build.key] : HEROES[this.build.key]
    let valid = this.canBuild(col, row)
    if (isTower) valid = valid && this.state.money >= def.cost
    else { const ult = isUltimate(this.build.key); const cap = ult ? ULTIMATE_SLOTS : HERO_SLOTS; valid = valid && this.heroes.filter((h) => isUltimate(h.key) === ult).length < cap && !this.heroes.some((h) => h.key === this.build.key) }
    const cx = col * TILE + TILE / 2, cy = row * TILE + TILE / 2
    const ring = isTower ? def.range : (def.attack ? def.attack.range : 0)
    if (ring) { ctx.globalAlpha = 0.11; ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(cx, cy, ring, 0, TAU); ctx.fill(); ctx.globalAlpha = 1 }
    ctx.globalAlpha = 0.5; ctx.fillStyle = valid ? '#22c55e' : '#ef4444'; ctx.fillRect(col * TILE, row * TILE, TILE, TILE); ctx.globalAlpha = 1
  }

  _renderSelectedRing(ctx) {
    const e = this.selected
    if (!e) return
    let radius = 0, color = '#fff'
    if (e.kind === 'tower') { radius = rangeAtLevel(TOWERS[e.key].range, e.level); color = TOWERS[e.key].color }
    else { const a = HEROES[e.key].attack; radius = a ? a.range : 0; color = HEROES[e.key].color }
    if (!radius) return
    ctx.globalAlpha = 0.12; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(e.x, e.y, radius, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
  }

  _renderEnemy(ctx, e) {
    drawEnemy(ctx, e, this.spin)
    const yTop = e.y - e.radius - (e.class === 'air' ? e.radius * 0.6 : 0) - 10
    const w = Math.max(e.radius * 2, 20), hpr = Math.max(0, e.hp / e.maxHp)
    ctx.fillStyle = '#0b1120'; ctx.fillRect(e.x - w / 2, yTop, w, 5)
    ctx.fillStyle = e.waveBoss ? '#f43f5e' : e.champion ? '#fbbf24' : e.boss ? '#f59e0b' : hpr > 0.5 ? '#22c55e' : hpr > 0.25 ? '#f59e0b' : '#ef4444'
    ctx.fillRect(e.x - w / 2, yTop, w * hpr, 5)
    if (e.slowTimer > 0 && e.slowFactor >= 1) { // frozen shell
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#bfdbfe'; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
    } else if (e.slowTimer > 0) { ctx.strokeStyle = 'rgba(147,197,253,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 5, 0, TAU); ctx.stroke() }
    if (e.dotTimer > 0) { ctx.strokeStyle = e.dotType === 'toxic' ? 'rgba(132,204,22,0.8)' : 'rgba(249,115,22,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, TAU); ctx.stroke() }
    if (e.shieldTimer > 0) {
      ctx.globalAlpha = 0.7; ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 7, 0, TAU); ctx.stroke()
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 7, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
    }
  }

  _renderProjectiles(ctx) {
    for (const p of this.projectiles) {
      // trail
      if (p.trail.length > 1) {
        ctx.lineCap = 'round'; ctx.strokeStyle = p.color
        for (let i = 1; i < p.trail.length; i++) {
          const a = i / p.trail.length
          ctx.globalAlpha = a * 0.5; ctx.lineWidth = (p.kind === 'bullet' ? 2 : 4) * a
          ctx.beginPath(); ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y); ctx.lineTo(p.trail[i].x, p.trail[i].y); ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      switch (p.kind) {
        case 'rocket':
          ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-13, -3); ctx.lineTo(-13, 3); ctx.closePath(); ctx.fill()
          ctx.fillStyle = p.color; this._rr(ctx, -6, -3, 12, 6, 2); ctx.fill()
          ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill()
          break
        case 'fireball': {
          const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 7); g.addColorStop(0, '#fff7ed'); g.addColorStop(0.5, '#f97316'); g.addColorStop(1, 'rgba(239,68,68,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); break
        }
        case 'shard':
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill()
          ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-1, -2); ctx.lineTo(-1, 2); ctx.closePath(); ctx.fill(); break
        case 'glob': {
          const g = ctx.createRadialGradient(-1, -1, 1, 0, 0, 6); g.addColorStop(0, '#d9f99d'); g.addColorStop(1, p.color)
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill(); break
        }
        case 'chakram': {
          ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke()
          ctx.fillStyle = '#e2e8f0'
          for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i / 4 * TAU); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(13, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.restore() }
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); break
        }
        default: { // bullet
          ctx.fillStyle = '#fffbeb'; ctx.fillRect(-6, -1.5, 12, 3)
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(5, 0, 2.5, 0, TAU); ctx.fill()
        }
      }
      ctx.restore()
    }
  }

  _rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }

  _renderBeams(ctx) {
    for (const b of this.beams) {
      if (b.bolt) { for (const s of b.segs) this._drawBolt(ctx, s, b.color) }
      else {
        ctx.strokeStyle = b.color; ctx.lineWidth = b.width; ctx.globalAlpha = 0.9
        for (const s of b.segs) { ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.stroke() }
        ctx.globalAlpha = 1
      }
    }
  }

  _drawBolt(ctx, seg, color) {
    const [x1, y1, x2, y2] = seg
    const steps = 6, dx = (x2 - x1) / steps, dy = (y2 - y1) / steps
    const len = Math.hypot(x2 - x1, y2 - y1) || 1, px = -(y2 - y1) / len, py = (x2 - x1) / len
    const pts = []
    for (let i = 0; i <= steps; i++) { const off = i === 0 || i === steps ? 0 : (rand() - 0.5) * 12; pts.push([x1 + dx * i + px * off, y1 + dy * i + py * off]) }
    const stroke = (w, a, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha = a; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke() }
    stroke(7, 0.3, color); stroke(3, 0.9, color); stroke(1.4, 1, '#ffffff'); ctx.globalAlpha = 1
  }

  _renderParticles(ctx) {
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.max)
      switch (p.type) {
        case 'screen': ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; break
        case 'text':
          ctx.globalAlpha = Math.min(1, a * 1.4); ctx.fillStyle = p.color
          ctx.font = p.big ? 'bold 34px sans-serif' : 'bold 15px sans-serif'; ctx.textAlign = 'center'
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); ctx.globalAlpha = 1; break
        case 'flash': {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle || 0); ctx.globalAlpha = a
          const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16); g.addColorStop(0, '#fff'); g.addColorStop(0.4, p.color); g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 12 * a + 5, 0, TAU); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; break
        }
        case 'shock':
          ctx.globalAlpha = a * 0.85; ctx.strokeStyle = p.color; ctx.lineWidth = 3
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - a), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; break
        case 'fireball': {
          const t = 1 - a
          const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r * (0.4 + t * 0.8))
          g.addColorStop(0, 'rgba(255,247,237,' + a + ')'); g.addColorStop(0.5, p.color); g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.4 + t * 0.8), 0, TAU); ctx.fill(); break
        }
        case 'smoke':
          ctx.globalAlpha = a * 0.4; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; break
        case 'beam': {
          ctx.globalAlpha = a * 0.7
          const g = ctx.createLinearGradient(p.x, 0, p.x, p.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, p.color)
          ctx.fillStyle = g; const w = 26 * a + 6; ctx.fillRect(p.x - w / 2, 0, w, p.y); ctx.globalAlpha = 1; break
        }
        case 'debris':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2); ctx.restore(); ctx.globalAlpha = 1; break
        default: // spark
          ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a + 0.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1
      }
    }
  }
}
