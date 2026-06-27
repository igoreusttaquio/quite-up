import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'

const NOTIFICATIONS_KEY = ['notifications'] as const

export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, { unreadOnly }] as const,
    queryFn: () => notificationsApi.list(unreadOnly).then((r) => r.data),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'] as const,
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
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
