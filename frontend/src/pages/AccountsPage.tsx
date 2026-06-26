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
  Card,
  CardHeader,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tag,
} from '@fluentui/react-components'
import { AddFilled, EditFilled, DeleteFilled, MoneyFilled } from '@fluentui/react-icons'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeactivateAccount } from '../hooks/useAccounts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import type { AccountType, Account } from '../types'

const accountTypeLabels: Record<AccountType, string> = {
  CheckingAccount: 'Conta Corrente',
  Savings: 'Poupança',
  Wallet: 'Carteira',
  Other: 'Outro',
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
    } catch {
      // handled by query client
    }
  }

  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return
    try {
      await updateAccount.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
    } catch {
      // handled by query client
    }
  }

  const handleDeactivate = async () => {
    if (!deleteTarget) return
    try {
      await deactivateAccount.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // handled by query client
    }
  }

  const openEdit = (account: Account) => {
    setEditTarget(account)
    editForm.reset({ name: account.name, type: account.type })
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div>
      <PageHeader title="Contas" action={
        <Button appearance="primary" icon={<AddFilled />} onClick={() => setCreateOpen(true)}>
          Nova Conta
        </Button>
      } />

      {(!accounts || accounts.length === 0) ? (
        <EmptyState
          icon={<MoneyFilled style={{ fontSize: 48 }} />}
          message="Nenhuma conta cadastrada"
          action={
            <Button appearance="primary" icon={<AddFilled />} onClick={() => setCreateOpen(true)}>
              Criar Conta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts
            .filter((a) => a.isActive)
            .map((account) => (
              <Card key={account.id} className="w-full">
                <CardHeader
                  header={
                    <div className="flex items-center gap-2">
                      <Text weight="semibold">{account.name}</Text>
                      <Tag size="small">{accountTypeLabels[account.type]}</Tag>
                    </div>
                  }
                  action={
                    <div className="flex gap-1">
                      <Button
                        appearance="subtle"
                        icon={<EditFilled />}
                        size="small"
                        onClick={() => openEdit(account)}
                      />
                      <Button
                        appearance="subtle"
                        icon={<DeleteFilled />}
                        size="small"
                        onClick={() => setDeleteTarget(account)}
                      />
                    </div>
                  }
                />
                <CurrencyBadge value={account.balance} />
              </Card>
            ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(_, data) => setCreateOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Nova Conta</DialogTitle>
            <DialogContent>
              <div className="space-y-4 mt-2">
                <Controller
                  name="name"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Nome" required
                      validationState={createForm.formState.errors.name ? 'error' : undefined}
                      validationMessage={createForm.formState.errors.name?.message}
                    >
                      <Input {...field} placeholder="Nome da conta" />
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={createForm.control}
                  render={({ field }) => (
                    <Field label="Tipo" required>
                      <Select {...field}>
                        {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(
                          ([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          )
                        )}
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
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={createForm.handleSubmit(handleCreate as () => Promise<void>)}
                disabled={createAccount.isPending}
              >
                {createAccount.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(_, data) => {
          if (!data.open) setEditTarget(null)
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogContent>
              <div className="space-y-4 mt-2">
                <Controller
                  name="name"
                  control={editForm.control}
                  render={({ field }) => (
                    <Field label="Nome" required
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
                        {(Object.entries(accountTypeLabels) as [AccountType, string][]).map(
                          ([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          )
                        )}
                      </Select>
                    </Field>
                  )}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)}
                disabled={updateAccount.isPending}
              >
                {updateAccount.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Desativar Conta"
        message={`Tem certeza que deseja desativar a conta "${deleteTarget?.name}"?`}
        confirmText="Desativar"
        destructive
        onConfirm={handleDeactivate}
        loading={deactivateAccount.isPending}
      />
    </div>
  )
}
