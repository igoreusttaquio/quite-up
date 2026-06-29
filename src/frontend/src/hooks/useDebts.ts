import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { debtsApi } from '../api/debts'
import type { CreateDebtRequest, UpdateDebtRequest, RegisterDebtPaymentRequest } from '../types'

const DEBTS_KEY = ['debts'] as const

export function useDebts(isPaid?: boolean) {
  return useQuery({
    queryKey: [...DEBTS_KEY, { isPaid }] as const,
    queryFn: () => debtsApi.list(isPaid).then((r) => r.data),
  })
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: [...DEBTS_KEY, id] as const,
    queryFn: () => debtsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDebtRequest) => debtsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
  })
}

export function useUpdateDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDebtRequest }) =>
      debtsApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
  })
}

export function useDeleteDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => debtsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
  })
}

export function useDebtPayments(debtId: string) {
  return useQuery({
    queryKey: [...DEBTS_KEY, debtId, 'payments'] as const,
    queryFn: () => debtsApi.getPayments(debtId).then((r) => r.data),
    enabled: !!debtId,
  })
}

export function useRegisterDebtPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: RegisterDebtPaymentRequest }) =>
      debtsApi.registerPayment(debtId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useSnowballStrategy() {
  return useQuery({
    queryKey: [...DEBTS_KEY, 'snowball'] as const,
    queryFn: () => debtsApi.getSnowball().then((r) => r.data),
  })
}
