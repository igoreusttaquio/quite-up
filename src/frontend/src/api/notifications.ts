import { api } from '../lib/axios'
import type { Notification } from '../types'

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    api.get<Notification[]>('/notifications', { params: { unreadOnly } }),
  getUnreadCount: () => api.get<number>('/notifications/unread-count'),
  markRead: (id: string) => api.put<void>(`/notifications/${id}/read`),
  markAllRead: () => api.put<void>('/notifications/read-all'),
}
