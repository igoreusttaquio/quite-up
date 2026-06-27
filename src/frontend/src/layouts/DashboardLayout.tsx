import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Wallet, Tags, ArrowLeftRight, UserCircle, LogOut, Sun, Moon } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { useAuthStore } from '../store/authStore'
import { useLogout } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { cn } from '../lib/utils'

interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { label: 'Dashboard',   path: '/dashboard',    icon: LayoutDashboard },
  { label: 'Contas',      path: '/accounts',     icon: Wallet },
  { label: 'Categorias',  path: '/categories',   icon: Tags },
  { label: 'Transações',  path: '/transactions', icon: ArrowLeftRight },
  { label: 'Perfil',      path: '/profile',      icon: UserCircle },
]

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const location = useLocation()
  const { mode, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top navbar — Desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-30 h-14 items-center justify-between px-5 border-b bg-background/80 backdrop-blur-md">
        <Link to="/dashboard" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">Q</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight leading-none">Quite-Up</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Finanças pessoais</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggle} aria-label={mode === 'light' ? 'Modo escuro' : 'Modo claro'}>
                {mode === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mode === 'light' ? 'Modo escuro' : 'Modo claro'}</TooltipContent>
          </Tooltip>
          <Link to="/profile" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors no-underline">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden lg:block">{user?.name}</span>
          </Link>
        </div>
      </header>

      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col fixed top-14 left-0 w-64 h-[calc(100vh-3.5rem)] z-20 border-r bg-card">
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto pt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer: user + logout */}
        <div className="p-3 border-t">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => logout.mutate()} disabled={logout.isPending}>
                  <LogOut className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-0 md:pt-14 pb-16 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
          <p className="text-lg font-bold text-primary tracking-tight">Quite-Up</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle}>
              {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t bg-background pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 no-underline text-xs py-2 px-3 min-w-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-16">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
