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
  const hour = isoLocal.slice(11, 16)
  return hour
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

  const table = document.createElement('table')
  table.className = 'wx-table'
  const thead = document.createElement('thead')
  thead.innerHTML = '<tr><th>時刻</th><th>天気</th><th>一致</th><th>気温</th><th>降水</th></tr>'
  const tbody = document.createElement('tbody')
  for (const row of rows) {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${fmtHour(row.time)}</td>
      <td>${weatherLabel(row)}</td>
      <td>${row.agreement}</td>
      <td>${fmtTemp(row.temperature)}</td>
      <td>${fmtProb(row.precipProb)}</td>
    `
    tbody.append(tr)
  }
  table.append(thead, tbody)
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

  const table = document.createElement('table')
  table.className = 'wx-table'
  const thead = document.createElement('thead')
  thead.innerHTML = '<tr><th>日</th><th>天気</th><th>一致</th><th>気温</th><th>降水</th></tr>'
  const tbody = document.createElement('tbody')
  for (const row of rows) {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${fmtDate(row.date)}</td>
      <td>${weatherLabel(row)}</td>
      <td>${row.agreement}</td>
      <td>${fmtTemp(row.tempMin)}〜${fmtTemp(row.tempMax)}</td>
      <td>${fmtProb(row.precipProb)}</td>
    `
    tbody.append(tr)
  }
  table.append(thead, tbody)
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
