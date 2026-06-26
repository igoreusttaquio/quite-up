import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories'

const schema = z.object({ name: z.string().min(1), type: z.string().min(1), icon: z.string().min(1), color: z.string().min(1) })
type FormData = z.infer<typeof schema>
const icons = ['💰', '🍕', '🚗', '🏥', '🏠', '📚', '🎮', '👕', '✈️', '💻', '🏋️', '🎵', '🐾', '🎁', '💡', '📱']
const colors = [
  { value: '#f43f5e', label: 'Vermelho' }, { value: '#f97316', label: 'Laranja' }, { value: '#eab308', label: 'Amarelo' },
  { value: '#22c55e', label: 'Verde' }, { value: '#06b6d4', label: 'Ciano' }, { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' }, { value: '#ec4899', label: 'Rosa' },
]

function CategoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (d: FormData) => categoriesApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); onClose(); reset() },
  })
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">Nova categoria</h2>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('type')} defaultValue="Expense">
              <option value="Income">Receita</option><option value="Expense">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" {...register('icon')} defaultValue="💰">
              {icons.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" value={c.value} className="sr-only peer" {...register('color')} />
                  <div className="w-7 h-7 rounded-full border-2 border-transparent peer-checked:border-gray-400 transition-colors" style={{ backgroundColor: c.value }} />
                </label>
              ))}
            </div>
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

export function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories', filter], queryFn: () => categoriesApi.getAll(filter !== 'all' ? filter : undefined), select: (res) => res.data })
  const deleteMutation = useMutation({ mutationFn: (id: string) => categoriesApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Nova categoria</button>
      </div>
      <div className="flex gap-2">
        {[{ key: 'all', label: 'Todas' }, { key: 'Income', label: 'Receitas' }, { key: 'Expense', label: 'Despesas' }].map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories?.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center gap-2">
            <span className="text-3xl">{cat.icon}</span>
            <p className="font-medium text-sm text-gray-900">{cat.name}</p>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
              {cat.type === 'Income' ? 'Receita' : 'Despesa'}
            </span>
            {!cat.isDefault && <button onClick={() => deleteMutation.mutate(cat.id)} className="text-xs text-red-600 hover:text-red-700 mt-1">Excluir</button>}
          </div>
        ))}
      </div>
      <CategoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
