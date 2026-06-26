import { api } from '../lib/axios'
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PaginatedResult,
  TransactionFilters,
} from '../types'

export const transactionsApi = {
  list: (filters?: TransactionFilters) =>
    api.get<PaginatedResult<Transaction>>('/transactions', { params: filters }),
  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  create: (data: CreateTransactionRequest) => api.post<Transaction>('/transactions', data),
  update: (id: string, data: UpdateTransactionRequest) => api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete<void>(`/transactions/${id}`),
}
