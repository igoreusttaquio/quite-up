import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Text,
  Avatar,
  Button,
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
} from '@fluentui/react-icons'
import { useAuthStore } from '../store/authStore'
import { useLogout } from '../hooks/useAuth'
import type { FluentIcon } from '@fluentui/react-icons'

interface NavItem {
  label: string
  path: string
  icon: FluentIcon
  activeIcon: FluentIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardRegular, activeIcon: DashboardFilled },
  { label: 'Contas', path: '/accounts', icon: MoneyRegular, activeIcon: MoneyFilled },
  { label: 'Categorias', path: '/categories', icon: TagRegular, activeIcon: TagFilled },
  { label: 'Transações', path: '/transactions', icon: ArrowSyncRegular, activeIcon: ArrowSyncFilled },
  { label: 'Perfil', path: '/profile', icon: PersonRegular, activeIcon: PersonFilled },
]

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const location = useLocation()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--colorNeutralBackground2)' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 fixed h-full z-10 border-r" style={{ backgroundColor: 'var(--colorNeutralBackground1)', borderColor: 'var(--colorNeutralStroke1)' }}>
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--colorNeutralStroke1)' }}>
          <Text size={600} weight="bold" style={{ color: 'var(--colorBrandForeground1)' }}>
            Quite-Up
          </Text>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = isActive ? item.activeIcon : item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={mergeClasses(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors',
                )}
                style={{
                  color: isActive ? 'var(--colorBrandForeground1)' : 'var(--colorNeutralForeground2)',
                  backgroundColor: isActive ? 'var(--colorBrandBackground2)' : 'transparent',
                }}
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--colorNeutralStroke1)' }}>
          <Avatar name={user?.name} size={32} />
          <div className="flex-1 min-w-0">
            <Text size={200} weight="semibold" block truncate>
              {user?.name}
            </Text>
            <Text size={100} style={{ color: 'var(--colorNeutralForeground3)' }} block truncate>
              {user?.email}
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<SignOutFilled />}
            onClick={() => logout.mutate()}
            title="Sair"
          />
        </div>
      </aside>

      {/* Main content area (desktop with sidebar offset) */}
      <main className="flex-1 md:ml-60 pb-16 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--colorNeutralBackground1)', borderColor: 'var(--colorNeutralStroke1)' }}>
          <Text size={500} weight="bold" style={{ color: 'var(--colorBrandForeground1)' }}>
            Quite-Up
          </Text>
          <Avatar name={user?.name} size={28} />
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation - Mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t py-2"
        style={{ backgroundColor: 'var(--colorNeutralBackground1)', borderColor: 'var(--colorNeutralStroke1)' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = isActive ? item.activeIcon : item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 no-underline text-xs"
              style={{ color: isActive ? 'var(--colorBrandForeground1)' : 'var(--colorNeutralForeground3)' }}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
