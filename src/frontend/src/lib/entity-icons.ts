import { Landmark, PiggyBank, Wallet, Folder, HandCoins, Car, CreditCard, type LucideIcon } from 'lucide-react'
import type { AccountType, DebtType } from '../types'

interface EntityVisual {
  Icon: LucideIcon
  color: string
}

// Cores da paleta da logo + semânticas do tema.
export const accountTypeVisual: Record<AccountType, EntityVisual> = {
  CheckingAccount: { Icon: Landmark, color: 'var(--primary)' },
  Savings: { Icon: PiggyBank, color: 'var(--income)' },
  Wallet: { Icon: Wallet, color: 'var(--warning)' },
  Other: { Icon: Folder, color: 'var(--muted-foreground)' },
}

export const debtTypeVisual: Record<DebtType, EntityVisual> = {
  Loan: { Icon: HandCoins, color: 'var(--primary)' },
  Financing: { Icon: Car, color: '#8E6FC7' },
  CreditCard: { Icon: CreditCard, color: 'var(--warning)' },
}
