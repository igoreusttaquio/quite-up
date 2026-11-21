import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} })

// Cor de fundo do cabeçalho/cards em cada tema (barra de status do sistema no PWA).
const THEME_COLORS: Record<ThemeMode, string> = { light: '#ffffff', dark: '#1b1922' }

/** O tema do app pode diferir do sistema: força a cor da barra para o tema escolhido. */
function syncThemeColor(mode: ThemeMode) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', THEME_COLORS[mode])
  })
  document
    .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute('content', mode === 'dark' ? 'black' : 'default')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem('color-scheme') as ThemeMode) ?? 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('color-scheme', mode)
    } catch {
      /* preferência é só conveniência */
    }
    document.documentElement.classList.toggle('dark', mode === 'dark')
    syncThemeColor(mode)
  }, [mode])

  const toggle = () => setMode(m => (m === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
