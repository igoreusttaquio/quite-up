import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button, Input, Chip, Card, CardContent,
  Modal, ModalBackdrop, ModalBody, ModalCloseTrigger, ModalContainer,
  ModalDialog, ModalFooter, ModalHeader, ModalHeading, useOverlayState,
} from '@heroui/react'
import { transactionsApi } from '../api/transactions'
import { accountsApi } from '../api/accounts'
import { categoriesApi } from '../api/categories'

interface OverlayState {
  readonly isOpen: boolean
  setOpen(isOpen: boolean): void
  open(): void
  close(): void
  toggle(): void
}

const schema = z.object({
  type: z.string().min(1), value: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1), accountId: z.string().min(1), categoryId: z.string().optional(),
  destinationAccountId: z.string().optional(), description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const typeStyles: Record<string, { label: string; color: 'success' | 'danger' | 'warning'; icon: string }> = {
  Income: { label: 'Receita', color: 'success', icon: '📈' },
  Expense: { label: 'Despesa', color: 'danger', icon: '📉' },
  Transfer: { label: 'Transferência', color: 'warning', icon: '🔄' },
}

function TransactionModal({ state }: { state: OverlayState }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const watchType = watch('type')
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.getAll(), select: (res) => res.data })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll(), select: (res) => res.data })
  const mutation = useMutation({
    mutationFn: (d: FormData) => transactionsApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); queryClient.invalidateQueries({ queryKey: ['accounts'] }); state.close(); reset() },
  })

  return (
    <Modal state={state}>
      <ModalBackdrop />
      <ModalContainer>
        <ModalDialog>
          <ModalCloseTrigger />
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <ModalHeader><ModalHeading>Nova transação</ModalHeading></ModalHeader>
            <ModalBody className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" {...register('type')} defaultValue="Expense">
                  <option value="Income">📈 Receita</option><option value="Expense">📉 Despesa</option><option value="Transfer">🔄 Transferência</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Valor</label>
                <Input type="number" step="0.01" placeholder="0,00" {...register('value', { valueAsNumber: true })} />
                {errors.value && <p className="text-red-500 text-xs">{errors.value.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Data</label>
                <Input type="date" {...register('date')} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Conta</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" {...register('accountId')}>
                  <option value="">Selecione...</option>
                  {accounts?.filter((a) => a.isActive).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {watchType !== 'Transfer' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" {...register('categoryId')}>
                    <option value="">Sem categoria</option>
                    {categories?.filter((c) => c.type === (watchType === 'Income' ? 'Income' : 'Expense')).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              )}
              {watchType === 'Transfer' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Conta de destino</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white" {...register('destinationAccountId')}>
                    <option value="">Selecione...</option>
                    {accounts?.filter((a) => a.isActive).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
                <Input placeholder="Descrição da transação" {...register('description')} />
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

export function TransactionsPage() {
  const addOverlay = useOverlayState({ defaultOpen: false })
  const queryClient = useQueryClient()
  const { data: transactions, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: () => transactionsApi.getAll(), select: (res) => res.data })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); queryClient.invalidateQueries({ queryKey: ['accounts'] }) },
  })
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de todas as movimentações</p>
        </div>
        <Button variant="primary" onPress={() => addOverlay.open()}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-200">
          + Nova transação
        </Button>
      </div>

      <Card className="border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Data', 'Tipo', 'Valor', 'Conta', 'Categoria', 'Descrição', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : (transactions?.items ?? []).length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                    <span className="text-4xl">📝</span>
                    <p className="mt-2">Nenhuma transação encontrada</p>
                  </td></tr>
                ) : transactions?.items.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-medium">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" color={typeStyles[t.type].color} variant="soft">
                        {typeStyles[t.type].icon} {typeStyles[t.type].label}
                      </Chip>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${t.type === 'Income' ? 'text-green-600' : t.type === 'Expense' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {t.type === 'Income' ? '+' : t.type === 'Expense' ? '-' : ''}{fmt(t.value)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.accountName}</td>
                    <td className="px-4 py-3 text-gray-600">{t.categoryName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{t.description ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger-soft" onPress={() => deleteMutation.mutate(t.id)} className="text-xs">
                        Excluir
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransactionModal state={addOverlay} />
    </motion.div>
  )
}
