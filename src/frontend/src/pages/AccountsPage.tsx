import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button, Input, Card, CardContent, CardHeader, CardTitle, Chip,
  Modal, ModalBackdrop, ModalBody, ModalCloseTrigger, ModalContainer,
  ModalDialog, ModalFooter, ModalHeader, ModalHeading, useOverlayState,
} from '@heroui/react'
import { accountsApi } from '../api/accounts'

interface OverlayState {
  readonly isOpen: boolean
  setOpen(isOpen: boolean): void
  open(): void
  close(): void
  toggle(): void
}

const schema = z.object({ name: z.string().min(1, 'Nome obrigatório'), type: z.string().min(1), initialBalance: z.number() })
type FormData = z.infer<typeof schema>
const accountTypes = [
  { value: 'Checking', label: 'Conta corrente', icon: '🏦' },
  { value: 'Savings', label: 'Poupança', icon: '🐷' },
  { value: 'Cash', label: 'Carteira', icon: '👛' },
  { value: 'Other', label: 'Outro', icon: '📦' },
]

function AccountModal({ state }: { state: OverlayState }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (d: FormData) => accountsApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); state.close(); reset() },
  })

  return (
    <Modal state={state}>
      <ModalBackdrop />
      <ModalContainer>
        <ModalDialog>
          <ModalCloseTrigger />
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <ModalHeader>
              <ModalHeading>Nova conta</ModalHeading>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <Input placeholder="Ex: Nubank, Carteira" {...register('name')} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" {...register('type')}>
                  {accountTypes.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Saldo inicial</label>
                <Input type="number" step="0.01" placeholder="0,00" {...register('initialBalance', { valueAsNumber: true })} />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onPress={() => state.close()}>Cancelar</Button>
              <Button type="submit" variant="primary" isDisabled={mutation.isPending}
                className="bg-gradient-to-r from-violet-600 to-indigo-600">Criar</Button>
            </ModalFooter>
          </form>
        </ModalDialog>
      </ModalContainer>
    </Modal>
  )
}

export function AccountsPage() {
  const addOverlay = useOverlayState({ defaultOpen: false })
  const queryClient = useQueryClient()
  const { data: accounts, isLoading } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.getAll(), select: (res) => res.data })
  const deactivateMutation = useMutation({ mutationFn: (id: string) => accountsApi.deactivate(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }) })
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie suas contas bancárias</p>
        </div>
        <Button variant="primary" onPress={() => addOverlay.open()}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-200">
          + Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-2/3" />
            </div>
          ))
        ) : accounts?.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="text-5xl">🏦</span>
            <p className="text-gray-400 mt-4">Nenhuma conta cadastrada</p>
            <Button variant="ghost" onPress={() => addOverlay.open()} className="mt-2">
              Criar primeira conta
            </Button>
          </div>
        ) : accounts?.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${!a.isActive ? 'opacity-50' : ''}`}>
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-indigo-600" />
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{accountTypes.find((t) => t.value === a.type)?.icon || '🏦'}</span>
                  <div>
                    <CardTitle className="text-base">{a.name}</CardTitle>
                    <Chip size="sm" variant="soft" className="bg-indigo-100 text-indigo-700">
                      {accountTypes.find((t) => t.value === a.type)?.label}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Saldo disponível</p>
                <p className={`text-2xl font-bold mt-1 ${a.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{fmt(a.balance)}</p>
                {a.isActive && (
                  <Button size="sm" variant="danger-soft" onPress={() => deactivateMutation.mutate(a.id)} className="mt-3">
                    Desativar
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AccountModal state={addOverlay} />
    </motion.div>
  )
}
