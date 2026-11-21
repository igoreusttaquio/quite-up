import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'

const NOTIFICATIONS_KEY = ['notifications'] as const

export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, { unreadOnly }] as const,
    queryFn: () => notificationsApi.list(unreadOnly).then((r) => r.data),
  })
}

/** Aceita { count } (formato da API) ou número; qualquer outra coisa vira 0. */
function toCount(value: unknown): number {
  const raw = typeof value === 'object' && value !== null ? (value as { count?: unknown }).count : value
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/** Quantidade de notificações não lidas (sempre um número). */
export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'] as const,
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
    // `select` também normaliza valores antigos restaurados do cache offline.
    select: toCount,
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}
