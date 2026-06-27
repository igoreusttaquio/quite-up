import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../components/ui/sheet'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeactivateAccount } from '../hooks/useAccounts'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyBadge } from '../components/CurrencyBadge'
import type { AccountType, Account } from '../types'

const accountTypeLabels: Record<AccountType, string> = {
  CheckingAccount: 'Conta Corrente', Savings: 'Poupança', Wallet: 'Carteira', Other: 'Outro',
}
const accountTypeEmoji: Record<AccountType, string> = {
  CheckingAccount: '🏦', Savings: '💰', Wallet: '👛', Other: '📁',
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

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema), defaultValues: { name: '', type: 'CheckingAccount', initialBalance: 0 } })
  const editForm = useForm<UpdateFormData>({ resolver: zodResolver(updateSchema), defaultValues: { name: '', type: 'CheckingAccount' } })

  const handleCreate = async (data: CreateFormData) => {
    try { await createAccount.mutateAsync(data); setCreateOpen(false); createForm.reset() } catch {}
  }
  const handleEdit = async (data: UpdateFormData) => {
    if (!editTarget) return; try { await updateAccount.mutateAsync({ id: editTarget.id, data }); setEditTarget(null) } catch {}
  }
  const handleDeactivate = async () => {
    if (!deleteTarget) return; try { await deactivateAccount.mutateAsync(deleteTarget.id); setDeleteTarget(null) } catch {}
  }
  const openEdit = (account: Account) => { setEditTarget(account); editForm.reset({ name: account.name, type: account.type }) }
  const activeAccounts = accounts?.filter((a) => a.isActive) ?? []

  return (
    <div>
      <PageHeader title="Contas" action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova Conta</Button>} />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : activeAccounts.length === 0 ? (
        <EmptyState icon={<Wallet className="h-12 w-12" />} title="Nenhuma conta cadastrada" description="Adicione uma conta para começar." action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />Criar Conta</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAccounts.map((account) => (
            <AccountCard key={account.id} account={account} onEdit={() => openEdit(account)} onDeactivate={() => setDeleteTarget(account)} />
          ))}
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Nova Conta</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Controller name="name" control={createForm.control} render={({ field }) => <Input {...field} placeholder="Ex: Conta Bradesco" />} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller name="type" control={createForm.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.entries(accountTypeLabels) as [AccountType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Saldo Inicial</Label>
              <Controller name="initialBalance" control={createForm.control} render={({ field: { onChange, value, ...rest } }) => (
                <Input type="number" step="0.01" placeholder="0,00" value={String(value ?? '')} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)} {...rest} />
              )} />
            </div>
          </div>
          <SheetFooter><Button onClick={createForm.handleSubmit(handleCreate as () => Promise<void>)} disabled={createAccount.isPending}>{createAccount.isPending ? 'Salvando…' : 'Criar Conta'}</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <SheetContent>
          <SheetHeader><SheetTitle>Editar Conta</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Controller name="name" control={editForm.control} render={({ field }) => <Input {...field} />} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller name="type" control={editForm.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.entries(accountTypeLabels) as [AccountType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <SheetFooter><Button onClick={editForm.handleSubmit(handleEdit as () => Promise<void>)} disabled={updateAccount.isPending}>{updateAccount.isPending ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} title="Desativar Conta" message={`Tem certeza que deseja desativar "${deleteTarget?.name}"?`} confirmText="Desativar" destructive onConfirm={handleDeactivate} loading={deactivateAccount.isPending} />
    </div>
  )
}

function AccountCard({ account, onEdit, onDeactivate }: { account: Account; onEdit: () => void; onDeactivate: () => void }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{accountTypeEmoji[account.type]}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{account.name}</p>
            <p className="text-xs text-muted-foreground">{accountTypeLabels[account.type]}</p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDeactivate}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground mb-1">Saldo atual</p>
        <CurrencyBadge value={account.balance} />
      </div>
    </div>
  )
}
