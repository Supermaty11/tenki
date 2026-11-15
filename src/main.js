import './style.css'
import { searchPlaces } from './geocode.js'
import { fetchMultiModelForecast, buildStats } from './forecast.js'
import { renderStatus, renderPlaceChoices, renderStats, renderFavorites } from './ui.js'
import { initThemeControls } from './theme.js'
import { listFavorites, toggleFavorite, isFavorite } from './favorites.js'

initThemeControls(document.querySelector('#theme'))
refreshFavorites()

const form = document.querySelector('#search')
let requestId = 0
let currentPlace = null

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const query = new FormData(form).get('query').trim()
  if (!query) {
    renderStatus('地点を入力してください。')
    return
  }

  const id = ++requestId
  renderStatus(`「${query}」を検索しています…`)

  try {
    const places = await searchPlaces(query)
    if (id !== requestId) return

    if (places.length === 0) {
      renderStatus(`「${query}」に一致する地点が見つかりませんでした。`)
      return
    }

    if (places.length === 1) {
      await loadForecast(places[0], id)
      return
    }

    renderPlaceChoices(places, (place) => {
      void loadForecast(place, ++requestId)
    })
  } catch (error) {
    if (id !== requestId) return
    console.error(error)
    renderStatus(error.message || '地点検索に失敗しました。')
  }
})

async function loadForecast(place, id) {
  currentPlace = place
  renderStatus(`${place.label} の予報を集計しています…`)
  try {
    const forecast = await fetchMultiModelForecast(place)
    if (id !== requestId) return
    const stats = buildStats(forecast)
    renderStats(place, stats, {
      onToggleFavorite: handleToggleFavorite,
    })
  } catch (error) {
    if (id !== requestId) return
    console.error(error)
    renderStatus(error.message || '予報の取得に失敗しました。')
  }
}

function handleToggleFavorite(place) {
  toggleFavorite(place)
  refreshFavorites()
  const btn = document.querySelector('#summary .favorite-toggle')
  if (btn && currentPlace) {
    const saved = isFavorite(currentPlace)
    btn.textContent = saved ? '★' : '☆'
    btn.setAttribute('aria-pressed', saved ? 'true' : 'false')
    btn.setAttribute('aria-label', saved ? 'お気に入り解除' : 'お気に入り登録')
  }
}

function refreshFavorites() {
  renderFavorites(listFavorites(), {
    onSelect: (place) => {
      document.querySelector('#query').value = place.searchName || place.name
      void loadForecast(place, ++requestId)
    },
    onRemove: (place) => {
      toggleFavorite(place)
      refreshFavorites()
      if (currentPlace && (currentPlace.id === place.id || currentPlace.label === place.label)) {
        const btn = document.querySelector('#summary .favorite-toggle')
        if (btn) {
          btn.textContent = '☆'
          btn.setAttribute('aria-pressed', 'false')
          btn.setAttribute('aria-label', 'お気に入り登録')
        }
      }
    },
  })
}
