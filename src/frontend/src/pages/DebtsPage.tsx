import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm, Controller, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, DollarSign, Snowflake, CalendarDays } from 'lucide-react'
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, useDebtPayments, useRegisterDebtPayment, useSnowballStrategy } from '../hooks/useDebts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { CurrencyInput } from '../components/ui/currency-input'
import { DateInput } from '../components/ui/date-input'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { Badge } from '../components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Spinner } from '../components/ui/spinner'
import type { DebtType, Debt, DebtPayment } from '../types'

const debtTypeLabels: Record<DebtType, string> = {
  Loan: 'Empréstimo',
  Financing: 'Financiamento',
  CreditCard: 'Cartão de Crédito',
}

const debtTypeEmoji: Record<DebtType, string> = {
  Loan: '\u{1F3E6}',
  Financing: '\u{1F697}',
  CreditCard: '\u{1F4B3}',
}

const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['Loan', 'Financing', 'CreditCard']),
  totalAmount: z.number().min(0.01, 'Valor total é obrigatório'),
  interestRate: z.number().optional(),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  notes: z.string().optional(),
})

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor do pagamento é obrigatório'),
  paymentDate: z.string().min(1, 'Data do pagamento é obrigatória'),
  isEarlyPayment: z.boolean(),
  discount: z.number().optional(),
  notes: z.string().optional(),
})

type DebtFormData = z.infer<typeof debtSchema>
type PaymentFormData = z.infer<typeof paymentSchema>

export function DebtsPage() {
  const { data: debts, isLoading } = useDebts()
  const createDebt = useCreateDebt()
  const updateDebt = useUpdateDebt()
  const deleteDebt = useDeleteDebt()
  const registerPayment = useRegisterDebtPayment()
  const { data: snowball, isLoading: snowballLoading } = useSnowballStrategy()

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'paid'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Debt | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null)
  const [paymentDebtTarget, setPaymentDebtTarget] = useState<Debt | null>(null)
  const [paymentsDebtId, setPaymentsDebtId] = useState<string | null>(null)
  const [snowballOpen, setSnowballOpen] = useState(false)

  const { data: paymentsData, isLoading: paymentsLoading } = useDebtPayments(paymentsDebtId ?? '')

  const createForm = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: { name: '', type: 'Loan', totalAmount: 0, interestRate: undefined, dueDate: '', notes: '' },
  })

  const editForm = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: { name: '', type: 'Loan', totalAmount: 0, interestRate: undefined, dueDate: '', notes: '' },
  })

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, paymentDate: new Date().toISOString().split('T')[0], isEarlyPayment: false, discount: 0, notes: '' },
  })

  const handleCreate = async (data: DebtFormData) => {
    try {
      await createDebt.mutateAsync(data)
      setCreateOpen(false)
      createForm.reset()
    } catch { /* handled by query client */ }
  }

  const handleEdit = async (data: DebtFormData) => {
    if (!editTarget) return
    try {
      await updateDebt.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
    } catch { /* handled by query client */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDebt.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch { /* handled by query client */ }
  }

  const handlePayment = async (data: PaymentFormData) => {
    if (!paymentDebtTarget) return
    try {
      await registerPayment.mutateAsync({ debtId: paymentDebtTarget.id, data })
      setPaymentDebtTarget(null)
      paymentForm.reset()
    } catch { /* handled by query client */ }
  }

  const openEdit = (debt: Debt) => {
    setEditTarget(debt)
    editForm.reset({
      name: debt.name,
      type: debt.type,
      totalAmount: debt.totalAmount,
      interestRate: debt.interestRate,
      dueDate: debt.dueDate.split('T')[0] ?? debt.dueDate,
      notes: debt.notes ?? '',
    })
  }

  const openPayments = (debtId: string) => {
    setPaymentsDebtId(debtId)
  }

  const openPaymentDialog = (debt: Debt) => {
    setPaymentDebtTarget(debt)
    paymentForm.reset({
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      isEarlyPayment: false,
      discount: 0,
      notes: '',
    })
  }

  const filteredDebts = debts?.filter((d) => {
    if (filterTab === 'pending') return !d.isPaid
    if (filterTab === 'paid') return d.isPaid
    return true
  }) ?? []

  const tabs = [
    { key: 'all' as const, label: 'Todas' },
    { key: 'pending' as const, label: 'Pendentes' },
    { key: 'paid' as const, label: 'Quitadas' },
  ]

  return (
    <div>
      <PageHeader
        title="Dívidas"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSnowballOpen(true)} icon={<Snowflake size={16} />}>
              Bola de Neve
            </Button>
            <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
              Nova Dívida
            </Button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              filterTab === tab.key
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredDebts.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={48} />}
          title="Nenhuma dívida encontrada"
          description={filterTab === 'all' ? 'Adicione uma dívida para acompanhar seus pagamentos.' : 'Nenhuma dívida neste filtro.'}
          action={
            filterTab === 'all' ? (
              <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
                Criar Dívida
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={() => openEdit(debt)}
              onDelete={() => setDeleteTarget(debt)}
              onViewPayments={() => openPayments(debt.id)}
              onRegisterPayment={() => openPaymentDialog(debt)}
            />
          ))}
        </div>
      )}

      {/* Create sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Dívida</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <DebtFormContent
              form={createForm}
              mutation={createDebt}
              onSubmit={createForm.handleSubmit(handleCreate as () => Promise<void>)}
              onCancel={() => setCreateOpen(false)}
              submitLabel="Criar Dívida"
              savingLabel="Salvando…"
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Dívida</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <DebtFormContent
              form={editForm}
              mutation={updateDebt}
              onSubmit={editForm.handleSubmit(handleEdit as () => Promise<void>)}
              onCancel={() => setEditTarget(null)}
              submitLabel="Salvar"
              savingLabel="Salvando…"
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Dívida"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteDebt.isPending}
      />

      {/* Payment registration dialog */}
      <Dialog open={!!paymentDebtTarget} onOpenChange={(open) => { if (!open) { setPaymentDebtTarget(null); paymentForm.reset() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {paymentDebtTarget && (
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-lg">{debtTypeEmoji[paymentDebtTarget.type]}</span>
                <span className="font-semibold">{paymentDebtTarget.name}</span>
              </div>
            )}
            <Controller
              name="amount"
              control={paymentForm.control}
              render={({ field: { onChange, value } }) => (
                <Field
                  label="Valor do Pagamento"
                  required
                  validationState={paymentForm.formState.errors.amount ? 'error' : undefined}
                  validationMessage={paymentForm.formState.errors.amount?.message}
                >
                  <CurrencyInput value={value ?? 0} onChange={onChange} />
                </Field>
              )}
            />
            <Controller
              name="paymentDate"
              control={paymentForm.control}
              render={({ field }) => (
                <Field
                  label="Data do Pagamento"
                  required
                  validationState={paymentForm.formState.errors.paymentDate ? 'error' : undefined}
                  validationMessage={paymentForm.formState.errors.paymentDate?.message}
                >
                  <DateInput {...field} />
                </Field>
              )}
            />
            <Controller
              name="isEarlyPayment"
              control={paymentForm.control}
              render={({ field: { value, onChange, ...rest } }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    {...rest}
                  />
                  <span className="text-sm">Pagamento Antecipado</span>
                </label>
              )}
            />
            {paymentForm.watch('isEarlyPayment') && (
              <Controller
                name="discount"
                control={paymentForm.control}
                render={({ field: { onChange, value } }) => (
                  <Field label="Desconto">
                    <CurrencyInput value={value ?? 0} onChange={onChange} />
                  </Field>
                )}
              />
            )}
            <Controller
              name="notes"
              control={paymentForm.control}
              render={({ field }) => (
                <Field label="Observações">
                  <Input {...field} placeholder="Observações sobre o pagamento" />
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentDebtTarget(null); paymentForm.reset() }}>
              Cancelar
            </Button>
            <Button
              onClick={paymentForm.handleSubmit(handlePayment as () => Promise<void>)}
              disabled={registerPayment.isPending}
              icon={registerPayment.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {registerPayment.isPending ? 'Salvando…' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payments list dialog */}
      <Dialog open={!!paymentsDebtId} onOpenChange={(open) => { if (!open) setPaymentsDebtId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamentos</DialogTitle>
          </DialogHeader>
          {paymentsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !paymentsData || paymentsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum pagamento registrado.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {paymentsData.map((payment: DebtPayment) => (
                <div key={payment.id} className="border border-border rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <CurrencyBadge value={payment.amount} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(payment.paymentDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {payment.isEarlyPayment && (
                      <Badge variant="income">Antecipado</Badge>
                    )}
                    {payment.discount > 0 && (
                      <Badge variant="secondary">Desconto: {payment.discount.toFixed(2)}</Badge>
                    )}
                  </div>
                  {payment.notes && (
                    <p className="text-xs text-muted-foreground">{payment.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentsDebtId(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snowball strategy dialog */}
      <Dialog open={snowballOpen} onOpenChange={setSnowballOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estratégia Bola de Neve</DialogTitle>
          </DialogHeader>
          {snowballLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !snowball ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma dívida para calcular a estratégia.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Total Restante</p>
                  <CurrencyBadge value={snowball.totalRemaining} size="sm" />
                </div>
                <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Meses Estimados</p>
                  <p className="font-semibold text-base">{snowball.estimatedMonthsToPayOff} meses</p>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {snowball.debts.map((item, index) => (
                  <motion.div
                    key={item.debtId}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.25, ease: 'easeOut' }}
                    className="flex items-center justify-between border border-border rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">{debtTypeEmoji[item.type]}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{debtTypeLabels[item.type]}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <CurrencyBadge value={item.remainingAmount} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnowballOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DebtCard({
  debt,
  onEdit,
  onDelete,
  onViewPayments,
  onRegisterPayment,
}: {
  debt: Debt
  onEdit: () => void
  onDelete: () => void
  onViewPayments: () => void
  onRegisterPayment: () => void
}) {
  const emoji = debtTypeEmoji[debt.type]
  const label = debtTypeLabels[debt.type]
  const progress = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0
  const dueDate = new Date(debt.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')

  return (
    <div className="card p-5 space-y-4 cursor-pointer" onClick={onViewPayments}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{debt.name}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <CurrencyBadge value={debt.totalAmount} size="sm" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pago</span>
          <CurrencyBadge value={debt.paidAmount} size="sm" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Restante</span>
          <CurrencyBadge value={debt.remainingAmount} size="sm" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays size={12} />
          <span>Vence: {dueDate}</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {debt.isPaid ? (
            <Badge variant="income">Quitada</Badge>
          ) : (
            <Badge variant="expense">Pendente</Badge>
          )}
          <Button size="sm" onClick={onRegisterPayment}>
            Pagar
          </Button>
        </div>
      </div>
    </div>
  )
}

function DebtFormContent({
  form,
  mutation,
  onSubmit,
  onCancel,
  submitLabel,
  savingLabel,
}: {
  form: UseFormReturn<DebtFormData>
  mutation: { isPending: boolean }
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  savingLabel: string
}) {
  return (
    <>
      <div className="space-y-4">
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <Field
              label="Nome"
              required
              validationState={form.formState.errors.name ? 'error' : undefined}
              validationMessage={form.formState.errors.name?.message}
            >
              <Input {...field} placeholder="Ex: Financiamento Imobiliário" />
            </Field>
          )}
        />
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Field label="Tipo" required>
              <NativeSelect {...field}>
                {(Object.entries(debtTypeLabels) as [DebtType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </NativeSelect>
            </Field>
          )}
        />
        <Controller
          name="totalAmount"
          control={form.control}
          render={({ field: { onChange, value } }) => (
            <Field
              label="Valor Total"
              required
              validationState={form.formState.errors.totalAmount ? 'error' : undefined}
              validationMessage={form.formState.errors.totalAmount?.message}
            >
              <CurrencyInput value={value ?? 0} onChange={onChange} />
            </Field>
          )}
        />
        <Controller
          name="interestRate"
          control={form.control}
          render={({ field: { onChange, value, ...rest } }) => (
            <Field label="Taxa de Juros (%)">
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 2.5"
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                {...rest}
              />
            </Field>
          )}
        />
        <Controller
          name="dueDate"
          control={form.control}
          render={({ field }) => (
            <Field
              label="Data de Vencimento"
              required
              validationState={form.formState.errors.dueDate ? 'error' : undefined}
              validationMessage={form.formState.errors.dueDate?.message}
            >
              <DateInput {...field} />
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Field label="Observações">
              <Input {...field} placeholder="Observações opcionais" />
            </Field>
          )}
        />
      </div>
      <div className="flex gap-2 pt-5">
        <Button
          className="flex-1"
          onClick={onSubmit}
          disabled={mutation.isPending}
          icon={mutation.isPending ? <Spinner size="tiny" /> : undefined}
        >
          {mutation.isPending ? savingLabel : submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </>
  )
}
