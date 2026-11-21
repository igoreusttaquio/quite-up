import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface FabProps {
  onClick: () => void
  label: string
  icon: ReactNode
  className?: string
}

/** Botão de ação flutuante — só no mobile, acima da barra de navegação inferior. */
export function Fab({ onClick, label, icon, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        // z-[15]: acima da barra inferior (z-10) e abaixo do menu mobile (z-20).
        'md:hidden fixed right-4 z-[15] flex h-14 w-14 items-center justify-center rounded-full',
        'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]',
        'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
        'transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {icon}
    </button>
  )
}
