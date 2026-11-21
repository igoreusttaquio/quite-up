import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Upload,
  Copy,
  ArrowUp,
  ArrowDown,
  Scale,
} from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import { useTransactionActions } from '../context/TransactionActionsContext'
import { useAppToast } from '../hooks/useAppToast'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { TransactionIcon } from '../components/TransactionIcon'
import { Button } from '../components/ui/button'
import { DateInput } from '../components/ui/date-input'
import { NativeSelect } from '../components/ui/native-select'
import { Spinner } from '../components/ui/spinner'
import { toDateParam, UNCATEGORIZED_ID } from '../lib/utils'
import { isTempTransactionId, usePendingSyncIds } from '../lib/offline'
import { PendingSyncBadge } from '../components/PendingSyncBadge'
import { signedAmount, todayParam, transactionTypeLabels } from '../lib/transactions'
import { useNewTransaction } from '../context/NewTransactionContext'
import type { TransactionType, Transaction, TransactionTotals, Category } from '../types'

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useAppToast()
  const { open: openNewTransaction } = useNewTransaction()

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const filterAccountId = searchParams.get('account') || ''
  const filterType = searchParams.get('type') || ''
  const filterCategoryId = searchParams.get('category') || ''
  const filterStartDate = searchParams.get('from') || ''
  const filterEndDate = searchParams.get('to') || ''
  const pageSize = 20

  const updateFilter = (key: string, value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        next.delete('page')
        return next
      },
      { replace: true }
    )
  }

  const setPage = (p: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (p > 1) next.set('page', String(p))
        else next.delete('page')
        return next
      },
      { replace: true }
    )
  }

  const clearFilters = () => setSearchParams({}, { replace: true })
  const hasActiveFilters = !!(filterAccountId || filterType || filterCategoryId || filterStartDate || filterEndDate)

  const { data: result, isLoading, isFetching } = useTransactions({
    page,
    pageSize,
    accountId: filterAccountId || undefined,
    type: (filterType as TransactionType) || undefined,
    categoryId: filterCategoryId || undefined,
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
  })

  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const actions = useTransactionActions()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []
  const totalPages = result ? Math.ceil(result.totalCount / result.pageSize) : 0
  const filterCategories = (categories ?? []).filter(
    (c) => !filterType || filterType === 'Transfer' || c.type === filterType
  )

  const handleUploadAttachment = async (transactionId: string, file: File) => {
    setUploadingId(transactionId)
    await actions.uploadAttachment(transactionId, file)
    setUploadingId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }


  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]))
  const pendingSyncIds = usePendingSyncIds()


  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Transações"
        action={
          <Button onClick={() => openNewTransaction()} icon={<Plus size={16} />} >
            Nova Transação
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mb-5 card px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
          <div className="flex flex-col gap-2 sm:contents">
            <Filter size={14} className="hidden text-muted-foreground flex-shrink-0 sm:block" />
            <NativeSelect
              aria-label="Conta"
              className="w-full sm:w-auto sm:min-w-[140px]"
              value={filterAccountId}
              onChange={(e) => updateFilter('account', e.target.value)}
            >
              <option value="">Todas as contas</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Tipo"
              className="w-full sm:w-auto sm:min-w-[130px]"
              value={filterType}
              onChange={(e) => {
                const value = e.target.value
                const category = categories?.find((c) => c.id === filterCategoryId)
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    if (value) next.set('type', value)
                    else next.delete('type')
                    if (value === 'Transfer' || (category && value && category.type !== value)) next.delete('category')
                    next.delete('page')
                    return next
                  },
                  { replace: true }
                )
              }}
            >
              <option value="">Todos os tipos</option>
              {(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Categoria"
              className="w-full sm:w-auto sm:min-w-[150px]"
              value={filterCategoryId}
              disabled={filterType === 'Transfer'}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">Todas as categorias</option>
              <option value={UNCATEGORIZED_ID}>Sem categoria</option>
              {filterCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">De</span>
            <DateInput
              value={filterStartDate}
              onChange={(e) => updateFilter('from', e.target.value)}
              className="min-w-0 flex-1 sm:w-[130px] sm:flex-none"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <DateInput
              value={filterEndDate}
              onChange={(e) => updateFilter('to', e.target.value)}
              className="min-w-0 flex-1 sm:w-[130px] sm:flex-none"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 self-start px-2 sm:ml-auto sm:self-auto" icon={<X size={12} />}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {result && result.totalCount > 0 && (
        <TotalsBar
          totals={result.totals}
          count={result.totalCount}
          hasAccountFilter={!!filterAccountId}
          isFetching={isFetching}
        />
      )}

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          icon={<ArrowRightLeft size={48} />}
          title="Nenhuma transação encontrada"
          description={hasActiveFilters ? 'Tente ajustar os filtros.' : 'Registre sua primeira transação.'}
          action={
            !hasActiveFilters ? (
              <Button onClick={() => openNewTransaction()} icon={<Plus size={16} />}>Nova Transação</Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            )
          }
        />
      ) : (
        <TransactionTable
          transactions={result.items}
          pendingSyncIds={pendingSyncIds}
          categoriesById={categoriesById}
          filterAccountId={filterAccountId || undefined}
          isFetching={isFetching}
          page={page}
          totalPages={totalPages}
          onOpen={(t) => actions.openDetail(t, { accountId: filterAccountId || undefined })}
          onEdit={actions.openEdit}
          onDuplicate={actions.duplicate}
          onDelete={actions.requestDelete}
          onPageChange={setPage}
          onViewReceipt={actions.viewReceipt}
          onUploadAttachment={(id) => {
            if (isTempTransactionId(id)) {
              toast.info('Aguardando sincronização', 'Anexe o comprovante depois que a transação sincronizar.')
              return
            }
            setUploadingId(id)
            fileInputRef.current?.click()
          }}
          onDeleteAttachment={actions.removeAttachment}
          uploadingId={uploadingId}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && uploadingId) handleUploadAttachment(uploadingId, file)
        }}
      />

    </div>
  )
}

// ─── TotalsBar ────────────────────────────────────────────────────────────────

function TotalsBar({
  totals,
  count,
  hasAccountFilter,
  isFetching,
}: {
  totals: TransactionTotals
  count: number
  hasAccountFilter: boolean
  isFetching: boolean
}) {
  const inflow = totals.income + totals.transfersIn
  const outflow = totals.expenses + totals.transfersOut

  return (
    <div className={`mb-5 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <TotalTile
          label="Entradas"
          value={inflow}
          tone="income"
          icon={<ArrowUp size={14} />}
          iconClass="bg-income-subtle text-income"
          hint={hasAccountFilter && totals.transfersIn > 0 ? 'inclui transferências recebidas' : undefined}
        />
        <TotalTile
          label="Saídas"
          value={outflow}
          tone="expense"
          icon={<ArrowDown size={14} />}
          iconClass="bg-expense-subtle text-expense"
          hint={hasAccountFilter && totals.transfersOut > 0 ? 'inclui transferências enviadas' : undefined}
        />
        <TotalTile
          label="Resultado"
          value={totals.net}
          tone="signed"
          icon={<Scale size={14} />}
          iconClass="bg-brand-light text-primary"
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-muted-foreground">
        {count} {count === 1 ? 'transação' : 'transações'} no filtro
        {!hasAccountFilter && ' · transferências entre contas não entram no total'}
      </p>
    </div>
  )
}

function TotalTile({
  label,
  value,
  tone,
  icon,
  iconClass,
  hint,
}: {
  label: string
  value: number
  tone: 'income' | 'expense' | 'signed'
  icon: React.ReactNode
  iconClass: string
  hint?: string
}) {
  return (
    <div className="card min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-1.5">
        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
      <CurrencyBadge value={value} tone={tone} className="mt-1 block truncate text-sm sm:text-lg" />
      {hint && <p className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">{hint}</p>}
    </div>
  )
}

// ─── TransactionTable ─────────────────────────────────────────────────────────

function TransactionTable({
  transactions,
  pendingSyncIds,
  categoriesById,
  filterAccountId,
  isFetching,
  page,
  totalPages,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  onPageChange,
  onViewReceipt,
  onUploadAttachment,
  onDeleteAttachment,
  uploadingId,
}: {
  transactions: Transaction[]
  pendingSyncIds: Set<string>
  categoriesById: Map<string, Category>
  filterAccountId?: string
  isFetching: boolean
  page: number
  totalPages: number
  onOpen: (t: Transaction) => void
  onEdit: (t: Transaction) => void
  onDuplicate: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPageChange: (p: number) => void
  onViewReceipt: (t: Transaction) => void
  onUploadAttachment: (transactionId: string) => void
  onDeleteAttachment: (transactionId: string) => void
  uploadingId: string | null
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const groups = groupByDay(transactions)

  return (
    <div>
      <div className={`card overflow-hidden transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <div className="hidden md:grid grid-cols-[44px_1fr_140px_160px_130px_44px_100px] gap-3 px-4 py-2.5 border-b border-border bg-muted/50">
          {['', 'Descrição', 'Categoria', 'Conta', 'Valor', '', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
          ))}
        </div>
        <div>
          {groups.map((group) => {
            const dayTotal = group.items
              .filter((tx) => tx.type !== 'Transfer' || !!filterAccountId)
              .reduce((sum, tx) => sum + signedAmount(tx, filterAccountId), 0)
            return (
              <section key={group.date} aria-label={dayLabel(group.date)} className="border-b border-border last:border-b-0">
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/40 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground first-letter:uppercase">
                    {dayLabel(group.date)}
                  </span>
                  <CurrencyBadge value={dayTotal} size="sm" className="text-xs" />
                </div>
                <ul className="divide-y divide-border">
                  {group.items.map((tx) => {
                    const isTransfer = tx.type === 'Transfer'
                    const accountLabel = isTransfer
                      ? `${tx.accountName} → ${tx.destinationAccountName ?? '—'}`
                      : tx.accountName
                    return (
                      <li
                        key={tx.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpen(tx)}
                        onKeyDown={(e) => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            onOpen(tx)
                          }
                        }}
                        className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1fr_140px_160px_130px_44px_100px] gap-3 px-4 py-3.5 items-center hover:bg-muted/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-muted/50"
                      >
                        <div className="flex items-center justify-center">
                          <TransactionIcon
                            transaction={tx}
                            category={tx.categoryId ? categoriesById.get(tx.categoryId) : undefined}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {tx.description || transactionTypeLabels[tx.type]}
                          </p>
                          {pendingSyncIds.has(tx.id) && <PendingSyncBadge />}
                          <p className="text-xs text-muted-foreground truncate md:hidden">
                            {[isTransfer ? null : tx.categoryName, accountLabel].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground truncate hidden md:block">
                          {isTransfer ? 'Transferência' : tx.categoryName || '—'}
                        </span>
                        <span className="text-sm text-muted-foreground truncate hidden md:block" title={accountLabel}>
                          {accountLabel || '—'}
                        </span>
                        <div>
                          <CurrencyBadge
                            value={signedAmount(tx, filterAccountId)}
                            className={isTransfer && !filterAccountId ? 'text-muted-foreground' : undefined}
                          />
                        </div>
                        <div className="hidden md:flex items-center justify-center gap-0.5" onClick={stop}>
                          {tx.attachmentId ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onViewReceipt(tx)}
                                title="Ver comprovante"
                                className="text-primary"
                              >
                                <Paperclip size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onDeleteAttachment(tx.id)}
                                title="Remover comprovante"
                                className="text-destructive/70 hover:text-destructive"
                              >
                                <Trash2 size={11} />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onUploadAttachment(tx.id)}
                              disabled={uploadingId === tx.id}
                              title="Anexar comprovante"
                              className="text-muted-foreground"
                            >
                              <Upload size={13} />
                            </Button>
                          )}
                        </div>
                        <div className="hidden md:flex gap-1 justify-end" onClick={stop}>
                          <Button variant="ghost" size="icon-sm" onClick={() => onDuplicate(tx)} title="Duplicar" aria-label="Duplicar">
                            <Copy size={13} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(tx)} title="Editar">
                            <Pencil size={13} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(tx)} title="Excluir">
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>

          {getPaginationPages(page, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`e${i}`} className="text-sm text-muted-foreground px-1">…</span>
            ) : (
              <Button
                key={item}
                variant={item === page ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => onPageChange(item as number)}
              >
                {item}
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>

          {isFetching && <Spinner size="small" className="ml-2" />}
        </div>
      )}
    </div>
  )
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
const weekdayYearFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function dayLabel(date: string): string {
  const todayStr = todayParam()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date === todayStr) return 'Hoje'
  if (date === toDateParam(yesterday)) return 'Ontem'
  const d = new Date(date + 'T12:00:00')
  return (d.getFullYear() === new Date().getFullYear() ? weekdayFormatter : weekdayYearFormatter).format(d)
}

/** Agrupa transações (já ordenadas por data desc) em blocos por dia. */
function groupByDay(transactions: Transaction[]): { date: string; items: Transaction[] }[] {
  const groups: { date: string; items: Transaction[] }[] = []
  for (const tx of transactions) {
    const last = groups[groups.length - 1]
    if (last && last.date === tx.date) last.items.push(tx)
    else groups.push({ date: tx.date, items: [tx] })
  }
  return groups
}

function getPaginationPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}
