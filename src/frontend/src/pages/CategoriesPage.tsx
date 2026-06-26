import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button, Input, Chip,
  Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from '@heroui/react'
import { categoriesApi } from '../api/categories'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  type: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
})
type FormData = z.infer<typeof schema>

const icons = ['💰', '🍕', '🚗', '🏥', '🏠', '📚', '🎮', '👕', '✈️', '💻', '🏋️', '🎵', '🐾', '🎁', '💡', '📱']
const colors = [
  { value: '#f43f5e', label: 'Vermelho' }, { value: '#f97316', label: 'Laranja' },
  { value: '#eab308', label: 'Amarelo' }, { value: '#22c55e', label: 'Verde' },
  { value: '#06b6d4', label: 'Ciano' }, { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' }, { value: '#ec4899', label: 'Rosa' },
]

const selectCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-indigo-500 bg-white transition-colors'

export function CategoriesPage() {
  const modalState = useOverlayState()
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Expense', icon: '💰', color: '#8b5cf6' },
  })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', filter],
    queryFn: () => categoriesApi.getAll(filter !== 'all' ? filter : undefined),
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => categoriesApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      modalState.close()
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'Income', label: 'Receitas' },
    { key: 'Expense', label: 'Despesas' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 text-sm mt-1">Organize suas receitas e despesas</p>
        </div>
        <Button
          variant="primary"
          onPress={modalState.open}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
        >
          + Nova categoria
        </Button>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm ${
              filter === f.key
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex flex-col items-center gap-2 h-28" />
          ))
        ) : categories?.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 p-4 flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform duration-200"
          >
            <span className="text-3xl">{cat.icon}</span>
            <p className="font-medium text-sm text-gray-900">{cat.name}</p>
            <Chip
              size="sm"
              variant="soft"
              style={{ backgroundColor: cat.color + '20', color: cat.color }}
            >
              {cat.type === 'Income' ? 'Receita' : 'Despesa'}
            </Chip>
            {!cat.isDefault && (
              <Button
                size="sm"
                variant="danger-soft"
                onPress={() => deleteMutation.mutate(cat.id)}
                isDisabled={deleteMutation.isPending}
                className="mt-1"
              >
                Excluir
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <Modal state={modalState}>
        <ModalBackdrop isDismissable />
        <ModalContainer>
          <ModalDialog>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
              <ModalHeader>
                <ModalHeading>Nova categoria</ModalHeading>
                <ModalCloseTrigger />
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Nome</label>
                  <Input fullWidth placeholder="Ex: Alimentação, Transporte" {...register('name')} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select className={selectCls} {...register('type')}>
                    <option value="Income">Receita</option>
                    <option value="Expense">Despesa</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ícone</label>
                  <select className={selectCls} {...register('icon')}>
                    {icons.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Cor</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <label key={c.value} className="cursor-pointer">
                        <input type="radio" value={c.value} className="sr-only peer" {...register('color')} />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-gray-500 peer-checked:scale-110 hover:scale-110 transition-all shadow-sm"
                          style={{ backgroundColor: c.value }}
                        />
                      </label>
                    ))}
                  </div>
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
