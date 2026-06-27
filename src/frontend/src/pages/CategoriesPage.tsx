import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { CategoryIcon } from '../lib/category-icon'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
import { Badge } from '../components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '../components/ui/sheet'
import { Spinner } from '../components/ui/spinner'
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
  const sheetOpen = createOpen || !!editTarget

  return (
    <div>
      <PageHeader
        title="Categorias"
        action={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Nova Categoria
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : categories?.length === 0 ? (
        <EmptyState
          icon={<Tag size={48} />}
          title="Nenhuma categoria"
          description="Crie categorias para organizar suas transações."
          action={
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Criar Categoria
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <CategoryGroup title="Receitas" categories={incomeCategories} onEdit={openEdit} onDelete={(c) => setDeleteTarget(c)} />
          <CategoryGroup title="Despesas" categories={expenseCategories} onEdit={openEdit} onDelete={(c) => setDeleteTarget(c)} />
        </div>
      )}

      {/* Create / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditTarget(null) } }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editTarget ? 'Editar Categoria' : 'Nova Categoria'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
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
                    <NativeSelect {...field} disabled={!!editTarget}>
                      {(Object.entries(categoryTypeLabels) as [CategoryType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </NativeSelect>
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
              <Button variant="outline" onClick={() => { setCreateOpen(false); setEditTarget(null) }}>
                Cancelar
              </Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

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
  if (categories.length === 0) return null
  return (
    <div>
      <p className="text-base font-semibold mb-3">{title}</p>
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
    </div>
  )
}

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card-sm p-3.5 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: category.color + '20' }}
      >
        {category.icon
          ? <CategoryIcon icon={category.icon} size={20} color={category.color} />
          : <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: category.color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{category.name}</p>
        {category.isDefault && (
          <Badge variant="outline" className="mt-0.5 text-[10px] h-4 px-1.5">Padrão</Badge>
        )}
      </div>
      {!category.isDefault && (
        <div className="flex gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 size={13} />
          </Button>
        </div>
      )}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-2">
      <div className="flex flex-wrap gap-1">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              value === icon
                ? 'bg-brand-light border-primary ring-1 ring-primary'
                : 'border-transparent hover:bg-accent'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
      {!ICON_OPTIONS.includes(value) && value && (
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
          <span className="text-xl">{value}</span>
          <span className="text-xs text-muted-foreground">Ícone personalizado</span>
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
              borderColor: value === color ? 'var(--foreground)' : 'transparent',
              transform: value === color ? 'scale(1.2)' : 'scale(1)',
              outline: value === color ? '2px solid var(--background)' : 'none',
              outlineOffset: '1px',
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border border-border flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <span className="text-sm text-primary hover:underline">Cor personalizada</span>
        </label>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
    </div>
  )
}
