import { WEATHER_TIE_ORDER } from './models.js'
import { categorizeWeatherCode } from './weatherCode.js'

export function median(values) {
  const nums = values.filter((v) => v != null && !Number.isNaN(Number(v))).map(Number)
  if (nums.length === 0) return null
  nums.sort((a, b) => a - b)
  const mid = Math.floor(nums.length / 2)
  if (nums.length % 2 === 0) {
    return (nums[mid - 1] + nums[mid]) / 2
  }
  return nums[mid]
}

/**
 * 天気カテゴリの多数決。同数なら WEATHER_TIE_ORDER で強い現象を採用。
 * @returns {{ category: string|null, votes: number, total: number, tallies: Record<string, number> }}
 */
export function majorityWeather(codes) {
  const categories = codes
    .map(categorizeWeatherCode)
    .filter((c) => c != null)

  const tallies = Object.create(null)
  for (const cat of categories) {
    tallies[cat] = (tallies[cat] || 0) + 1
  }

  const total = categories.length
  if (total === 0) {
    return { category: null, votes: 0, total: 0, tallies: {} }
  }

  let best = null
  let bestVotes = -1
  for (const cat of WEATHER_TIE_ORDER) {
    const votes = tallies[cat] || 0
    if (votes > bestVotes) {
      best = cat
      bestVotes = votes
    }
  }

  return { category: best, votes: bestVotes, total, tallies }
}

export function formatAgreement({ votes, total, category }) {
  if (!category || total === 0) return 'データなし'
  return `${total}件中${votes}件が${category}`
}

/** 表用の短い一致表記。例: 5/7 */
export function formatAgreementShort({ votes, total }) {
  if (!total) return '—'
  return `${votes}/${total}`
}
