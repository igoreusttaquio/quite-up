import { api } from '../lib/axios'
import type { Debt, CreateDebtRequest, UpdateDebtRequest, DebtPayment, RegisterDebtPaymentRequest, SnowballStrategy } from '../types'

export const debtsApi = {
  list: (isPaid?: boolean) => api.get<Debt[]>('/debts', { params: { isPaid } }),
  getById: (id: string) => api.get<Debt>(`/debts/${id}`),
  create: (data: CreateDebtRequest) => api.post<Debt>('/debts', data),
  update: (id: string, data: UpdateDebtRequest) => api.put<Debt>(`/debts/${id}`, data),
  delete: (id: string) => api.delete<void>(`/debts/${id}`),
  getPayments: (debtId: string) => api.get<DebtPayment[]>(`/debts/${debtId}/payments`),
  registerPayment: (debtId: string, data: RegisterDebtPaymentRequest) =>
    api.post<DebtPayment>(`/debts/${debtId}/payments`, {
      amount: data.amount,
      paymentDate: data.paymentDate,
      isEarlyPayment: data.isEarlyPayment,
      discount: data.discount,
      notes: data.notes,
      accountId: data.accountId ?? null,
    }),
  getSnowball: () => api.get<SnowballStrategy>('/debts/snowball'),
}
