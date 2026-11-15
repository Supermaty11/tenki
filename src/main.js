import './style.css'
import { searchPlaces } from './geocode.js'
import { fetchMultiModelForecast, buildStats } from './forecast.js'
import { renderStatus, renderPlaceChoices, renderStats } from './ui.js'

const form = document.querySelector('#search')
let requestId = 0

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
  renderStatus(`${place.label} の予報を集計しています…`)
  try {
    const forecast = await fetchMultiModelForecast(place)
    if (id !== requestId) return
    const stats = buildStats(forecast)
    renderStats(place, stats)
  } catch (error) {
    if (id !== requestId) return
    console.error(error)
    renderStatus(error.message || '予報の取得に失敗しました。')
  }
}
