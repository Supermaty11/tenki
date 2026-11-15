/**
 * 時間別の天気列から、状況に応じた一文を組み立てる。
 * 固定テンプレの列挙ではなく、いまの状態とこの先の変化から合成する。
 */

const WET = new Set(['雨', '雪', '雷'])

function hourLabel(isoLocal) {
  const hour = Number(isoLocal.slice(11, 13))
  return `${hour}時ごろ`
}

function categoryAt(row) {
  return row?.weather?.category || null
}

function isWet(category) {
  return WET.has(category)
}

/**
 * @param {Array<{ time: string, weather: { category: string|null } }>} hourlyToday
 * @param {{ time: string, weather: { category: string|null } } | null} current
 * @returns {string|null}
 */
export function buildOutlook(hourlyToday, current) {
  if (!current || !hourlyToday?.length) return null

  const startIndex = Math.max(
    0,
    hourlyToday.findIndex((row) => row.time === current.time),
  )
  const future = hourlyToday.slice(startIndex)
  if (!future.length) return null

  const nowCat = categoryAt(future[0])
  if (!nowCat) return null

  const parts = []

  if (isWet(nowCat)) {
    const stop = future.find((row) => {
      const cat = categoryAt(row)
      return cat && !isWet(cat)
    })
    if (stop) {
      const verb = nowCat === '雪' ? 'やみ' : '止み'
      parts.push(`${hourLabel(stop.time)}${verb}`)
    } else {
      parts.push('このあとも降り続きそう')
    }

    const clear = future.find((row) => categoryAt(row) === '晴')
    if (clear) parts.push(`${hourLabel(clear.time)}晴れそう`)
  } else {
    const wet = future.find((row) => isWet(categoryAt(row)))
    if (wet) {
      const wetCat = categoryAt(wet)
      const verb = wetCat === '雪' ? '雪になりそう' : wetCat === '雷' ? '雷になりそう' : '降りそう'
      parts.push(`${hourLabel(wet.time)}${verb}`)

      const afterWetIndex = future.findIndex((row) => row.time === wet.time)
      const afterWet = future.slice(afterWetIndex)
      const stop = afterWet.find((row) => {
        const cat = categoryAt(row)
        return cat && !isWet(cat)
      })
      if (stop && stop.time !== wet.time) {
        parts.push(`${hourLabel(stop.time)}止みそう`)
      }
    } else if (nowCat === '曇') {
      const clear = future.find((row) => categoryAt(row) === '晴')
      if (clear) parts.push(`${hourLabel(clear.time)}晴れそう`)
      else parts.push('このあと晴れ間は少なそう')
    } else if (nowCat === '晴') {
      const cloud = future.find((row) => categoryAt(row) === '曇')
      if (cloud) parts.push(`${hourLabel(cloud.time)}くもりそう`)
      // 晴が続くなら無理に一文を足さない
    }
  }

  if (!parts.length) return null
  return parts.join('、')
}
