import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeactivateAccount } from '../hooks/useAccounts'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Spinner } from '../components/ui/spinner'
import type { AccountType, Account } from '../types'

const accountTypeLabels: Record<AccountType, string> = {
  CheckingAccount: 'Conta Corrente',
  Savings: 'Poupança',
  Wallet: 'Carteira',
  Other: 'Outro',
}

const accountTypeEmoji: Record<AccountType, string> = {
  CheckingAccount: '🏦',
  Savings: '💰',
  Wallet: '👛',
  Other: '📁',
}

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['CheckingAccount', 'Savings', 'Wallet', 'Other']),
  initialBalance: z.number(),
})

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['CheckingAccount', 'Savings', 'Wallet', 'Other']),
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deactivateAccount = useDeactivateAccount()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', type: 'CheckingAccount', initialBalance: 0 },
  })

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: '', type: 'CheckingAccount' },
  })

  const handleCreate = async (data: CreateFormData) => {
    try {
      await createAccount.mutateAsync(data)
      setCreateOpen(false)
      createForm.reset()
    } catch { /* handled by query client */ }
  }

  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return
    try {
      await updateAccount.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
    } catch { /* handled by query client */ }
  }

  const handleDeactivate = async () => {
    if (!deleteTarget) return
    try {
      await deactivateAccount.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch { /* handled by query client */ }
  }

  const openEdit = (account: Account) => {
    setEditTarget(account)
    editForm.reset({ name: account.name, type: account.type })
  }

  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []

  return (
    <div>
      <PageHeader
        title="Contas"
        action={
          <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
            Nova Conta
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : activeAccounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={48} />}
          title="Nenhuma conta cadastrada"
          description="Adicione uma conta para começar a registrar suas transações."
          action={
            <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
              Criar Conta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEdit(account)}
              onDeactivate={() => setDeleteTarget(account)}
            />
          ))}
        </div>
      )}

      {/* Create sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Conta</SheetTitle>
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
                    <Input {...field} placeholder="Ex: Conta Bradesco" />
                  </Field>
                )}
              />
              <Controller
                name="type"
                control={createForm.control}
                render={({ field }) => (
                  <Field label="Tipo" required>
                    <NativeSelect {...field}>
                      {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
              <Controller
                name="initialBalance"
                control={createForm.control}
                render={({ field: { onChange, value } }) => (
                  <Field label="Saldo Inicial" required>
                    <CurrencyInput value={value ?? 0} onChange={onChange} />
                  </Field>
                )}
              />
            </div>
            <div className="flex gap-2 pt-5">
              <Button
                className="flex-1"
                onClick={createForm.handleSubmit(handleCreate as () => Promise<void>)}
                disabled={createAccount.isPending}
                icon={createAccount.isPending ? <Spinner size="tiny" /> : undefined}
              >
                {createAccount.isPending ? 'Salvando…' : 'Criar Conta'}
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
            <SheetTitle>Editar Conta</SheetTitle>
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
                name="type"
                control={editForm.control}
                render={({ field }) => (
                  <Field label="Tipo" required>
                    <NativeSelect {...field}>
                      {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            </div>
            <div className="flex gap-2 pt-5">
              <Button
                className="flex-1"
                onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
                disabled={updateAccount.isPending}
                icon={updateAccount.isPending ? <Spinner size="tiny" /> : undefined}
              >
                {updateAccount.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Desativar Conta"
        message={`Tem certeza que deseja desativar "${deleteTarget?.name}"? Você não poderá registrar transações nela.`}
        confirmText="Desativar"
        destructive
        onConfirm={handleDeactivate}
        loading={deactivateAccount.isPending}
      />
    </div>
  )
}

function AccountCard({
  account,
  onEdit,
  onDeactivate,
}: {
  account: Account
  onEdit: () => void
  onDeactivate: () => void
}) {
  const emoji = accountTypeEmoji[account.type]
  const label = accountTypeLabels[account.type]

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{account.name}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDeactivate}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-1">Saldo atual</p>
        <CurrencyBadge value={account.balance} />
      </div>
    </div>
  )
}
