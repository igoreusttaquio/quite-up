import type { TransactionType } from '../types'
import {
  ArrowUpFilled,
  ArrowDownFilled,
  ArrowRepeatAllFilled,
} from '@fluentui/react-icons'
import type { FluentIcon } from '@fluentui/react-icons'

const icons: Record<TransactionType, FluentIcon> = {
  Income: ArrowUpFilled,
  Expense: ArrowDownFilled,
  Transfer: ArrowRepeatAllFilled,
}

const colorClass: Record<TransactionType, string> = {
  Income: 'text-income',
  Expense: 'text-expense',
  Transfer: 'text-muted',
}

interface TransactionTypeIconProps {
  type: TransactionType
}

export function TransactionTypeIcon({ type }: TransactionTypeIconProps) {
  const Icon = icons[type]
  return <Icon className={colorClass[type]} />
}
