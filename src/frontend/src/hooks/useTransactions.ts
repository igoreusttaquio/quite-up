import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi } from '../api/transactions'
import type { CreateTransactionRequest, UpdateTransactionRequest, TransactionFilters } from '../types'

const TRANSACTIONS_KEY = ['transactions'] as const

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, filters] as const,
    queryFn: () => transactionsApi.list(filters).then((r) => r.data),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}
