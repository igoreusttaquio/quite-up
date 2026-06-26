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

const colors: Record<TransactionType, string> = {
  Income: 'var(--colorPaletteGreenForeground1)',
  Expense: 'var(--colorPaletteRedForeground1)',
  Transfer: 'var(--colorNeutralForeground3)',
}

interface TransactionTypeIconProps {
  type: TransactionType
}

export function TransactionTypeIcon({ type }: TransactionTypeIconProps) {
  const Icon = icons[type]
  return <Icon style={{ color: colors[type] }} />
}
