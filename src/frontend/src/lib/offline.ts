import { useSyncExternalStore } from 'react'
import { onlineManager, useMutationState } from '@tanstack/react-query'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'
import { mutationKeys } from './queryClient'

const STORE_KEY = 'quite-up-query-cache'

/*
 * Persister no IndexedDB usando structured clone (sem JSON): mutações pausadas com
 * arquivos (File/Blob de comprovantes) sobrevivem a recarregar o app.
 * Gravação limitada a 1x por segundo.
 */
let pending: PersistedClient | null = null
let timer: number | undefined

export const idbPersister: Persister = {
  persistClient: (client) => {
    pending = client
    if (timer !== undefined) return
    timer = window.setTimeout(() => {
      timer = undefined
      const snapshot = pending
      pending = null
      if (snapshot) set(STORE_KEY, snapshot).catch(() => {})
    }, 1000)
  },
  restoreClient: () => get<PersistedClient>(STORE_KEY),
  removeClient: () => del(STORE_KEY),
}

// App indo para segundo plano/fechando: grava na hora o que estiver esperando o throttle
// (no celular, fechar o app logo após uma ação offline não pode perder a fila).
function flushNow() {
  if (timer !== undefined) {
    window.clearTimeout(timer)
    timer = undefined
  }
  const snapshot = pending
  pending = null
  if (snapshot) set(STORE_KEY, snapshot).catch(() => {})
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushNow)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushNow()
  })
}

/** Apaga o cache local (ex.: ao sair da conta). */
export function clearPersistedCache() {
  pending = null
  return del(STORE_KEY).catch(() => {})
}

export const isOnline = () => onlineManager.isOnline()

export function useOnline() {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true
  )
}

/** Id provisório de uma transação criada offline (até sincronizar). */
export const tempTransactionId = (clientRequestId: string) => `tmp:${clientRequestId}`
export const isTempTransactionId = (id: string) => id.startsWith('tmp:')

const sameKey = (a: readonly unknown[] | undefined, b: readonly unknown[]) =>
  !!a && a.length === b.length && a.every((v, i) => v === b[i])

/**
 * Ids de transações com alterações ainda não enviadas ao servidor
 * (mutações pausadas por falta de conexão).
 */
export function usePendingSyncIds(): Set<string> {
  const ids = useMutationState({
    filters: { status: 'pending', predicate: (m) => m.state.isPaused },
    select: (m) => {
      const key = m.options.mutationKey
      const vars = m.state.variables as Record<string, unknown> | string | undefined
      if (sameKey(key, mutationKeys.updateTransaction)) return (vars as { id: string }).id
      if (sameKey(key, mutationKeys.deleteTransaction)) return vars as string
      if (sameKey(key, mutationKeys.uploadAttachment)) return (vars as { transactionId: string }).transactionId
      if (sameKey(key, mutationKeys.deleteAttachment)) return vars as string
      if (sameKey(key, mutationKeys.createTransaction))
        return tempTransactionId((vars as { clientRequestId: string }).clientRequestId)
      return undefined
    },
  })
  return new Set(ids.filter((id): id is string => !!id))
}

/** Quantidade de alterações aguardando sincronização. */
export function usePendingSyncCount(): number {
  return useMutationState({ filters: { status: 'pending', predicate: (m) => m.state.isPaused } }).length
}
