import { useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLogout } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { UserAvatar } from '../components/UserAvatar'
import { Button } from '../components/ui/button'
import { TooltipProvider } from '../components/ui/tooltip'
import { cn } from '../lib/utils'
import { NewTransactionProvider, useNewTransaction } from '../context/NewTransactionContext'
import { usePreferences } from '../context/PreferencesContext'
import {
  DesktopSidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  type SidebarNavItem,
} from '../components/layout/DesktopSidebar'

const navItems: SidebarNavItem[] = [
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

// Barra inferior (mobile): 2 itens + botão "Nova transação" no centro + 1 item + "Mais".
const bottomNavLeft = [
  { label: 'Início', path: '/dashboard', Icon: LayoutDashboard },
  { label: 'Transações', path: '/transactions', Icon: ArrowRightLeft },
]
const bottomNavRight = [{ label: 'Contas', path: '/accounts', Icon: Wallet }]

function BottomNavLink({ label, path, Icon }: { label: string; path: string; Icon: typeof Wallet }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 no-underline text-xs py-2 px-1.5 min-w-0 flex-1 overflow-hidden transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )
      }
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className="w-full truncate text-center">{label}</span>
    </NavLink>
  )
}

/** Botão central da barra inferior: abre o formulário de nova transação sem sair da tela. */
function NewTransactionNavButton() {
  const { open } = useNewTransaction()
  return (
    <div className="flex flex-1 items-center justify-center">
      <button
        type="button"
        onClick={() => open()}
        aria-label="Nova transação"
        title="Nova transação"
        className="flex h-10 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus size={22} />
      </button>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <NewTransactionProvider>
      <DashboardShell />
    </NewTransactionProvider>
  )
}

function DashboardShell() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { mode, toggle } = useTheme()
  const { sidebarCollapsed: collapsed } = usePreferences()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen w-full bg-background flex">
        <DesktopSidebar items={navItems} />

        {/* Main content */}
        <main
          className={cn(
            'flex-1 min-w-0 w-full flex flex-col min-h-screen transition-[margin] duration-200 ease-in-out',
            collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
          )}
        >
          {/* Mobile header */}
          <header className="md:hidden w-full flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-10 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-primary text-lg tracking-tight">
              <img src="/favicon.svg" alt="Quite-Up" className="h-7 w-7" />
              Quite-Up
            </Link>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggle}
                aria-label={mode === 'light' ? 'Tema escuro' : 'Tema claro'}
              >
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

          {/* Mobile slide-down menu — fixed overlay */}
          {mobileOpen && (
            <div className="md:hidden w-full fixed inset-0 top-14 z-20 flex flex-col">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileOpen(false)}
              />
              {/* Menu panel */}
              <div className="relative w-full bg-card border-b border-border overflow-y-auto max-h-[calc(100vh-3.5rem-4rem)]">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <UserAvatar name={user?.name} size={36} />
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
            </div>
          )}

          {/* Page content */}
          <div className="flex-1 min-w-0 w-full p-4 pb-24 md:p-6 lg:p-8">
            <div className="w-full min-w-0 max-w-[2200px] mx-auto">
              <ErrorBoundary>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </div>
          </div>
        </main>

        {/* Bottom nav — Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 w-full max-w-full flex justify-around border-t border-border bg-card pb-safe">
          {bottomNavLeft.map((item) => (
            <BottomNavLink key={item.path} {...item} />
          ))}
          <NewTransactionNavButton />
          {bottomNavRight.map((item) => (
            <BottomNavLink key={item.path} {...item} />
          ))}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              'flex flex-col items-center gap-0.5 text-xs py-2 px-1.5 min-w-0 flex-1 overflow-hidden transition-colors',
              mobileOpen ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal size={20} className="flex-shrink-0" />
            <span className="w-full truncate text-center">Mais</span>
          </button>
        </nav>
      </div>
    </TooltipProvider>
  )
}
