import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  MoreHorizontal,
  Plus,
  Moon,
  Sun,
  FoldVertical,
  UnfoldVertical,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useNotifications'
import { useTheme } from '../../context/ThemeContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useNewTransaction } from '../../context/NewTransactionContext'
import { useCurrentPrimaryAction } from '../../context/PrimaryActionContext'
import { ResponsiveDialog } from '../ui/responsive-dialog'
import { UserAvatar } from '../UserAvatar'
import { cn } from '../../lib/utils'
import type { SidebarNavItem } from './DesktopSidebar'

const primaryItems: SidebarNavItem[] = [
  { label: 'Início', path: '/dashboard', Icon: LayoutDashboard },
  { label: 'Transações', path: '/transactions', Icon: ArrowRightLeft },
  { label: 'Contas', path: '/accounts', Icon: Wallet },
]

const PRIMARY_PATHS = new Set(primaryItems.map((i) => i.path))
const NOTIFICATIONS_PATH = '/notifications'

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (typeof count !== 'number' || !(count > 0)) return null
  return (
    <span
      className={cn(
        'flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-expense px-1 text-[10px] font-bold leading-none text-white',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** Mantém o contador de não lidas também no ícone do app instalado (quando suportado). */
function useAppBadge(count: number) {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }
    if (!nav.setAppBadge) return
    if (count > 0) nav.setAppBadge(count).catch(() => {})
    else nav.clearAppBadge?.().catch(() => {})
  }, [count])
}

/** Cabeçalho do celular: só a marca. Tudo o mais fica na barra inferior / "Mais". */
export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-10 w-full flex-shrink-0 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center px-[max(1rem,env(safe-area-inset-left))]">
        <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          Quite-Up
        </Link>
      </div>
    </header>
  )
}

function BottomItem({ label, path, Icon, badge }: SidebarNavItem & { badge?: number }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'group flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] no-underline transition-colors',
          isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
        )
      }
    >
      <span className="relative flex h-7 w-12 items-center justify-center rounded-full transition-colors group-aria-[current=page]:bg-brand-light">
        <Icon size={20} />
        {badge ? <CountBadge count={badge} className="absolute -right-0.5 -top-1" /> : null}
      </span>
      <span className="w-full truncate text-center">{label}</span>
    </NavLink>
  )
}

export function BottomNav({ moreItems }: { moreItems: SidebarNavItem[] }) {
  const { open: openNewTransaction } = useNewTransaction()
  // Ação principal da página atual (ex.: "Nova Dívida"); padrão: nova transação.
  const pageAction = useCurrentPrimaryAction()
  const plusLabel = pageAction?.label ?? 'Nova transação'
  const onPlus = () => (pageAction ? pageAction.onClick() : openNewTransaction())
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const { data: unread = 0 } = useUnreadCount()
  useAppBadge(unread)

  // "Mais" fica ativo quando a tela atual é uma das que ele contém.
  const moreActive = !PRIMARY_PATHS.has('/' + location.pathname.split('/')[1])

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)]"
      >
        {primaryItems.slice(0, 2).map((item) => (
          <BottomItem key={item.path} {...item} />
        ))}
        <div className="flex min-h-[52px] flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onPlus}
            aria-label={plusLabel}
            title={plusLabel}
            className="flex h-11 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <Plus size={22} />
          </button>
        </div>
        {primaryItems.slice(2).map((item) => (
          <BottomItem key={item.path} {...item} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={unread > 0 ? `Mais (${unread} notificações não lidas)` : 'Mais'}
          aria-haspopup="dialog"
          className={cn(
            'group flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] transition-colors cursor-pointer',
            moreActive ? 'font-semibold text-primary' : 'text-muted-foreground'
          )}
        >
          <span className={cn('relative flex h-7 w-12 items-center justify-center rounded-full', moreActive && 'bg-brand-light')}>
            <MoreHorizontal size={20} />
            <CountBadge count={unread} className="absolute -right-0.5 -top-1" />
          </span>
          <span className="w-full truncate text-center">Mais</span>
        </button>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} items={moreItems} unread={unread} />
    </>
  )
}

function MoreSheet({
  open,
  onOpenChange,
  items,
  unread,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SidebarNavItem[]
  unread: number
}) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { mode, toggle: toggleTheme } = useTheme()
  const { density, toggleDensity } = usePreferences()
  const close = () => onOpenChange(false)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Mais opções" hideTitle size="sm">
      <div className="flex items-center gap-3">
        <UserAvatar name={user?.name} size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <nav aria-label="Outras telas" className="-mx-1 grid grid-cols-1">
        {items.map(({ label, path, Icon }) => (
          <MoreLink key={path} to={path} label={label} Icon={Icon} onNavigate={close} badge={path === NOTIFICATIONS_PATH ? unread : 0} />
        ))}
      </nav>

      <div className="-mx-1 border-t border-border pt-3">
        <MoreAction
          Icon={mode === 'light' ? Moon : Sun}
          label={mode === 'light' ? 'Tema escuro' : 'Tema claro'}
          onClick={toggleTheme}
        />
        <MoreAction
          Icon={density === 'compact' ? UnfoldVertical : FoldVertical}
          label={density === 'compact' ? 'Modo confortável' : 'Modo compacto'}
          onClick={toggleDensity}
        />
        <MoreAction
          Icon={LogOut}
          label="Sair"
          danger
          onClick={() => {
            close()
            logout.mutate()
          }}
        />
      </div>
    </ResponsiveDialog>
  )
}

const rowClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function MoreLink({
  to,
  label,
  Icon,
  onNavigate,
  badge,
}: {
  to: string
  label: string
  Icon: LucideIcon
  onNavigate: () => void
  badge: number
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(rowClass, isActive ? 'bg-brand-light text-primary' : 'text-foreground hover:bg-accent active:bg-accent')
      }
    >
      <Icon size={20} className="flex-shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      <CountBadge count={badge} />
      <ChevronRight size={16} className="flex-shrink-0 text-muted-foreground" />
    </NavLink>
  )
}

function MoreAction({
  Icon,
  label,
  onClick,
  danger,
}: {
  Icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        rowClass,
        'cursor-pointer',
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-accent active:bg-accent'
      )}
    >
      <Icon size={20} className={cn('flex-shrink-0', danger ? 'text-destructive' : 'text-muted-foreground')} />
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}
