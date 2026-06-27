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
  Tag,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  Spinner,
} from '@fluentui/react-components'
import { AddFilled, EditFilled, DeleteFilled, TagFilled, DismissRegular } from '@fluentui/react-icons'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { CategoryType, Category } from '../types'

const categoryTypeLabels: Record<CategoryType, string> = {
  Income: 'Receita',
  Expense: 'Despesa',
}

const ICON_OPTIONS = [
  '💰', '💳', '🏠', '🚗', '🍔', '✈️', '📚', '🏥', '🎮', '🛒',
  '💼', '📱', '🎵', '🏋️', '🐾', '🎁', '🔧', '⚡', '🌱', '🏦',
  '🎯', '🍕', '👕', '🚿', '💡', '🌍', '📊', '🎓', '🎬', '🍺',
  '☕', '💊', '🚌', '🔑', '🎸', '🎨', '🧴', '🎪', '💅', '🐕',
]

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  '#84cc16', '#f59e0b', '#10b981', '#0ea5e5', '#6366f1',
]

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
    defaultValues: { name: '', type: 'Expense', icon: '💳', color: '#6366f1' },
  })

  const handleCreate = async (data: FormData) => {
    try {
      await createCategory.mutateAsync(data)
      setCreateOpen(false)
      form.reset()
    } catch { /* handled by query client */ }
  }

  const handleEdit = async (data: FormData) => {
    if (!editTarget) return
    try {
      await updateCategory.mutateAsync({ id: editTarget.id, data })
      setEditTarget(null)
    } catch { /* handled by query client */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategory.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch { /* handled by query client */ }
  }

  const openEdit = (category: Category) => {
    setEditTarget(category)
    form.reset({ name: category.name, type: category.type, icon: category.icon, color: category.color })
  }

  const openCreate = () => {
    form.reset({ name: '', type: 'Expense', icon: '💳', color: '#6366f1' })
    setCreateOpen(true)
  }

  const incomeCategories = categories?.filter((c) => c.type === 'Income') ?? []
  const expenseCategories = categories?.filter((c) => c.type === 'Expense') ?? []

  const isSaving = createCategory.isPending || updateCategory.isPending
  const dialogOpen = createOpen || !!editTarget

  return (
    <div>
      <PageHeader
        title="Categorias"
        action={
          <Button appearance="primary" icon={<AddFilled />} onClick={openCreate}>
            Nova Categoria
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : categories?.length === 0 ? (
        <EmptyState
          icon={<TagFilled style={{ fontSize: 48 }} />}
          title="Nenhuma categoria"
          description="Crie categorias para organizar suas transações."
          action={
            <Button appearance="primary" icon={<AddFilled />} onClick={openCreate}>
              Criar Categoria
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <CategoryGroup
            title="Receitas"
            categories={incomeCategories}
            onEdit={openEdit}
            onDelete={(c) => setDeleteTarget(c)}
          />
          <CategoryGroup
            title="Despesas"
            categories={expenseCategories}
            onEdit={openEdit}
            onDelete={(c) => setDeleteTarget(c)}
          />
        </div>
      )}

      {/* Create / Edit drawer — shared form */}
      <Drawer
        type="overlay"
        modalType="non-modal"
        position="end"
        size="medium"
        open={dialogOpen}
        onOpenChange={(_, { open }) => {
          if (!open) { setCreateOpen(false); setEditTarget(null) }
        }}
      >
        <DrawerHeader>
          <DrawerHeaderNavigation>
            <Button appearance="subtle" icon={<DismissRegular />} onClick={() => { setCreateOpen(false); setEditTarget(null) }} />
          </DrawerHeaderNavigation>
          <DrawerHeaderTitle>{editTarget ? 'Editar Categoria' : 'Nova Categoria'}</DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-5">
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Field
                  label="Nome"
                  required
                  validationState={form.formState.errors.name ? 'error' : undefined}
                  validationMessage={form.formState.errors.name?.message}
                >
                  <Input {...field} placeholder="Ex: Alimentação" />
                </Field>
              )}
            />

            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field label="Tipo" required>
                  <Select {...field} disabled={!!editTarget}>
                    {(Object.entries(categoryTypeLabels) as [CategoryType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </Field>
              )}
            />

            <Controller
              name="icon"
              control={form.control}
              render={({ field }) => (
                <Field label="Ícone">
                  <IconPicker value={field.value} onChange={field.onChange} />
                </Field>
              )}
            />

            <Controller
              name="color"
              control={form.control}
              render={({ field }) => (
                <Field label="Cor">
                  <ColorPicker value={field.value} onChange={field.onChange} />
                </Field>
              )}
            />
          </div>
          <div className="flex gap-2 pt-5">
            <Button
              appearance="primary"
              className="flex-1"
              onClick={
                editTarget
                  ? form.handleSubmit(handleEdit as () => Promise<void>)
                  : form.handleSubmit(handleCreate as () => Promise<void>)
              }
              disabled={isSaving}
              icon={isSaving ? <Spinner size="tiny" /> : undefined}
            >
              {isSaving ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button onClick={() => { setCreateOpen(false); setEditTarget(null) }}>
              Cancelar
            </Button>
          </div>
        </DrawerBody>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Categoria"
        message={`Excluir "${deleteTarget?.name}"? Transações vinculadas perderão a categoria.`}
        confirmText="Excluir"
        destructive
        onConfirm={handleDelete}
        loading={deleteCategory.isPending}
      />
    </div>
  )
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string
  categories: Category[]
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  return (
    <div>
      <Text size={400} weight="semibold" block className="mb-3">{title}</Text>
      {categories.length === 0 ? (
        <Text size={200} className="text-muted">Nenhuma categoria de {title.toLowerCase()}.</Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => onEdit(category)}
              onDelete={() => onDelete(category)}
            />
          ))}
        </div>
      )}
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
    <div className="card-sm p-3.5 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: category.color + '20' }}
      >
        {category.icon || <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: category.color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <Text weight="semibold" size={300} block truncate>{category.name}</Text>
        {category.isDefault && (
          <Tag size="extra-small" appearance="outline" className="mt-0.5">Padrão</Tag>
        )}
      </div>
      {!category.isDefault && (
        <div className="flex gap-0.5 flex-shrink-0">
          <Button appearance="subtle" icon={<EditFilled />} size="small" onClick={onEdit} />
          <Button appearance="subtle" icon={<DeleteFilled />} size="small" onClick={onDelete} />
        </div>
      )}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-lg border border-subtle bg-canvas p-2">
      <div className="flex flex-wrap gap-1">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              value === icon
                ? 'bg-brand-light border-[var(--colorBrandForeground1)] ring-1 ring-[var(--colorBrandForeground1)]'
                : 'border-transparent hover:bg-surface-3'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
      {!ICON_OPTIONS.includes(value) && value && (
        <div className="mt-2 pt-2 border-t border-subtle flex items-center gap-2">
          <span className="text-xl">{value}</span>
          <Text size={100} className="text-muted">Ícone personalizado</Text>
        </div>
      )}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-8 h-8 rounded-full cursor-pointer transition-all border-2"
            style={{
              backgroundColor: color,
              borderColor: value === color ? 'var(--colorNeutralForeground1)' : 'transparent',
              transform: value === color ? 'scale(1.2)' : 'scale(1)',
              outline: value === color ? '2px solid var(--colorNeutralBackground1)' : 'none',
              outlineOffset: '1px',
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border border-subtle flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <span className="text-sm text-brand hover:underline">Cor personalizada</span>
        </label>
        <Text size={100} className="text-subtle">{value}</Text>
      </div>
    </div>
  )
}
