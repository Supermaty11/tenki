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

function weatherLabel(row) {
  if (!row?.weather?.category) return '—'
  return row.weather.category
}

function agreementShort(row) {
  return row?.agreementShort || '—'
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

export function renderStats(place, stats) {
  renderSummary(place, stats)
  renderHourly(stats.hourlyToday)
  renderWeekly(stats.weekly)
  renderLinks(place)
  renderAttribution()
}

function renderSummary(place, stats) {
  const summary = document.querySelector('#summary')
  summary.replaceChildren()

  const h2 = document.createElement('h2')
  h2.textContent = '統計天気'

  const placeEl = document.createElement('p')
  placeEl.className = 'place-name'
  placeEl.textContent = place.label

  const now = stats.current
  const today = stats.today

  const main = document.createElement('p')
  main.className = 'stat-main'
  main.textContent = `${weatherLabel(now)}（いま）`

  const agree = document.createElement('p')
  agree.className = 'stat-agree'
  agree.textContent = now?.agreement || 'データなし'

  const meta = document.createElement('p')
  meta.className = 'stat-meta'
  meta.textContent = [
    `気温 ${fmtTemp(now?.temperature)}`,
    `降水確率 ${fmtProb(now?.precipProb)}`,
  ].join(' · ')

  const todayLine = document.createElement('p')
  todayLine.className = 'stat-today'
  if (today) {
    todayLine.textContent = `今日 ${weatherLabel(today)}（${today.agreement}） / ${fmtTemp(today.tempMin)}〜${fmtTemp(today.tempMax)} / 降水 ${fmtProb(today.precipProb)}`
  } else {
    todayLine.textContent = '今日の日次集計はありません。'
  }

  summary.append(h2, placeEl, main, agree, meta, todayLine)
}

/**
 * 時系列を横軸にした表を作る。
 * @param {Array<{ label: string, values: string[] }>} rows
 * @param {string[]} headers
 */
function buildTimelineTable(headers, rows) {
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
  for (const header of headers) {
    const th = document.createElement('th')
    th.textContent = header
    headRow.append(th)
  }
  thead.append(headRow)

  const tbody = document.createElement('tbody')
  for (const row of rows) {
    const tr = document.createElement('tr')
    const label = document.createElement('th')
    label.scope = 'row'
    label.className = 'sticky-col'
    label.textContent = row.label
    tr.append(label)
    for (const value of row.values) {
      const td = document.createElement('td')
      td.textContent = value
      tr.append(td)
    }
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
  const table = buildTimelineTable(headers, [
    { label: '天気', values: rows.map(weatherLabel) },
    { label: '気温', values: rows.map((row) => fmtTemp(row.temperature)) },
    { label: '降水', values: rows.map((row) => fmtProb(row.precipProb)) },
    { label: '一致', values: rows.map(agreementShort) },
  ])
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
  const table = buildTimelineTable(headers, [
    { label: '天気', values: rows.map(weatherLabel) },
    { label: '気温', values: rows.map((row) => `${fmtTemp(row.tempMin)}/${fmtTemp(row.tempMax)}`) },
    { label: '降水', values: rows.map((row) => fmtProb(row.precipProb)) },
    { label: '一致', values: rows.map(agreementShort) },
  ])
  table.setAttribute('aria-label', '週間予報')
  section.append(table)
}

function renderLinks(place) {
  const section = document.querySelector('#links')
  section.replaceChildren()
  const h2 = document.createElement('h2')
  h2.textContent = '各サイト'
  const note = document.createElement('p')
  note.textContent = '予報文は取得せず、サイトを開くだけです。'
  const nav = document.createElement('nav')
  nav.className = 'site-links'

  const q = encodeURIComponent(place.name)
  const links = [
    { label: 'tenki.jp', href: `https://tenki.jp/search/?word=${q}` },
    { label: 'ウェザーニュース', href: `https://weathernews.jp/onebox/${place.latitude}/${place.longitude}/` },
    { label: 'Yahoo!天気', href: `https://weather.yahoo.co.jp/weather/search/?p=${q}` },
    { label: '気象庁', href: 'https://www.jma.go.jp/bosai/forecast/' },
  ]

  for (const link of links) {
    const a = document.createElement('a')
    a.href = link.href
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.textContent = link.label
    nav.append(a)
  }

  section.append(h2, note, nav)
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
