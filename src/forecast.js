import { MODEL_IDS } from './models.js'
import { majorityWeather, median, formatAgreement, formatAgreementShort } from './aggregate.js'
import { buildOutlook } from './outlook.js'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

function seriesFor(block, field, modelId) {
  return block?.[`${field}_${modelId}`] ?? null
}

function valuesAt(block, field, index) {
  return MODEL_IDS.map((id) => {
    const series = seriesFor(block, field, id)
    return series ? series[index] : null
  })
}

function aggregateHour(hourly, index) {
  const weather = majorityWeather(valuesAt(hourly, 'weather_code', index))
  const temperature = median(valuesAt(hourly, 'temperature_2m', index))
  const precipProb = median(valuesAt(hourly, 'precipitation_probability', index))

  return {
    time: hourly.time[index],
    weather,
    agreement: formatAgreement(weather),
    agreementShort: formatAgreementShort(weather),
    temperature,
    precipProb,
  }
}

function aggregateDay(daily, index) {
  const weather = majorityWeather(valuesAt(daily, 'weather_code', index))
  const tempMax = median(valuesAt(daily, 'temperature_2m_max', index))
  const tempMin = median(valuesAt(daily, 'temperature_2m_min', index))
  const precipProb = median(valuesAt(daily, 'precipitation_probability_max', index))

  return {
    date: daily.time[index],
    weather,
    agreement: formatAgreement(weather),
    agreementShort: formatAgreementShort(weather),
    tempMax,
    tempMin,
    precipProb,
  }
}

/**
 * @param {{ latitude: number, longitude: number, timezone?: string }} place
 */
export async function fetchMultiModelForecast(place) {
  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', String(place.latitude))
  url.searchParams.set('longitude', String(place.longitude))
  url.searchParams.set('timezone', place.timezone || 'Asia/Tokyo')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set(
    'hourly',
    'temperature_2m,weather_code,precipitation_probability',
  )
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('models', MODEL_IDS.join(','))

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`予報の取得に失敗しました（${res.status}）`)
  }
  const data = await res.json()
  if (data.error) {
    throw new Error(data.reason || '予報の取得に失敗しました')
  }

  return data
}

/**
 * Open-Meteo の複数モデル応答を多数決・中央値にまとめる。
 */
export function buildStats(forecast, { now = new Date() } = {}) {
  const { hourly, daily, timezone } = forecast
  const localDate = formatLocalDate(now, timezone)
  const localHour = formatLocalHour(now, timezone)

  const hourlyStats = hourly.time.map((_, i) => aggregateHour(hourly, i))
  const dailyStats = daily.time.map((_, i) => aggregateDay(daily, i))

  const todayIndex = dailyStats.findIndex((d) => d.date === localDate)
  const todayDaily = (todayIndex >= 0 ? dailyStats[todayIndex] : null) || dailyStats[0]
  const tomorrowDaily = todayIndex >= 0 ? dailyStats[todayIndex + 1] || null : null
  const tomorrowDate = tomorrowDaily?.date || null

  const hourlyNear = hourlyStats.filter((h) => {
    const date = h.time.slice(0, 10)
    return date === localDate || (tomorrowDate && date === tomorrowDate)
  })

  const current =
    hourlyStats.find((h) => h.time === localHour)
    || hourlyNear.find((h) => h.time >= localHour)
    || hourlyNear[0]
    || hourlyStats[0]

  const currentHourIndex = Math.max(
    0,
    hourlyNear.findIndex((h) => h.time === current?.time),
  )

  return {
    timezone,
    localDate,
    tomorrowDate,
    current,
    today: todayDaily,
    tomorrow: tomorrowDaily,
    hourlyToday: hourlyNear.filter((h) => h.time.startsWith(localDate)),
    hourlyNear,
    currentHourIndex,
    weekly: dailyStats,
    outlook: buildOutlook(hourlyNear, current),
  }
}

function part(date, timeZone, type) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .find((p) => p.type === type)?.value
}

function formatLocalDate(date, timeZone) {
  return `${part(date, timeZone, 'year')}-${part(date, timeZone, 'month')}-${part(date, timeZone, 'day')}`
}

function formatLocalHour(date, timeZone) {
  return `${formatLocalDate(date, timeZone)}T${part(date, timeZone, 'hour')}:00`
}
