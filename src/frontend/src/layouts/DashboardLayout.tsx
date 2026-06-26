import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Navbar, NavbarBrand, NavbarContent, NavbarItem,
  NavbarMenuToggle, NavbarMenu, NavbarMenuItem,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from '@heroui/react'
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
      <Navbar
        isBordered
        classNames={{
          wrapper: 'max-w-7xl px-4',
          base: 'bg-white/80 backdrop-blur-md',
        }}
      >
        <NavbarContent>
          <NavbarMenuToggle className="sm:hidden" />
          <NavbarBrand>
            <Link
              to="/"
              className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
            >
              Quite-Up
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-1" justify="center">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <NavbarItem key={item.path} isActive={active}>
                <Link
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
              </NavbarItem>
            )
          })}
        </NavbarContent>

        <NavbarContent justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center shadow-md shadow-indigo-200 outline-none">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu" disabledKeys={['info']}>
              <DropdownItem key="info" textValue="user info" className="cursor-default opacity-100">
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </DropdownItem>
              <DropdownItem key="profile" onPress={() => navigate('/profile')}>
                👤 Perfil
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={() => logoutMutation.mutate()}>
                🚪 Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>

        <NavbarMenu>
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <NavbarMenuItem key={item.path}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center gap-2 py-2 text-sm font-medium ${
                    active ? 'text-indigo-600' : 'text-gray-600'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </NavbarMenuItem>
            )
          })}
        </NavbarMenu>
      </Navbar>

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
