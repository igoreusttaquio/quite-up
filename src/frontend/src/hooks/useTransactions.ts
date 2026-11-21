import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppToast } from './useAppToast'
import { transactionsApi } from '../api/transactions'
import type { CreateTransactionRequest, UpdateTransactionRequest, TransactionFilters, TransactionPage } from '../types'

const TRANSACTIONS_KEY = ['transactions'] as const

function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
  queryClient.invalidateQueries({ queryKey: ['accounts'] })
  queryClient.invalidateQueries({ queryKey: ['budgets'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['reports'] })
  queryClient.invalidateQueries({ queryKey: ['debts'] })
}

export function useTransactions(filters?: TransactionFilters, enabled = true) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, filters] as const,
    queryFn: () => transactionsApi.list(filters).then((r) => r.data),
    enabled,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data).then((r) => r.data),
    onSuccess: () => invalidateRelated(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data).then((r) => r.data),
    onSuccess: () => invalidateRelated(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => invalidateRelated(queryClient),
  })
}

const UNDO_WINDOW_MS = 5000

/**
 * Exclusão com "Desfazer": some da lista na hora (otimista) e só é enviada ao servidor
 * depois de 5s. "Desfazer" cancela. Exclusões pendentes são enviadas se a tela desmontar.
 */
export function useUndoableDeleteTransaction() {
  const queryClient = useQueryClient()
  const deleteTransaction = useDeleteTransaction()
  const toast = useAppToast()
  const pending = useRef(new Map<string, number>())
  const mutateRef = useRef(deleteTransaction.mutate)
  mutateRef.current = deleteTransaction.mutate

  useEffect(() => {
    const timers = pending.current
    return () => {
      timers.forEach((timer, id) => {
        window.clearTimeout(timer)
        mutateRef.current(id)
      })
      timers.clear()
    }
  }, [])

  return (id: string, description: string) => {
    queryClient.setQueriesData<TransactionPage>({ queryKey: TRANSACTIONS_KEY }, (old) =>
      old && 'items' in old
        ? { ...old, items: old.items.filter((t) => t.id !== id), totalCount: Math.max(0, old.totalCount - 1) }
        : old
    )

    const timer = window.setTimeout(() => {
      pending.current.delete(id)
      mutateRef.current(id)
    }, UNDO_WINDOW_MS)
    pending.current.set(id, timer)

    toast.success(
      'Transação excluída',
      description,
      {
        label: 'Desfazer',
        onClick: () => {
          window.clearTimeout(timer)
          pending.current.delete(id)
          queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
        },
      },
      UNDO_WINDOW_MS
    )
  }
}
