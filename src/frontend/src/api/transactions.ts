import { api } from '../lib/axios'
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PaginatedResult,
  TransactionFilters,
} from '../types'

const transactionTypeToInt: Record<string, number> = {
  Income: 0,
  Expense: 1,
  Transfer: 2,
}

export const transactionsApi = {
  list: (filters?: TransactionFilters) =>
    api.get<PaginatedResult<Transaction>>('/transactions', { params: filters }),
  create: (data: CreateTransactionRequest) =>
    api.post<Transaction>('/transactions', {
      type: transactionTypeToInt[data.type],
      amount: data.amount,
      date: data.date,
      accountId: data.accountId,
      categoryId: data.categoryId ?? null,
      destinationAccountId: data.destinationAccountId ?? null,
      description: data.description ?? null,
    }),
  update: (id: string, data: UpdateTransactionRequest) =>
    api.put<Transaction>(`/transactions/${id}`, {
      amount: data.amount,
      date: data.date,
      categoryId: data.categoryId ?? null,
      description: data.description ?? null,
    }),
  delete: (id: string) => api.delete<void>(`/transactions/${id}`),
}
