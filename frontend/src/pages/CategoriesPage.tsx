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
import { AddFilled, EditFilled, DeleteFilled, TagFilled } from '@fluentui/react-icons'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { CategoryType, Category } from '../types'

const categoryTypeLabels: Record<CategoryType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
}

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['Income', 'Expense']),
  icon: z.string(),
  color: z.string(),
})

type FormData = z.infer<typeof schema>

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'Expense', icon: '', color: '#6b7280' },
  })

  const handleCreate = async (data: FormData) => {
    try {
      await createCategory.mutateAsync(data)
      setCreateOpen(false)
      form.reset()
    } catch {
      // handled by query client
    }
  }

  const handleEdit = async (data: FormData) => {
    if (!editTarget) return
    try {
      await updateCategory.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
    } catch {
      // handled by query client
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategory.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // handled by query client
    }
  }

  const openEdit = (category: Category) => {
    setEditTarget(category)
    form.reset({ name: category.name, type: category.type, icon: category.icon, color: category.color })
  }

  if (isLoading) return <LoadingScreen />

  const incomeCategories = categories?.filter((c) => c.type === 'Income') || []
  const expenseCategories = categories?.filter((c) => c.type === 'Expense') || []

  return (
    <div>
      <PageHeader title="Categorias" action={
        <Button appearance="primary" icon={<AddFilled />} onClick={() => {
          form.reset({ name: '', type: 'Expense', icon: '', color: '#6b7280' })
          setCreateOpen(true)
        }}>
          Nova Categoria
        </Button>
      } />

      {(!categories || categories.length === 0) ? (
        <EmptyState
          icon={<TagFilled style={{ fontSize: 48 }} />}
          message="Nenhuma categoria cadastrada"
          action={
            <Button appearance="primary" icon={<AddFilled />} onClick={() => {
              form.reset({ name: '', type: 'Expense', icon: '', color: '#6b7280' })
              setCreateOpen(true)
            }}>
              Criar Categoria
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div>
            <Text size={500} weight="semibold" className="mb-3 block">
              Receitas
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {incomeCategories.length === 0 ? (
                <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                  Nenhuma categoria de receita
                </Text>
              ) : (
                incomeCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={() => openEdit(category)}
                    onDelete={() => setDeleteTarget(category)}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <Text size={500} weight="semibold" className="mb-3 block">
              Despesas
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenseCategories.length === 0 ? (
                <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
                  Nenhuma categoria de despesa
                </Text>
              ) : (
                expenseCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={() => openEdit(category)}
                    onDelete={() => setDeleteTarget(category)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={createOpen || !!editTarget}
        onOpenChange={(_, data) => {
          if (!data.open) { setCreateOpen(false); setEditTarget(null) }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editTarget ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogContent>
              <div className="space-y-4 mt-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <Field label="Nome" required
                      validationState={form.formState.errors.name ? 'error' : undefined}
                      validationMessage={form.formState.errors.name?.message}
                    >
                      <Input {...field} placeholder="Nome da categoria" />
                    </Field>
                  )}
                />
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Field label="Tipo" required>
                      <Select {...field} disabled={!!editTarget}>
                        {(Object.entries(categoryTypeLabels) as [CategoryType, string][]).map(
                          ([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          )
                        )}
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  name="icon"
                  control={form.control}
                  render={({ field }) => (
                    <Field label="Ícone">
                      <Input {...field} placeholder="Nome do ícone" />
                    </Field>
                  )}
                />
                <Controller
                  name="color"
                  control={form.control}
                  render={({ field }) => (
                    <Field label="Cor">
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full h-10 rounded border cursor-pointer"
                        style={{ borderColor: 'var(--colorNeutralStroke1)', backgroundColor: 'var(--colorNeutralBackground1)' }}
                      />
                    </Field>
                  )}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={editTarget ? form.handleSubmit(handleEdit as () => Promise<void>) : form.handleSubmit(handleCreate as () => Promise<void>)}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {createCategory.isPending || updateCategory.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={() => { setCreateOpen(false); setEditTarget(null) }}>
                Cancelar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${deleteTarget?.name}"?`}
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteCategory.isPending}
      />
    </div>
  )
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="w-full">
      <CardHeader
        header={
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
            <Text weight="semibold">{category.name}</Text>
          </div>
        }
        action={
          <div className="flex gap-1">
            {!category.isDefault && (
              <>
                <Button appearance="subtle" icon={<EditFilled />} size="small" onClick={onEdit} />
                <Button appearance="subtle" icon={<DeleteFilled />} size="small" onClick={onDelete} />
              </>
            )}
            {category.isDefault && (
              <Tag size="extra-small" appearance="outline">Padrão</Tag>
            )}
          </div>
        }
      />
    </Card>
  )
}
