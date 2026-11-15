import './style.css'
import { searchPlaces } from './geocode.js'
import { fetchMultiModelForecast, buildStats } from './forecast.js'
import {
  renderStatus,
  renderPlaceChoices,
  renderStats,
  renderFavorites,
  renderSuggestions,
  hideSuggestions,
  renderEmptyResults,
} from './ui.js'
import { initThemeControls } from './theme.js'
import { listFavorites, toggleFavorite, isFavorite } from './favorites.js'

initThemeControls(document.querySelector('#theme'))
refreshFavorites()

const form = document.querySelector('#search')
const input = document.querySelector('#query')
const clearBtn = document.querySelector('#clear')
let requestId = 0
let suggestId = 0
let currentPlace = null
let suggestTimer = null

syncClearButton()

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  hideSuggestions()
  const query = input.value.trim()
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
      void selectPlace(place)
    })
  } catch (error) {
    if (id !== requestId) return
    console.error(error)
    renderStatus(error.message || '地点検索に失敗しました。')
  }
})

input.addEventListener('input', () => {
  syncClearButton()
  const query = input.value.trim()
  window.clearTimeout(suggestTimer)

  if (query.length < 1) {
    hideSuggestions()
    return
  }

  suggestTimer = window.setTimeout(() => {
    void updateSuggestions(query)
  }, 220)
})

input.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideSuggestions()
})

input.addEventListener('blur', () => {
  // mousedown で候補選択できるように少し遅らせる
  window.setTimeout(() => hideSuggestions(), 120)
})

clearBtn.addEventListener('click', () => {
  clearAll()
  input.focus()
})

async function updateSuggestions(query) {
  const id = ++suggestId
  try {
    const places = await searchPlaces(query)
    if (id !== suggestId) return
    if (input.value.trim() !== query) return
    renderSuggestions(places, (place) => {
      void selectPlace(place)
    })
  } catch (error) {
    if (id !== suggestId) return
    console.error(error)
    hideSuggestions()
  }
}

async function selectPlace(place) {
  hideSuggestions()
  input.value = place.searchName || place.name
  syncClearButton()
  await loadForecast(place, ++requestId)
}

async function loadForecast(place, id) {
  currentPlace = place
  hideSuggestions()
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
      void selectPlace(place)
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

function clearAll() {
  requestId += 1
  suggestId += 1
  currentPlace = null
  input.value = ''
  hideSuggestions()
  syncClearButton()
  renderEmptyResults()
}

function syncClearButton() {
  clearBtn.hidden = input.value.length === 0
}
