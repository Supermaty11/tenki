import { isFavorite } from './favorites.js'
import { buildSiteLinks } from './siteLinks.js'

const WEATHER_ICONS = {
  晴: '☀️',
  曇: '☁️',
  雨: '☔️',
  雪: '❄️',
  雷: '⚡️',
}

function fmtTemp(value) {
  if (value == null) return '—'
  const n = Math.round(Number(value) * 10) / 10
  return `${n}℃`
}

function fmtProb(value) {
  if (value == null) return '—'
  return `${Math.round(Number(value))}%`
}

function fmtHour(isoLocal) {
  return isoLocal.slice(11, 13)
}

function fmtDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(d)
}

function weatherCategory(row) {
  return row?.weather?.category || null
}

function weatherLabel(row) {
  const category = weatherCategory(row)
  if (!category) return '—'
  const icon = WEATHER_ICONS[category] || ''
  return icon ? `${icon}${category}` : category
}

function agreementShort(row) {
  return row?.agreementShort || '—'
}

function weatherClass(category) {
  return category ? `wx-${category}` : ''
}

export function renderFavorites(favorites, { onSelect, onRemove }) {
  const section = document.querySelector('#favorites')
  section.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = 'お気に入り'
  section.append(h2)

  if (!favorites.length) {
    const p = document.createElement('p')
    p.textContent = '地点を表示したあと、☆で登録できます。'
    section.append(p)
    return
  }

  const list = document.createElement('ul')
  list.className = 'favorite-list'
  for (const place of favorites) {
    const li = document.createElement('li')
    const open = document.createElement('button')
    open.type = 'button'
    open.className = 'favorite-open'
    open.textContent = place.label
    open.addEventListener('click', () => onSelect(place))

    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'favorite-remove'
    remove.setAttribute('aria-label', `${place.label}をお気に入りから外す`)
    remove.textContent = '×'
    remove.addEventListener('click', () => onRemove(place))

    li.append(open, remove)
    list.append(li)
  }
  section.append(list)
}

export function renderStatus(message) {
  const summary = document.querySelector('#summary')
  summary.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '統計天気'
  const p = document.createElement('p')
  p.textContent = message
  summary.append(h2, p)

  clearListSection('#hourly', '時間別', '地点を選ぶと表示します。')
  clearListSection('#weekly', '週間', '地点を選ぶと表示します。')
}

function clearListSection(selector, title, message) {
  const el = document.querySelector(selector)
  el.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = title
  const p = document.createElement('p')
  p.textContent = message
  el.append(h2, p)
}

export function renderPlaceChoices(places, onPick) {
  const summary = document.querySelector('#summary')
  summary.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '地点を選んでください'
  const list = document.createElement('ul')
  list.className = 'place-list'
  for (const place of places) {
    const li = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'place-choice'
    button.textContent = place.label
    button.addEventListener('click', () => onPick(place))
    li.append(button)
    list.append(li)
  }
  summary.append(h2, list)
}

export function renderSuggestions(places, onPick) {
  const list = document.querySelector('#suggestions')
  list.replaceChildren()
  if (!places.length) {
    list.hidden = true
    return
  }

  for (const place of places) {
    const li = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'suggestion-item'
    button.setAttribute('role', 'option')
    button.textContent = place.label
    button.addEventListener('mousedown', (event) => {
      // blur より先に選ばせる
      event.preventDefault()
      onPick(place)
    })
    li.append(button)
    list.append(li)
  }
  list.hidden = false
}

export function hideSuggestions() {
  const list = document.querySelector('#suggestions')
  list.replaceChildren()
  list.hidden = true
}

export function renderEmptyResults() {
  renderStatus('検索した地点の結果がここに出ます。')
  const links = document.querySelector('#links')
  links.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '各サイト'
  links.append(h2)

  const attribution = document.querySelector('#attribution')
  if (attribution) attribution.remove()
}

export function renderStats(place, stats, { onToggleFavorite } = {}) {
  renderSummary(place, stats, onToggleFavorite)
  renderHourly(stats.hourlyToday)
  renderWeekly(stats.weekly)
  renderLinks(place)
  renderAttribution()
}

function renderSummary(place, stats, onToggleFavorite) {
  const summary = document.querySelector('#summary')
  summary.replaceChildren()

  const heading = document.createElement('div')
  heading.className = 'summary-heading'

  const h2 = document.createElement('h2')
  h2.textContent = '統計天気'
  heading.append(h2)

  if (onToggleFavorite) {
    const fav = document.createElement('button')
    fav.type = 'button'
    fav.className = 'favorite-toggle'
    const saved = isFavorite(place)
    fav.setAttribute('aria-pressed', saved ? 'true' : 'false')
    fav.setAttribute('aria-label', saved ? 'お気に入り解除' : 'お気に入り登録')
    fav.textContent = saved ? '★' : '☆'
    fav.addEventListener('click', () => onToggleFavorite(place))
    heading.append(fav)
  }

  const placeEl = document.createElement('p')
  placeEl.className = 'place-name'
  placeEl.textContent = place.label

  const now = stats.current
  const today = stats.today
  const nowCategory = weatherCategory(now)

  const hero = document.createElement('div')
  hero.className = 'stat-hero'

  const mainRow = document.createElement('div')
  mainRow.className = 'stat-main-row'

  const weather = document.createElement('p')
  weather.className = `stat-main ${weatherClass(nowCategory)}`
  weather.textContent = weatherLabel(now)

  const temp = document.createElement('p')
  temp.className = 'stat-temp'
  temp.textContent = fmtTemp(now?.temperature)

  mainRow.append(weather, temp)

  if (stats.outlook) {
    const outlook = document.createElement('p')
    outlook.className = 'stat-outlook'
    outlook.textContent = stats.outlook
    mainRow.append(outlook)
  }

  hero.append(mainRow)

  const agree = document.createElement('p')
  agree.className = 'stat-agree'
  agree.textContent = now?.agreement || 'データなし'

  const meta = document.createElement('p')
  meta.className = 'stat-meta'
  meta.textContent = `降水確率 ${fmtProb(now?.precipProb)}`

  const todayLine = document.createElement('p')
  todayLine.className = 'stat-today'
  if (today) {
    const line1 = document.createElement('span')
    line1.className = 'stat-today-main'
    line1.textContent = `今日 ${weatherLabel(today)}（${today.agreement}） / ${fmtTemp(today.tempMin)}〜${fmtTemp(today.tempMax)}`
    const line2 = document.createElement('span')
    line2.className = 'stat-today-precip'
    line2.textContent = `降水 ${fmtProb(today.precipProb)}`
    todayLine.append(line1, line2)
  } else {
    todayLine.textContent = '今日の日次集計はありません。'
  }

  summary.append(heading, placeEl, hero, agree, meta, todayLine)
}

function buildTimelineTable(headers, rows, categories) {
  const wrap = document.createElement('div')
  wrap.className = 'timeline-scroll'
  wrap.setAttribute('tabindex', '0')
  wrap.setAttribute('role', 'region')

  const table = document.createElement('table')
  table.className = 'wx-table wx-timeline'

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  const corner = document.createElement('th')
  corner.className = 'sticky-col'
  corner.textContent = ''
  headRow.append(corner)
  headers.forEach((header, i) => {
    const th = document.createElement('th')
    th.textContent = header
    const cls = weatherClass(categories[i])
    if (cls) th.classList.add(cls)
    headRow.append(th)
  })
  thead.append(headRow)

  const tbody = document.createElement('tbody')
  for (const row of rows) {
    const tr = document.createElement('tr')
    const label = document.createElement('th')
    label.scope = 'row'
    label.className = 'sticky-col'
    label.textContent = row.label
    tr.append(label)
    row.values.forEach((value, i) => {
      const td = document.createElement('td')
      td.textContent = value
      const cls = weatherClass(categories[i])
      if (cls) td.classList.add(cls)
      tr.append(td)
    })
    tbody.append(tr)
  }

  table.append(thead, tbody)
  wrap.append(table)
  return wrap
}

function renderHourly(rows) {
  const section = document.querySelector('#hourly')
  section.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '時間別'
  section.append(h2)

  if (!rows.length) {
    const p = document.createElement('p')
    p.textContent = '今日の時間別データがありません。'
    section.append(p)
    return
  }

  const headers = rows.map((row) => fmtHour(row.time))
  const categories = rows.map(weatherCategory)
  const table = buildTimelineTable(
    headers,
    [
      { label: '天気', values: rows.map(weatherLabel) },
      { label: '気温', values: rows.map((row) => fmtTemp(row.temperature)) },
      { label: '降水', values: rows.map((row) => fmtProb(row.precipProb)) },
      { label: '一致', values: rows.map(agreementShort) },
    ],
    categories,
  )
  table.setAttribute('aria-label', '時間別予報')
  section.append(table)
}

function renderWeekly(rows) {
  const section = document.querySelector('#weekly')
  section.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '週間'
  section.append(h2)

  if (!rows.length) {
    const p = document.createElement('p')
    p.textContent = '週間データがありません。'
    section.append(p)
    return
  }

  const headers = rows.map((row) => fmtDate(row.date))
  const categories = rows.map(weatherCategory)
  const table = buildTimelineTable(
    headers,
    [
      { label: '天気', values: rows.map(weatherLabel) },
      { label: '気温', values: rows.map((row) => `${fmtTemp(row.tempMin)}/${fmtTemp(row.tempMax)}`) },
      { label: '降水', values: rows.map((row) => fmtProb(row.precipProb)) },
      { label: '一致', values: rows.map(agreementShort) },
    ],
    categories,
  )
  table.setAttribute('aria-label', '週間予報')
  section.append(table)
}

function renderLinks(place) {
  const section = document.querySelector('#links')
  section.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '各サイト'
  const nav = document.createElement('nav')
  nav.className = 'site-links'

  for (const link of buildSiteLinks(place)) {
    const a = document.createElement('a')
    a.href = link.href
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.textContent = link.label
    nav.append(a)
  }

  section.append(h2, nav)
}

function renderAttribution() {
  let el = document.querySelector('#attribution')
  if (!el) {
    el = document.createElement('section')
    el.id = 'attribution'
    document.querySelector('#app').append(el)
  }
  el.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '出典'
  const p = document.createElement('p')
  p.innerHTML = [
    '予報データは <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> 経由で取得しています。',
    '気象庁 MSM を含む複数機関のモデルを、本アプリ側で多数決・中央値に加工して表示しています。加工結果の責任は本アプリにあります。',
    '地点検索は Open-Meteo Geocoding / OpenStreetMap Nominatim を利用します。',
  ].join(' ')
  el.append(h2, p)
}
