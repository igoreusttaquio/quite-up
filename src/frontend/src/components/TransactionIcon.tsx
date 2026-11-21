import { CategoryIcon } from '../lib/category-icon'
import type { Category, Transaction } from '../types'
import { IconBadge } from './IconBadge'
import { TransactionTypeIcon } from './TransactionTypeIcon'

/**
 * Ícone de uma transação: usa o ícone e a cor da categoria quando houver;
 * sem categoria (ou transferência), cai no ícone do tipo.
 */
export function TransactionIcon({ transaction, category }: { transaction: Transaction; category?: Category }) {
  if (transaction.type === 'Transfer' || !category) {
    return <TransactionTypeIcon type={transaction.type} />
  }

  return (
    <IconBadge color={category.color || 'var(--muted-foreground)'}>
      <CategoryIcon icon={category.icon} size={16} />
    </IconBadge>
  )
}
