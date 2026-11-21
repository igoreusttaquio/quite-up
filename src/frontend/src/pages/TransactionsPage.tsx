import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, Controller, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Paperclip,
  Upload,
  Repeat,
  ArrowUp,
  ArrowDown,
  Scale,
} from 'lucide-react'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/useTransactions'
import { useUploadAttachment, useDeleteAttachment } from '../hooks/useAttachment'
import { useAppToast } from '../hooks/useAppToast'
import { ReceiptViewer } from '../components/ReceiptViewer'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useDebts } from '../hooks/useDebts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { TransactionIcon } from '../components/TransactionIcon'
import { Fab } from '../components/Fab'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { DateInput } from '../components/ui/date-input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { CurrencyInput } from '../components/ui/currency-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Spinner } from '../components/ui/spinner'
import { getApiErrorMessage, toDateParam } from '../lib/utils'
import type { TransactionType, Transaction, TransactionTotals, Account, Category, Debt } from '../types'

const transactionTypeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

const today = () => toDateParam(new Date())

const transferRefinement = (
  data: { type: TransactionType; accountId?: string; destinationAccountId?: string },
  ctx: z.RefinementCtx
) => {
  if (data.type !== 'Transfer') return
  if (!data.destinationAccountId) {
    ctx.addIssue({ code: 'custom', path: ['destinationAccountId'], message: 'Conta de destino é obrigatória' })
  } else if (data.destinationAccountId === data.accountId) {
    ctx.addIssue({ code: 'custom', path: ['destinationAccountId'], message: 'Origem e destino devem ser diferentes' })
  }
}

const createSchema = z
  .object({
    accountId: z.string().min(1, 'Conta é obrigatória'),
    categoryId: z.string().optional(),
    type: z.enum(['Income', 'Expense', 'Transfer']),
    amount: z.number().positive('Valor deve ser positivo'),
    description: z.string().optional(),
    date: z.string().min(1, 'Data é obrigatória'),
    destinationAccountId: z.string().optional(),
    debtId: z.string().optional(),
  })
  .superRefine(transferRefinement)

const updateSchema = z
  .object({
    type: z.enum(['Income', 'Expense', 'Transfer']),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    destinationAccountId: z.string().optional(),
    amount: z.number().positive('Valor deve ser positivo'),
    date: z.string().min(1, 'Data é obrigatória'),
    categoryId: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine(transferRefinement)

const repeatSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>
type RepeatFormData = z.infer<typeof repeatSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldError(errors: Record<string, any>, field: string): string | undefined {
  const err = errors[field]
  if (!err) return undefined
  return typeof err.message === 'string' ? err.message : undefined
}

/** Valor com sinal do ponto de vista da conta filtrada (transferência sai de uma e entra na outra). */
function signedAmount(tx: Transaction, accountId?: string): number {
  if (tx.type === 'Income') return tx.amount
  if (tx.type === 'Expense') return -tx.amount
  if (accountId && tx.accountId === accountId) return -tx.amount
  if (accountId && tx.destinationAccountId === accountId) return tx.amount
  return tx.amount
}

/** Garante que a conta atual da transação apareça no select, mesmo se estiver inativa. */
function withCurrentAccount(accounts: Account[], id?: string, name?: string): Account[] {
  if (!id || accounts.some((a) => a.id === id)) return accounts
  return [...accounts, { id, name: `${name ?? 'Conta'} (inativa)`, type: 'Other', balance: 0, isActive: false, createdAt: '' }]
}

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useAppToast()

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
  const { data: debts } = useDebts()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [createOpen, setCreateOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [repeatTarget, setRepeatTarget] = useState<Transaction | null>(null)
  const [viewReceipt, setViewReceipt] = useState<{ transactionId: string; attachmentId: string; fileName: string; contentType: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createFileRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment()

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      type: 'Expense',
      amount: 0,
      description: '',
      date: today(),
      destinationAccountId: '',
      debtId: '',
    },
  })

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      type: 'Expense',
      accountId: '',
      destinationAccountId: '',
      amount: 0,
      date: today(),
      categoryId: '',
      description: '',
    },
  })

  const repeatForm = useForm<RepeatFormData>({
    resolver: zodResolver(repeatSchema),
    defaultValues: { amount: 0, date: today() },
  })

  const watchType = createForm.watch('type')
  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []
  const pendingDebts = debts?.filter((d) => !d.isPaid) ?? []
  const totalPages = result ? Math.ceil(result.totalCount / result.pageSize) : 0
  const filterCategories = (categories ?? []).filter(
    (c) => !filterType || filterType === 'Transfer' || c.type === filterType
  )

  // Ao trocar o tipo, limpa campos que não fazem sentido para o novo tipo.
  useEffect(() => {
    if (watchType === 'Transfer') {
      createForm.setValue('categoryId', '')
      createForm.setValue('debtId', '')
    } else {
      createForm.setValue('destinationAccountId', '')
      const currentCategory = categories?.find((c) => c.id === createForm.getValues('categoryId'))
      if (currentCategory && currentCategory.type !== watchType) createForm.setValue('categoryId', '')
      if (watchType !== 'Expense') createForm.setValue('debtId', '')
    }
  }, [watchType, categories, createForm])

  const handleCreate = async (data: CreateFormData) => {
    try {
      const isTransfer = data.type === 'Transfer'
      const result = await createTransaction.mutateAsync({
        ...data,
        categoryId: !isTransfer ? data.categoryId || undefined : undefined,
        destinationAccountId: isTransfer ? data.destinationAccountId || undefined : undefined,
        description: data.description || undefined,
        debtId: data.type === 'Expense' ? data.debtId || undefined : undefined,
      })
      const file = createFileRef.current?.files?.[0]
      if (file) {
        await uploadAttachment.mutateAsync({ transactionId: result.id, file })
      }
      setCreateOpen(false)
      createForm.reset()
      if (createFileRef.current) createFileRef.current.value = ''
      toast.success(isTransfer ? 'Transferência registrada!' : 'Transação registrada!')
    } catch (error) {
      toast.error('Erro ao salvar transação', getApiErrorMessage(error))
    }
  }

  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return
    const isTransfer = editTarget.type === 'Transfer'
    try {
      await updateTransaction.mutateAsync({
        id: editTarget.id,
        data: {
          amount: data.amount,
          date: data.date,
          accountId: data.accountId,
          destinationAccountId: isTransfer ? data.destinationAccountId || undefined : undefined,
          categoryId: !isTransfer ? data.categoryId || undefined : undefined,
          description: data.description || undefined,
        },
      })
      setEditTarget(null)
      toast.success('Transação atualizada!')
    } catch (error) {
      toast.error('Erro ao atualizar transação', getApiErrorMessage(error))
    }
  }

  const handleRepeat = async (data: RepeatFormData) => {
    if (!repeatTarget) return
    try {
      await createTransaction.mutateAsync({
        type: repeatTarget.type,
        amount: data.amount,
        date: data.date,
        accountId: repeatTarget.accountId,
        categoryId: repeatTarget.type !== 'Transfer' ? repeatTarget.categoryId || undefined : undefined,
        destinationAccountId: repeatTarget.type === 'Transfer' ? repeatTarget.destinationAccountId || undefined : undefined,
        description: repeatTarget.description || undefined,
        debtId: repeatTarget.type === 'Expense' ? repeatTarget.debtId || undefined : undefined,
      })
      setRepeatTarget(null)
      toast.success('Transação repetida!')
    } catch (error) {
      toast.error('Erro ao repetir transação', getApiErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (error) {
      toast.error('Erro ao excluir transação', getApiErrorMessage(error))
    }
  }

  const handleUploadAttachment = async (transactionId: string, file: File) => {
    setUploadingId(transactionId)
    try {
      await uploadAttachment.mutateAsync({ transactionId, file })
    } catch { /* handled by hook */ }
    setUploadingId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteAttachment = async (transactionId: string) => {
    await deleteAttachment.mutateAsync(transactionId)
  }

  const openEdit = (transaction: Transaction) => {
    setDetailTarget(null)
    setEditTarget(transaction)
    editForm.reset({
      type: transaction.type,
      accountId: transaction.accountId,
      destinationAccountId: transaction.destinationAccountId || '',
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId || '',
      description: transaction.description || '',
    })
  }

  const openRepeat = (transaction: Transaction) => {
    setDetailTarget(null)
    setRepeatTarget(transaction)
    repeatForm.reset({ amount: transaction.amount, date: today() })
  }

  const openDelete = (transaction: Transaction) => {
    setDetailTarget(null)
    setDeleteTarget(transaction)
  }

  const openCreate = () => {
    createForm.reset({
      accountId: '',
      categoryId: '',
      type: 'Expense',
      amount: 0,
      description: '',
      date: today(),
      destinationAccountId: '',
      debtId: '',
    })
    setCreateOpen(true)
  }

  // Atalho vindo de outras telas (ex.: botão flutuante do dashboard): /transactions?new=1
  const openNewFromUrl = searchParams.get('new') === '1'
  useEffect(() => {
    if (!openNewFromUrl) return
    openCreate()
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('new')
        return next
      },
      { replace: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNewFromUrl])

  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]))

  const editAccounts = withCurrentAccount(activeAccounts, editTarget?.accountId, editTarget?.accountName)
  const editDestinationAccounts = withCurrentAccount(
    activeAccounts,
    editTarget?.destinationAccountId,
    editTarget?.destinationAccountName
  ).filter((a) => a.id !== editForm.watch('accountId'))
  const editCategories = (categories ?? []).filter((c) => c.type === editTarget?.type)

  return (
    <div className="w-full min-w-0 pb-16 md:pb-0">
      <PageHeader
        title="Transações"
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />} className="hidden md:inline-flex">
            Nova Transação
          </Button>
        }
      />
      <Fab onClick={openCreate} label="Nova transação" icon={<Plus size={24} />} />

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
                    if (category && value && (value === 'Transfer' || category.type !== value)) next.delete('category')
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
              <Button onClick={openCreate} icon={<Plus size={16} />}>Nova Transação</Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            )
          }
        />
      ) : (
        <TransactionTable
          transactions={result.items}
          categoriesById={categoriesById}
          filterAccountId={filterAccountId || undefined}
          isFetching={isFetching}
          page={page}
          totalPages={totalPages}
          onOpen={setDetailTarget}
          onEdit={openEdit}
          onRepeat={openRepeat}
          onDelete={openDelete}
          onPageChange={setPage}
          onViewReceipt={(t) => t.attachmentId && t.attachmentFileName && t.attachmentContentType && setViewReceipt({
            transactionId: t.id,
            attachmentId: t.attachmentId,
            fileName: t.attachmentFileName,
            contentType: t.attachmentContentType,
          })}
          onUploadAttachment={(id) => {
            setUploadingId(id)
            fileInputRef.current?.click()
          }}
          onDeleteAttachment={handleDeleteAttachment}
          uploadingId={uploadingId}
        />
      )}

      {/* Create sheet */}
      <TransactionFormSheet
        open={createOpen}
        title="Nova Transação"
        form={createForm}
        accounts={activeAccounts}
        categories={(categories ?? []).filter((c) => c.type === watchType)}
        debts={pendingDebts}
        watchType={watchType}
        isPending={createTransaction.isPending || uploadAttachment.isPending}
        onSubmit={createForm.handleSubmit(handleCreate as () => Promise<void>)}
        onClose={() => setCreateOpen(false)}
        fileInputRef={createFileRef}
      />

      {/* Detail / actions dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => { if (!open) setDetailTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailTarget ? transactionTypeLabels[detailTarget.type] : ''}</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TransactionIcon
                  transaction={detailTarget}
                  category={detailTarget.categoryId ? categoriesById.get(detailTarget.categoryId) : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {detailTarget.description || transactionTypeLabels[detailTarget.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(detailTarget.date + 'T12:00:00'))}
                  </p>
                </div>
                <CurrencyBadge
                  value={signedAmount(detailTarget, filterAccountId || undefined)}
                  className={detailTarget.type === 'Transfer' && !filterAccountId ? 'text-muted-foreground' : undefined}
                />
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-border p-3 text-sm">
                {detailTarget.type === 'Transfer' ? (
                  <>
                    <dt className="text-muted-foreground">Sai de</dt>
                    <dd className="truncate font-medium">{detailTarget.accountName}</dd>
                    <dt className="text-muted-foreground">Entra em</dt>
                    <dd className="truncate font-medium">{detailTarget.destinationAccountName ?? '—'}</dd>
                  </>
                ) : (
                  <>
                    <dt className="text-muted-foreground">Conta</dt>
                    <dd className="truncate font-medium">{detailTarget.accountName}</dd>
                    <dt className="text-muted-foreground">Categoria</dt>
                    <dd className="truncate font-medium">{detailTarget.categoryName || '—'}</dd>
                  </>
                )}
                {detailTarget.debtName && (
                  <>
                    <dt className="text-muted-foreground">Dívida</dt>
                    <dd className="truncate font-medium">{detailTarget.debtName}</dd>
                  </>
                )}
              </dl>
              {detailTarget.attachmentId ? (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  onClick={() => {
                    const t = detailTarget
                    setDetailTarget(null)
                    if (t.attachmentId && t.attachmentFileName && t.attachmentContentType) {
                      setViewReceipt({
                        transactionId: t.id,
                        attachmentId: t.attachmentId,
                        fileName: t.attachmentFileName,
                        contentType: t.attachmentContentType,
                      })
                    }
                  }}
                >
                  <Paperclip size={14} />
                  {detailTarget.attachmentFileName || 'Ver comprovante'}
                </button>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const id = detailTarget.id
                    setDetailTarget(null)
                    setUploadingId(id)
                    fileInputRef.current?.click()
                  }}
                >
                  <Upload size={14} />
                  Anexar comprovante
                </button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => detailTarget && openDelete(detailTarget)}
              icon={<Trash2 size={14} />}
              className="text-destructive hover:text-destructive"
            >
              Excluir
            </Button>
            <Button variant="outline" onClick={() => detailTarget && openEdit(detailTarget)} icon={<Pencil size={14} />}>
              Editar
            </Button>
            <Button onClick={() => detailTarget && openRepeat(detailTarget)} icon={<Repeat size={14} />}>
              Repetir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repeat dialog */}
      <Dialog open={!!repeatTarget} onOpenChange={(open) => { if (!open) setRepeatTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repetir Transação</DialogTitle>
          </DialogHeader>
          {repeatTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <TransactionIcon
                  transaction={repeatTarget}
                  category={repeatTarget.categoryId ? categoriesById.get(repeatTarget.categoryId) : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {repeatTarget.description || transactionTypeLabels[repeatTarget.type]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {repeatTarget.type === 'Transfer'
                      ? `${repeatTarget.accountName} → ${repeatTarget.destinationAccountName ?? '—'}`
                      : [repeatTarget.accountName, repeatTarget.categoryName].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <Controller
                name="amount"
                control={repeatForm.control}
                render={({ field: { onChange, value } }) => (
                  <Field
                    label="Valor"
                    required
                    validationState={repeatForm.formState.errors.amount ? 'error' : undefined}
                    validationMessage={repeatForm.formState.errors.amount?.message}
                  >
                    <CurrencyInput value={value ?? 0} onChange={onChange} />
                  </Field>
                )}
              />
              <Controller
                name="date"
                control={repeatForm.control}
                render={({ field }) => (
                  <Field
                    label="Data"
                    required
                    validationState={repeatForm.formState.errors.date ? 'error' : undefined}
                    validationMessage={repeatForm.formState.errors.date?.message}
                  >
                    <DateInput {...field} />
                  </Field>
                )}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={repeatForm.handleSubmit(handleRepeat as () => Promise<void>)}
              disabled={createTransaction.isPending}
              icon={createTransaction.isPending ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
            >
              {createTransaction.isPending ? 'Salvando…' : 'Repetir'}
            </Button>
            <Button variant="outline" onClick={() => setRepeatTarget(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget?.type === 'Transfer' ? 'Editar Transferência' : 'Editar Transação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Controller
              name="accountId"
              control={editForm.control}
              render={({ field }) => (
                <Field
                  label={editTarget?.type === 'Transfer' ? 'Conta de Origem (sai)' : 'Conta'}
                  required
                  validationState={editForm.formState.errors.accountId ? 'error' : undefined}
                  validationMessage={editForm.formState.errors.accountId?.message}
                >
                  <NativeSelect {...field} value={field.value || ''}>
                    {editAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />
            {editTarget?.type === 'Transfer' ? (
              <Controller
                name="destinationAccountId"
                control={editForm.control}
                render={({ field }) => (
                  <Field
                    label="Conta de Destino (entra)"
                    required
                    validationState={editForm.formState.errors.destinationAccountId ? 'error' : undefined}
                    validationMessage={editForm.formState.errors.destinationAccountId?.message}
                  >
                    <NativeSelect {...field} value={field.value || ''}>
                      <option value="">Selecione uma conta</option>
                      {editDestinationAccounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            ) : (
              <Controller
                name="categoryId"
                control={editForm.control}
                render={({ field }) => (
                  <Field label="Categoria">
                    <NativeSelect {...field} value={field.value || ''}>
                      <option value="">Sem categoria</option>
                      {editCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            )}
            <Controller
              name="amount"
              control={editForm.control}
              render={({ field: { onChange, value } }) => (
                <Field
                  label="Valor"
                  required
                  validationState={editForm.formState.errors.amount ? 'error' : undefined}
                  validationMessage={editForm.formState.errors.amount?.message}
                >
                  <CurrencyInput value={value ?? 0} onChange={onChange} />
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
                  <DateInput {...field} />
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && uploadingId) handleUploadAttachment(uploadingId, file)
        }}
      />

      {viewReceipt && (
        <ReceiptViewer
          open={!!viewReceipt}
          onClose={() => setViewReceipt(null)}
          attachmentId={viewReceipt.attachmentId}
          fileName={viewReceipt.fileName}
          contentType={viewReceipt.contentType}
          title={`Comprovante - ${viewReceipt.fileName}`}
        />
      )}
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
  categoriesById,
  filterAccountId,
  isFetching,
  page,
  totalPages,
  onOpen,
  onEdit,
  onRepeat,
  onDelete,
  onPageChange,
  onViewReceipt,
  onUploadAttachment,
  onDeleteAttachment,
  uploadingId,
}: {
  transactions: Transaction[]
  categoriesById: Map<string, Category>
  filterAccountId?: string
  isFetching: boolean
  page: number
  totalPages: number
  onOpen: (t: Transaction) => void
  onEdit: (t: Transaction) => void
  onRepeat: (t: Transaction) => void
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
                          <Button variant="ghost" size="icon-sm" onClick={() => onRepeat(tx)} title="Repetir">
                            <Repeat size={13} />
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
  const todayStr = today()
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

// ─── TransactionFormSheet ─────────────────────────────────────────────────────

function TransactionFormSheet({
  open,
  title,
  form,
  accounts,
  categories,
  debts,
  watchType,
  isPending,
  onSubmit,
  onClose,
  fileInputRef,
}: {
  open: boolean
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  accounts: Account[]
  categories: Category[]
  debts: Debt[]
  watchType: TransactionType
  isPending: boolean
  onSubmit: () => void
  onClose: () => void
  fileInputRef?: React.RefObject<HTMLInputElement | null>
}) {
  const isTransfer = watchType === 'Transfer'
  const originId = form.watch('accountId')

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
                  label={isTransfer ? 'Conta de Origem (sai)' : 'Conta'}
                  required
                  validationState={form.formState.errors.accountId ? 'error' : undefined}
                  validationMessage={getFieldError(form.formState.errors, 'accountId')}
                >
                  <NativeSelect
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e)
                      if (e.target.value && e.target.value === form.getValues('destinationAccountId')) {
                        form.setValue('destinationAccountId', '')
                      }
                    }}
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            />

            {isTransfer && (
              <Controller
                name="destinationAccountId"
                control={form.control}
                render={({ field }) => (
                  <Field
                    label="Conta de Destino (entra)"
                    required
                    validationState={form.formState.errors.destinationAccountId ? 'error' : undefined}
                    validationMessage={getFieldError(form.formState.errors, 'destinationAccountId')}
                  >
                    <NativeSelect {...field} value={field.value || ''}>
                      <option value="">Selecione uma conta</option>
                      {accounts
                        .filter((a) => a.id !== originId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            )}

            {!isTransfer && (
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
            )}

            {watchType === 'Expense' && debts.length > 0 && (
              <Controller
                name="debtId"
                control={form.control}
                render={({ field }) => (
                  <Field label="Lançar na dívida">
                    <NativeSelect {...field} value={field.value || ''}>
                      <option value="">Nenhuma</option>
                      {debts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            )}

            <Controller
              name="amount"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <Field
                  label="Valor"
                  required
                  validationState={form.formState.errors.amount ? 'error' : undefined}
                  validationMessage={getFieldError(form.formState.errors, 'amount')}
                >
                  <CurrencyInput value={value ?? 0} onChange={onChange} />
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
                  <DateInput {...field} />
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

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Comprovante (opcional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>
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
