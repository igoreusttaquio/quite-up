import { api } from '../lib/axios'
import type { Debt, CreateDebtRequest, UpdateDebtRequest, DebtPayment, RegisterDebtPaymentRequest, SnowballStrategy } from '../types'

const debtTypeToInt: Record<string, number> = {
  Loan: 0,
  Financing: 1,
  CreditCard: 2,
}

export const debtsApi = {
  list: (isPaid?: boolean) => api.get<Debt[]>('/debts', { params: { isPaid } }),
  getById: (id: string) => api.get<Debt>(`/debts/${id}`),
  create: (data: CreateDebtRequest) =>
    api.post<Debt>('/debts', {
      name: data.name,
      type: debtTypeToInt[data.type],
      totalAmount: data.totalAmount,
      interestRate: data.interestRate,
      dueDate: data.dueDate,
      notes: data.notes,
    }),
  update: (id: string, data: UpdateDebtRequest) =>
    api.put<Debt>(`/debts/${id}`, {
      name: data.name,
      type: debtTypeToInt[data.type],
      totalAmount: data.totalAmount,
      interestRate: data.interestRate,
      dueDate: data.dueDate,
      notes: data.notes,
    }),
  delete: (id: string) => api.delete<void>(`/debts/${id}`),
  getPayments: (debtId: string) => api.get<DebtPayment[]>(`/debts/${debtId}/payments`),
  registerPayment: (debtId: string, data: RegisterDebtPaymentRequest) =>
    api.post<DebtPayment>(`/debts/${debtId}/payments`, {
      amount: data.amount,
      paymentDate: data.paymentDate,
      isEarlyPayment: data.isEarlyPayment,
      discount: data.discount,
      notes: data.notes,
    }),
  getSnowball: () => api.get<SnowballStrategy>('/debts/snowball'),
}
