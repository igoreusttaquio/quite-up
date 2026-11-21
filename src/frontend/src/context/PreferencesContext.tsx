import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/** Densidade da interface: escala o tamanho base (rem) de textos e espaçamentos. */
export type Density = 'compact' | 'default' | 'comfortable'

export const densityLabels: Record<Density, string> = {
  compact: 'Compacta',
  default: 'Padrão',
  comfortable: 'Ampla',
}

const DENSITY_ORDER: Density[] = ['compact', 'default', 'comfortable']

interface PreferencesContextValue {
  density: Density
  setDensity: (density: Density) => void
  cycleDensity: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

// localStorage pode falhar (modo privado, bloqueado): preferências são só conveniência.
function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null
    return value && allowed.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignora */
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [density, setDensity] = useState<Density>(() => readPref('ui-density', DENSITY_ORDER, 'default'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => readPref('ui-sidebar', ['collapsed', 'expanded'] as const, 'expanded') === 'collapsed'
  )

  useEffect(() => {
    writePref('ui-density', density)
    document.documentElement.dataset.density = density
  }, [density])

  useEffect(() => {
    writePref('ui-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded')
  }, [sidebarCollapsed])

  const cycleDensity = useCallback(
    () => setDensity((d) => DENSITY_ORDER[(DENSITY_ORDER.indexOf(d) + 1) % DENSITY_ORDER.length]),
    []
  )
  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), [])

  const value = useMemo(
    () => ({ density, setDensity, cycleDensity, sidebarCollapsed, toggleSidebar }),
    [density, cycleDensity, sidebarCollapsed, toggleSidebar]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider')
  return ctx
}
