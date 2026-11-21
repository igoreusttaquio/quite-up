import type { z } from 'zod'
import type { TransactionType } from '../types'
import { toDateParam } from './utils'

export const transactionTypeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatBRL = (value: number) => brl.format(value)

/** Ex.: "Despesa de R$ 45,00" */
export function describeAmount(type: TransactionType, amount: number) {
  return transactionTypeLabels[type] + ' de ' + brl.format(amount)
}

/** Data de hoje (local) no formato yyyy-MM-dd. */
export const todayParam = () => toDateParam(new Date())

/** Valida conta de destino em transferências (obrigatória e diferente da origem). */
export function transferRefinement(
  data: { type: TransactionType; accountId?: string; destinationAccountId?: string },
  ctx: z.RefinementCtx
) {
  if (data.type !== 'Transfer') return
  if (!data.destinationAccountId) {
    ctx.addIssue({ code: 'custom', path: ['destinationAccountId'], message: 'Conta de destino é obrigatória' })
  } else if (data.destinationAccountId === data.accountId) {
    ctx.addIssue({ code: 'custom', path: ['destinationAccountId'], message: 'Origem e destino devem ser diferentes' })
  }
}
