import { QueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { transactionsApi } from '../api/transactions'
import { attachmentsApi } from '../api/attachments'
import type { CreateTransactionRequest, UpdateTransactionRequest } from '../types'

const DAY = 24 * 60 * 60 * 1000

/** Erro de rede (sem resposta do servidor): vale tentar de novo. */
const isNetworkError = (error: unknown) => !(error as AxiosError)?.response

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      // Mantém o cache (persistido no IndexedDB) por uma semana para uso offline.
      gcTime: 7 * DAY,
    },
    mutations: {
      // Sem conexão, mutações ficam pausadas e são retomadas ao voltar a internet.
      networkMode: 'online',
      retry: (failureCount, error) => isNetworkError(error) && failureCount < 3,
    },
  },
})

/*
 * Mutações que funcionam offline. As funções ficam aqui (e não só nos hooks) para que
 * mutações pausadas restauradas do IndexedDB, depois de recarregar o app, saibam o que executar.
 */
export const mutationKeys = {
  createTransaction: ['transactions', 'create'] as const,
  updateTransaction: ['transactions', 'update'] as const,
  deleteTransaction: ['transactions', 'delete'] as const,
  uploadAttachment: ['attachments', 'upload'] as const,
  deleteAttachment: ['attachments', 'delete'] as const,
}

export type CreateTransactionVariables = CreateTransactionRequest & {
  /** Chave de idempotência: reenvios não duplicam a transação. */
  clientRequestId: string
  /** Comprovante enviado logo após criar (funciona offline: o arquivo fica no IndexedDB). */
  file?: File
}

queryClient.setMutationDefaults(mutationKeys.createTransaction, {
  mutationFn: async ({ file, ...data }: CreateTransactionVariables) => {
    const created = (await transactionsApi.create(data)).data
    if (file) await attachmentsApi.upload(created.id, file)
    return created
  },
})

queryClient.setMutationDefaults(mutationKeys.updateTransaction, {
  mutationFn: ({ id, data }: { id: string; data: UpdateTransactionRequest }) =>
    transactionsApi.update(id, data).then((r) => r.data),
})

queryClient.setMutationDefaults(mutationKeys.deleteTransaction, {
  // Já excluída (ex.: reenvio após perda de conexão) conta como sucesso.
  mutationFn: (id: string) =>
    transactionsApi.delete(id).catch((error: AxiosError) => {
      if (error.response?.status === 404) return
      throw error
    }),
})

queryClient.setMutationDefaults(mutationKeys.uploadAttachment, {
  mutationFn: ({ transactionId, file }: { transactionId: string; file: File }) =>
    attachmentsApi.upload(transactionId, file).then((r) => r.data),
})

queryClient.setMutationDefaults(mutationKeys.deleteAttachment, {
  mutationFn: (transactionId: string) =>
    attachmentsApi.deleteByTransaction(transactionId).catch((error: AxiosError) => {
      if (error.response?.status === 404) return
      throw error
    }),
})

/** Invalida tudo o que depende de transações (após sincronizar). */
export function invalidateTransactionData(client: QueryClient = queryClient) {
  for (const key of ['transactions', 'accounts', 'budgets', 'dashboard', 'reports', 'debts']) {
    client.invalidateQueries({ queryKey: [key] })
  }
}
