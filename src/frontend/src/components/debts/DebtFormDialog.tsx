import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarClock } from 'lucide-react'
import { ResponsiveDialog, DialogActions } from '../ui/responsive-dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Field } from '../ui/field'
import { NativeSelect } from '../ui/native-select'
import { CurrencyInput } from '../ui/currency-input'
import { DateInput } from '../ui/date-input'
import { Spinner } from '../ui/spinner'
import { useCreateDebt, useUpdateDebt } from '../../hooks/useDebts'
import { useAppToast } from '../../hooks/useAppToast'
import { cn, getApiErrorMessage } from '../../lib/utils'
import {
  debtTypeLabels,
  defaultFirstInstallment,
  formatBRL,
  formatMonthYear,
  formatPercent,
  installmentDueDate,
  interestPeriodShort,
  parsePercent,
} from '../../lib/debts'
import type { Debt, DebtInput, DebtPaymentMode, DebtType, InterestPeriod } from '../../types'

const DEBT_TYPES = Object.keys(debtTypeLabels) as DebtType[]

const intText = (v: string) => (v.trim() === '' ? null : Number(v))

const schema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
    type: z.enum(DEBT_TYPES as [DebtType, ...DebtType[]]),
    totalAmount: z.number().positive('Informe o valor total'),
    paymentMode: z.enum(['Installments', 'Flexible']),
    installmentCount: z.string(),
    installmentAmount: z.number(),
    initialPaidInstallments: z.string(),
    dueDay: z.string(),
    firstInstallmentDate: z.string(),
    payoffDate: z.string(),
    interestRate: z.string(),
    interestPeriod: z.enum(['Monthly', 'Yearly']),
    notes: z.string().max(500, 'Máximo de 500 caracteres'),
  })
  .superRefine((d, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    const day = intText(d.dueDay)
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) issue('dueDay', 'Dia entre 1 e 31')
    if (d.interestRate.trim() && parsePercent(d.interestRate) === null) issue('interestRate', 'Use números, ex.: 1,98')

    if (d.paymentMode !== 'Installments') return
    const count = intText(d.installmentCount)
    if (count === null || !Number.isInteger(count) || count < 1 || count > 600) issue('installmentCount', 'Entre 1 e 600')
    if (!(d.installmentAmount > 0)) issue('installmentAmount', 'Informe o valor da parcela')
    if (day === null) issue('dueDay', 'Informe o dia de vencimento')
    if (!d.firstInstallmentDate) issue('firstInstallmentDate', 'Informe a 1ª parcela')
    const paid = intText(d.initialPaidInstallments) ?? 0
    if (!Number.isInteger(paid) || paid < 0) issue('initialPaidInstallments', 'Número inválido')
    else if (count !== null && paid > count) issue('initialPaidInstallments', 'Maior que o nº de parcelas')
  })

type FormData = z.infer<typeof schema>

const empty = (): FormData => ({
  name: '',
  type: 'Loan',
  totalAmount: 0,
  paymentMode: 'Installments',
  installmentCount: '',
  installmentAmount: 0,
  initialPaidInstallments: '',
  dueDay: '10',
  firstInstallmentDate: defaultFirstInstallment(10),
  payoffDate: '',
  interestRate: '',
  interestPeriod: 'Monthly',
  notes: '',
})

const fromDebt = (d: Debt): FormData => ({
  name: d.name,
  type: d.type,
  totalAmount: d.totalAmount,
  paymentMode: d.paymentMode,
  installmentCount: d.installmentCount != null ? String(d.installmentCount) : '',
  installmentAmount: d.installmentAmount ?? 0,
  initialPaidInstallments: d.initialPaidInstallments ? String(d.initialPaidInstallments) : '',
  dueDay: d.dueDay != null ? String(d.dueDay) : '',
  firstInstallmentDate:
    d.firstInstallmentDate ?? (d.dueDay ? defaultFirstInstallment(d.dueDay) : ''),
  payoffDate: d.paymentMode === 'Flexible' ? d.payoffDate ?? '' : '',
  interestRate: formatPercent(d.interestRate),
  interestPeriod: d.interestPeriod,
  notes: d.notes ?? '',
})

function toInput(d: FormData): DebtInput {
  const installments = d.paymentMode === 'Installments'
  return {
    name: d.name.trim(),
    type: d.type,
    totalAmount: d.totalAmount,
    paymentMode: d.paymentMode,
    installmentCount: installments ? intText(d.installmentCount) : null,
    installmentAmount: installments ? d.installmentAmount : null,
    initialPaidInstallments: installments ? intText(d.initialPaidInstallments) ?? 0 : 0,
    dueDay: intText(d.dueDay),
    firstInstallmentDate: installments ? d.firstInstallmentDate || null : null,
    payoffDate: installments ? null : d.payoffDate || null,
    interestRate: parsePercent(d.interestRate),
    interestPeriod: d.interestPeriod,
    notes: d.notes.trim() || null,
  }
}

function Section({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
      {footer}
    </section>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-9 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface DebtFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dívida em edição; ausente = nova dívida. */
  debt?: Debt | null
}

export function DebtFormDialog({ open, onOpenChange, debt }: DebtFormDialogProps) {
  const toast = useAppToast()
  const createDebt = useCreateDebt()
  const updateDebt = useUpdateDebt()
  const pending = createDebt.isPending || updateDebt.isPending
  const editing = !!debt

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: empty() })
  const { control, setValue, formState } = form

  // Sugestões automáticas só até o usuário mexer no campo.
  const amountTouched = useRef(false)
  const firstDateTouched = useRef(false)
  const [, force] = useState(0)

  useEffect(() => {
    if (!open) return
    form.reset(debt ? fromDebt(debt) : empty())
    amountTouched.current = !!debt
    firstDateTouched.current = !!debt?.firstInstallmentDate
    force((n) => n + 1)
  }, [open, debt, form])

  const [paymentMode, totalAmount, countText, installmentAmount, dueDayText, firstDate, paidText] =
    useWatch({
      control,
      name: [
        'paymentMode',
        'totalAmount',
        'installmentCount',
        'installmentAmount',
        'dueDay',
        'firstInstallmentDate',
        'initialPaidInstallments',
      ],
    })
  const count = intText(countText)
  const dueDay = intText(dueDayText)
  const paidBefore = intText(paidText) ?? 0
  const installments = paymentMode === 'Installments'

  // Valor da parcela sugerido = total ÷ parcelas (editável por causa dos juros).
  useEffect(() => {
    if (amountTouched.current || !count || count < 1 || !(totalAmount > 0)) return
    setValue('installmentAmount', Math.round((totalAmount / count) * 100) / 100, { shouldDirty: true })
  }, [totalAmount, count, setValue])

  // 1ª parcela padrão: próximo mês, no dia de vencimento.
  useEffect(() => {
    if (firstDateTouched.current || !dueDay || dueDay < 1 || dueDay > 31) return
    setValue('firstInstallmentDate', defaultFirstInstallment(dueDay), { shouldDirty: true })
  }, [dueDay, setValue])

  const payoff =
    installments && count && count > 0 && dueDay && firstDate ? installmentDueDate(firstDate, dueDay, count) : null

  const summary =
    installments && count && installmentAmount > 0
      ? [
          `${count}× de ${formatBRL(installmentAmount)}`,
          dueDay ? `vence todo dia ${dueDay}` : null,
          payoff ? `termina em ${formatMonthYear(payoff)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  const submit = form.handleSubmit(async (data) => {
    const input = toInput(data)
    try {
      if (debt) await updateDebt.mutateAsync({ id: debt.id, data: input })
      else await createDebt.mutateAsync(input)
      toast.success(editing ? 'Dívida atualizada' : 'Dívida criada', input.name)
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao salvar dívida', getApiErrorMessage(error))
    }
  })

  const err = (name: keyof FormData) => {
    const e = formState.errors[name]
    return e ? { validationState: 'error' as const, validationMessage: e.message } : {}
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar Dívida' : 'Nova Dívida'}
      description={
        debt?.needsReview ? 'Confira as parcelas e o vencimento — esta dívida veio do formato antigo.' : undefined
      }
      size="lg"
      confirmOnClose={formState.isDirty}
      bodyClassName="space-y-6"
      footer={
        <DialogActions
          primary={
            <Button onClick={submit} disabled={pending} icon={pending ? <Spinner size="tiny" /> : undefined}>
              {pending ? 'Salvando…' : editing ? 'Salvar' : 'Criar dívida'}
            </Button>
          }
          secondary={
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          }
        />
      }
    >
      <Section title="Dados">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Field label="Nome" required {...err('name')}>
              <Input {...field} placeholder="Ex.: Crédito consignado" autoComplete="off" />
            </Field>
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Field label="Tipo" required>
                <NativeSelect {...field}>
                  {DEBT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {debtTypeLabels[t]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          />
          <Controller
            name="totalAmount"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label="Valor total" required {...err('totalAmount')}>
                <CurrencyInput value={value ?? 0} onChange={onChange} />
              </Field>
            )}
          />
        </div>
      </Section>

      <Section
        title="Pagamento"
        footer={
          summary ? (
            <p className="flex items-start gap-2 rounded-lg bg-brand-light px-3 py-2.5 text-sm text-primary" aria-live="polite">
              <CalendarClock size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                {summary}
                {paidBefore > 0 && installmentAmount > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {paidBefore} {paidBefore === 1 ? 'parcela já paga' : 'parcelas já pagas'} ·{' '}
                    {formatBRL(paidBefore * installmentAmount)} entram como pago
                  </span>
                )}
              </span>
            </p>
          ) : null
        }
      >
        <Controller
          name="paymentMode"
          control={control}
          render={({ field }) => (
            <Segmented<DebtPaymentMode>
              label="Forma de pagamento"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'Installments', label: 'Parcelado' },
                { value: 'Flexible', label: 'Sem parcelas fixas' },
              ]}
            />
          )}
        />

        {installments ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="installmentCount"
                control={control}
                render={({ field }) => (
                  <Field label="Nº de parcelas" required {...err('installmentCount')}>
                    <Input {...field} inputMode="numeric" pattern="[0-9]*" placeholder="Ex.: 24" />
                  </Field>
                )}
              />
              <Controller
                name="installmentAmount"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field label="Valor da parcela" required {...err('installmentAmount')}>
                    <CurrencyInput
                      value={value ?? 0}
                      onChange={(v) => {
                        amountTouched.current = true
                        onChange(v)
                      }}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="dueDay"
                control={control}
                render={({ field }) => (
                  <Field label="Dia de vencimento" required {...err('dueDay')}>
                    <Input {...field} inputMode="numeric" pattern="[0-9]*" placeholder="1 a 31" />
                  </Field>
                )}
              />
              <Controller
                name="initialPaidInstallments"
                control={control}
                render={({ field }) => (
                  <Field label="Parcelas já pagas" {...err('initialPaidInstallments')}>
                    <Input {...field} inputMode="numeric" pattern="[0-9]*" placeholder="0" />
                  </Field>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="firstInstallmentDate"
                control={control}
                render={({ field }) => (
                  <Field label="1ª parcela" required {...err('firstInstallmentDate')}>
                    <DateInput
                      {...field}
                      onChange={(e) => {
                        firstDateTouched.current = true
                        field.onChange(e)
                      }}
                    />
                  </Field>
                )}
              />
              <Field label="Previsão de quitação">
                <div
                  className="flex h-9 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {payoff ? `Termina em ${formatMonthYear(payoff)}` : 'Calculada'}
                </div>
              </Field>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="dueDay"
              control={control}
              render={({ field }) => (
                <Field label="Dia de vencimento" {...err('dueDay')}>
                  <Input {...field} inputMode="numeric" pattern="[0-9]*" placeholder="Opcional" />
                </Field>
              )}
            />
            <Controller
              name="payoffDate"
              control={control}
              render={({ field }) => (
                <Field label="Quitar até">
                  <DateInput {...field} />
                </Field>
              )}
            />
          </div>
        )}
      </Section>

      <Section title="Juros">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Controller
            name="interestRate"
            control={control}
            render={({ field }) => (
              <Field label="Taxa de juros (%)" {...err('interestRate')}>
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder="Ex.: 1,98"
                  onBlur={() => {
                    // Normaliza para o formato pt-BR (vírgula).
                    const n = parsePercent(field.value)
                    if (n !== null) field.onChange(formatPercent(n))
                    field.onBlur()
                  }}
                />
              </Field>
            )}
          />
          <Controller
            name="interestPeriod"
            control={control}
            render={({ field }) => (
              <Segmented<InterestPeriod>
                label="Período dos juros"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'Monthly', label: interestPeriodShort.Monthly },
                  { value: 'Yearly', label: interestPeriodShort.Yearly },
                ]}
              />
            )}
          />
        </div>
      </Section>

      <Section title="Observações">
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Field {...err('notes')}>
              <textarea
                {...field}
                rows={3}
                placeholder="Opcional"
                className="flex w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          )}
        />
      </Section>
    </ResponsiveDialog>
  )
}
