import { Bell, CheckCheck, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/button'
import { SkeletonLine } from '../components/Skeleton'
import { useAppToast } from '../hooks/useAppToast'
import type { Notification } from '../types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

const notificationIcon = (type: string) => {
  switch (type) {
    case 'success': return <CheckCircle size={18} className="text-income" />
    case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />
    case 'error': return <XCircle size={18} className="text-expense" />
    case 'info': return <Info size={18} className="text-blue-500" />
    default: return <Bell size={18} className="text-muted-foreground" />
  }
}

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const toast = useAppToast()

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0
  const sorted = [...(notifications ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync()
      toast.success('Todas as notificações marcadas como lidas')
    } catch { /* handled by query client */ }
  }

  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return
    try {
      await markRead.mutateAsync(notification.id)
    } catch { /* handled by query client */ }
  }

  return (
    <div>
      <PageHeader
        title="Notificações"
        action={
          unreadCount > 0 ? (
            <Button
              onClick={handleMarkAllRead}
              icon={<CheckCheck size={16} />}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? 'Marcando…' : `Marcar todas como lidas (${unreadCount})`}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <SkeletonLine className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonLine className="h-4 w-1/3" />
                  <SkeletonLine className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="Nenhuma notificação"
          description="Você não tem notificações no momento."
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleMarkRead(notification)}
              className={`card p-4 w-full text-left transition-colors cursor-pointer ${
                !notification.isRead ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
                <div className="flex-shrink-0 mt-0.5">
                  {notificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
