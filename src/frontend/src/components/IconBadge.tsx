import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

const sizes = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-full',
  lg: 'h-11 w-11 rounded-xl',
} as const

interface IconBadgeProps {
  children: ReactNode
  /** Qualquer cor CSS (hex, var(--x)...). O fundo usa a mesma cor com transparência. */
  color: string
  size?: keyof typeof sizes
  className?: string
}

/** Ícone dentro de um círculo/quadrado tingido com a cor informada. */
export function IconBadge({ children, color, size = 'md', className }: IconBadgeProps) {
  return (
    <div
      className={cn('flex flex-shrink-0 items-center justify-center', sizes[size], className)}
      style={{ color, backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)` }}
    >
      {children}
    </div>
  )
}
