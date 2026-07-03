// Domain logic for levels & chapters. Components ask this service for view
// models instead of importing the generator directly.

import { getLevelConfig, getEndlessConfig, getBossRushConfig, MAX_LEVEL, CHAPTER_SIZE, chapterCount } from '../game/config/levels.js'
import { getPuzzleConfig, PUZZLES } from '../game/config/puzzles.js'

export const levelService = {
  MAX_LEVEL,
  CHAPTER_SIZE,
  chapterCount,
  PUZZLES,

  getConfig: getLevelConfig,
  getEndless: getEndlessConfig,
  getBossRush: getBossRushConfig,
  getPuzzle: getPuzzleConfig,

  chapterOf(level) {
    return Math.floor((level - 1) / CHAPTER_SIZE) + 1
  },

  /** All chapters as view models, with unlock state derived from `progress`. */
  chapters(progress) {
    return Array.from({ length: chapterCount }, (_, i) => {
      const start = i * CHAPTER_SIZE + 1
      const end = Math.min((i + 1) * CHAPTER_SIZE, MAX_LEVEL)
      return {
        n: i + 1, start, end,
        unlocked: progress >= start,
        theme: getLevelConfig(start).theme,
      }
    })
  },

  /** All levels within a chapter as view models. `starsMap` is { level: 1..3 }. */
  levelsInChapter(chapter, progress, starsMap = {}) {
    const start = (chapter - 1) * CHAPTER_SIZE + 1
    const end = Math.min(chapter * CHAPTER_SIZE, MAX_LEVEL)
    const out = []
    for (let n = start; n <= end; n++) {
      out.push({ n, unlocked: n <= progress, cleared: n < progress, boss: n % 10 === 0, stars: starsMap[n] || 0 })
    }
    return out
  },
}
