import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  Tag,
  ArrowRightLeft,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  HandCoins,
  PiggyBank,
  Target,
  Bell,
  BarChart3,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLogout } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { AvatarUser } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { cn } from '../lib/utils'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
  { label: 'Contas', path: '/accounts', Icon: Wallet },
  { label: 'Categorias', path: '/categories', Icon: Tag },
  { label: 'Transações', path: '/transactions', Icon: ArrowRightLeft },
  { label: 'Dívidas', path: '/debts', Icon: HandCoins },
  { label: 'Orçamento', path: '/budgets', Icon: PiggyBank },
  { label: 'Metas', path: '/financial-goals', Icon: Target },
  { label: 'Notificações', path: '/notifications', Icon: Bell },
  { label: 'Relatórios', path: '/reports', Icon: BarChart3 },
  { label: 'Perfil', path: '/profile', Icon: User },
]

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { mode, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar — Desktop */}
        <aside className="hidden md:flex flex-col fixed top-0 left-0 w-60 h-screen z-20 border-r border-border bg-card">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 px-4 h-14 border-b border-border flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Q</span>
            </div>
            <div>
              <span className="font-bold text-primary tracking-tight block leading-none">Quite-Up</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5 block">Finanças pessoais</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto pt-3">
            {navItems.map(({ label, path, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Icon size={17} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-border space-y-1">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
              <AvatarUser name={user?.name} size={30} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none">{user?.name}</p>
                <p className="text-xs text-subtle truncate mt-0.5">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-1 px-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggle}
                    className="flex-1"
                    aria-label={mode === 'light' ? 'Modo escuro' : 'Modo claro'}
                  >
                    {mode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{mode === 'light' ? 'Modo escuro' : 'Modo claro'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="flex-1"
                    aria-label="Sair"
                  >
                    <LogOut size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sair</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-10 flex-shrink-0">
            <Link to="/dashboard" className="font-bold text-primary text-lg tracking-tight">
              Quite-Up
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={toggle}>
                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
            </div>
          </header>

          {/* Mobile slide-down menu */}
          {mobileOpen && (
            <div className="md:hidden border-b border-border bg-card z-10">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <AvatarUser name={user?.name} size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <nav className="p-3 space-y-0.5">
                {navItems.map(({ label, path, Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent'
                      )
                    }
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="px-4 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => { logout.mutate(); setMobileOpen(false) }}
                  disabled={logout.isPending}
                  icon={<LogOut size={14} />}
                >
                  Sair
                </Button>
              </div>
            </div>
          )}

          {/* Page content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </div>
        </main>

        {/* Bottom nav — Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-border bg-card pb-safe">
          {navItems.map(({ label, path, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 no-underline text-xs py-2 px-3 min-w-0 flex-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <Icon size={20} />
              <span className="truncate max-w-16">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  )
}
