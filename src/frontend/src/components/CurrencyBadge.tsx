import { cn } from '../lib/utils'

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface CurrencyBadgeProps {
  value: number
  className?: string
}

export function CurrencyBadge({ value, className }: CurrencyBadgeProps) {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  return (
    <span
      className={cn(
        'text-sm font-semibold tabular-nums',
        isNegative ? 'text-[hsl(var(--expense))]' : 'text-[hsl(var(--income))]',
        className
      )}
    >
      {isNegative ? '- ' : '+ '}{fmt.format(absValue)}
    </span>
  )
}
