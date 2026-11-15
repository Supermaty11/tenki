/**
 * WMO Weather interpretation codes (WW) → 天気カテゴリ。
 * https://open-meteo.com/en/docs
 */
export function categorizeWeatherCode(code) {
  if (code == null || Number.isNaN(Number(code))) return null
  const c = Number(code)

  if (c >= 95) return '雷'
  if (
    (c >= 71 && c <= 77) ||
    c === 85 ||
    c === 86
  ) {
    return '雪'
  }
  if (
    (c >= 51 && c <= 67) ||
    (c >= 80 && c <= 82)
  ) {
    return '雨'
  }
  if (c === 0 || c === 1) return '晴'
  if (c === 2 || c === 3 || c === 45 || c === 48) return '曇'
  return '曇'
}
