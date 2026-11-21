import { CalendarDays, Clock, DollarSign, EllipsisVertical, ListOrdered, Pencil, PartyPopper, Snowflake, Trash2, TriangleAlert } from 'lucide-react'
import { IconBadge } from '../IconBadge'
import { CurrencyBadge } from '../CurrencyBadge'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { debtTypeVisual } from '../../lib/entity-icons'
import { debtStatus, debtTypeLabels, formatBRL, formatDayMonth, formatMonthYear } from '../../lib/debts'
import { cn } from '../../lib/utils'
import type { Debt } from '../../types'

interface DebtCardProps {
  debt: Debt
  isSnowballNext: boolean
  onEdit: () => void
  onDelete: () => void
  onViewInstallments: () => void
  onViewPayments: () => void
  onRegisterPayment: () => void
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation()

export function DebtCard({
  debt,
  isSnowballNext,
  onEdit,
  onDelete,
  onViewInstallments,
  onViewPayments,
  onRegisterPayment,
}: DebtCardProps) {
  const { Icon, color } = debtTypeVisual[debt.type]
  const progress = debt.totalAmount > 0 ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100) : 0
  const status = debtStatus(debt)
  const installments = debt.paymentMode === 'Installments' && !!debt.installmentCount
  const next = debt.nextInstallment
  const progressColor = debt.isPaid ? 'var(--income)' : progress < 33 ? 'var(--warning)' : 'var(--primary)'

  return (
    <div
      className={cn(
        'card cursor-pointer space-y-4 p-5 transition-shadow hover:shadow-md',
        debt.isPaid && 'border-income/40 bg-income-subtle',
        isSnowballNext && !debt.isPaid && 'ring-2 ring-primary/40'
      )}
      onClick={onViewPayments}
    >
      {/* Cabeçalho: ícone, nome (até 2 linhas) e menu único */}
      <div className="flex items-start gap-3">
        <IconBadge color={debt.isPaid ? 'var(--income)' : color} size="lg">
          {debt.isPaid ? <PartyPopper size={20} /> : <Icon size={20} />}
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-base font-semibold leading-snug" title={debt.name}>
            {debt.name}
          </p>
          <p className="text-sm text-muted-foreground">{debtTypeLabels[debt.type]}</p>
        </div>
        {/* modal={false}: o menu abre diálogos (Editar, Parcelas); se fosse modal, o
            pointer-events:none que ele põe no body podia ficar preso após fechar o diálogo. */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild onClick={stop}>
            <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${debt.name}`} className="-mr-1.5 -mt-1">
              <EllipsisVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={stop}>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil size={15} /> Editar
            </DropdownMenuItem>
            {installments && (
              <DropdownMenuItem onSelect={onViewInstallments}>
                <ListOrdered size={15} /> Ver parcelas
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onViewPayments}>
              <DollarSign size={15} /> Ver pagamentos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              <Trash2 size={15} /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {debt.needsReview && !debt.isPaid && (
        <button
          type="button"
          onClick={(e) => {
            stop(e)
            onEdit()
          }}
          className="flex w-full items-start gap-2 rounded-lg bg-warning-subtle px-3 py-2 text-left text-xs text-foreground cursor-pointer"
        >
          <TriangleAlert size={14} className="mt-px flex-shrink-0 text-warning" />
          <span>
            <span className="font-semibold">Revise os dados.</span> Confirme as parcelas e o dia de vencimento desta
            dívida.
          </span>
        </button>
      )}

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
            Você pagou <span className="font-medium tabular-nums text-foreground">{formatBRL(debt.paidAmount)}</span>
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground">Falta pagar</p>
          <CurrencyBadge
            value={debt.remainingAmount}
            tone={status.tone === 'expense' ? 'expense' : status.tone === 'warning' ? 'warning' : 'neutral'}
            size={700}
          />
        </div>
      )}

      {/* Progresso: o percentual fica junto da barra, com rótulo */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold tabular-nums" style={{ color: progressColor }}>
            {Math.round(progress)}% pago
          </span>
          {installments && debt.paidInstallments != null && (
            <span className="text-muted-foreground">
              {debt.isPaid
                ? `${debt.installmentCount} de ${debt.installmentCount} parcelas`
                : `Parcela ${Math.min(debt.paidInstallments + 1, debt.installmentCount!)} de ${debt.installmentCount}`}
            </span>
          )}
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de quitação"
        >
          <div className="h-full rounded-full transition-all duration-500" style={{ width: progress + '%', backgroundColor: progressColor }} />
        </div>
        <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>Pago {formatBRL(debt.paidAmount)}</span>
          <span>Total {formatBRL(debt.totalAmount)}</span>
        </div>
      </div>

      {!debt.isPaid && next && (
        <p className="flex items-center gap-1.5 text-sm">
          <CalendarDays size={14} className="flex-shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            Próxima parcela: <span className="font-semibold tabular-nums">{formatBRL(next.amount)}</span>
            <span className="text-muted-foreground"> · vence {formatDayMonth(next.dueDate)}</span>
          </span>
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="min-w-0">
          {debt.isPaid ? (
            <Badge variant="income">Quitada</Badge>
          ) : status.tone === 'expense' ? (
            <Badge variant="expense" className="gap-1">
              <TriangleAlert size={11} /> {status.label}
            </Badge>
          ) : status.tone === 'warning' ? (
            <Badge variant="warning" className="gap-1">
              <Clock size={11} /> {status.label}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {status.label}
              {debt.payoffDate && ` · termina em ${formatMonthYear(debt.payoffDate)}`}
            </span>
          )}
        </div>
        {!debt.isPaid && (
          <div onClick={stop}>
            <Button size="sm" onClick={onRegisterPayment} icon={<DollarSign size={14} />}>
              Pagar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
