import { Link } from 'react-router-dom'
import { Wallet, ArrowUp, ArrowDown, ArrowRightLeft, Building2, Tag, User } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { useAuthStore } from '../store/authStore'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { SkeletonCard } from '../components/Skeleton'
import { TransactionTypeIcon } from '../components/TransactionTypeIcon'
import type { TransactionType } from '../types'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

const typeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: dashboard, isLoading } = useDashboard()

  const now = new Date()
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)

  const totalBalance = dashboard?.totalBalance ?? 0
  const monthlyIncome = dashboard?.monthlyIncome ?? 0
  const monthlyExpenses = dashboard?.monthlyExpenses ?? 0
  const recentTransactions = dashboard?.recentTransactions ?? []

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Olá, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground capitalize mt-0.5">{monthName}</p>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Saldo Total"
            value={totalBalance}
            icon={<Wallet size={22} />}
            iconBg="bg-brand-light"
            iconColor="text-primary"
          />
          <StatCard
            label="Receitas do Mês"
            value={monthlyIncome}
            icon={<ArrowUp size={22} />}
            iconBg="bg-income-subtle"
            iconColor="text-income"
          />
          <StatCard
            label="Despesas do Mês"
            value={monthlyExpenses}
            icon={<ArrowDown size={22} />}
            iconBg="bg-expense-subtle"
            iconColor="text-expense"
          />
        </div>
      )}

      {/* Income vs Expense bar */}
      {!isLoading && (monthlyIncome > 0 || monthlyExpenses > 0) && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold">Receitas vs Despesas</span>
            <span className={`text-sm font-medium ${savingsRate >= 0 ? 'text-income' : 'text-expense'}`}>
              {savingsRate >= 0 ? '↑' : '↓'} {Math.abs(savingsRate).toFixed(1)}% de economia
            </span>
          </div>
          <MonthProgressBar income={monthlyIncome} expenses={monthlyExpenses} />
        </div>
      )}

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <span className="text-base font-semibold">Transações Recentes</span>
          <Link to="/transactions" className="text-sm text-primary hover:underline font-medium transition-colors">
            Ver todas →
          </Link>
        </div>

        {isLoading ? (
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
        ) : !recentTransactions.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-5">
            <ArrowRightLeft size={44} className="text-muted-foreground opacity-40" />
            <div className="space-y-1">
              <p className="text-base font-semibold">Nenhuma transação</p>
              <p className="text-sm text-muted-foreground">Registre sua primeira transação para começar</p>
            </div>
            <Link to="/transactions" className="text-sm text-primary hover:underline font-medium">
              Registrar transação →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-subtle">
            {recentTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                <TransactionTypeIcon type={tx.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {tx.description || typeLabels[tx.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categoryName && `${tx.categoryName} · `}
                    {dateFormatter.format(new Date(tx.date + 'T12:00:00'))}
                  </p>
                </div>
                <CurrencyBadge value={tx.type === 'Expense' ? -tx.amount : tx.amount} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick links */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink to="/accounts" icon={<Building2 size={22} />} label="Contas" />
          <QuickLink to="/categories" icon={<Tag size={22} />} label="Categorias" />
          <QuickLink to="/transactions" icon={<ArrowRightLeft size={22} />} label="Transações" />
          <QuickLink to="/profile" icon={<User size={22} />} label="Perfil" />
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-1.5">
            <CurrencyBadge value={value} size={600} />
          </div>
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
    <Link
      to={to}
      className="card p-4 flex flex-col items-center gap-2.5 hover:bg-muted/50 transition-colors no-underline"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
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
        <div
          className="bg-income transition-all duration-500"
          style={{ width: `${incomeWidth}%` }}
        />
        <div
          className="bg-expense transition-all duration-500"
          style={{ width: `${expenseWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1 text-income font-medium">
          <ArrowUp size={12} /> {fmt.format(income)}
        </span>
        <span className="flex items-center gap-1 text-expense font-medium">
          <ArrowDown size={12} /> {fmt.format(expenses)}
        </span>
      </div>
    </div>
  )
}
