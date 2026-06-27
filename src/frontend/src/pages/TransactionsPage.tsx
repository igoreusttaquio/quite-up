import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, Controller, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ArrowRightLeft, Filter, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { TransactionTypeIcon } from '../components/TransactionTypeIcon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Spinner } from '../components/ui/spinner'
import type { TransactionType, Transaction, Account, Category } from '../types'

const transactionTypeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

const createSchema = z.object({
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().optional(),
  type: z.enum(['Income', 'Expense', 'Transfer']),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  destinationAccountId: z.string().optional(),
})

const updateSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldError(errors: Record<string, any>, field: string): string | undefined {
  const err = errors[field]
  if (!err) return undefined
  return typeof err.message === 'string' ? err.message : undefined
}

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const filterAccountId = searchParams.get('account') || ''
  const filterType = searchParams.get('type') || ''
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
  const hasActiveFilters = !!(filterAccountId || filterType || filterStartDate || filterEndDate)

  const { data: result, isLoading, isFetching } = useTransactions({
    page,
    pageSize,
    accountId: filterAccountId || undefined,
    type: (filterType as TransactionType) || undefined,
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
  })

  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      type: 'Expense',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      destinationAccountId: '',
    },
  })

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: { amount: 0, date: new Date().toISOString().split('T')[0], categoryId: '', description: '' },
  })

  const watchType = createForm.watch('type')
  const filteredCategories = categories?.filter((c) => watchType === 'Transfer' || c.type === watchType) ?? []
  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []
  const totalPages = result ? Math.ceil(result.totalCount / result.pageSize) : 0

  const handleCreate = async (data: CreateFormData) => {
    try {
      await createTransaction.mutateAsync({
        ...data,
        categoryId: data.categoryId || undefined,
        destinationAccountId: data.destinationAccountId || undefined,
        description: data.description || undefined,
      })
      setCreateOpen(false)
      createForm.reset()
    } catch { /* handled by query client */ }
  }

  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return
    try {
      await updateTransaction.mutateAsync({
        id: editTarget.id,
        data: {
          ...data,
          categoryId: data.categoryId || undefined,
          description: data.description || undefined,
        },
      })
      setEditTarget(null)
    } catch { /* handled by query client */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch { /* handled by query client */ }
  }

  const openEdit = (transaction: Transaction) => {
    setEditTarget(transaction)
    editForm.reset({
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId || '',
      description: transaction.description || '',
    })
  }

  const openCreate = () => {
    createForm.reset({
      accountId: '',
      categoryId: '',
      type: 'Expense',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      destinationAccountId: '',
    })
    setCreateOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Nova Transação
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mb-5 card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">Filtros</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-7 px-2" icon={<X size={12} />}>
              Limpar
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <NativeSelect
            className="w-48"
            value={filterAccountId}
            onChange={(e) => updateFilter('account', e.target.value)}
          >
            <option value="">Todas as contas</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </NativeSelect>
          <NativeSelect
            className="w-40"
            value={filterType}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </NativeSelect>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => updateFilter('from', e.target.value)}
              style={{ width: 148 }}
            />
            <span className="text-sm text-muted-foreground">até</span>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => updateFilter('to', e.target.value)}
              style={{ width: 148 }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          icon={<ArrowRightLeft size={48} />}
          title="Nenhuma transação encontrada"
          description={hasActiveFilters ? 'Tente ajustar os filtros.' : 'Registre sua primeira transação.'}
          action={
            !hasActiveFilters ? (
              <Button onClick={openCreate} icon={<Plus size={16} />}>Nova Transação</Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            )
          }
        />
      ) : (
        <TransactionTable
          transactions={result.items}
          isFetching={isFetching}
          page={page}
          totalPages={totalPages}
          onEdit={openEdit}
          onDelete={(t) => setDeleteTarget(t)}
          onPageChange={setPage}
        />
      )}

      {/* Create sheet */}
      <TransactionFormSheet
        open={createOpen}
        title="Nova Transação"
        form={createForm}
        accounts={activeAccounts}
        categories={filteredCategories}
        watchType={watchType}
        isPending={createTransaction.isPending}
        onSubmit={createForm.handleSubmit(handleCreate as () => Promise<void>)}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Controller
              name="amount"
              control={editForm.control}
              render={({ field: { onChange, value, ...rest } }) => (
                <Field
                  label="Valor"
                  required
                  validationState={editForm.formState.errors.amount ? 'error' : undefined}
                  validationMessage={editForm.formState.errors.amount?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                    {...rest}
                  />
                </Field>
              )}
            />
            <Controller
              name="date"
              control={editForm.control}
              render={({ field }) => (
                <Field
                  label="Data"
                  required
                  validationState={editForm.formState.errors.date ? 'error' : undefined}
                  validationMessage={editForm.formState.errors.date?.message}
                >
                  <Input {...field} type="date" />
                </Field>
              )}
            />
            <Controller
              name="categoryId"
              control={editForm.control}
              render={({ field }) => (
                <Field label="Categoria">
                  <NativeSelect {...field} value={field.value || ''}>
                    <option value="">Sem categoria</option>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={editForm.control}
              render={({ field }) => (
                <Field label="Descrição">
                  <Input {...field} placeholder="Descrição opcional" />
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
              disabled={updateTransaction.isPending}
              icon={updateTransaction.isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
            >
              {updateTransaction.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteTransaction.isPending}
      />
    </div>
  )
}

// ─── TransactionTable ─────────────────────────────────────────────────────────

function TransactionTable({
  transactions,
  isFetching,
  page,
  totalPages,
  onEdit,
  onDelete,
  onPageChange,
}: {
  transactions: Transaction[]
  isFetching: boolean
  page: number
  totalPages: number
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPageChange: (p: number) => void
}) {
  return (
    <div>
      <div className={`card overflow-hidden transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <div className="hidden md:grid grid-cols-[44px_1fr_140px_140px_130px_72px] gap-3 px-4 py-2.5 border-b border-border bg-muted/50">
          {['', 'Descrição / Data', 'Categoria', 'Conta', 'Valor', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1fr_140px_140px_130px_72px] gap-3 px-4 py-3.5 items-center hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center">
                <TransactionTypeIcon type={tx.type} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {tx.description || transactionTypeLabels[tx.type]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(tx.date))}
                  {tx.accountName && <span className="md:hidden"> · {tx.accountName}</span>}
                </p>
              </div>
              <span className="text-sm text-muted-foreground truncate hidden md:block">{tx.categoryName || '—'}</span>
              <span className="text-sm text-muted-foreground truncate hidden md:block">{tx.accountName || '—'}</span>
              <div>
                <CurrencyBadge value={tx.type === 'Expense' ? -tx.amount : tx.amount} />
              </div>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(tx)}>
                  <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => onDelete(tx)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
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

function getPaginationPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

// ─── TransactionFormSheet ─────────────────────────────────────────────────────

function TransactionFormSheet({
  open,
  title,
  form,
  accounts,
  categories,
  watchType,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  accounts: Account[]
  categories: Category[]
  watchType: TransactionType
  isPending: boolean
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-4">
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field label="Tipo" required>
                  <NativeSelect {...field}>
                    {(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />

            <Controller
              name="accountId"
              control={form.control}
              render={({ field }) => (
                <Field
                  label="Conta"
                  required
                  validationState={form.formState.errors.accountId ? 'error' : undefined}
                  validationMessage={getFieldError(form.formState.errors, 'accountId')}
                >
                  <NativeSelect {...field} value={field.value || ''}>
                    <option value="">Selecione uma conta</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />

            {watchType === 'Transfer' && (
              <Controller
                name="destinationAccountId"
                control={form.control}
                render={({ field }) => (
                  <Field label="Conta de Destino">
                    <NativeSelect {...field} value={field.value || ''}>
                      <option value="">Selecione uma conta</option>
                      {accounts
                        .filter((a) => a.id !== form.watch('accountId'))
                        .map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            )}

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field }) => (
                <Field label="Categoria">
                  <NativeSelect {...field} value={field.value || ''}>
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />

            <Controller
              name="amount"
              control={form.control}
              render={({ field: { onChange, value, ...rest } }) => (
                <Field
                  label="Valor"
                  required
                  validationState={form.formState.errors.amount ? 'error' : undefined}
                  validationMessage={getFieldError(form.formState.errors, 'amount')}
                >
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                    {...rest}
                  />
                </Field>
              )}
            />

            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Field
                  label="Data"
                  required
                  validationState={form.formState.errors.date ? 'error' : undefined}
                  validationMessage={getFieldError(form.formState.errors, 'date')}
                >
                  <Input {...field} type="date" />
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field label="Descrição">
                  <Input {...field} placeholder="Descrição opcional" />
                </Field>
              )}
            />
          </div>

          <div className="flex gap-2 pt-5">
            <Button
              className="flex-1"
              onClick={onSubmit}
              disabled={isPending}
              icon={isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
            >
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
