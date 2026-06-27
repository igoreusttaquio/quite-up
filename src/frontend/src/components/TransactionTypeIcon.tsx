import { ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react'
import type { TransactionType } from '../types'

interface Props { type: TransactionType }

export function TransactionTypeIcon({ type }: Props) {
  if (type === 'Income') return (
    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
      <ArrowUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    </div>
  )
  if (type === 'Expense') return (
    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
      <ArrowLeftRight className="h-4 w-4 text-primary" />
    </div>
  )
}
