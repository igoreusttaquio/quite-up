import { useMemo } from 'react'
import { Text } from '@fluentui/react-components'
import {
  MoneyRegular,
  ArrowUpFilled,
  ArrowDownFilled,
  ArrowSyncRegular,
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

  const isLoading = loadingAccounts || loadingRecent

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Text as="h1" size={800} weight="semibold" block>
          Olá, {user?.name?.split(' ')[0]} 👋
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
            positive
          />
          <StatCard
            label="Despesas do Mês"
            value={monthlyExpenses}
            icon={<ArrowDownFilled style={{ fontSize: 22 }} />}
            iconBg="bg-[var(--colorPaletteRedBackground2)]"
            iconColor="text-expense"
            negative
          />
        </div>
      )}

      {/* Income vs Expense bar */}
      {!isLoading && (monthlyIncome > 0 || monthlyExpenses > 0) && (
        <div className="bg-surface rounded-xl border border-subtle shadow-sm p-5">
          <Text size={400} weight="semibold" block className="mb-3">
            Receitas vs Despesas
          </Text>
          <MonthProgressBar income={monthlyIncome} expenses={monthlyExpenses} />
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-surface rounded-xl border border-subtle shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <Text size={400} weight="semibold">Transações Recentes</Text>
          <Link to="/transactions" className="text-sm text-brand hover:underline font-medium">
            Ver todas →
          </Link>
        </div>

        {loadingRecent ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="animate-pulse w-9 h-9 rounded-full bg-surface-3 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="animate-pulse h-3.5 w-1/3 rounded bg-surface-3" />
                  <div className="animate-pulse h-3 w-1/4 rounded bg-surface-3" />
                </div>
                <div className="animate-pulse h-4 w-20 rounded bg-surface-3" />
              </div>
            ))}
          </div>
        ) : !recentResult?.items.length ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-5">
            <ArrowSyncRegular style={{ fontSize: 40 }} className="text-subtle opacity-60" />
            <Text size={300} className="text-muted">Nenhuma transação ainda</Text>
            <Link to="/transactions" className="text-brand hover:underline text-sm font-medium">
              Registrar primeira transação →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--colorNeutralStroke1)]">
            {recentResult.items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/accounts',     label: 'Contas',      emoji: '🏦' },
            { to: '/categories',   label: 'Categorias',  emoji: '🏷️' },
            { to: '/transactions', label: 'Transações',  emoji: '💳' },
            { to: '/profile',      label: 'Perfil',      emoji: '👤' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="bg-surface rounded-xl border border-subtle shadow-sm p-4 flex flex-col items-center gap-2 hover:bg-surface-3 transition-colors no-underline"
            >
              <span className="text-2xl">{item.emoji}</span>
              <Text size={200} weight="semibold" className="text-muted">{item.label}</Text>
            </Link>
          ))}
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
  positive = false,
  negative = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  positive?: boolean
  negative?: boolean
}) {
  const valueClass = positive ? 'text-income' : negative ? 'text-expense' : undefined

  return (
    <div className="bg-surface rounded-xl border border-subtle shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text size={200} className="text-muted" block>{label}</Text>
          <div className="mt-1.5">
            <CurrencyBadge value={positive || negative ? value : value} className={valueClass} />
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function MonthProgressBar({ income, expenses }: { income: number; expenses: number }) {
  const total = income + expenses
  const incomeWidth = total > 0 ? Math.round((income / total) * 100) : 50
  const expenseWidth = 100 - incomeWidth

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3">
        <div
          className="bg-[var(--colorPaletteGreenForeground1)] transition-all"
          style={{ width: `${incomeWidth}%` }}
        />
        <div
          className="bg-[var(--colorPaletteRedForeground1)] transition-all"
          style={{ width: `${expenseWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-income">↑ {fmt.format(income)}</span>
        <span className="text-expense">↓ {fmt.format(expenses)}</span>
      </div>
    </div>
  )
}
