const STORAGE_KEY = 'tenki-favorites'
const MAX_FAVORITES = 12

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_FAVORITES)))
}

export function listFavorites() {
  return readAll()
}

export function isFavorite(place) {
  return readAll().some((item) => samePlace(item, place))
}

export function toggleFavorite(place) {
  const list = readAll()
  const index = list.findIndex((item) => samePlace(item, place))
  if (index >= 0) {
    list.splice(index, 1)
    writeAll(list)
    return false
  }

  list.unshift({
    id: place.id,
    name: place.name,
    searchName: place.searchName || place.name,
    label: place.label,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || 'Asia/Tokyo',
    countryCode: place.countryCode || 'JP',
  })
  writeAll(list)
  return true
}

function samePlace(a, b) {
  if (a.id && b.id && a.id === b.id) return true
  return (
    Math.abs(Number(a.latitude) - Number(b.latitude)) < 0.01
    && Math.abs(Number(a.longitude) - Number(b.longitude)) < 0.01
    && a.label === b.label
  )
}
