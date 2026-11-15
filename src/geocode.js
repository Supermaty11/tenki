/**
 * 地点検索。
 * Open-Meteo Geocoding はラテン文字向け。日本語は Nominatim (OSM) にフォールバック。
 */

const OPEN_METEO_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA = 'tenki-weather-app/0.1 (https://github.com/Supermaty11/tenki)'

function labelFromOpenMeteo(place) {
  const parts = [place.name, place.admin1, place.country].filter(Boolean)
  return [...new Set(parts)].join('、')
}

function labelFromNominatim(place) {
  return place.display_name?.split(',').slice(0, 3).map((s) => s.trim()).join('、')
    || place.name
    || '地点'
}

async function searchOpenMeteo(query) {
  const url = new URL(OPEN_METEO_GEOCODE)
  url.searchParams.set('name', query)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'ja')
  url.searchParams.set('format', 'json')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`地点検索に失敗しました（Open-Meteo ${res.status}）`)
  const data = await res.json()
  if (!data.results?.length) return []

  return data.results.map((place) => ({
    id: `om-${place.id}`,
    name: place.name,
    label: labelFromOpenMeteo(place),
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || 'Asia/Tokyo',
    countryCode: place.country_code || '',
    source: 'open-meteo',
  }))
}

async function searchNominatim(query) {
  const url = new URL(NOMINATIM)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'ja')
  // 日本向けアプリなので日本を優先。海外地名も拾いたい場合は外す。
  url.searchParams.set('countrycodes', 'jp')

  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`地点検索に失敗しました（Nominatim ${res.status}）`)
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return []

  return data.map((place) => ({
    id: `osm-${place.place_id}`,
    name: place.name || place.display_name?.split(',')[0]?.trim() || query,
    label: labelFromNominatim(place),
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    timezone: 'Asia/Tokyo',
    countryCode: place.address?.country_code?.toUpperCase() || 'JP',
    source: 'nominatim',
  }))
}

/**
 * @param {string} query
 * @returns {Promise<Array<{id:string,name:string,label:string,latitude:number,longitude:number,timezone:string}>>}
 */
export async function searchPlaces(query) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const fromOpenMeteo = await searchOpenMeteo(trimmed)
  if (fromOpenMeteo.length > 0) return fromOpenMeteo

  return searchNominatim(trimmed)
}
