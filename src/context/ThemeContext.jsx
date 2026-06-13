import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Dark/light theme for the redesigned marketing surface.
// Ported from the design handoff's `shared.jsx` ThemeProvider.
// - default theme: dark (confirmed in the handoff)
// - persisted to localStorage['oro_theme']
// - applies <html data-theme="dark|light"> so the CSS variables in index.css flip
const STORAGE_KEY = 'oro_theme'

const ThemeContext = createContext(null)

function readInitialTheme(defaultTheme) {
  if (typeof window === 'undefined') return defaultTheme
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* localStorage unavailable (private mode / blocked) — fall back to default */
  }
  return defaultTheme
}

export function ThemeProvider({ children, defaultTheme = 'dark' }) {
  const [theme, setThemeState] = useState(defaultTheme)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const storedTheme = readInitialTheme(defaultTheme)
    if (storedTheme !== theme) setThemeState(storedTheme)
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore persistence failures */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      // Keep <body> in sync so overscroll / scroll gutters don't flash the wrong color.
      document.body.style.background = theme === 'dark' ? '#3A2646' : '#FFF9ED'
    }
  }, [initialized, theme])

  const setTheme = useCallback((next) => {
    if (next === 'dark' || next === 'light') setThemeState(next)
  }, [])

  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  )

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
