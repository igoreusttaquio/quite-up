import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Text,
  Avatar,
  Button,
  Tooltip,
  mergeClasses,
} from '@fluentui/react-components'
import {
  DashboardFilled,
  DashboardRegular,
  MoneyFilled,
  MoneyRegular,
  TagFilled,
  TagRegular,
  ArrowSyncFilled,
  ArrowSyncRegular,
  PersonFilled,
  PersonRegular,
  SignOutFilled,
  WeatherSunnyRegular,
  WeatherMoonRegular,
} from '@fluentui/react-icons'
import { useAuthStore } from '../store/authStore'
import { useLogout } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import type { FluentIcon } from '@fluentui/react-icons'

interface NavItem {
  label: string
  path: string
  icon: FluentIcon
  activeIcon: FluentIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard',   path: '/dashboard',    icon: DashboardRegular,  activeIcon: DashboardFilled },
  { label: 'Contas',      path: '/accounts',     icon: MoneyRegular,      activeIcon: MoneyFilled },
  { label: 'Categorias',  path: '/categories',   icon: TagRegular,        activeIcon: TagFilled },
  { label: 'Transações',  path: '/transactions', icon: ArrowSyncRegular,  activeIcon: ArrowSyncFilled },
  { label: 'Perfil',      path: '/profile',      icon: PersonRegular,     activeIcon: PersonFilled },
]

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const location = useLocation()
  const { mode, toggle } = useTheme()

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed h-full z-20 border-r border-subtle bg-surface">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-subtle">
          <Text size={600} weight="bold" className="text-brand tracking-tight">Quite-Up</Text>
          <Text size={100} className="text-muted block mt-0.5">Finanças pessoais</Text>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = isActive ? item.activeIcon : item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={mergeClasses(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors font-medium',
                  isActive
                    ? 'bg-brand-light text-brand'
                    : 'text-muted hover:bg-surface-3 hover:text-[var(--colorNeutralForeground1)]'
                )}
              >
                <Icon className="flex-shrink-0" style={{ fontSize: 18 }} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer: user + dark mode + logout */}
        <div className="p-2.5 border-t border-subtle space-y-1">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
            <Avatar name={user?.name} size={32} color="colorful" />
            <div className="flex-1 min-w-0">
              <Text size={200} weight="semibold" block truncate>{user?.name}</Text>
              <Text size={75} className="text-subtle" block truncate>{user?.email}</Text>
            </div>
          </div>
          <div className="flex items-center gap-1 px-1">
            <Tooltip content={mode === 'light' ? 'Modo escuro' : 'Modo claro'} relationship="label">
              <Button
                appearance="subtle"
                icon={mode === 'light' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />}
                onClick={toggle}
                size="small"
              />
            </Tooltip>
            <Tooltip content="Sair" relationship="label">
              <Button
                appearance="subtle"
                icon={<SignOutFilled />}
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                size="small"
              />
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-16 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-subtle bg-surface sticky top-0 z-10">
          <Text size={500} weight="bold" className="text-brand tracking-tight">Quite-Up</Text>
          <div className="flex items-center gap-1">
            <Button
              appearance="subtle"
              icon={mode === 'light' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />}
              onClick={toggle}
              size="small"
            />
            <Avatar name={user?.name} size={28} color="colorful" />
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom nav — Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-subtle bg-surface pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = isActive ? item.activeIcon : item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={mergeClasses(
                'flex flex-col items-center gap-0.5 no-underline text-xs py-2 px-3 min-w-0',
                isActive ? 'text-brand' : 'text-subtle'
              )}
            >
              <Icon style={{ fontSize: 20 }} />
              <span className="truncate max-w-16">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
