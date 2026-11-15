/** 1機関1票。Open-Meteo のモデル ID（2026-11-15 時点で配信中）。 */
export const MODELS = [
  { id: 'jma_msm', agency: '気象庁', name: 'MSM' },
  { id: 'ecmwf_ifs', agency: 'ECMWF', name: 'IFS' },
  { id: 'gfs_global', agency: 'NOAA', name: 'GFS' },
  { id: 'gem_global', agency: 'カナダ気象局', name: 'GEM' },
  { id: 'ukmo_global_deterministic_10km', agency: 'イギリス気象庁', name: 'UKMO' },
  { id: 'meteofrance_arpege_world', agency: 'フランス気象局', name: 'ARPEGE' },
  { id: 'cma_grapes_global', agency: '中国気象局', name: 'GRAPES' },
]

export const MODEL_IDS = MODELS.map((m) => m.id)

/** 同数のとき、現象が強い方を採用する順。 */
export const WEATHER_TIE_ORDER = ['雷', '雪', '雨', '曇', '晴']
