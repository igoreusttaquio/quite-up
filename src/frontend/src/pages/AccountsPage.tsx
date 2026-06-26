import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '../api/accounts'

const schema = z.object({ name: z.string().min(1, 'Nome obrigatório'), type: z.string().min(1), initialBalance: z.coerce.number() })
type FormData = z.infer<typeof schema>
const accountTypes = [
  { value: 'Checking', label: 'Conta corrente' }, { value: 'Savings', label: 'Poupança' },
  { value: 'Cash', label: 'Carteira' }, { value: 'Other', label: 'Outro' },
]

function AccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (d: FormData) => accountsApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); onClose(); reset() },
  })
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">Nova conta</h2>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`} {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('type')}>
              {accountTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
            <input type="number" step="0.01" className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.initialBalance ? 'border-red-400' : 'border-gray-300'}`} {...register('initialBalance')} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AccountsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.getAll(), select: (res) => res.data })
  const deactivateMutation = useMutation({ mutationFn: (id: string) => accountsApi.deactivate(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }) })
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Nova conta</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.map((a) => (
          <div key={a.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 ${!a.isActive ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{a.name}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{accountTypes.find((t) => t.value === a.type)?.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmt(a.balance)}</p>
            {a.isActive && <button onClick={() => deactivateMutation.mutate(a.id)} className="mt-3 text-sm text-red-600 hover:text-red-700">Desativar</button>}
          </div>
        ))}
      </div>
      <AccountModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
