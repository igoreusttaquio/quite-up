import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi } from '../api/transactions'
import { accountsApi } from '../api/accounts'
import { categoriesApi } from '../api/categories'

const schema = z.object({
  type: z.string().min(1, 'Tipo obrigatório'),
  value: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data obrigatória'),
  accountId: z.string().min(1, 'Conta obrigatória'),
  categoryId: z.string().optional(),
  destinationAccountId: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const typeStyles: Record<string, { label: string; bg: string; text: string }> = {
  Income: { label: 'Receita', bg: 'bg-green-100', text: 'text-green-700' },
  Expense: { label: 'Despesa', bg: 'bg-red-100', text: 'text-red-700' },
  Transfer: { label: 'Transferência', bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

function TransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchType = watch('type')

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
      onClose()
      reset()
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Nova transação</h2>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('type')} defaultValue="Expense">
              <option value="Income">Receita</option>
              <option value="Expense">Despesa</option>
              <option value="Transfer">Transferência</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input type="number" step="0.01" placeholder="0,00"
              className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.value ? 'border-red-400' : 'border-gray-300'}`}
              {...register('value')} />
            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input type="date"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('accountId')}>
              <option value="">Selecione...</option>
              {accounts?.filter((a) => a.isActive).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {watchType !== 'Transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('categoryId')}>
                <option value="">Sem categoria</option>
                {categories?.filter((c) => c.type === (watchType === 'Income' ? 'Income' : 'Expense')).map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {watchType === 'Transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta de destino</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('destinationAccountId')}>
                <option value="">Selecione...</option>
                {accounts?.filter((a) => a.isActive).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <input className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('description')} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {createMutation.isPending ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll(),
    select: (res) => res.data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Nova transação
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Data', 'Tipo', 'Valor', 'Conta', 'Categoria', 'Descrição', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(transactions?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma transação encontrada</td>
                </tr>
              ) : (
                transactions?.items.map((t) => {
                  const style = typeStyles[t.type]
                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{fmt(t.value)}</td>
                      <td className="px-4 py-3 text-gray-600">{t.accountName}</td>
                      <td className="px-4 py-3 text-gray-600">{t.categoryName ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-400">{t.description ?? '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteMutation.mutate(t.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
