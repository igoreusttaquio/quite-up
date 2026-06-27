import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, Controller, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight, Filter, X, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../components/ui/sheet'
import {
  useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction,
} from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { TransactionTypeIcon } from '../components/TransactionTypeIcon'
import type { TransactionType, Transaction, Account, Category } from '../types'

const transactionTypeLabels: Record<TransactionType, string> = { Income: 'Receita', Expense: 'Despesa', Transfer: 'Transferência' }
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

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const filterAccountId = searchParams.get('account') || ''
  const filterType = searchParams.get('type') || ''
  const filterStartDate = searchParams.get('from') || ''
  const filterEndDate = searchParams.get('to') || ''
  const pageSize = 20

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); if (value) n.set(key, value); else n.delete(key); n.delete('page'); return n }, { replace: true })
  }
  const setPage = (p: number) => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true })
  }
  const clearFilters = () => setSearchParams({}, { replace: true })
  const hasActiveFilters = !!(filterAccountId || filterType || filterStartDate || filterEndDate)

  const { data: result, isLoading, isFetching } = useTransactions({ page, pageSize, accountId: filterAccountId || undefined, type: (filterType as TransactionType) || undefined, startDate: filterStartDate || undefined, endDate: filterEndDate || undefined })
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema), defaultValues: { accountId: '', categoryId: '', type: 'Expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0], destinationAccountId: '' } })
  const editForm = useForm<UpdateFormData>({ resolver: zodResolver(updateSchema), defaultValues: { amount: 0, date: new Date().toISOString().split('T')[0], categoryId: '', description: '' } })

  const watchType = createForm.watch('type')
  const filteredCategories = categories?.filter((c) => watchType === 'Transfer' || c.type === watchType) ?? []
  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []
  const totalPages = result ? Math.ceil(result.totalCount / result.pageSize) : 0

  const handleCreate = async (data: CreateFormData) => { try { await createTransaction.mutateAsync({ ...data, categoryId: data.categoryId || undefined, destinationAccountId: data.destinationAccountId || undefined, description: data.description || undefined }); setCreateOpen(false); createForm.reset() } catch {} }
  const handleEdit = async (data: UpdateFormData) => { if (!editTarget) return; try { await updateTransaction.mutateAsync({ id: editTarget.id, data: { ...data, categoryId: data.categoryId || undefined, description: data.description || undefined } }); setEditTarget(null) } catch {} }
  const handleDelete = async () => { if (!deleteTarget) return; try { await deleteTransaction.mutateAsync(deleteTarget.id); setDeleteTarget(null) } catch {} }
  const openEdit = (t: Transaction) => { setEditTarget(t); editForm.reset({ amount: t.amount, date: t.date, categoryId: t.categoryId || '', description: t.description || '' }) }
  const openCreate = () => { createForm.reset({ accountId: '', categoryId: '', type: 'Expense', amount: 0, description: '', date: new Date().toISOString().split('T')[0], destinationAccountId: '' }); setCreateOpen(true) }

  return (
    <div>
      <PageHeader title="Transações" action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Transação</Button>} />

      <TransactionFilterBar accounts={activeAccounts} filterAccountId={filterAccountId} filterType={filterType} filterStartDate={filterStartDate} filterEndDate={filterEndDate} hasActiveFilters={hasActiveFilters}
        onChangeAccount={(v) => updateFilter('account', v)} onChangeType={(v) => updateFilter('type', v)} onChangeStartDate={(v) => updateFilter('from', v)} onChangeEndDate={(v) => updateFilter('to', v)} onClear={clearFilters} />

      {isLoading ? <SkeletonTable rows={8} /> : !result || result.items.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight className="h-12 w-12" />} title="Nenhuma transação encontrada"
          description={hasActiveFilters ? 'Tente ajustar os filtros.' : 'Registre sua primeira transação.'}
          action={!hasActiveFilters ? <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Transação</Button> : <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>} />
      ) : (
        <TransactionTable transactions={result.items} isFetching={isFetching} page={page} totalPages={totalPages} onEdit={openEdit} onDelete={(t) => setDeleteTarget(t)} onPageChange={setPage} />
      )}

      <TransactionFormDialog open={createOpen} title="Nova Transação" form={createForm} accounts={activeAccounts} categories={filteredCategories} watchType={watchType} isPending={createTransaction.isPending}
        onSubmit={createForm.handleSubmit(handleCreate as () => Promise<void>)} onClose={() => setCreateOpen(false)} />

      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Valor</Label>
              <Controller name="amount" control={editForm.control} render={({ field: { onChange, value, ...rest } }) => (
                <Input type="number" step="0.01" placeholder="0,00" value={String(value ?? '')} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)} {...rest} />)} />
            </div>
            <div className="space-y-2"><Label>Data</Label>
              <Controller name="date" control={editForm.control} render={({ field }) => <Input {...field} type="date" />} />
            </div>
            <div className="space-y-2"><Label>Categoria</Label>
              <Controller name="categoryId" control={editForm.control} render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                  <SelectContent><SelectItem value="Sem categoria">Sem categoria</SelectItem>{(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>)} />
            </div>
            <div className="space-y-2"><Label>Descrição</Label>
              <Controller name="description" control={editForm.control} render={({ field }) => <Input {...field} placeholder="Descrição opcional" />} />
            </div>
          </div>
          <DialogFooter><Button onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)} disabled={updateTransaction.isPending}>{updateTransaction.isPending ? 'Salvando…' : 'Salvar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} title="Excluir Transação" message="Tem certeza?" confirmText="Excluir" destructive onConfirm={handleDelete} loading={deleteTransaction.isPending} />
    </div>
  )
}

function TransactionFilterBar({ accounts, filterAccountId, filterType, filterStartDate, filterEndDate, hasActiveFilters, onChangeAccount, onChangeType, onChangeStartDate, onChangeEndDate, onClear }: {
  accounts: Account[]; filterAccountId: string; filterType: string; filterStartDate: string; filterEndDate: string; hasActiveFilters: boolean
  onChangeAccount: (v: string) => void; onChangeType: (v: string) => void; onChangeStartDate: (v: string) => void; onChangeEndDate: (v: string) => void; onClear: () => void
}) {
  return (
    <div className="mb-5 rounded-xl border bg-card shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground">Filtros</p>
        {hasActiveFilters && <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}><X className="h-3 w-3 mr-1" />Limpar</Button>}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select value={filterAccountId} onValueChange={onChangeAccount}>
            <SelectTrigger><SelectValue placeholder="Todas as contas" /></SelectTrigger>
            <SelectContent><SelectItem value="">Todas as contas</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={filterType} onValueChange={onChangeType}>
            <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
            <SelectContent><SelectItem value="">Todos os tipos</SelectItem>{(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={filterStartDate} onChange={(e) => onChangeStartDate(e.target.value)} className="w-36" />
          <p className="text-xs text-muted-foreground">até</p>
          <Input type="date" value={filterEndDate} onChange={(e) => onChangeEndDate(e.target.value)} className="w-36" />
        </div>
      </div>
    </div>
  )
}

function TransactionTable({ transactions, isFetching, page, totalPages, onEdit, onDelete, onPageChange }: {
  transactions: Transaction[]; isFetching: boolean; page: number; totalPages: number
  onEdit: (t: Transaction) => void; onDelete: (t: Transaction) => void; onPageChange: (p: number) => void
}) {
  return (
    <div>
      <div className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <div className="hidden md:grid grid-cols-[44px_1fr_140px_140px_130px_72px] gap-3 px-4 py-2.5 border-b bg-muted/50">
          {['', 'Descrição / Data', 'Categoria', 'Conta', 'Valor', ''].map((h, i) => (
            <p key={i} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>
        <ul className="divide-y">
          {transactions.map((tx) => (
            <li key={tx.id} className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1fr_140px_140px_130px_72px] gap-3 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-center"><TransactionTypeIcon type={tx.type} /></div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{tx.description || transactionTypeLabels[tx.type]}</p>
                <p className="text-[10px] text-muted-foreground">{dateFormatter.format(new Date(tx.date))}{tx.accountName && <span className="md:hidden"> · {tx.accountName}</span>}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate hidden md:block">{tx.categoryName || '—'}</p>
              <p className="text-xs text-muted-foreground truncate hidden md:block">{tx.accountName || '—'}</p>
              <div><CurrencyBadge value={tx.type === 'Expense' ? -tx.amount : tx.amount} /></div>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon" onClick={() => onEdit(tx)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(tx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {getPaginationPages(page, totalPages).map((item, i) =>
            item === '…' ? <p key={`e${i}`} className="text-xs text-muted-foreground px-1">…</p>
            : <Button key={item} variant={item === page ? 'default' : 'outline'} size="sm" className="min-w-8" onClick={() => onPageChange(item as number)}>{item}</Button>
          )}
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          {isFetching && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
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

function TransactionFormDialog({ open, title, form, accounts, categories, watchType, isPending, onSubmit, onClose }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open: boolean; title: string; form: UseFormReturn<any>; accounts: Account[]; categories: Category[]; watchType: TransactionType; isPending: boolean; onSubmit: () => void; onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Tipo</Label>
            <Controller name="type" control={form.control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>)} />
          </div>
          <div className="space-y-2"><Label>Conta</Label>
            <Controller name="accountId" control={form.control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent><SelectItem value="">Selecione</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>)} />
          </div>
          {watchType === 'Transfer' && (
            <div className="space-y-2"><Label>Conta de Destino</Label>
              <Controller name="destinationAccountId" control={form.control} render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="">Selecione</SelectItem>{accounts.filter((a) => a.id !== form.watch('accountId')).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>)} />
            </div>
          )}
          <div className="space-y-2"><Label>Categoria</Label>
            <Controller name="categoryId" control={form.control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent><SelectItem value="">Sem categoria</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>)} />
          </div>
          <div className="space-y-2"><Label>Valor</Label>
            <Controller name="amount" control={form.control} render={({ field: { onChange, value, ...rest } }) => (
              <Input type="number" step="0.01" placeholder="0,00" value={String(value ?? '')} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)} {...rest} />)} />
          </div>
          <div className="space-y-2"><Label>Data</Label>
            <Controller name="date" control={form.control} render={({ field }) => <Input {...field} type="date" />} />
          </div>
          <div className="space-y-2"><Label>Descrição</Label>
            <Controller name="description" control={form.control} render={({ field }) => <Input {...field} placeholder="Descrição opcional" />} />
          </div>
        </div>
        <SheetFooter><Button onClick={onSubmit} disabled={isPending}>{isPending ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
