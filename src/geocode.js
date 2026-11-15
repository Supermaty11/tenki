/**
 * 地点検索（日本優先）。
 * Open-Meteo は同名の小さな集落を先に返しがちなので、
 * 日本語は Nominatim を併用し、人口・種別で並べ替える。
 */

const OPEN_METEO_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA = 'tenki-weather-app/0.1 (https://github.com/Supermaty11/tenki)'

const FEATURE_SCORE = {
  PPLC: 100,
  PPLA: 90,
  PPLA2: 80,
  PPLA3: 70,
  PPLA4: 60,
  PPL: 40,
  PPLX: 20,
}

function hasJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text)
}

function expandQueries(query) {
  const q = query.trim()
  const variants = [q]

  if (hasJapanese(q) && !/(市|区|町|村|都|道|府|県|駅|空港)$/.test(q)) {
    variants.unshift(`${q}市`)
  }

  if (/ディズニー|disney/i.test(q) && !/東京|舞浜|ランド|シー/.test(q)) {
    variants.unshift('東京ディズニーリゾート', '東京ディズニーランド')
  }

  return [...new Set(variants)]
}

function labelFromOpenMeteo(place) {
  const parts = [place.name, place.admin1, place.country].filter(Boolean)
  return [...new Set(parts)].join('、')
}

function labelFromNominatim(place) {
  const addr = place.address || {}
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county
  const parts = [
    place.name || addr.amenity || addr.tourism || city,
    city && place.name !== city ? city : null,
    addr.state || addr.province,
  ].filter(Boolean)
  if (parts.length) return [...new Set(parts)].join('、')
  return place.display_name?.split(',').slice(0, 3).map((s) => s.trim()).join('、') || '地点'
}

function scoreOpenMeteo(place, query) {
  const pop = place.population || 0
  const feature = FEATURE_SCORE[place.feature_code] || 10
  let score = Math.log10(pop + 10) * 20 + feature
  if (place.name === query || place.name === `${query}市`) score += 40
  if (place.name?.includes(query)) score += 10
  if (place.country_code?.toUpperCase() === 'JP') score += 50
  return score
}

function scoreNominatim(place, query) {
  const importance = (place.importance || 0) * 100
  const type = place.type || ''
  const addresstype = place.addresstype || ''
  let score = importance
  if (['city', 'town', 'municipality', 'administrative'].includes(type) || addresstype === 'city') {
    score += 40
  }
  if (['railway', 'station', 'stop', 'bus_stop'].includes(type)) score -= 30
  if (place.address?.country_code?.toUpperCase() === 'jp') score += 50
  const name = place.name || ''
  if (name === query || name === `${query}市`) score += 40
  if (name.includes(query)) score += 10
  return score
}

async function searchOpenMeteo(query) {
  const url = new URL(OPEN_METEO_GEOCODE)
  url.searchParams.set('name', query)
  url.searchParams.set('count', '8')
  url.searchParams.set('language', 'ja')
  url.searchParams.set('format', 'json')
  url.searchParams.set('countryCode', 'JP')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`地点検索に失敗しました（Open-Meteo ${res.status}）`)
  const data = await res.json()
  if (!data.results?.length) return []

  return data.results
    .filter((place) => (place.country_code || '').toUpperCase() === 'JP')
    .map((place) => ({
      id: `om-${place.id}`,
      name: place.name,
      searchName: place.name,
      label: labelFromOpenMeteo(place),
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone || 'Asia/Tokyo',
      countryCode: 'JP',
      source: 'open-meteo',
      score: scoreOpenMeteo(place, query),
    }))
}

async function searchNominatim(query) {
  const url = new URL(NOMINATIM)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '8')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'ja')
  url.searchParams.set('countrycodes', 'jp')

  // 市名っぽいときは settlement / city を優先
  if (/市$/.test(query) || /ディズニー|disney/i.test(query)) {
    // featureType は厳密すぎることがあるので付与は市のみ
    if (/市$/.test(query)) url.searchParams.set('featureType', 'city')
  }

  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`地点検索に失敗しました（Nominatim ${res.status}）`)
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return []

  return data
    .filter((place) => (place.address?.country_code || 'jp').toLowerCase() === 'jp')
    .map((place) => {
      const name = place.name || place.display_name?.split(',')[0]?.trim() || query
      return {
        id: `osm-${place.place_id}`,
        name,
        searchName: name,
        label: labelFromNominatim(place),
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        timezone: 'Asia/Tokyo',
        countryCode: 'JP',
        source: 'nominatim',
        score: scoreNominatim(place, query),
      }
    })
}

function dedupePlaces(places) {
  const kept = []
  for (const place of places) {
    const near = kept.find(
      (other) =>
        Math.abs(other.latitude - place.latitude) < 0.05
        && Math.abs(other.longitude - place.longitude) < 0.05,
    )
    if (near) {
      if (place.score > near.score) {
        Object.assign(near, place)
      }
      continue
    }
    kept.push({ ...place })
  }
  return kept
}

/**
 * @param {string} query
 * @returns {Promise<Array<{id:string,name:string,searchName:string,label:string,latitude:number,longitude:number,timezone:string}>>}
 */
export async function searchPlaces(query) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const variants = expandQueries(trimmed)
  const tasks = []
  for (const variant of variants) {
    tasks.push(searchOpenMeteo(variant))
    tasks.push(searchNominatim(variant))
  }

  const batches = await Promise.all(tasks)
  const merged = dedupePlaces(batches.flat())
  merged.sort((a, b) => b.score - a.score)

  const preferred = preferMajorPlaces(merged, trimmed)
  return preferred.slice(0, 6).map(({ score, ...place }) => place)
}

/** 横浜市があるときに青森の横浜町などを落とす。 */
function preferMajorPlaces(places, query) {
  if (!places.length) return places

  const cityName = /市$/.test(query) ? query : `${query}市`
  const cityHit = places.find((p) => p.name === cityName || p.name?.endsWith('市') && p.name.includes(query))
  if (!cityHit) {
    const best = places[0].score
    return places.filter((p) => p.score >= best - 40)
  }

  return places.filter((p) => {
    if (p.id === cityHit.id) return true
    if (p.score < cityHit.score - 25) return false
    // 同名の小さな集落・公園は市があるなら隠す
    if (p.name === query || p.name === `${query}町`) return false
    if (/遊園地|公園|児童/.test(p.name || '')) return false
    return true
  })
}
