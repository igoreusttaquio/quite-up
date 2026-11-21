import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useForm, Controller, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, DollarSign, Snowflake, CalendarDays, Paperclip, PartyPopper, AlertTriangle, Clock } from 'lucide-react'
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, useDebtPayments, useRegisterDebtPayment, useUpdateDebtPayment, useDeleteDebtPayment, useSnowballStrategy } from '../hooks/useDebts'
import { useAppToast } from '../hooks/useAppToast'
import { cn, getApiErrorMessage, toDateParam } from '../lib/utils'
import { useAccounts } from '../hooks/useAccounts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { IconBadge } from '../components/IconBadge'
import { debtTypeVisual } from '../lib/entity-icons'
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
import { ReceiptViewer } from '../components/ReceiptViewer'
import { useUploadAttachment } from '../hooks/useAttachment'
import type { DebtType, Debt, DebtPayment } from '../types'

const debtTypeLabels: Record<DebtType, string> = {
  Loan: 'Empréstimo',
  Financing: 'Financiamento',
  CreditCard: 'Cartão de Crédito',
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

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
  accountId: z.string().optional(),
})

type DebtFormData = z.infer<typeof debtSchema>
type PaymentFormData = z.infer<typeof paymentSchema>

export function DebtsPage() {
  const { data: debts, isLoading } = useDebts()
  const { data: accounts } = useAccounts()
  const createDebt = useCreateDebt()
  const updateDebt = useUpdateDebt()
  const deleteDebt = useDeleteDebt()
  const registerPayment = useRegisterDebtPayment()
  const updatePayment = useUpdateDebtPayment()
  const deletePayment = useDeleteDebtPayment()
  const toast = useAppToast()
  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []
  const { data: snowball, isLoading: snowballLoading } = useSnowballStrategy()
  const snowballNextId = snowball?.debts.find((d) => d.order === 1)?.debtId

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'paid'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Debt | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null)
  const [paymentDebtTarget, setPaymentDebtTarget] = useState<Debt | null>(null)
  const [editingPayment, setEditingPayment] = useState<DebtPayment | null>(null)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<DebtPayment | null>(null)
  const [paymentsDebtId, setPaymentsDebtId] = useState<string | null>(null)
  const [snowballOpen, setSnowballOpen] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<{ attachmentId: string; fileName: string; contentType: string } | null>(null)
  const paymentFileInputRef = useRef<HTMLInputElement>(null)

  const uploadAttachment = useUploadAttachment()

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

  const closePaymentDialog = () => {
    setPaymentDebtTarget(null)
    setEditingPayment(null)
    paymentForm.reset()
  }

  const handlePayment = async (data: PaymentFormData) => {
    if (!paymentDebtTarget) return
    const payload = {
      ...data,
      discount: data.isEarlyPayment ? data.discount ?? 0 : 0,
      notes: data.notes || undefined,
      accountId: data.accountId || undefined,
    }
    try {
      const result = editingPayment
        ? await updatePayment.mutateAsync({ debtId: paymentDebtTarget.id, paymentId: editingPayment.id, data: payload })
        : await registerPayment.mutateAsync({ debtId: paymentDebtTarget.id, data: payload })
      const file = paymentFileInputRef.current?.files?.[0]
      if (file && result.transactionId && !result.attachmentId) {
        await uploadAttachment.mutateAsync({ transactionId: result.transactionId, file })
      }
      toast.success(
        (editingPayment ? 'Pagamento atualizado: ' : 'Pagamento de ') + brl.format(data.amount) + (editingPayment ? '' : ' registrado'),
        paymentDebtTarget.name
      )
      closePaymentDialog()
      if (paymentFileInputRef.current) paymentFileInputRef.current.value = ''
    } catch (error) {
      toast.error('Erro ao salvar pagamento', getApiErrorMessage(error))
    }
  }

  const handleDeletePayment = async () => {
    if (!deletePaymentTarget) return
    try {
      await deletePayment.mutateAsync({ debtId: deletePaymentTarget.debtId, paymentId: deletePaymentTarget.id })
      setDeletePaymentTarget(null)
      toast.success('Pagamento excluído', 'O valor voltou para o saldo devedor.')
    } catch (error) {
      toast.error('Erro ao excluir pagamento', getApiErrorMessage(error))
    }
  }

  const openEditPayment = (payment: DebtPayment) => {
    const debt = debts?.find((d) => d.id === payment.debtId)
    if (!debt) return
    setEditingPayment(payment)
    setPaymentDebtTarget(debt)
    paymentForm.reset({
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      isEarlyPayment: payment.isEarlyPayment,
      discount: payment.discount,
      notes: payment.notes ?? '',
      accountId: payment.accountId ?? '',
    })
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
    setEditingPayment(null)
    setPaymentDebtTarget(debt)
    paymentForm.reset({
      amount: 0,
      paymentDate: toDateParam(new Date()),
      isEarlyPayment: false,
      discount: 0,
      notes: '',
      accountId: '',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-4">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              isSnowballNext={debt.id === snowballNextId}
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
      <Dialog open={!!paymentDebtTarget} onOpenChange={(open) => { if (!open) closePaymentDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Editar Pagamento' : 'Registrar Pagamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {paymentDebtTarget && (
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <DebtTypeIcon type={paymentDebtTarget.type} />
                <span className="font-semibold">{paymentDebtTarget.name}</span>
              </div>
            )}
            {editingPayment && (
              <p className="text-xs text-muted-foreground">
                Alterar o valor atualiza o total pago da dívida e o lançamento na conta vinculada.
              </p>
            )}
            {!editingPayment?.attachmentId && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Comprovante (opcional)</label>
                <input
                  ref={paymentFileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
            )}
            {(activeAccounts.length > 0 || !!editingPayment?.accountId) && (
              <Controller
                name="accountId"
                control={paymentForm.control}
                render={({ field }) => (
                  <Field label="Pagar com a conta">
                    <NativeSelect {...field} value={field.value || ''}>
                      <option value="">Não vincular conta</option>
                      {activeAccounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                      {editingPayment?.accountId && !activeAccounts.some((a) => a.id === editingPayment.accountId) && (
                        <option value={editingPayment.accountId}>{editingPayment.accountName ?? 'Conta'} (inativa)</option>
                      )}
                    </NativeSelect>
                  </Field>
                )}
              />
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
            <Button variant="outline" onClick={closePaymentDialog}>
              Cancelar
            </Button>
            <Button
              onClick={paymentForm.handleSubmit(handlePayment as () => Promise<void>)}
              disabled={registerPayment.isPending || updatePayment.isPending}
              icon={registerPayment.isPending || updatePayment.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {registerPayment.isPending || updatePayment.isPending ? 'Salvando…' : editingPayment ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payments list dialog */}
      <Dialog
        open={!!paymentsDebtId && !paymentDebtTarget && !deletePaymentTarget && !viewReceipt}
        onOpenChange={(open) => { if (!open) setPaymentsDebtId(null) }}
      >
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
                  <div className="flex items-center justify-between gap-2">
                    <CurrencyBadge value={payment.amount} tone="neutral" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">
                        {new Date(payment.paymentDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditPayment(payment)} title="Editar pagamento">
                        <Pencil size={13} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeletePaymentTarget(payment)} title="Excluir pagamento">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {payment.isEarlyPayment && (
                      <Badge variant="income">Antecipado</Badge>
                    )}
                    {payment.discount > 0 && (
                      <Badge variant="secondary">Desconto: {payment.discount.toFixed(2)}</Badge>
                    )}
                    {payment.accountName && (
                      <Badge variant="secondary">{payment.accountName}</Badge>
                    )}
                  </div>
                  {payment.attachmentId && (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewReceipt({
                          attachmentId: payment.attachmentId!,
                          fileName: payment.attachmentFileName || 'Comprovante',
                          contentType: payment.attachmentContentType || 'application/octet-stream',
                        })
                      }}
                    >
                      <Paperclip size={12} />
                      {payment.attachmentFileName || 'Ver comprovante'}
                    </button>
                  )}
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

      <ConfirmDialog
        open={!!deletePaymentTarget}
        onOpenChange={(open) => { if (!open) setDeletePaymentTarget(null) }}
        title="Excluir Pagamento"
        message={
          deletePaymentTarget?.accountName
            ? `O valor volta para o saldo devedor da dívida e o lançamento na conta "${deletePaymentTarget.accountName}" será removido. Deseja continuar?`
            : 'O valor volta para o saldo devedor da dívida. Deseja continuar?'
        }
        confirmText="Excluir"
        destructive
        onConfirm={handleDeletePayment}
        loading={deletePayment.isPending}
      />

      {/* Snowball strategy dialog */}
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
                  <CurrencyBadge value={snowball.totalRemaining} size="sm" tone="neutral" />
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
                      <DebtTypeIcon type={item.type} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{debtTypeLabels[item.type]}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <CurrencyBadge value={item.remainingAmount} size="sm" tone="neutral" />
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

function DebtTypeIcon({ type }: { type: DebtType }) {
  const { Icon, color } = debtTypeVisual[type]
  return (
    <IconBadge color={color} size="sm">
      <Icon size={16} />
    </IconBadge>
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(date: string): number {
  const due = new Date(date + 'T12:00:00')
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / DAY_MS)
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many
}

function DueBadge({ debt }: { debt: Debt }) {
  const dueDate = new Date(debt.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')
  const days = daysUntil(debt.dueDate)

  if (!debt.isPaid && days < 0) {
    return (
      <Badge variant="expense" className="gap-1">
        <AlertTriangle size={11} />
        Vencida há {-days} {plural(-days, 'dia', 'dias')}
      </Badge>
    )
  }
  if (!debt.isPaid && days <= 7) {
    return (
      <Badge variant="warning" className="gap-1">
        <Clock size={11} />
        {days === 0 ? 'Vence hoje' : 'Vence em ' + days + ' ' + plural(days, 'dia', 'dias')}
      </Badge>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <CalendarDays size={12} />
      Vencimento: {dueDate}
    </span>
  )
}

function DebtCard({
  debt,
  isSnowballNext,
  onEdit,
  onDelete,
  onViewPayments,
  onRegisterPayment,
}: {
  debt: Debt
  isSnowballNext: boolean
  onEdit: () => void
  onDelete: () => void
  onViewPayments: () => void
  onRegisterPayment: () => void
}) {
  const { Icon, color } = debtTypeVisual[debt.type]
  const label = debtTypeLabels[debt.type]
  const progress = debt.totalAmount > 0 ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100) : 0
  const urgent = !debt.isPaid && daysUntil(debt.dueDate) <= 7
  const progressColor = debt.isPaid
    ? 'var(--income)'
    : progress < 33
      ? 'var(--warning)'
      : 'var(--primary)'

  return (
    <div
      className={cn(
        'card p-5 space-y-4 cursor-pointer transition-shadow hover:shadow-md',
        debt.isPaid && 'border-income/40 bg-income-subtle',
        isSnowballNext && !debt.isPaid && 'ring-2 ring-primary/40'
      )}
      onClick={onViewPayments}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <IconBadge color={debt.isPaid ? 'var(--income)' : color} size="lg">
            {debt.isPaid ? <PartyPopper size={20} /> : <Icon size={20} />}
          </IconBadge>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{debt.name}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Editar">
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} title="Excluir">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {isSnowballNext && !debt.isPaid && (
        <div className="flex items-center gap-1.5 rounded-lg bg-brand-light px-2.5 py-1.5 text-xs font-medium text-primary">
          <Snowflake size={13} />
          Próxima a quitar na Bola de Neve
        </div>
      )}

      {debt.isPaid ? (
        <div className="py-1 text-center">
          <p className="text-lg font-semibold text-income">Dívida quitada!</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Você pagou <span className="font-medium text-foreground tabular-nums">{brl.format(debt.paidAmount)}</span>
          </p>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Falta pagar</p>
            <CurrencyBadge value={debt.remainingAmount} tone={urgent ? 'warning' : 'neutral'} size={700} />
          </div>
          <span className="text-2xl font-bold tabular-nums" style={{ color: progressColor }}>
            {Math.round(progress)}%
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de quitação"
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: progress + '%', backgroundColor: progressColor }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>Pago {brl.format(debt.paidAmount)}</span>
          <span>Total {brl.format(debt.totalAmount)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <DueBadge debt={debt} />
        {!debt.isPaid && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={onRegisterPayment} icon={<DollarSign size={14} />}>
              Pagar
            </Button>
          </div>
        )}
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
