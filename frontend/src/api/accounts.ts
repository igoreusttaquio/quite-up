import { api } from '../lib/axios'
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../types'

const accountTypeToInt: Record<string, number> = {
  CheckingAccount: 0,
  Savings: 1,
  Wallet: 2,
  Other: 3,
}

export const accountsApi = {
  list: () => api.get<Account[]>('/accounts'),
  getById: (id: string) => api.get<Account>(`/accounts/${id}`),
  create: (data: CreateAccountRequest) =>
    api.post<Account>('/accounts', {
      name: data.name,
      type: accountTypeToInt[data.type],
      initialBalance: data.initialBalance,
    }),
  update: (id: string, data: UpdateAccountRequest) =>
    api.put<Account>(`/accounts/${id}`, {
      name: data.name,
      type: accountTypeToInt[data.type],
    }),
  deactivate: (id: string) => api.put<void>(`/accounts/${id}/deactivate`),
}
