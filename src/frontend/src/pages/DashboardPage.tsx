import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Tags, UserCircle } from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useTransactions } from '../hooks/useTransactions'
import { useAuthStore } from '../store/authStore'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { SkeletonCard } from '../components/Skeleton'
import type { TransactionType } from '../types'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const typeLabels: Record<TransactionType, string> = { Income: 'Receita', Expense: 'Despesa', Transfer: 'Transferência' }

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: accounts, isLoading: loadingAccounts } = useAccounts()
  const { data: recentResult, isLoading: loadingRecent } = useTransactions({ pageSize: 8 })

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const { data: monthlyResult } = useTransactions({ startDate, endDate, pageSize: 500 })
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)

  const totalBalance = useMemo(() => accounts?.filter((a) => a.isActive).reduce((s, a) => s + a.balance, 0) ?? 0, [accounts])
  const monthlyIncome = useMemo(() => monthlyResult?.items.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0) ?? 0, [monthlyResult])
  const monthlyExpenses = useMemo(() => monthlyResult?.items.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0) ?? 0, [monthlyResult])
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0
  const isLoading = loadingAccounts || loadingRecent

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground capitalize">{monthName}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Saldo Total" value={totalBalance} icon={<Wallet className="h-5 w-5" />} iconBg="bg-primary/10" iconColor="text-primary" />
          <StatCard label="Receitas do Mês" value={monthlyIncome} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Despesas do Mês" value={monthlyExpenses} icon={<TrendingDown className="h-5 w-5" />} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600 dark:text-red-400" />
        </div>
      )}

      {!isLoading && (monthlyIncome > 0 || monthlyExpenses > 0) && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Receitas vs Despesas</p>
            <p className={`text-xs ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {savingsRate >= 0 ? '↑' : '↓'} {Math.abs(savingsRate).toFixed(1)}% de economia
            </p>
          </div>
          <MonthProgressBar income={monthlyIncome} expenses={monthlyExpenses} />
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-sm font-semibold">Transações Recentes</p>
          <Link to="/transactions" className="text-xs text-primary hover:underline font-medium">Ver todas →</Link>
        </div>

        {loadingRecent ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/4 rounded bg-muted" />
                </div>
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : !recentResult?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-5">
            <ArrowLeftRight className="h-11 w-11 text-muted-foreground opacity-40" />
            <div className="space-y-1">
              <p className="text-base font-semibold">Nenhuma transação</p>
              <p className="text-xs text-muted-foreground">Registre sua primeira transação para começar</p>
            </div>
            <Link to="/transactions" className="text-xs text-primary hover:underline font-medium">Registrar transação →</Link>
          </div>
        ) : (
          <ul className="divide-y">
            {recentResult.items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                  tx.type === 'Income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : tx.type === 'Expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-primary/10 text-primary'
                }`}>
                  {tx.type === 'Income' ? '↑' : tx.type === 'Expense' ? '↓' : '⇄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description || typeLabels[tx.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categoryName && `${tx.categoryName} · `}{dateFormatter.format(new Date(tx.date))}
                  </p>
                </div>
                <CurrencyBadge value={tx.type === 'Expense' ? -tx.amount : tx.amount} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink to="/accounts" icon={<Wallet className="h-5 w-5" />} label="Contas" />
          <QuickLink to="/categories" icon={<Tags className="h-5 w-5" />} label="Categorias" />
          <QuickLink to="/transactions" icon={<ArrowLeftRight className="h-5 w-5" />} label="Transações" />
          <QuickLink to="/profile" icon={<UserCircle className="h-5 w-5" />} label="Perfil" />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, iconBg, iconColor }: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; iconColor: string
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-1.5"><CurrencyBadge value={value} /></p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col items-center gap-2.5 hover:bg-muted/50 transition-colors no-underline">
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </Link>
  )
}

function MonthProgressBar({ income, expenses }: { income: number; expenses: number }) {
  const total = income + expenses
  const incomeWidth = total > 0 ? Math.round((income / total) * 100) : 50
  const expenseWidth = 100 - incomeWidth
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-2.5">
      <div className="flex rounded-full overflow-hidden h-3 bg-muted">
        <div className="bg-emerald-500 dark:bg-emerald-400 transition-all duration-500" style={{ width: `${incomeWidth}%` }} />
        <div className="bg-red-500 dark:bg-red-400 transition-all duration-500" style={{ width: `${expenseWidth}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" /> {fmt.format(income)}
        </span>
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" /> {fmt.format(expenses)}
        </span>
      </div>
    </div>
  )
}
