import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCreateTransaction } from '../hooks/useTransactions'
import { useUploadAttachment } from '../hooks/useAttachment'
import { useAppToast } from '../hooks/useAppToast'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { useDebts } from '../hooks/useDebts'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DateInput } from './ui/date-input'
import { Field } from './ui/field'
import { NativeSelect } from './ui/native-select'
import { CurrencyInput } from './ui/currency-input'
import { ResponsiveDialog, DialogActions } from './ui/responsive-dialog'
import { getApiErrorMessage } from '../lib/utils'
import { describeAmount, transactionTypeLabels, todayParam, transferRefinement } from '../lib/transactions'
import type { TransactionType, Account, Category, Debt } from '../types'

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

type CreateFormData = z.infer<typeof createSchema>

/** Valores iniciais (ex.: duplicar uma transação). A data é sempre a de hoje. */
export type NewTransactionPrefill = Partial<Omit<CreateFormData, 'date'>>

const emptyForm = (): CreateFormData => ({
  accountId: '',
  categoryId: '',
  type: 'Expense',
  amount: 0,
  description: '',
  date: todayParam(),
  destinationAccountId: '',
  debtId: '',
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldError(errors: Record<string, any>, field: string): string | undefined {
  const err = errors[field]
  if (!err) return undefined
  return typeof err.message === 'string' ? err.message : undefined
}

/** Formulário de nova transação, aberto de qualquer tela (barra inferior, página de transações...). */
export function NewTransactionSheet({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefill?: NewTransactionPrefill
}) {
  const toast = useAppToast()
  const navigate = useNavigate()
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const { data: debts } = useDebts()
  const createTransaction = useCreateTransaction()
  const uploadAttachment = useUploadAttachment()
  const fileRef = useRef<HTMLInputElement>(null)

  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: emptyForm(),
  })

  // Formulário limpo (e com a data de hoje) toda vez que abre.
  useEffect(() => {
    if (open) {
      form.reset({ ...emptyForm(), ...prefill, date: todayParam() })
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open, form, prefill])

  const watchType = form.watch('type')

  // Ao trocar o tipo, limpa campos que não fazem sentido para o novo tipo.
  useEffect(() => {
    if (watchType === 'Transfer') {
      form.setValue('categoryId', '')
      form.setValue('debtId', '')
    } else {
      form.setValue('destinationAccountId', '')
      const currentCategory = categories?.find((c) => c.id === form.getValues('categoryId'))
      if (currentCategory && currentCategory.type !== watchType) form.setValue('categoryId', '')
      if (watchType !== 'Expense') form.setValue('debtId', '')
    }
  }, [watchType, categories, form])

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
      const file = fileRef.current?.files?.[0]
      if (file) {
        await uploadAttachment.mutateAsync({ transactionId: result.id, file })
      }
      onOpenChange(false)
      const accountName = (id?: string) => accounts?.find((a) => a.id === id)?.name
      const details = isTransfer
        ? [accountName(data.accountId), accountName(data.destinationAccountId)].filter(Boolean).join(' → ')
        : [categories?.find((c) => c.id === data.categoryId)?.name, accountName(data.accountId)].filter(Boolean).join(' · ')
      toast.success(describeAmount(data.type, data.amount) + ' registrada', details || undefined, {
        label: 'Ver',
        onClick: () => navigate('/transactions'),
      })
    } catch (error) {
      toast.error('Erro ao salvar transação', getApiErrorMessage(error))
    }
  }

  return (
    <TransactionFormSheet
      open={open}
      title={prefill ? 'Duplicar transação' : 'Nova Transação'}
      form={form}
      accounts={accounts?.filter((a) => a.isActive) ?? []}
      categories={(categories ?? []).filter((c) => c.type === watchType)}
      debts={debts?.filter((d) => !d.isPaid) ?? []}
      watchType={watchType}
      isPending={createTransaction.isPending || uploadAttachment.isPending}
      onSubmit={form.handleSubmit(handleCreate as () => Promise<void>)}
      onClose={() => onOpenChange(false)}
      dirty={form.formState.isDirty}
      fileInputRef={fileRef}
    />
  )
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
  dirty,
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
  dirty?: boolean
  fileInputRef?: React.RefObject<HTMLInputElement | null>
}) {
  const isTransfer = watchType === 'Transfer'
  const originId = form.watch('accountId')

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      title={title}
      confirmOnClose={dirty}
      footer={
        <DialogActions
          primary={
            <Button
              onClick={onSubmit}
              disabled={isPending}
              icon={isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
            >
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          }
          secondary={
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          }
        />
      }
    >
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
    </ResponsiveDialog>
  )
}
