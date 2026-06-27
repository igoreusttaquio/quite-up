import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { FluentProvider, webLightTheme, webDarkTheme, type Theme } from '@fluentui/react-components'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('color-scheme') as ThemeMode) ?? 'light'
  })

  useEffect(() => {
    localStorage.setItem('color-scheme', mode)
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  const toggle = () => setMode(m => m === 'light' ? 'dark' : 'light')
  const theme: Theme = mode === 'light' ? webLightTheme : webDarkTheme

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <FluentProvider theme={theme} className="min-h-screen">
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
