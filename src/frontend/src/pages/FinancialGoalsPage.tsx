import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Target, TrendingUp, History } from 'lucide-react'
import {
  useFinancialGoals,
  useCreateFinancialGoal,
  useUpdateFinancialGoal,
  useDeleteFinancialGoal,
  useGoalContributions,
  useAddGoalContribution,
} from '../hooks/useFinancialGoals'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Badge } from '../components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Spinner } from '../components/ui/spinner'
import { useAppToast } from '../hooks/useAppToast'
import type { FinancialGoal, GoalContribution } from '../types'

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  targetAmount: z.number({ required_error: 'Valor é obrigatório' }).positive('Valor deve ser positivo'),
  targetDate: z.string().optional(),
})

const contributionSchema = z.object({
  amount: z.number({ required_error: 'Valor é obrigatório' }).positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = CreateFormData
type ContributionFormData = z.infer<typeof contributionSchema>

const todayStr = () => new Date().toISOString().split('T')[0]

const goalsEmoji = '🎯'

const filterTabs = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Em Andamento' },
  { key: 'completed', label: 'Concluídas' },
] as const

type FilterTab = (typeof filterTabs)[number]['key']

export function FinancialGoalsPage() {
  const { data: goals, isLoading } = useFinancialGoals()
  const createGoal = useCreateFinancialGoal()
  const updateGoal = useUpdateFinancialGoal()
  const deleteGoal = useDeleteFinancialGoal()
  const addContribution = useAddGoalContribution()
  const toast = useAppToast()

  const [filter, setFilter] = useState<FilterTab>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FinancialGoal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FinancialGoal | null>(null)
  const [contributionGoal, setContributionGoal] = useState<FinancialGoal | null>(null)
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null)

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', targetAmount: 0, targetDate: '' },
  })

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', targetAmount: 0, targetDate: '' },
  })

  const contributionForm = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: 0, date: todayStr(), notes: '' },
  })

  const { data: contributions, isLoading: loadingContributions } = useGoalContributions(historyGoalId ?? '')

  const filteredGoals = (goals ?? []).filter((g) => {
    if (filter === 'active') return !g.isCompleted
    if (filter === 'completed') return g.isCompleted
    return true
  })

  const handleCreate = async (data: CreateFormData) => {
    try {
      await createGoal.mutateAsync(data)
      setCreateOpen(false)
      createForm.reset()
      toast.success('Meta criada com sucesso')
    } catch { /* handled by query client */ }
  }

  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return
    try {
      await updateGoal.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
      toast.success('Meta atualizada com sucesso')
    } catch { /* handled by query client */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteGoal.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      toast.success('Meta excluída com sucesso')
    } catch { /* handled by query client */ }
  }

  const handleAddContribution = async (data: ContributionFormData) => {
    if (!contributionGoal) return
    try {
      await addContribution.mutateAsync({ goalId: contributionGoal.id, data })
      setContributionGoal(null)
      contributionForm.reset()
      toast.success('Contribuição adicionada com sucesso')
    } catch { /* handled by query client */ }
  }

  const openEdit = (goal: FinancialGoal) => {
    setEditTarget(goal)
    editForm.reset({ name: goal.name, targetAmount: goal.targetAmount, targetDate: goal.targetDate ?? '' })
  }

  const openContribution = (goal: FinancialGoal) => {
    setContributionGoal(goal)
    contributionForm.reset({ amount: 0, date: todayStr(), notes: '' })
  }

  return (
    <div>
      <PageHeader
        title="Metas Financeiras"
        action={
          <Button onClick={() => { createForm.reset(); setCreateOpen(true) }} icon={<Plus size={16} />}>
            Nova Meta
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-lg w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              filter === tab.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
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
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target size={48} />}
          title="Nenhuma meta encontrada"
          description={filter === 'all' ? 'Crie uma meta financeira para começar.' : 'Nenhuma meta com esse filtro.'}
          action={
            filter === 'all' ? (
              <Button onClick={() => { createForm.reset(); setCreateOpen(true) }} icon={<Plus size={16} />}>
                Criar Meta
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => openEdit(goal)}
              onDelete={() => setDeleteTarget(goal)}
              onAddContribution={() => openContribution(goal)}
              onShowHistory={() => setHistoryGoalId(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Create sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Meta</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="space-y-4">
              <Controller
                name="name"
                control={createForm.control}
                render={({ field }) => (
                  <Field
                    label="Nome"
                    required
                    validationState={createForm.formState.errors.name ? 'error' : undefined}
                    validationMessage={createForm.formState.errors.name?.message}
                  >
                    <Input {...field} placeholder="Ex: Viagem para Europa" />
                  </Field>
                )}
              />
              <Controller
                name="targetAmount"
                control={createForm.control}
                render={({ field: { onChange, value, ...rest } }) => (
                  <Field
                    label="Valor Alvo"
                    required
                    validationState={createForm.formState.errors.targetAmount ? 'error' : undefined}
                    validationMessage={createForm.formState.errors.targetAmount?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={String(value ?? '')}
                      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                      {...rest}
                    />
                  </Field>
                )}
              />
              <Controller
                name="targetDate"
                control={createForm.control}
                render={({ field }) => (
                  <Field label="Data Alvo">
                    <Input type="date" {...field} />
                  </Field>
                )}
              />
            </div>
            <div className="flex gap-2 pt-5">
              <Button
                className="flex-1"
                onClick={createForm.handleSubmit(handleCreate as () => Promise<void>)}
                disabled={createGoal.isPending}
                icon={createGoal.isPending ? <Spinner size="tiny" /> : undefined}
              >
                {createGoal.isPending ? 'Salvando…' : 'Criar Meta'}
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Meta</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="space-y-4">
              <Controller
                name="name"
                control={editForm.control}
                render={({ field }) => (
                  <Field
                    label="Nome"
                    required
                    validationState={editForm.formState.errors.name ? 'error' : undefined}
                    validationMessage={editForm.formState.errors.name?.message}
                  >
                    <Input {...field} />
                  </Field>
                )}
              />
              <Controller
                name="targetAmount"
                control={editForm.control}
                render={({ field: { onChange, value, ...rest } }) => (
                  <Field
                    label="Valor Alvo"
                    required
                    validationState={editForm.formState.errors.targetAmount ? 'error' : undefined}
                    validationMessage={editForm.formState.errors.targetAmount?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      value={String(value ?? '')}
                      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                      {...rest}
                    />
                  </Field>
                )}
              />
              <Controller
                name="targetDate"
                control={editForm.control}
                render={({ field }) => (
                  <Field label="Data Alvo">
                    <Input type="date" {...field} />
                  </Field>
                )}
              />
            </div>
            <div className="flex gap-2 pt-5">
              <Button
                className="flex-1"
                onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
                disabled={updateGoal.isPending}
                icon={updateGoal.isPending ? <Spinner size="tiny" /> : undefined}
              >
                {updateGoal.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Add contribution dialog */}
      <Dialog open={!!contributionGoal} onOpenChange={(open) => { if (!open) setContributionGoal(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Contribuição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Meta: <span className="font-semibold text-foreground">{contributionGoal?.name}</span>
            </div>
            <Controller
              name="amount"
              control={contributionForm.control}
              render={({ field: { onChange, value, ...rest } }) => (
                <Field
                  label="Valor"
                  required
                  validationState={contributionForm.formState.errors.amount ? 'error' : undefined}
                  validationMessage={contributionForm.formState.errors.amount?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
                    {...rest}
                  />
                </Field>
              )}
            />
            <Controller
              name="date"
              control={contributionForm.control}
              render={({ field }) => (
                <Field
                  label="Data"
                  required
                  validationState={contributionForm.formState.errors.date ? 'error' : undefined}
                  validationMessage={contributionForm.formState.errors.date?.message}
                >
                  <Input type="date" {...field} />
                </Field>
              )}
            />
            <Controller
              name="notes"
              control={contributionForm.control}
              render={({ field }) => (
                <Field label="Observações">
                  <Input {...field} placeholder="Opcional" />
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={contributionForm.handleSubmit(handleAddContribution as () => Promise<void>)}
              disabled={addContribution.isPending}
              icon={addContribution.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {addContribution.isPending ? 'Salvando…' : 'Adicionar'}
            </Button>
            <Button variant="outline" onClick={() => setContributionGoal(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contributions history dialog */}
      <Dialog open={!!historyGoalId} onOpenChange={(open) => { if (!open) setHistoryGoalId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Contribuições</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-80 overflow-y-auto">
            {loadingContributions ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : !contributions || contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma contribuição registrada.</p>
            ) : (
              <div className="space-y-2">
                {contributions.map((c: GoalContribution) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        <CurrencyBadge value={c.amount} size="sm" />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {c.notes && (
                      <p className="text-xs text-muted-foreground text-right max-w-[140px] truncate">{c.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryGoalId(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Meta"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteGoal.isPending}
      />
    </div>
  )
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddContribution,
  onShowHistory,
}: {
  goal: FinancialGoal
  onEdit: () => void
  onDelete: () => void
  onAddContribution: () => void
  onShowHistory: () => void
}) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{goalsEmoji}</span>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{goal.name}</p>
            <p className="text-xs text-muted-foreground">
              {goal.targetDate ? `Até ${new Date(goal.targetDate).toLocaleDateString('pt-BR')}` : 'Sem data alvo'}
            </p>
          </div>
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
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs font-semibold">{Math.round(goal.progressPercent)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(goal.progressPercent, 100)}%`,
              backgroundColor: goal.isCompleted ? '#22c55e' : '#3b82f6',
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">Atual</p>
          <CurrencyBadge value={goal.currentAmount} size="sm" />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Meta</p>
          <CurrencyBadge value={goal.targetAmount} size="sm" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Badge variant={goal.isCompleted ? 'income' : 'secondary'} size="extra-small">
          {goal.isCompleted ? 'Concluída' : 'Em andamento'}
        </Badge>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onAddContribution} title="Adicionar Contribuição">
            <TrendingUp size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onShowHistory} title="Histórico de Contribuições">
            <History size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
