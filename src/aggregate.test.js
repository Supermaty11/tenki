import { median, majorityWeather, formatAgreement, formatAgreementShort } from './aggregate.js'
import { categorizeWeatherCode } from './weatherCode.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(median([1, 3, 2]) === 2, 'median odd')
assert(median([1, 4, 2, 3]) === 2.5, 'median even')
assert(median([null, 10]) === 10, 'median skips null')
assert(median([]) === null, 'median empty')

assert(categorizeWeatherCode(0) === '晴', 'clear')
assert(categorizeWeatherCode(3) === '曇', 'overcast')
assert(categorizeWeatherCode(61) === '雨', 'rain')
assert(categorizeWeatherCode(71) === '雪', 'snow')
assert(categorizeWeatherCode(95) === '雷', 'thunder')

const rainMajority = majorityWeather([61, 61, 3, 1, 61, null, 80])
assert(rainMajority.category === '雨', 'majority rain')
// 61×3 + 80 → 雨4、曇1、晴1（null除外で total=6）
assert(rainMajority.votes === 4 && rainMajority.total === 6, 'majority counts exclude null')
assert(formatAgreement(rainMajority) === '6件中4件が雨', 'agreement text')
assert(formatAgreementShort(rainMajority) === '4/6', 'short agreement')

// 同数: 雨2 / 晴2 → 雨が勝つ
const tie = majorityWeather([61, 61, 0, 0])
assert(tie.category === '雨', 'tie prefers stronger')

console.log('aggregate.test.js: ok')
