import { buildOutlook } from './outlook.js'

function row(time, category) {
  return { time, weather: { category } }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const rainy = [
  row('2026-11-15T13:00', '雨'),
  row('2026-11-15T14:00', '雨'),
  row('2026-11-15T15:00', '曇'),
  row('2026-11-15T17:00', '晴'),
]
assert(
  buildOutlook(rainy, rainy[0]) === '15時ごろ止み、17時ごろ晴れそう',
  'rain then clear',
)

const keepRain = [
  row('2026-11-15T13:00', '雨'),
  row('2026-11-15T14:00', '雨'),
  row('2026-11-15T15:00', '雨'),
]
assert(buildOutlook(keepRain, keepRain[0]) === 'このあとも降り続きそう', 'keep raining')

const laterRain = [
  row('2026-11-15T10:00', '曇'),
  row('2026-11-15T12:00', '雨'),
  row('2026-11-15T14:00', '曇'),
]
assert(
  buildOutlook(laterRain, laterRain[0]) === '12時ごろ降りそう、14時ごろ止みそう',
  'later rain',
)

const sunny = [
  row('2026-11-15T10:00', '晴'),
  row('2026-11-15T11:00', '晴'),
]
assert(buildOutlook(sunny, sunny[0]) === null, 'stable sunny stays quiet')

console.log('outlook.test.js: ok')
