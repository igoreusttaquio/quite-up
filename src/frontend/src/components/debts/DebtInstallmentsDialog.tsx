import { CheckCircle2, Circle, TriangleAlert } from 'lucide-react'
import { ResponsiveDialog, DialogActions } from '../ui/responsive-dialog'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { useDebtInstallments } from '../../hooks/useDebts'
import { formatBRL, formatDate } from '../../lib/debts'
import { cn } from '../../lib/utils'
import type { Debt, DebtInstallment } from '../../types'

const statusView: Record<DebtInstallment['status'], { label: string; className: string; Icon: typeof Circle }> = {
  paid: { label: 'Paga', className: 'text-income', Icon: CheckCircle2 },
  open: { label: 'Em aberto', className: 'text-muted-foreground', Icon: Circle },
  overdue: { label: 'Vencida', className: 'text-expense', Icon: TriangleAlert },
}

/** Lista de parcelas (número, valor, vencimento, status) gerada a partir da dívida. */
export function DebtInstallmentsDialog({ debt, onOpenChange }: { debt: Debt | null; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useDebtInstallments(debt?.id ?? null)

  return (
    <ResponsiveDialog
      open={!!debt}
      onOpenChange={onOpenChange}
      title="Parcelas"
      description={
        debt?.installmentCount
          ? `${debt.name} · ${debt.paidInstallments ?? 0} de ${debt.installmentCount} pagas`
          : debt?.name
      }
      footer={<DialogActions secondary={<Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>} />}
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Esta dívida não tem parcelas fixas.</p>
      ) : (
        <ol className="divide-y divide-border rounded-xl border border-border">
          {data.map((i) => {
            const view = statusView[i.status]
            return (
              <li key={i.number} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                <view.Icon size={16} className={cn('flex-shrink-0', view.className)} aria-hidden />
                <span className="w-10 flex-shrink-0 tabular-nums text-muted-foreground">{i.number}ª</span>
                <span className="min-w-0 flex-1 tabular-nums">{formatDate(i.dueDate)}</span>
                <span className="text-right">
                  <span className="block font-medium tabular-nums">{formatBRL(i.amount)}</span>
                  <span className={cn('block text-xs', view.className)}>
                    {view.label}
                    {i.status !== 'paid' && i.remainingAmount < i.amount && ` · falta ${formatBRL(i.remainingAmount)}`}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </ResponsiveDialog>
  )
}
