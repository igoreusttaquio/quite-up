import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, DollarSign, Snowflake, Paperclip } from 'lucide-react'
import { useDebts, useDeleteDebt, useDebtPayments, useRegisterDebtPayment, useUpdateDebtPayment, useDeleteDebtPayment, useSnowballStrategy } from '../hooks/useDebts'
import { useAppToast } from '../hooks/useAppToast'
import { getApiErrorMessage, toDateParam } from '../lib/utils'
import { useAccounts } from '../hooks/useAccounts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { IconBadge } from '../components/IconBadge'
import { debtTypeVisual } from '../lib/entity-icons'
import { debtTypeLabels } from '../lib/debts'
import { DebtCard } from '../components/debts/DebtCard'
import { DebtFormDialog } from '../components/debts/DebtFormDialog'
import { DebtInstallmentsDialog } from '../components/debts/DebtInstallmentsDialog'
import { CurrencyInput } from '../components/ui/currency-input'
import { DateInput } from '../components/ui/date-input'
import { Button } from '../components/ui/button'
import { ResponsiveDialog, DialogActions, ConfirmDialog } from '../components/ui/responsive-dialog'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import { ReceiptViewer } from '../components/ReceiptViewer'
import { useUploadAttachment } from '../hooks/useAttachment'
import type { DebtType, Debt, DebtPayment } from '../types'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor do pagamento é obrigatório'),
  paymentDate: z.string().min(1, 'Data do pagamento é obrigatória'),
  isEarlyPayment: z.boolean(),
  discount: z.number().optional(),
  notes: z.string().optional(),
  accountId: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export function DebtsPage() {
  const { data: debts, isLoading } = useDebts()
  const { data: accounts } = useAccounts()
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
  const [installmentsDebt, setInstallmentsDebt] = useState<Debt | null>(null)
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

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, paymentDate: new Date().toISOString().split('T')[0], isEarlyPayment: false, discount: 0, notes: '' },
  })

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

  const openPayments = (debtId: string) => {
    setPaymentsDebtId(debtId)
  }

  const openPaymentDialog = (debt: Debt) => {
    setEditingPayment(null)
    setPaymentDebtTarget(debt)
    paymentForm.reset({
      amount: debt.nextInstallment?.amount ?? 0,
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
        primaryAction={{ label: 'Nova Dívida', onClick: () => setCreateOpen(true) }}
        secondaryActions={[
          { label: 'Bola de Neve', icon: <Snowflake size={16} />, onClick: () => setSnowballOpen(true) },
        ]}
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
              onEdit={() => setEditTarget(debt)}
              onDelete={() => setDeleteTarget(debt)}
              onViewInstallments={() => setInstallmentsDebt(debt)}
              onViewPayments={() => openPayments(debt.id)}
              onRegisterPayment={() => openPaymentDialog(debt)}
            />
          ))}
        </div>
      )}

      <DebtFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DebtFormDialog
        open={!!editTarget}
        debt={editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
      />
      <DebtInstallmentsDialog debt={installmentsDebt} onOpenChange={(open) => { if (!open) setInstallmentsDebt(null) }} />

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
      <ResponsiveDialog
        open={!!paymentDebtTarget}
        onOpenChange={(open) => { if (!open) closePaymentDialog() }}
        confirmOnClose={paymentForm.formState.isDirty}
        title={editingPayment ? 'Editar Pagamento' : 'Registrar Pagamento'}
        footer={
          <DialogActions
            primary={
              <Button
                onClick={paymentForm.handleSubmit(handlePayment as () => Promise<void>)}
                disabled={registerPayment.isPending || updatePayment.isPending}
                icon={registerPayment.isPending || updatePayment.isPending ? <Spinner size="tiny" /> : undefined}
              >
                {registerPayment.isPending || updatePayment.isPending ? 'Salvando…' : editingPayment ? 'Salvar' : 'Registrar'}
              </Button>
            }
            secondary={
              <Button variant="outline" onClick={closePaymentDialog}>
                Cancelar
              </Button>
            }
          />
        }
      >
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
      </ResponsiveDialog>

      {/* Payments list dialog */}
      <ResponsiveDialog
        open={!!paymentsDebtId}
        onOpenChange={(open) => { if (!open) setPaymentsDebtId(null) }}
        title="Pagamentos"
        description={debts?.find((d) => d.id === paymentsDebtId)?.name}
        footer={
          <DialogActions
            secondary={<Button variant="outline" onClick={() => setPaymentsDebtId(null)}>Fechar</Button>}
          />
        }
      >
        {paymentsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !paymentsData || paymentsData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum pagamento registrado.
          </div>
        ) : (
          <div className="space-y-3">
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
      </ResponsiveDialog>

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

      <ResponsiveDialog
        open={snowballOpen}
        onOpenChange={setSnowballOpen}
        title="Estratégia Bola de Neve"
        footer={
          <DialogActions
            secondary={
              <Button variant="outline" onClick={() => setSnowballOpen(false)}>Fechar</Button>
            }
          />
        }
      >
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
      </ResponsiveDialog>
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

