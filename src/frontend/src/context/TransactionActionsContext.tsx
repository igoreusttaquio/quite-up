import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Repeat } from 'lucide-react'
import { useCreateTransaction, useUpdateTransaction, useUndoableDeleteTransaction } from '../hooks/useTransactions'
import { useUploadAttachment, useDeleteAttachment } from '../hooks/useAttachment'
import { useAppToast } from '../hooks/useAppToast'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useNewTransaction } from './NewTransactionContext'
import { TransactionDetailDialog } from '../components/transactions/TransactionDetailDialog'
import { ReceiptViewer } from '../components/ReceiptViewer'
import { ResponsiveDialog, DialogActions, ConfirmDialog } from '../components/ui/responsive-dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { DateInput } from '../components/ui/date-input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { CurrencyInput } from '../components/ui/currency-input'
import { getApiErrorMessage } from '../lib/utils'
import { compressImage } from '../lib/image'
import { isOnline, isTempTransactionId, usePendingSyncIds } from '../lib/offline'
import {
  describeAmount,
  formatBRL,
  signedAmount,
  todayParam,
  transactionTypeLabels,
  transferRefinement,
} from '../lib/transactions'
import type { Account, DashboardSummary, Transaction, TransactionPage } from '../types'

/*
 * Ações sobre uma transação existente, disponíveis em qualquer tela do layout
 * (Transações, Dashboard...): detalhe, editar, duplicar, excluir com desfazer e comprovante.
 */

interface OpenDetailOptions {
  /** Conta filtrada na tela de origem: define o sinal de transferências no detalhe. */
  accountId?: string
}

interface TransactionActionsValue {
  openDetail: (transaction: Transaction, options?: OpenDetailOptions) => void
  openEdit: (transaction: Transaction) => void
  requestDelete: (transaction: Transaction) => void
  /** Formulário completo de nova transação, preenchido (data de hoje). */
  duplicate: (transaction: Transaction) => void
  /** Diálogo rápido: repete a transação mudando só valor e data. */
  repeat: (transaction: Transaction) => void
  viewReceipt: (transaction: Transaction) => void
  /** Online aguarda o envio; offline enfileira (o arquivo fica no IndexedDB). */
  uploadAttachment: (transactionId: string, file: File) => Promise<void>
  removeAttachment: (transactionId: string) => Promise<void>
}

const TransactionActionsContext = createContext<TransactionActionsValue | null>(null)

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

type UpdateFormData = z.infer<typeof updateSchema>

const repeatSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type RepeatFormData = z.infer<typeof repeatSchema>

const dateBR = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')

/** Garante que a conta atual da transação apareça no select, mesmo se estiver inativa. */
function withCurrentAccount(accounts: Account[], id?: string, name?: string): Account[] {
  if (!id || accounts.some((a) => a.id === id)) return accounts
  return [...accounts, { id, name: `${name ?? 'Conta'} (inativa)`, type: 'Other', balance: 0, isActive: false, createdAt: '' }]
}

/** Versão mais recente da transação nos caches (listas de transações e dashboard). */
function useLatestTransaction(snapshot: Transaction | null): Transaction | null {
  const queryClient = useQueryClient()
  const cache = queryClient.getQueryCache()
  // Re-renderiza quando o cache muda (ex.: após anexar comprovante ou editar).
  useSyncExternalStore(
    useCallback((cb) => (snapshot ? cache.subscribe(cb) : () => {}), [cache, snapshot]),
    () => (snapshot ? cache.getAll().reduce((n, q) => n + q.state.dataUpdatedAt, 0) : 0)
  )
  if (!snapshot) return null

  for (const [, page] of queryClient.getQueriesData<TransactionPage>({ queryKey: ['transactions'] })) {
    const found = page && 'items' in page ? page.items.find((t) => t.id === snapshot.id) : undefined
    if (found) return found
  }
  for (const [, summary] of queryClient.getQueriesData<DashboardSummary>({ queryKey: ['dashboard'] })) {
    const found = summary?.recentTransactions?.find((t) => t.id === snapshot.id)
    if (found) return found
  }
  return snapshot
}

export function TransactionActionsProvider({ children }: { children: ReactNode }) {
  const toast = useAppToast()
  const { open: openNewTransaction } = useNewTransaction()
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const updateTransaction = useUpdateTransaction()
  const createTransaction = useCreateTransaction()
  const deleteWithUndoRaw = useUndoableDeleteTransaction()
  const upload = useUploadAttachment()
  const deleteAttachmentMutation = useDeleteAttachment()
  const pendingSyncIds = usePendingSyncIds()

  const [detail, setDetail] = useState<{ tx: Transaction; accountId?: string } | null>(null)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [repeatTarget, setRepeatTarget] = useState<Transaction | null>(null)
  const [receipt, setReceipt] = useState<{ attachmentId: string; fileName: string; contentType: string } | null>(null)

  const detailTx = useLatestTransaction(detail?.tx ?? null)

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      type: 'Expense',
      accountId: '',
      destinationAccountId: '',
      amount: 0,
      date: todayParam(),
      categoryId: '',
      description: '',
    },
  })

  const repeatForm = useForm<RepeatFormData>({
    resolver: zodResolver(repeatSchema),
    defaultValues: { amount: 0, date: todayParam() },
  })

  /** Criada offline e ainda sem id no servidor: editar/excluir só depois de sincronizar. */
  const blockIfNotSynced = useCallback(
    (transaction: Transaction) => {
      if (!isTempTransactionId(transaction.id)) return false
      toast.info('Aguardando sincronização', 'Esta transação foi criada offline; edite ou exclua depois que ela sincronizar.')
      return true
    },
    [toast]
  )

  const openEdit = useCallback(
    (transaction: Transaction) => {
      if (blockIfNotSynced(transaction)) return
      setDetail(null)
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
    },
    [blockIfNotSynced, editForm]
  )

  const requestDelete = useCallback(
    (transaction: Transaction) => {
      if (blockIfNotSynced(transaction)) return
      setDetail(null)
      setDeleteTarget(transaction)
    },
    [blockIfNotSynced]
  )

  const deleteWithUndo = (transaction: Transaction) => {
    setDetail(null)
    setDeleteTarget(null)
    deleteWithUndoRaw(transaction.id, describeAmount(transaction.type, transaction.amount))
  }

  const duplicate = useCallback(
    (transaction: Transaction) => {
      setDetail(null)
      const isTransfer = transaction.type === 'Transfer'
      openNewTransaction({
        type: transaction.type,
        amount: transaction.amount,
        accountId: transaction.accountId,
        categoryId: !isTransfer ? transaction.categoryId ?? '' : '',
        destinationAccountId: isTransfer ? transaction.destinationAccountId ?? '' : '',
        description: transaction.description ?? '',
        debtId: transaction.type === 'Expense' ? transaction.debtId ?? '' : '',
      })
    },
    [openNewTransaction]
  )

  const repeat = useCallback(
    (transaction: Transaction) => {
      setDetail(null)
      setRepeatTarget(transaction)
      repeatForm.reset({ amount: transaction.amount, date: todayParam() })
    },
    [repeatForm]
  )

  const handleRepeat = async (data: RepeatFormData) => {
    const t = repeatTarget
    if (!t) return
    const isTransfer = t.type === 'Transfer'
    const variables = {
      type: t.type,
      amount: data.amount,
      date: data.date,
      accountId: t.accountId,
      categoryId: !isTransfer ? t.categoryId || undefined : undefined,
      destinationAccountId: isTransfer ? t.destinationAccountId || undefined : undefined,
      description: t.description || undefined,
      debtId: t.type === 'Expense' ? t.debtId || undefined : undefined,
      clientRequestId: crypto.randomUUID(),
    }
    if (!isOnline()) {
      createTransaction.mutate(variables)
      setRepeatTarget(null)
      toast.info('Salva offline', 'Será sincronizada quando a conexão voltar.')
      return
    }
    try {
      await createTransaction.mutateAsync(variables)
      setRepeatTarget(null)
      toast.success(describeAmount(t.type, data.amount) + ' repetida', 'Lançada em ' + dateBR(data.date))
    } catch (error) {
      toast.error('Erro ao repetir transação', getApiErrorMessage(error))
    }
  }

  const viewReceipt = useCallback((transaction: Transaction) => {
    if (!transaction.attachmentId) return
    setReceipt({
      attachmentId: transaction.attachmentId,
      fileName: transaction.attachmentFileName ?? 'Comprovante',
      contentType: transaction.attachmentContentType ?? '',
    })
  }, [])

  const uploadAttachment = useCallback(
    async (transactionId: string, file: File) => {
      if (isTempTransactionId(transactionId)) {
        toast.info('Aguardando sincronização', 'Anexe o comprovante depois que a transação sincronizar.')
        return
      }
      const variables = { transactionId, file: await compressImage(file) }
      if (!isOnline()) {
        upload.mutate(variables)
        toast.info('Comprovante salvo offline', 'Será enviado quando a conexão voltar.')
        return
      }
      await upload.mutateAsync(variables).then(
        () => undefined,
        () => undefined
      )
    },
    [toast, upload]
  )

  const removeAttachment = useCallback(
    async (transactionId: string) => {
      if (!isOnline()) {
        deleteAttachmentMutation.mutate(transactionId)
        toast.info('Remoção salva offline', 'Será sincronizada quando a conexão voltar.')
        return
      }
      await deleteAttachmentMutation.mutateAsync(transactionId).catch(() => undefined)
    },
    [toast, deleteAttachmentMutation]
  )

  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return
    const isTransfer = editTarget.type === 'Transfer'
    const variables = {
      id: editTarget.id,
      data: {
        amount: data.amount,
        date: data.date,
        accountId: data.accountId,
        destinationAccountId: isTransfer ? data.destinationAccountId || undefined : undefined,
        categoryId: !isTransfer ? data.categoryId || undefined : undefined,
        description: data.description || undefined,
      },
    }
    // Offline: aplica na hora (otimista) e sincroniza depois.
    if (!isOnline()) {
      updateTransaction.mutate(variables)
      setEditTarget(null)
      toast.info('Alteração salva offline', 'Será sincronizada quando a conexão voltar.')
      return
    }
    try {
      await updateTransaction.mutateAsync(variables)
      setEditTarget(null)
      toast.success('Transação atualizada', describeAmount(editTarget.type, data.amount))
    } catch (error) {
      toast.error('Erro ao atualizar transação', getApiErrorMessage(error))
    }
  }

  const openDetail = useCallback(
    (transaction: Transaction, options?: OpenDetailOptions) => setDetail({ tx: transaction, accountId: options?.accountId }),
    []
  )

  const value = useMemo<TransactionActionsValue>(
    () => ({ openDetail, openEdit, requestDelete, duplicate, repeat, viewReceipt, uploadAttachment, removeAttachment }),
    [openDetail, openEdit, requestDelete, duplicate, repeat, viewReceipt, uploadAttachment, removeAttachment]
  )

  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []
  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]))
  const editAccounts = withCurrentAccount(activeAccounts, editTarget?.accountId, editTarget?.accountName)
  const editDestinationAccounts = withCurrentAccount(
    activeAccounts,
    editTarget?.destinationAccountId,
    editTarget?.destinationAccountName
  ).filter((a) => a.id !== editForm.watch('accountId'))
  const editCategories = (categories ?? []).filter((c) => c.type === editTarget?.type)

  return (
    <TransactionActionsContext.Provider value={value}>
      {children}

      <TransactionDetailDialog
        transaction={detailTx}
        category={detailTx?.categoryId ? categoriesById.get(detailTx.categoryId) : undefined}
        accounts={accounts ?? []}
        signedAmount={(t) => signedAmount(t, detail?.accountId)}
        onOpenChange={(open) => { if (!open) setDetail(null) }}
        onEdit={openEdit}
        onDuplicate={duplicate}
        onRepeat={repeat}
        onDelete={deleteWithUndo}
        onUploadAttachment={(t, file) => uploadAttachment(t.id, file)}
        onRemoveAttachment={(t) => removeAttachment(t.id)}
        onViewAttachment={viewReceipt}
        uploading={upload.isPending && isOnline()}
        pendingSync={!!detailTx && pendingSyncIds.has(detailTx.id)}
      />

      <ResponsiveDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        title={editTarget?.type === 'Transfer' ? 'Editar Transferência' : 'Editar Transação'}
        confirmOnClose={editForm.formState.isDirty}
        footer={
          <DialogActions
            primary={
              <Button
                onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
                disabled={updateTransaction.isPending && isOnline()}
                icon={updateTransaction.isPending && isOnline() ? <Loader2 size={14} className="animate-spin" /> : undefined}
              >
                {updateTransaction.isPending && isOnline() ? 'Salvando…' : 'Salvar'}
              </Button>
            }
            secondary={
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            }
          />
        }
      >
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
      </ResponsiveDialog>

      {/* Repetir: só valor e data (o resto vem da transação original) */}
      <ResponsiveDialog
        open={!!repeatTarget}
        onOpenChange={(open) => { if (!open) setRepeatTarget(null) }}
        title="Repetir transação"
        description={
          repeatTarget
            ? [
                repeatTarget.description || transactionTypeLabels[repeatTarget.type],
                repeatTarget.type === 'Transfer'
                  ? `${repeatTarget.accountName} → ${repeatTarget.destinationAccountName ?? '—'}`
                  : [repeatTarget.categoryName, repeatTarget.accountName].filter(Boolean).join(' · '),
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        size="sm"
        footer={
          <DialogActions
            primary={
              <Button
                onClick={repeatForm.handleSubmit(handleRepeat as () => Promise<void>)}
                disabled={createTransaction.isPending && isOnline()}
                icon={createTransaction.isPending && isOnline() ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
              >
                {createTransaction.isPending && isOnline() ? 'Salvando…' : 'Repetir'}
              </Button>
            }
            secondary={
              <Button variant="outline" onClick={() => setRepeatTarget(null)}>Cancelar</Button>
            }
          />
        }
      >
        <div className="grid grid-cols-2 gap-3">
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
      </ResponsiveDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={
          deleteTarget
            ? `Excluir “${deleteTarget.description || transactionTypeLabels[deleteTarget.type]}” de ${formatBRL(deleteTarget.amount)}?`
            : ''
        }
        message="Você poderá desfazer logo em seguida."
        confirmText="Excluir"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return
          navigator.vibrate?.(10)
          deleteWithUndo(deleteTarget)
        }}
      />

      {receipt && (
        <ReceiptViewer
          open
          onClose={() => setReceipt(null)}
          attachmentId={receipt.attachmentId}
          fileName={receipt.fileName}
          contentType={receipt.contentType}
          title={`Comprovante - ${receipt.fileName}`}
        />
      )}
    </TransactionActionsContext.Provider>
  )
}

export function useTransactionActions() {
  const ctx = useContext(TransactionActionsContext)
  if (!ctx) throw new Error('useTransactionActions deve ser usado dentro de TransactionActionsProvider')
  return ctx
}
