import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { colors } from '@oro/tokens'

// Dark/light theme for the redesigned marketing surface.
// Ported from the design handoff's `shared.jsx` ThemeProvider.
// - default theme: light
// - persisted to localStorage['oro_theme']
// - applies <html data-theme="dark|light"> so the CSS variables in index.css flip
const STORAGE_KEY = 'oro_theme'

const ThemeContext = createContext(null)

function readInitialTheme(defaultTheme) {
  if (typeof window === 'undefined') return defaultTheme
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'system' || stored === 'dark' || stored === 'light') return stored
  } catch {
    /* localStorage unavailable (private mode / blocked) — fall back to default */
  }
  return defaultTheme
}

export function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [mode, setModeState] = useState(defaultTheme)
  const [theme, setResolvedTheme] = useState(defaultTheme === 'dark' ? 'dark' : 'light')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const storedTheme = readInitialTheme(defaultTheme)
    if (storedTheme !== mode) setModeState(storedTheme)
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore persistence failures */
    }

    const preference = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolved = mode === 'system' ? (preference.matches ? 'dark' : 'light') : mode
      setResolvedTheme(resolved)
      document.documentElement.setAttribute('data-theme-mode', mode)
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.style.colorScheme = resolved
      document.body.style.background = resolved === 'dark' ? colors.plum : colors.paper
    }

    applyTheme()
    if (mode !== 'system') return undefined
    preference.addEventListener('change', applyTheme)
    return () => preference.removeEventListener('change', applyTheme)
  }, [initialized, mode])

  const setTheme = useCallback((next) => {
    if (next === 'system' || next === 'dark' || next === 'light') setModeState(next)
  }, [])

  const value = useMemo(
    () => ({ theme, mode, setTheme }),
    [theme, mode, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
