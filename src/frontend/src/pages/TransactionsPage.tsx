import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button, Input, Chip, Card, CardContent,
  Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from '@heroui/react'
import { transactionsApi } from '../api/transactions'
import { accountsApi } from '../api/accounts'
import { categoriesApi } from '../api/categories'

const schema = z.object({
  type: z.string().min(1),
  value: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1),
  accountId: z.string().min(1, 'Conta obrigatória'),
  categoryId: z.string().optional(),
  destinationAccountId: z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const typeConfig: Record<string, { label: string; chipColor: 'success' | 'danger' | 'warning'; icon: string; textColor: string }> = {
  Income:   { label: 'Receita',       chipColor: 'success', icon: '📈', textColor: 'text-green-600' },
  Expense:  { label: 'Despesa',       chipColor: 'danger',  icon: '📉', textColor: 'text-red-600' },
  Transfer: { label: 'Transferência', chipColor: 'warning', icon: '🔄', textColor: 'text-yellow-600' },
}

const selectCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-indigo-500 bg-white transition-colors'

export function TransactionsPage() {
  const modalState = useOverlayState()
  const queryClient = useQueryClient()
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Expense', date: new Date().toISOString().split('T')[0] },
  })
  const watchType = watch('type')

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll(),
    select: (res) => res.data,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll(),
    select: (res) => res.data,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => transactionsApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      modalState.close()
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de todas as movimentações</p>
        </div>
        <Button
          variant="primary"
          onPress={modalState.open}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
        >
          + Nova transação
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Data', 'Tipo', 'Valor', 'Conta', 'Categoria', 'Descrição', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (transactions?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <span className="text-4xl">📝</span>
                      <p className="mt-2">Nenhuma transação encontrada</p>
                    </td>
                  </tr>
                ) : transactions?.items.map((t, i) => {
                  const cfg = typeConfig[t.type]
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Chip size="sm" color={cfg.chipColor} variant="soft">
                          {cfg.icon} {cfg.label}
                        </Chip>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${cfg.textColor}`}>
                        {t.type === 'Income' ? '+' : t.type === 'Expense' ? '-' : ''}{fmt(t.value)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.accountName}</td>
                      <td className="px-4 py-3 text-gray-500">{t.categoryName ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">
                        {t.description ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="danger-soft"
                          onPress={() => deleteMutation.mutate(t.id)}
                        >
                          Excluir
                        </Button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal state={modalState}>
        <ModalBackdrop isDismissable />
        <ModalContainer scroll="inside">
          <ModalDialog>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
              <ModalHeader>
                <ModalHeading>Nova transação</ModalHeading>
                <ModalCloseTrigger />
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select className={selectCls} {...register('type')}>
                    <option value="Income">📈 Receita</option>
                    <option value="Expense">📉 Despesa</option>
                    <option value="Transfer">🔄 Transferência</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Valor</label>
                  <Input
                    fullWidth
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...register('value', { valueAsNumber: true })}
                    className={errors.value ? 'border-red-500' : ''}
                  />
                  {errors.value && <p className="text-red-500 text-xs">{errors.value.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <Input fullWidth type="date" {...register('date')} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Conta</label>
                  <select className={selectCls} {...register('accountId')}>
                    <option value="">Selecione a conta...</option>
                    {accounts?.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {errors.accountId && <p className="text-red-500 text-xs">{errors.accountId.message}</p>}
                </div>
                {watchType !== 'Transfer' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Categoria</label>
                    <select className={selectCls} {...register('categoryId')}>
                      <option value="">Sem categoria</option>
                      {categories?.filter((c) => c.type === (watchType === 'Income' ? 'Income' : 'Expense')).map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {watchType === 'Transfer' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Conta de destino</label>
                    <select className={selectCls} {...register('destinationAccountId')}>
                      <option value="">Selecione a conta...</option>
                      {accounts?.filter((a) => a.isActive).map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
                  <Input fullWidth placeholder="Descrição da transação" {...register('description')} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onPress={modalState.close}>Cancelar</Button>
                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={createMutation.isPending}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600"
                >
                  Criar
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </Modal>
    </motion.div>
  )
}
