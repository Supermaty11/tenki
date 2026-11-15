const STORAGE_KEY = 'tenki-theme'

/** @type {Array<{ id: string, label: string }>} */
export const THEMES = [
  { id: 'earth', label: 'アース' },
  { id: 'moss', label: 'モス' },
  { id: 'clay', label: 'クレイ' },
]

export function getSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (THEMES.some((t) => t.id === saved)) return saved
  return 'earth'
}

export function applyTheme(themeId) {
  const id = THEMES.some((t) => t.id === themeId) ? themeId : 'earth'
  document.documentElement.dataset.theme = id
  localStorage.setItem(STORAGE_KEY, id)
  return id
}

export function initThemeControls(selectEl) {
  const current = applyTheme(getSavedTheme())
  for (const theme of THEMES) {
    const option = document.createElement('option')
    option.value = theme.id
    option.textContent = theme.label
    if (theme.id === current) option.selected = true
    selectEl.append(option)
  }
  selectEl.addEventListener('change', () => {
    applyTheme(selectEl.value)
  })
}
