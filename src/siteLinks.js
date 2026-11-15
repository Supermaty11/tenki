/**
 * 各地点の予報ページへ、できるだけ地点つきで飛ばす。
 * 予報文の取得はしない（リンクのみ）。
 */
export function buildSiteLinks(place) {
  const word = encodeURIComponent(place.searchName || place.name || place.label)
  const lat = Number(place.latitude)
  const lon = Number(place.longitude)
  const zoom = 10

  return [
    {
      label: 'tenki.jp',
      href: `https://tenki.jp/search/?word=${word}`,
    },
    {
      label: 'ウェザーニュース',
      href: `https://weathernews.jp/onebox/${lat}/${lon}/`,
    },
    {
      label: 'Yahoo!天気',
      href: `https://weather.yahoo.co.jp/weather/search/?p=${word}`,
    },
    {
      label: '気象庁',
      // 予報区コードなしでも、地点周辺の地図／予報画面へ寄せる
      href: `https://www.jma.go.jp/bosai/map.html#${zoom}/${lat}/${lon}/&elem=root&contents=forecast&lang=ja`,
    },
  ]
}
