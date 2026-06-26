import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Field,
  Input,
  Select,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components'
import {
  AddFilled,
  EditFilled,
  DeleteFilled,
  ArrowSyncFilled,
  ChevronLeftFilled,
  ChevronRightFilled,
} from '@fluentui/react-icons'
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
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { TransactionTypeIcon } from '../components/TransactionTypeIcon'
import type { TransactionType, Transaction } from '../types'

const transactionTypeLabels: Record<TransactionType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
  Transfer: 'Transferência',
}

const createSchema = z.object({
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().optional(),
  type: z.enum(['Income', 'Expense', 'Transfer']),
  amount: z.number(),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  destinationAccountId: z.string().optional(),
})

const updateSchema = z.object({
  amount: z.number(),
  date: z.string().min(1, 'Data é obrigatória'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

export function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [filterAccountId, setFilterAccountId] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const pageSize = 20

  const { data: result, isLoading } = useTransactions({
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
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      description: '',
    },
  })

  const watchType = createForm.watch('type')

  const filteredCategories = categories?.filter((c) => {
    if (watchType === 'Transfer') return true
    return c.type === watchType
  }) || []

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
    } catch {
      // handled by query client
    }
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
    } catch {
      // handled by query client
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // handled by query client
    }
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

  const activeAccounts = accounts?.filter((a) => a.isActive) || []

  const totalPages = result ? Math.ceil(result.totalCount / result.pageSize) : 0

  return (
    <div>
      <PageHeader title="Transações" action={
        <Button appearance="primary" icon={<AddFilled />} onClick={() => {
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
        }}>
          Nova Transação
        </Button>
      } />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-48">
          <Select
            value={filterAccountId}
            onChange={(_, data) => { setFilterAccountId(data.value); setPage(1) }}
          >
            <option value="">Todas as contas</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={filterType}
            onChange={(_, data) => { setFilterType(data.value); setPage(1) }}
          >
            <option value="">Todos os tipos</option>
            {(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>{label}</option>
              )
            )}
          </Select>
        </div>
        <div>
          <Input type="date" value={filterStartDate} onChange={(_, data) => { setFilterStartDate(data.value); setPage(1) }} placeholder="Data início" />
        </div>
        <div>
          <Input type="date" value={filterEndDate} onChange={(_, data) => { setFilterEndDate(data.value); setPage(1) }} placeholder="Data fim" />
        </div>
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          icon={<ArrowSyncFilled style={{ fontSize: 48 }} />}
          message="Nenhuma transação encontrada"
          action={
            <Button appearance="primary" icon={<AddFilled />} onClick={() => setCreateOpen(true)}>
              Nova Transação
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Descrição</TableHeaderCell>
                <TableHeaderCell>Categoria</TableHeaderCell>
                <TableHeaderCell>Conta</TableHeaderCell>
                <TableHeaderCell>Valor</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TransactionTypeIcon type={transaction.type} />
                      <Text size={200}>{transactionTypeLabels[transaction.type]}</Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{dateFormatter.format(new Date(transaction.date))}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{transaction.description || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{transaction.categoryName || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{transaction.accountName || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <CurrencyBadge
                      value={transaction.type === 'Expense' ? -transaction.amount : transaction.amount}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        appearance="subtle"
                        icon={<EditFilled />}
                        size="small"
                        onClick={() => openEdit(transaction)}
                      />
                      <Button
                        appearance="subtle"
                        icon={<DeleteFilled />}
                        size="small"
                        onClick={() => setDeleteTarget(transaction)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                appearance="subtle"
                icon={<ChevronLeftFilled />}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
              <Text size={200}>
                Página {page} de {totalPages}
              </Text>
              <Button
                appearance="subtle"
                icon={<ChevronRightFilled />}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </div>
          )}
        </>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(_, data) => { if (!data.open) setCreateOpen(false) }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogContent>
              <div className="space-y-4 mt-2">
                <Controller
                  name="type"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Tipo" required>
                      <Select {...field}>
                        {(Object.entries(transactionTypeLabels) as [TransactionType, string][]).map(
                          ([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          )
                        )}
                      </Select>
                    </Field>
                  )}
                />

                <Controller
                  name="accountId"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Conta" required
                      validationState={createForm.formState.errors.accountId ? 'error' : undefined}
                      validationMessage={createForm.formState.errors.accountId?.message}
                    >
                      <Select {...field} value={field.value || ''}>
                        <option value="">Selecione uma conta</option>
                        {activeAccounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </Select>
                    </Field>
                  )}
                />

                {watchType === 'Transfer' && (
                  <Controller
                    name="destinationAccountId"
                    control={createForm.control}
                    render={({ field }) => (
                      <Field label="Conta de Destino">
                        <Select {...field} value={field.value || ''}>
                          <option value="">Selecione uma conta</option>
                          {activeAccounts.filter((a) => a.id !== createForm.watch('accountId')).map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </Select>
                      </Field>
                    )}
                  />
                )}

                <Controller
                  name="categoryId"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Categoria">
                      <Select {...field} value={field.value || ''}>
                        <option value="">Selecione uma categoria</option>
                        {filteredCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Select>
                    </Field>
                  )}
                />

                <Controller
                  name="amount"
                  control={createForm.control}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Field label="Valor" required
                      validationState={createForm.formState.errors.amount ? 'error' : undefined}
                      validationMessage={createForm.formState.errors.amount?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={String(value ?? '')}
                        onChange={(_e, data) => onChange(data.value ? Number(data.value) : 0)}
                        {...rest}
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="date"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Data" required
                      validationState={createForm.formState.errors.date ? 'error' : undefined}
                      validationMessage={createForm.formState.errors.date?.message}
                    >
                      <Input {...field} type="date" />
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Descrição">
                      <Input {...field} placeholder="Descrição opcional" />
                    </Field>
                  )}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={createForm.handleSubmit(handleCreate as () => Promise<void>)}
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(_, data) => { if (!data.open) setEditTarget(null) }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogContent>
              <div className="space-y-4 mt-2">
                <Controller
                  name="amount"
                  control={editForm.control}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Field label="Valor" required
                      validationState={editForm.formState.errors.amount ? 'error' : undefined}
                      validationMessage={editForm.formState.errors.amount?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={String(value ?? '')}
                        onChange={(_e, data) => onChange(data.value ? Number(data.value) : 0)}
                        {...rest}
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="date"
                  control={editForm.control}
                  render={({ field }) => (
                    <Field label="Data" required
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
                      <Select {...field} value={field.value || ''}>
                        <option value="">Selecione uma categoria</option>
                        {(categories || []).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Select>
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
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
                disabled={updateTransaction.isPending}
              >
                {updateTransaction.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação?"
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteTransaction.isPending}
      />
    </div>
  )
}
