import api from '../lib/axios'
import type { Account } from '../types/api'

export const accountsApi = {
  getAll: () => api.get<Account[]>('/accounts'),
  getById: (id: string) => api.get<Account>(`/accounts/${id}`),
  create: (data: { name: string; type: string; initialBalance: number }) =>
    api.post<Account>('/accounts', data),
  update: (id: string, data: { name: string; type: string }) =>
    api.put<Account>(`/accounts/${id}`, data),
  deactivate: (id: string) => api.put(`/accounts/${id}/deactivate`),
}
