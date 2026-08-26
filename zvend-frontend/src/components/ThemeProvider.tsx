import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, THEMES, type ThemeId } from './theme-context'

const STORAGE_KEY = 'zvend-theme'

function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES.some((t) => t.id === saved)) return saved as ThemeId
  } catch {
    // storage unavailable
  }
  return 'blue'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(loadTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // storage unavailable
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  )
}
