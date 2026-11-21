import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

const sizes = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-full',
  lg: 'h-11 w-11 rounded-xl',
} as const

/** Preto ou branco, o que tiver mais contraste sobre a cor (hex). Outras cores → branco. */
function readableOn(color: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return '#ffffff'
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // Contraste com branco vs. com preto (WCAG).
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? '#ffffff' : '#1a1523'
}

interface IconBadgeProps {
  children: ReactNode
  /** Qualquer cor CSS (hex, var(--x)...). O fundo usa a mesma cor com transparência. */
  color: string
  size?: keyof typeof sizes
  /** Fundo sólido na cor, com ícone preto/branco para contraste (ex.: destaque do detalhe). */
  strong?: boolean
  className?: string
}

/** Ícone dentro de um círculo/quadrado tingido com a cor informada. */
export function IconBadge({ children, color, size = 'md', strong, className }: IconBadgeProps) {
  const style = strong
    ? { color: readableOn(color), backgroundColor: color }
    : { color, backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)` }

  return (
    <div className={cn('flex flex-shrink-0 items-center justify-center', sizes[size], className)} style={style}>
      {children}
    </div>
  )
}
