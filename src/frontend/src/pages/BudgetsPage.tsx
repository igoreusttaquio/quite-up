import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { CurrencyInput } from '../components/ui/currency-input'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { Badge } from '../components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Spinner } from '../components/ui/spinner'
import type { Budget, Category } from '../types'

const monthLabels: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
  5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
  9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
}

const schema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().min(0.01, 'Valor é obrigatório'),
  month: z.number(),
  year: z.number(),
})

type FormData = z.infer<typeof schema>

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)

  const { data: budgets, isLoading } = useBudgets(month, year)
  const { data: categories } = useCategories()
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Budget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)

  const expenseCategories = categories?.filter((c) => c.type === 'Expense') ?? []

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', amount: 0, month: currentMonth, year: currentYear },
  })

  const handleCreate = async (data: FormData) => {
    try {
      await createBudget.mutateAsync(data)
      setCreateOpen(false)
      form.reset()
    } catch { /* handled by query client */ }
  }

  const handleEdit = async (data: FormData) => {
    if (!editTarget) return
    try {
      await updateBudget.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
    } catch { /* handled by query client */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBudget.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch { /* handled by query client */ }
  }

  const openEdit = (budget: Budget) => {
    setEditTarget(budget)
    form.reset({
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
    })
  }

  const openCreate = () => {
    form.reset({ categoryId: '', amount: 0, month, year })
    setCreateOpen(true)
  }

  const isSaving = createBudget.isPending || updateBudget.isPending
  const sheetOpen = createOpen || !!editTarget

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i)

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Novo Orçamento
          </Button>
        }
      />

      {/* Month / Year filter */}
      <div className="flex gap-3 mb-6">
        <NativeSelect
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="w-40"
        >
          {(Object.entries(monthLabels) as [string, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-28"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </NativeSelect>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank size={48} />}
          title="Nenhum orçamento"
          description={`Nenhum orçamento encontrado para ${monthLabels[month]} de ${year}.`}
          action={
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Criar Orçamento
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categoryName={budget.categoryName}
              onEdit={() => openEdit(budget)}
              onDelete={() => setDeleteTarget(budget)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditTarget(null) } }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editTarget ? 'Editar Orçamento' : 'Novo Orçamento'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="space-y-4">
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field }) => (
                  <Field
                    label="Categoria"
                    required
                    validationState={form.formState.errors.categoryId ? 'error' : undefined}
                    validationMessage={form.formState.errors.categoryId?.message}
                  >
                    <NativeSelect {...field}>
                      <option value="">Selecione uma categoria</option>
                      {expenseCategories.map((cat: Category) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
              <Controller
                name="amount"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <Field
                    label="Valor Orçado"
                    required
                    validationState={form.formState.errors.amount ? 'error' : undefined}
                    validationMessage={form.formState.errors.amount?.message}
                  >
                    <CurrencyInput value={value ?? 0} onChange={onChange} />
                  </Field>
                )}
              />
              <Controller
                name="month"
                control={form.control}
                render={({ field }) => (
                  <Field label="Mês" required>
                    <NativeSelect {...field}>
                      {(Object.entries(monthLabels) as [string, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
              <Controller
                name="year"
                control={form.control}
                render={({ field }) => (
                  <Field label="Ano" required>
                    <NativeSelect {...field}>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            </div>
            <div className="flex gap-2 pt-5">
              <Button
                className="flex-1"
                onClick={
                  editTarget
                    ? form.handleSubmit(handleEdit as () => Promise<void>)
                    : form.handleSubmit(handleCreate as () => Promise<void>)
                }
                disabled={isSaving}
                icon={isSaving ? <Spinner size="tiny" /> : undefined}
              >
                {isSaving ? 'Salvando…' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => { setCreateOpen(false); setEditTarget(null) }}>
                Cancelar
              </Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Orçamento"
        message={`Excluir orçamento de "${deleteTarget?.categoryName}"?`}
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteBudget.isPending}
      />
    </div>
  )
}

function BudgetCard({
  budget,
  categoryName,
  onEdit,
  onDelete,
}: {
  budget: Budget
  categoryName?: string
  onEdit: () => void
  onDelete: () => void
}) {
  const overspent = budget.spent > budget.amount
  const progress = overspent ? 100 : (budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0)
  const remaining = budget.amount - budget.spent

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-base truncate">{categoryName ?? 'Sem categoria'}</p>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
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
          <span className="text-muted-foreground">Orçado</span>
          <CurrencyBadge value={budget.amount} size="sm" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gasto</span>
          <CurrencyBadge value={budget.spent} size="sm" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Restante</span>
          {overspent ? (
            <span className="text-expense font-semibold tabular-nums">
              {remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          ) : (
            <CurrencyBadge value={remaining} size="sm" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overspent ? 'bg-expense' : 'bg-income'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {overspent ? (
          <Badge variant="destructive">Ultrapassado</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}% utilizado
          </span>
        )}
      </div>
    </div>
  )
}
