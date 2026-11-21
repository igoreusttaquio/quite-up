import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Wallet,
  Tag,
  ArrowRightLeft,
  User,
  HandCoins,
  PiggyBank,
  Target,
  Bell,
  BarChart3,
} from 'lucide-react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { TooltipProvider } from '../components/ui/tooltip'
import { cn } from '../lib/utils'
import { NewTransactionProvider } from '../context/NewTransactionContext'
import { TransactionActionsProvider } from '../context/TransactionActionsContext'
import { usePreferences } from '../context/PreferencesContext'
import {
  DesktopSidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  type SidebarNavItem,
} from '../components/layout/DesktopSidebar'
import { BottomNav, MobileHeader } from '../components/layout/MobileNav'
import { OfflineBanner } from '../components/OfflineBanner'

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

// No celular a barra é simétrica: Início, Transações | + | Contas, Mais. O resto vai para "Mais".
const MOBILE_BAR_PATHS = new Set(['/dashboard', '/transactions', '/accounts'])
const mobileMoreItems = navItems.filter((item) => !MOBILE_BAR_PATHS.has(item.path))

export function DashboardLayout() {
  return (
    <NewTransactionProvider>
      <TransactionActionsProvider>
        <DashboardShell />
      </TransactionActionsProvider>
    </NewTransactionProvider>
  )
}

function DashboardShell() {
  const { sidebarCollapsed: collapsed } = usePreferences()
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-dvh w-full bg-background">
        <DesktopSidebar items={navItems} />

        <main
          className={cn(
            'flex min-h-dvh w-full min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out',
            collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
          )}
        >
          <MobileHeader />
          <OfflineBanner />

          {/* Conteúdo: no celular, espaço para a barra inferior + safe area */}
          <div
            className={cn(
              'w-full min-w-0 flex-1 p-4 md:p-6 lg:p-8',
              'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 lg:pb-8',
              'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6 lg:px-8'
            )}
          >
            <div className="mx-auto w-full min-w-0 max-w-[2200px]">
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

        <BottomNav moreItems={mobileMoreItems} />
      </div>
    </TooltipProvider>
  )
}
