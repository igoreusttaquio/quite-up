import { api } from '../lib/axios'
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../types'

export const accountsApi = {
  list: () => api.get<Account[]>('/accounts'),
  getById: (id: string) => api.get<Account>(`/accounts/${id}`),
  create: (data: CreateAccountRequest) => api.post<Account>('/accounts', data),
  update: (id: string, data: UpdateAccountRequest) => api.put<Account>(`/accounts/${id}`, data),
  deactivate: (id: string) => api.put<void>(`/accounts/${id}/deactivate`),
}
