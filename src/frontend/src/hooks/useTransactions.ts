import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppToast } from './useAppToast'
import { transactionsApi } from '../api/transactions'
import { mutationKeys, type CreateTransactionVariables } from '../lib/queryClient'
import { tempTransactionId } from '../lib/offline'
import type { Account, Category, Transaction, UpdateTransactionRequest, TransactionFilters, TransactionPage } from '../types'

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

/** Aplica `update` a todas as listas de transações em cache. */
function updateCachedLists(
  queryClient: ReturnType<typeof useQueryClient>,
  update: (page: TransactionPage) => TransactionPage
) {
  queryClient.setQueriesData<TransactionPage>({ queryKey: TRANSACTIONS_KEY }, (old) =>
    old && 'items' in old ? update(old) : old
  )
}

/**
 * Cria transação (com comprovante opcional). Otimista: aparece na hora na lista com um
 * id provisório; offline, fica na fila e é enviada ao voltar a conexão, sem duplicar
 * (clientRequestId).
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation<Transaction, Error, CreateTransactionVariables>({
    mutationKey: mutationKeys.createTransaction,
    onMutate: (vars) => {
      const accounts = queryClient.getQueryData<Account[]>(['accounts']) ?? []
      const categories = queryClient.getQueryData<Category[]>(['categories']) ?? []
      const temp: Transaction = {
        id: tempTransactionId(vars.clientRequestId),
        type: vars.type,
        amount: vars.amount,
        date: vars.date,
        description: vars.description,
        accountId: vars.accountId,
        accountName: accounts.find((a) => a.id === vars.accountId)?.name ?? '',
        categoryId: vars.categoryId,
        categoryName: categories.find((c) => c.id === vars.categoryId)?.name,
        destinationAccountId: vars.destinationAccountId,
        destinationAccountName: accounts.find((a) => a.id === vars.destinationAccountId)?.name,
        debtId: vars.debtId,
        createdAt: new Date().toISOString(),
      }
      // Só na 1ª página de cada lista (as demais se acertam ao sincronizar).
      updateCachedLists(queryClient, (page) =>
        page.page === 1 ? { ...page, items: [temp, ...page.items], totalCount: page.totalCount + 1 } : page
      )
    },
    onSettled: () => invalidateRelated(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation<Transaction, Error, { id: string; data: UpdateTransactionRequest }>({
    mutationKey: mutationKeys.updateTransaction,
    onMutate: ({ id, data }) => {
      const categories = queryClient.getQueryData<Category[]>(['categories']) ?? []
      const accounts = queryClient.getQueryData<Account[]>(['accounts']) ?? []
      updateCachedLists(queryClient, (page) => ({
        ...page,
        items: page.items.map((t) =>
          t.id !== id
            ? t
            : {
                ...t,
                amount: data.amount,
                date: data.date,
                description: data.description,
                categoryId: data.categoryId,
                categoryName: categories.find((c) => c.id === data.categoryId)?.name,
                ...(data.accountId && {
                  accountId: data.accountId,
                  accountName: accounts.find((a) => a.id === data.accountId)?.name ?? t.accountName,
                }),
                ...(data.destinationAccountId && {
                  destinationAccountId: data.destinationAccountId,
                  destinationAccountName:
                    accounts.find((a) => a.id === data.destinationAccountId)?.name ?? t.destinationAccountName,
                }),
              }
        ),
      }))
    },
    onSettled: () => invalidateRelated(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationKey: mutationKeys.deleteTransaction,
    onSettled: () => invalidateRelated(queryClient),
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
    updateCachedLists(queryClient, (page) => ({
      ...page,
      items: page.items.filter((t) => t.id !== id),
      totalCount: Math.max(0, page.totalCount - 1),
    }))

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
