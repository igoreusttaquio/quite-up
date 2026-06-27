import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Field,
  Input,
  Select,
  Text,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  Spinner,
} from '@fluentui/react-components'
import { AddFilled, EditFilled, DeleteFilled, MoneyFilled, DismissRegular } from '@fluentui/react-icons'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeactivateAccount } from '../hooks/useAccounts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
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
          <Button appearance="primary" icon={<AddFilled />} onClick={() => setCreateOpen(true)}>
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
          icon={<MoneyFilled style={{ fontSize: 48 }} />}
          title="Nenhuma conta cadastrada"
          description="Adicione uma conta para começar a registrar suas transações."
          action={
            <Button appearance="primary" icon={<AddFilled />} onClick={() => setCreateOpen(true)}>
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

      {/* Create drawer */}
      <Drawer
        type="inline"
        position="end"
        size="medium"
        open={createOpen}
        onOpenChange={(_, { open }) => setCreateOpen(open)}
      >
        <DrawerHeader>
          <DrawerHeaderNavigation>
            <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setCreateOpen(false)} />
          </DrawerHeaderNavigation>
          <DrawerHeaderTitle>Nova Conta</DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
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
                  <Select {...field}>
                    {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="initialBalance"
              control={createForm.control}
              render={({ field: { onChange, value, ...rest } }) => (
                <Field label="Saldo Inicial" required>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={String(value ?? '')}
                    onChange={(_e, data) => onChange(data.value ? Number(data.value) : 0)}
                    {...rest}
                  />
                </Field>
              )}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              appearance="primary"
              className="flex-1"
              onClick={createForm.handleSubmit(handleCreate as () => Promise<void>)}
              disabled={createAccount.isPending}
              icon={createAccount.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {createAccount.isPending ? 'Salvando…' : 'Criar Conta'}
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          </div>
        </DrawerBody>
      </Drawer>

      {/* Edit drawer */}
      <Drawer
        type="inline"
        position="end"
        size="medium"
        open={!!editTarget}
        onOpenChange={(_, { open }) => { if (!open) setEditTarget(null) }}
      >
        <DrawerHeader>
          <DrawerHeaderNavigation>
            <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setEditTarget(null)} />
          </DrawerHeaderNavigation>
          <DrawerHeaderTitle>Editar Conta</DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
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
                  <Select {...field}>
                    {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </Field>
              )}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              appearance="primary"
              className="flex-1"
              onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
              disabled={updateAccount.isPending}
              icon={updateAccount.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {updateAccount.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
          </div>
        </DrawerBody>
      </Drawer>

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
            <Text weight="semibold" size={400} block truncate>{account.name}</Text>
            <Text size={200} className="text-muted">{label}</Text>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <Button appearance="subtle" icon={<EditFilled />} size="small" onClick={onEdit} />
          <Button appearance="subtle" icon={<DeleteFilled />} size="small" onClick={onDeactivate} />
        </div>
      </div>
      <div className="pt-3 border-t border-subtle">
        <Text size={200} className="text-muted mb-1 block">Saldo atual</Text>
        <CurrencyBadge value={account.balance} />
      </div>
    </div>
  )
}
