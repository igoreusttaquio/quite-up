import { useState } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../api/auth'
import { useMutation } from '@tanstack/react-query'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Contas', path: '/accounts' },
  { label: 'Categorias', path: '/categories' },
  { label: 'Transações', path: '/transactions' },
]

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => { logout(); navigate('/login') },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-indigo-600">Quite-Up</Link>
            <nav className="hidden sm:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}
                  className={`text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center hover:bg-indigo-200 transition-colors">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  <button onClick={() => { navigate('/profile'); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Perfil</button>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={() => { logoutMutation.mutate(); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sair</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6"><Outlet /></main>
    </div>
  )
}
