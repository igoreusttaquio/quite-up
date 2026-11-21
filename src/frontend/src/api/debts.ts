import { api } from '../lib/axios'
import type { Debt, DebtInput, DebtInstallment, DebtPayment, RegisterDebtPaymentRequest, UpdateDebtPaymentRequest, SnowballStrategy } from '../types'

export const debtsApi = {
  list: (isPaid?: boolean) => api.get<Debt[]>('/debts', { params: { isPaid } }),
  getById: (id: string) => api.get<Debt>(`/debts/${id}`),
  create: (data: DebtInput) => api.post<Debt>('/debts', data),
  update: (id: string, data: DebtInput) => api.put<Debt>(`/debts/${id}`, data),
  getInstallments: (debtId: string) => api.get<DebtInstallment[]>(`/debts/${debtId}/installments`),
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
  updatePayment: (debtId: string, paymentId: string, data: UpdateDebtPaymentRequest) =>
    api.put<DebtPayment>(`/debts/${debtId}/payments/${paymentId}`, {
      amount: data.amount,
      paymentDate: data.paymentDate,
      isEarlyPayment: data.isEarlyPayment,
      discount: data.discount ?? 0,
      notes: data.notes ?? null,
      accountId: data.accountId ?? null,
    }),
  deletePayment: (debtId: string, paymentId: string) =>
    api.delete<void>(`/debts/${debtId}/payments/${paymentId}`),
  getSnowball: () => api.get<SnowballStrategy>('/debts/snowball'),
}
