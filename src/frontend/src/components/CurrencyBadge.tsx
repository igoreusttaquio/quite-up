import { cn } from '../lib/utils'

/**
 * Tom semântico do valor:
 * - `signed` (padrão): verde se positivo, vermelho se negativo — para movimentações com sinal.
 * - `income` / `expense`: sempre verde / vermelho — receitas e despesas.
 * - `balance`: neutro, ficando vermelho só quando negativo — saldos.
 * - `neutral`: sem cor — totais, metas, dívidas.
 * - `warning`: laranja — valores que pedem atenção.
 */
export type CurrencyTone = 'signed' | 'income' | 'expense' | 'balance' | 'neutral' | 'warning'

interface CurrencyBadgeProps {
  value: number
  tone?: CurrencyTone
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

function toneClass(tone: CurrencyTone, value: number): string {
  switch (tone) {
    case 'income':
      return 'text-income'
    case 'expense':
      return 'text-expense'
    case 'warning':
      return 'text-warning'
    case 'neutral':
      return 'text-foreground'
    case 'balance':
      return value < 0 ? 'text-expense' : 'text-foreground'
    case 'signed':
      return value > 0 ? 'text-income' : value < 0 ? 'text-expense' : 'text-foreground'
  }
}

export function CurrencyBadge({ value, tone = 'signed', className, size = 'md' }: CurrencyBadgeProps) {
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        sizeClasses[String(size)] ?? 'text-base',
        toneClass(tone, value),
        className
      )}
    >
      {formatter.format(value)}
    </span>
  )
}
