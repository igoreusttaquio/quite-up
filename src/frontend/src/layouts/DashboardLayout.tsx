import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dropdown, DropdownTrigger, DropdownPopover, DropdownMenu, DropdownItem } from '@heroui/react'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../api/auth'
import { useMutation } from '@tanstack/react-query'

const navItems = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Contas', path: '/accounts', icon: '💰' },
  { label: 'Categorias', path: '/categories', icon: '🏷️' },
  { label: 'Transações', path: '/transactions', icon: '📝' },
]

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => { logout(); navigate('/login') },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent shrink-0"
          >
            Quite-Up
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Dropdown>
            <DropdownTrigger className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center shadow-md shadow-indigo-200 outline-none cursor-pointer">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </DropdownTrigger>
            <DropdownPopover placement="bottom end">
              <DropdownMenu
                disabledKeys={['info']}
                onAction={(key) => {
                  if (key === 'profile') navigate('/profile')
                  if (key === 'logout') logoutMutation.mutate()
                }}
              >
                <DropdownItem id="info" textValue="user info">
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </DropdownItem>
                <DropdownItem id="profile">👤 Perfil</DropdownItem>
                <DropdownItem id="logout">🚪 Sair</DropdownItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
