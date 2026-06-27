import { cn } from '../lib/utils'

interface CurrencyBadgeProps {
  value: number
  className?: string
  size?: 'sm' | 'md' | 'lg' | 300 | 400 | 500 | 600 | 700
}

const sizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  300: 'text-sm',
  400: 'text-base',
  500: 'text-lg',
  600: 'text-xl',
  700: 'text-2xl',
}

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function CurrencyBadge({ value, className, size = 'md' }: CurrencyBadgeProps) {
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        sizeClasses[String(size)] ?? 'text-base',
        value > 0 ? 'text-income' : value < 0 ? 'text-expense' : 'text-foreground',
        className
      )}
    >
      {formatter.format(value)}
    </span>
  )
}
