import { api } from '../lib/axios'
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '../types'

export const budgetsApi = {
  list: (month?: number, year?: number) =>
    api.get<Budget[]>('/budgets', { params: { month, year } }),
  create: (data: CreateBudgetRequest) =>
    api.post<Budget>('/budgets', data),
  update: (id: string, data: UpdateBudgetRequest) =>
    api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete<void>(`/budgets/${id}`),
}
