import type { CSSProperties, ReactNode } from 'react'
import { Toaster } from 'sonner'
import { CircleCheck, CircleAlert, Info, TriangleAlert, Loader2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useMediaQuery } from '../hooks/useMediaQuery'

function ToastIcon({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full"
      style={{ color, backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)` }}
    >
      {children}
    </span>
  )
}

const icons = {
  success: (
    <ToastIcon color="var(--income)">
      <CircleCheck size={16} />
    </ToastIcon>
  ),
  error: (
    <ToastIcon color="var(--expense)">
      <CircleAlert size={16} />
    </ToastIcon>
  ),
  warning: (
    <ToastIcon color="var(--warning)">
      <TriangleAlert size={16} />
    </ToastIcon>
  ),
  info: (
    <ToastIcon color="var(--primary)">
      <Info size={16} />
    </ToastIcon>
  ),
  loading: (
    <ToastIcon color="var(--muted-foreground)">
      <Loader2 size={16} className="animate-spin" />
    </ToastIcon>
  ),
}

/**
 * Toasts no visual do app: fundo de card, borda e sombra do tema, cor só no ícone.
 * Mobile: embaixo, logo acima da barra de navegação (perto do polegar). Desktop: canto inferior direito.
 */
export function AppToaster() {
  const { mode } = useTheme()
  const isMobile = useMediaQuery('(max-width: 767px)')

  return (
    <Toaster
      theme={mode}
      position={isMobile ? 'bottom-center' : 'bottom-right'}
      mobileOffset={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))', left: 12, right: 12 }}
      offset={24}
      gap={8}
      icons={icons}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-border': 'var(--border)',
          '--normal-text': 'var(--card-foreground)',
          '--border-radius': '0.875rem',
        } as CSSProperties
      }
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: 'gap-3! p-3.5! shadow-lg! items-center!',
          title: 'text-sm font-semibold',
          description: 'text-xs text-muted-foreground!',
          icon: 'h-7! w-7! m-0!',
          actionButton: 'bg-primary! text-primary-foreground! rounded-md! font-medium!',
          closeButton: 'bg-card! border-border! text-muted-foreground!',
        },
      }}
    />
  )
}
