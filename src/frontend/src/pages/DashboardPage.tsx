import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Wallet, ArrowUp, ArrowDown, ArrowRightLeft, Building2, Tag, User, Filter, X, ChevronRight } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { useCategories } from '../hooks/useCategories'
import { useAccounts } from '../hooks/useAccounts'
import { useTransactions } from '../hooks/useTransactions'
import { useTransactionActions } from '../context/TransactionActionsContext'
import { PageHeader } from '../components/PageHeader'
import { useAuthStore } from '../store/authStore'
import { CurrencyBadge, type CurrencyTone } from '../components/CurrencyBadge'
import { IconBadge } from '../components/IconBadge'
import { TransactionIcon } from '../components/TransactionIcon'
import { accountTypeVisual } from '../lib/entity-icons'
import { SkeletonCard } from '../components/Skeleton'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { CategoryBreakdownChart } from '../components/charts/CategoryBreakdownChart'
import { NativeSelect } from '../components/ui/native-select'
import { DateInput } from '../components/ui/date-input'
import { Button } from '../components/ui/button'
import { cn, toDateParam, UNCATEGORIZED_ID } from '../lib/utils'
import type { Account, DashboardFilters, TransactionType } from '../types'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

const typeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

type PeriodPreset = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'last-12-months' | 'custom'

const periodLabels: Record<PeriodPreset, string> = {
  'this-month': 'Este mês',
  'last-month': 'Mês passado',
  'last-3-months': 'Últimos 3 meses',
  'last-6-months': 'Últimos 6 meses',
  'this-year': 'Este ano',
  'last-12-months': 'Últimos 12 meses',
  custom: 'Personalizado',
}

const DEFAULT_PERIOD: PeriodPreset = 'this-month'

function presetRange(preset: Exclude<PeriodPreset, 'custom'>): { start: Date; end: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'this-month':
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) }
    case 'last-month':
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) }
    case 'last-3-months':
      return { start: new Date(y, m - 2, 1), end: new Date(y, m + 1, 0) }
    case 'last-6-months':
      return { start: new Date(y, m - 5, 1), end: new Date(y, m + 1, 0) }
    case 'this-year':
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) }
    case 'last-12-months':
      return { start: new Date(y, m - 11, 1), end: new Date(y, m + 1, 0) }
  }
}

function describePeriod(preset: PeriodPreset, startDate: string, endDate: string) {
  if (preset === 'this-month' || preset === 'last-month') {
    return monthFormatter.format(new Date(startDate + 'T12:00:00'))
  }
  const start = fullDateFormatter.format(new Date(startDate + 'T12:00:00'))
  const end = fullDateFormatter.format(new Date(endDate + 'T12:00:00'))
  return `${start} – ${end}`
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories } = useCategories()
  const { data: accounts, isLoading: accountsLoading } = useAccounts()
  const { openDetail } = useTransactionActions()

  const rawPeriod = searchParams.get('period')
  const period: PeriodPreset = rawPeriod && rawPeriod in periodLabels ? (rawPeriod as PeriodPreset) : DEFAULT_PERIOD
  const filterType = (searchParams.get('type') as 'Income' | 'Expense' | null) ?? undefined
  const filterCategoryId = searchParams.get('category') ?? undefined

  let startDate: string
  let endDate: string
  if (period === 'custom') {
    const fallback = presetRange('this-month')
    startDate = searchParams.get('from') || toDateParam(fallback.start)
    endDate = searchParams.get('to') || toDateParam(fallback.end)
  } else {
    const range = presetRange(period)
    startDate = toDateParam(range.start)
    endDate = toDateParam(range.end)
  }

  const filters: DashboardFilters = { startDate, endDate, type: filterType, categoryId: filterCategoryId }
  const { data: dashboard, isLoading, isFetching } = useDashboard(filters)

  const updateParams = (changes: Record<string, string | undefined>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true }
    )
  }

  const handlePeriodChange = (value: PeriodPreset) => {
    if (value === 'custom') {
      updateParams({ period: 'custom', from: startDate, to: endDate })
    } else {
      updateParams({ period: value === DEFAULT_PERIOD ? undefined : value, from: undefined, to: undefined })
    }
  }

  const handleTypeChange = (value: 'Income' | 'Expense' | undefined) => {
    const category = categories?.find((c) => c.id === filterCategoryId)
    const keepCategory = !value || !category || category.type === value
    updateParams({ type: value, category: keepCategory ? filterCategoryId : undefined })
  }

  const hasActiveFilters = period !== DEFAULT_PERIOD || !!filterType || !!filterCategoryId
  const clearFilters = () => setSearchParams({}, { replace: true })

  const availableCategories = (categories ?? []).filter((c) => !filterType || c.type === filterType)
  const selectedCategory = categories?.find((c) => c.id === filterCategoryId)
  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]))
  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []

  const totalBalance = dashboard?.totalBalance ?? 0
  const periodIncome = dashboard?.periodIncome ?? 0
  const periodExpenses = dashboard?.periodExpenses ?? 0
  const periodDescription = describePeriod(period, startDate, endDate)
  const periodSuffix = period === 'this-month' ? 'do Mês' : 'no Período'

  const showCategoryIncome = filterType === 'Income'
  const categoryItems = showCategoryIncome ? dashboard?.incomeByCategory ?? [] : dashboard?.expensesByCategory ?? []
  const filterKey = `${startDate}|${endDate}|${filterType ?? ''}|${filterCategoryId ?? ''}`

  // Fatia selecionada no gráfico de categorias: filtra só a lista de transações abaixo.
  // Guardada junto com a chave dos filtros, para ser descartada quando eles mudam.
  const [slice, setSlice] = useState<{ key: string; categoryId: string } | null>(null)
  const sliceCategoryId = slice?.key === filterKey ? slice.categoryId : undefined
  const sliceCategoryName = !sliceCategoryId
    ? undefined
    : sliceCategoryId === UNCATEGORIZED_ID
      ? 'Sem categoria'
      : categoriesById.get(sliceCategoryId)?.name
  const sliceType: 'Income' | 'Expense' = showCategoryIncome ? 'Income' : 'Expense'

  const sliceTransactions = useTransactions(
    sliceCategoryId
      ? { startDate, endDate, type: sliceType, categoryId: sliceCategoryId, page: 1, pageSize: 8 }
      : undefined,
    !!sliceCategoryId
  )

  const listCategoryId = sliceCategoryId ?? filterCategoryId
  const listType = sliceCategoryId ? sliceType : filterType
  const recentTransactions = sliceCategoryId
    ? sliceTransactions.data?.items ?? []
    : dashboard?.recentTransactions ?? []
  const listLoading = sliceCategoryId ? sliceTransactions.isLoading : isLoading
  const listTitle = sliceCategoryName
    ? `Transações · ${sliceCategoryName}`
    : hasActiveFilters
      ? 'Transações do Filtro'
      : 'Transações Recentes'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.name?.split(' ')[0] ?? ''}`.trim()}
        subtitle={<span className="first-letter:uppercase">{periodDescription}</span>}
        className="mb-0"
      />

      {/* Filters */}
      <div className="card px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
          <Filter size={14} className="hidden text-muted-foreground flex-shrink-0 sm:block" />
          <NativeSelect
            aria-label="Período"
            className="w-full sm:w-auto sm:min-w-[160px]"
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as PeriodPreset)}
          >
            {(Object.entries(periodLabels) as [PeriodPreset, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </NativeSelect>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">De</span>
              <DateInput
                value={startDate}
                onChange={(e) => e.target.value && updateParams({ from: e.target.value })}
                className="min-w-0 flex-1 sm:w-[130px] sm:flex-none"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <DateInput
                value={endDate}
                onChange={(e) => e.target.value && updateParams({ to: e.target.value })}
                className="min-w-0 flex-1 sm:w-[130px] sm:flex-none"
              />
            </div>
          )}

          <div className="flex gap-1 rounded-lg bg-muted/50 p-1" role="group" aria-label="Tipo">
            {([
              [undefined, 'Todos'],
              ['Income', 'Receitas'],
              ['Expense', 'Despesas'],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => handleTypeChange(value)}
                aria-pressed={filterType === value}
                className={cn(
                  'flex-1 rounded-md px-3 py-1 text-sm font-medium transition-colors cursor-pointer sm:flex-none',
                  filterType === value
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <NativeSelect
            aria-label="Categoria"
            className="w-full sm:w-auto sm:min-w-[160px]"
            value={filterCategoryId ?? ''}
            onChange={(e) => updateParams({ category: e.target.value || undefined })}
          >
            <option value="">Todas as categorias</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 self-start px-2 sm:ml-auto sm:self-auto"
              icon={<X size={12} />}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity', isFetching && 'opacity-70')}>
          <StatCard
            label="Saldo Total"
            value={totalBalance}
            tone="balance"
            icon={<Wallet size={22} />}
            iconBg="bg-brand-light"
            iconColor="text-primary"
          />
          <StatCard
            label={`Receitas ${periodSuffix}`}
            value={periodIncome}
            tone="income"
            hint={selectedCategory && filterType !== 'Expense' ? selectedCategory.name : undefined}
            muted={filterType === 'Expense'}
            icon={<ArrowUp size={22} />}
            iconBg="bg-income-subtle"
            iconColor="text-income"
          />
          <StatCard
            label={`Despesas ${periodSuffix}`}
            value={periodExpenses}
            tone="expense"
            hint={selectedCategory && filterType !== 'Income' ? selectedCategory.name : undefined}
            muted={filterType === 'Income'}
            icon={<ArrowDown size={22} />}
            iconBg="bg-expense-subtle"
            iconColor="text-expense"
          />
        </div>
      )}

      {/* Accounts strip */}
      {!accountsLoading && activeAccounts.length > 0 && (
        <AccountsStrip accounts={activeAccounts} />
      )}

      {/* Charts */}
      <IncomeExpenseChart
        series={dashboard?.series ?? []}
        granularity={dashboard?.seriesGranularity ?? 'day'}
        subtitle={selectedCategory ? `${periodDescription} · ${selectedCategory.name}` : periodDescription}
        loading={isLoading}
        type={filterType}
      />
      {/* Categorias + transações: lado a lado em telas largas (o clique na fatia filtra a lista ao lado) */}
      <div className="space-y-6 xl:grid xl:grid-cols-5 xl:items-stretch xl:gap-6 xl:space-y-0">
        {!filterCategoryId && (
          <div className="min-w-0 xl:col-span-2">
            <CategoryBreakdownChart
              key={filterKey}
              title={showCategoryIncome ? 'Receitas por categoria' : 'Despesas por categoria'}
              subtitle={periodDescription}
              items={categoryItems}
              loading={isLoading}
              emptyMessage={showCategoryIncome ? 'Sem receitas neste período' : 'Sem despesas neste período'}
              selectedCategoryId={sliceCategoryId ?? null}
              onSelectedChange={(id) => setSlice(id ? { key: filterKey, categoryId: id } : null)}
            />
          </div>
        )}

        {/* Recent transactions */}
        <div
          className={cn(
            'card flex min-w-0 flex-col',
            filterCategoryId ? 'xl:col-span-5' : 'xl:col-span-3 xl:h-0 xl:min-h-full'
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-subtle">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-base font-semibold">{listTitle}</span>
              {sliceCategoryName && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSlice(null)}
                  aria-label="Remover filtro da categoria"
                  title="Remover filtro da categoria"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
            <Link
              to={{
                pathname: '/transactions',
                search: new URLSearchParams({
                  from: startDate,
                  to: endDate,
                  ...(listType ? { type: listType } : {}),
                  ...(listCategoryId ? { category: listCategoryId } : {}),
                }).toString(),
              }}
              className="flex-shrink-0 text-sm text-primary hover:underline font-medium transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          {listLoading ? (
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
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters ? 'Nada encontrado para os filtros selecionados' : 'Registre sua primeira transação para começar'}
                </p>
              </div>
              <Link to="/transactions" className="text-sm text-primary hover:underline font-medium">
                Registrar transação →
              </Link>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-subtle overflow-y-auto overscroll-contain">
              {recentTransactions.map((tx) => (
                <li key={tx.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(tx)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none cursor-pointer"
                  >
                    <TransactionIcon
                      transaction={tx}
                      category={tx.categoryId ? categoriesById.get(tx.categoryId) : undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {tx.description || typeLabels[tx.type]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.type === 'Transfer'
                          ? `${tx.accountName} → ${tx.destinationAccountName ?? '—'} · `
                          : tx.categoryName && `${tx.categoryName} · `}
                        {dateFormatter.format(new Date(tx.date + 'T12:00:00'))}
                      </p>
                    </div>
                    {tx.type === 'Transfer' ? (
                      <CurrencyBadge value={tx.amount} className="text-muted-foreground" />
                    ) : (
                      <CurrencyBadge value={tx.type === 'Expense' ? -tx.amount : tx.amount} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:hidden">
          <QuickLink to="/accounts" icon={<Building2 size={22} />} label="Contas" />
          <QuickLink to="/categories" icon={<Tag size={22} />} label="Categorias" />
          <QuickLink to="/transactions" icon={<ArrowRightLeft size={22} />} label="Transações" />
          <QuickLink to="/profile" icon={<User size={22} />} label="Perfil" />
        </div>
      )}
    </div>
  )
}

function AccountsStrip({ accounts }: { accounts: Account[] }) {
  return (
    <section aria-label="Contas">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Minhas contas</span>
        <Link to="/accounts" className="text-xs font-medium text-primary hover:underline">
          Gerenciar
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {accounts.map((account) => {
          const { Icon, color } = accountTypeVisual[account.type]
          return (
            <Link
              key={account.id}
              to={`/transactions?account=${account.id}`}
              className="card group flex min-w-[200px] flex-shrink-0 snap-start items-center gap-3 p-3.5 no-underline transition-colors hover:bg-muted/50"
            >
              <IconBadge color={color} size="sm">
                <Icon size={16} />
              </IconBadge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">{account.name}</p>
                <CurrencyBadge value={account.balance} tone="balance" size="sm" />
              </div>
              <ChevronRight size={14} className="flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  tone,
  hint,
  muted,
  icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: number
  tone: CurrencyTone
  hint?: string
  muted?: boolean
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  return (
    <div className={cn('card p-5 transition-opacity', muted && 'opacity-50')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-1.5">
            <CurrencyBadge value={value} tone={tone} size={600} />
          </div>
          {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
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
