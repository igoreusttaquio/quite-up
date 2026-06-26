import api from '../lib/axios'
import type { Transaction, PagedResult } from '../types/api'

export const transactionsApi = {
  getAll: (params?: { page?: number; pageSize?: number; accountId?: string; categoryId?: string; startDate?: string; endDate?: string }) =>
    api.get<PagedResult<Transaction>>('/transactions', { params }),

  create: (data: {
    type: string
    value: number
    date: string
    accountId: string
    categoryId?: string
    destinationAccountId?: string
    description?: string
  }) => api.post<Transaction>('/transactions', data),

  update: (id: string, data: {
    value?: number
    date?: string
    categoryId?: string
    description?: string
  }) => api.put<Transaction>(`/transactions/${id}`, data),

  delete: (id: string) => api.delete(`/transactions/${id}`),
}
