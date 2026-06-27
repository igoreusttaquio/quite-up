import { useMemo } from 'react'
import { Text } from '@fluentui/react-components'
import {
  MoneyRegular,
  ArrowUpFilled,
  ArrowDownFilled,
  ArrowSyncRegular,
  DataFunnelFilled,
  BuildingBankFilled,
  PersonFilled,
} from '@fluentui/react-icons'
import { Link } from 'react-router-dom'
import { useAccounts } from '../hooks/useAccounts'
import { useTransactions } from '../hooks/useTransactions'
import { useAuthStore } from '../store/authStore'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { SkeletonCard } from '../components/Skeleton'
import type { TransactionType } from '../types'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

const typeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: accounts, isLoading: loadingAccounts } = useAccounts()
  const { data: recentResult, isLoading: loadingRecent } = useTransactions({ pageSize: 8 })

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStr = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const startDate = `${year}-${monthStr}-01`
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const { data: monthlyResult } = useTransactions({ startDate, endDate, pageSize: 500 })

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)

  const totalBalance = useMemo(
    () => accounts?.filter((a) => a.isActive).reduce((sum, a) => sum + a.balance, 0) ?? 0,
    [accounts]
  )

  const monthlyIncome = useMemo(
    () => monthlyResult?.items.filter((t) => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0) ?? 0,
    [monthlyResult]
  )

  const monthlyExpenses = useMemo(
    () => monthlyResult?.items.filter((t) => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0) ?? 0,
    [monthlyResult]
  )

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100)
    : 0

  const isLoading = loadingAccounts || loadingRecent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Text as="h1" size={800} weight="semibold" block className="tracking-tight">
          Olá, {user?.name?.split(' ')[0]}
        </Text>
        <Text size={300} className="text-muted capitalize">{monthName}</Text>
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
            icon={<MoneyRegular style={{ fontSize: 22 }} />}
            iconBg="bg-brand-light"
            iconColor="text-brand"
          />
          <StatCard
            label="Receitas do Mês"
            value={monthlyIncome}
            icon={<ArrowUpFilled style={{ fontSize: 22 }} />}
            iconBg="bg-[var(--colorPaletteGreenBackground2)]"
            iconColor="text-income"
          />
          <StatCard
            label="Despesas do Mês"
            value={monthlyExpenses}
            icon={<ArrowDownFilled style={{ fontSize: 22 }} />}
            iconBg="bg-[var(--colorPaletteRedBackground2)]"
            iconColor="text-expense"
          />
        </div>
      )}

      {/* Income vs Expense bar + savings rate */}
      {!isLoading && (monthlyIncome > 0 || monthlyExpenses > 0) && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <Text size={400} weight="semibold">Receitas vs Despesas</Text>
            <Text size={200} className={savingsRate >= 0 ? 'text-income' : 'text-expense'}>
              {savingsRate >= 0 ? '↑' : '↓'} {Math.abs(savingsRate).toFixed(1)}% de economia
            </Text>
          </div>
          <MonthProgressBar income={monthlyIncome} expenses={monthlyExpenses} />
        </div>
      )}

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <Text size={400} weight="semibold">Transações Recentes</Text>
          <Link to="/transactions" className="text-sm text-brand hover:underline font-medium transition-colors">
            Ver todas →
          </Link>
        </div>

        {loadingRecent ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-surface-3 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-1/3 rounded bg-surface-3" />
                  <div className="h-3 w-1/4 rounded bg-surface-3" />
                </div>
                <div className="h-4 w-20 rounded bg-surface-3" />
              </div>
            ))}
          </div>
        ) : !recentResult?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-5">
            <ArrowSyncRegular style={{ fontSize: 44 }} className="text-subtle opacity-40" />
            <div className="space-y-1">
              <Text size={400} weight="semibold" block>Nenhuma transação</Text>
              <Text size={200} className="text-muted" block>Registre sua primeira transação para começar</Text>
            </div>
            <Link to="/transactions" className="text-brand hover:underline text-sm font-medium">
              Registrar transação →
            </Link>
          </div>
        ) : (
          <ul className="divide-y border-subtle">
            {recentResult.items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-3 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                  tx.type === 'Income'
                    ? 'bg-[var(--colorPaletteGreenBackground2)] text-income'
                    : tx.type === 'Expense'
                    ? 'bg-[var(--colorPaletteRedBackground2)] text-expense'
                    : 'bg-brand-light text-brand'
                }`}>
                  {tx.type === 'Income' ? '↑' : tx.type === 'Expense' ? '↓' : '⇄'}
                </div>
                <div className="flex-1 min-w-0">
                  <Text size={300} weight="semibold" block truncate>
                    {tx.description || typeLabels[tx.type]}
                  </Text>
                  <Text size={200} className="text-muted">
                    {tx.categoryName && `${tx.categoryName} · `}
                    {dateFormatter.format(new Date(tx.date))}
                  </Text>
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
          <QuickLink to="/accounts"     icon={<BuildingBankFilled />}        label="Contas" />
          <QuickLink to="/categories"   icon={<DataFunnelFilled />}         label="Categorias" />
          <QuickLink to="/transactions" icon={<ArrowSyncRegular />}         label="Transações" />
          <QuickLink to="/profile"      icon={<PersonFilled />}             label="Perfil" />
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
          <Text size={200} className="text-muted" block>{label}</Text>
          <div className="mt-1.5">
            <Text size={600} weight="semibold" block>
              <CurrencyBadge value={value} />
            </Text>
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
      className="card p-4 flex flex-col items-center gap-2.5 hover:bg-surface-3 transition-colors no-underline"
    >
      <span className="text-muted">{icon}</span>
      <Text size={200} weight="semibold" className="text-muted">{label}</Text>
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
      <div className="flex rounded-full overflow-hidden h-3 bg-surface-3">
        <div
          className="bg-[var(--colorPaletteGreenForeground1)] transition-all duration-500"
          style={{ width: `${incomeWidth}%` }}
        />
        <div
          className="bg-[var(--colorPaletteRedForeground1)] transition-all duration-500"
          style={{ width: `${expenseWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1 text-income">
          <ArrowUpFilled style={{ fontSize: 12 }} /> {fmt.format(income)}
        </span>
        <span className="flex items-center gap-1 text-expense">
          <ArrowDownFilled style={{ fontSize: 12 }} /> {fmt.format(expenses)}
        </span>
      </div>
    </div>
  )
}
