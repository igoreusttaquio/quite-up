import { ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react'
import { cn } from '../lib/utils'
import type { TransactionType } from '../types'

const config = {
  Income: { Icon: ArrowUp, bg: 'bg-income-subtle', color: 'text-income' },
  Expense: { Icon: ArrowDown, bg: 'bg-expense-subtle', color: 'text-expense' },
  Transfer: { Icon: ArrowRightLeft, bg: 'bg-muted', color: 'text-muted-foreground' },
}

interface TransactionTypeIconProps {
  type: TransactionType
  size?: number
}

export function TransactionTypeIcon({ type, size = 15 }: TransactionTypeIconProps) {
  const { Icon, bg, color } = config[type]
  return (
    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0', bg)}>
      <Icon className={color} size={size} />
    </div>
  )
}
