import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../components/ui/sheet'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCard } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { CategoryType, Category } from '../types'

const categoryTypeLabels: Record<CategoryType, string> = { Income: 'Receita', Expense: 'Despesa' }
const ICON_OPTIONS = ['💰','💳','🏠','🚗','🍔','✈️','📚','🏥','🎮','🛒','💼','📱','🎵','🏋️','🐾','🎁','🔧','⚡','🌱','🏦','🎯','🍕','👕','🚿','💡','🌍','📊','🎓','🎬','🍺','☕','💊','🚌','🔑','🎸','🎨','🧴','🎪','💅','🐕']
const COLOR_PRESETS = ['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280','#84cc16','#f59e0b','#10b981','#0ea5e5','#6366f1']

const schema = z.object({ name: z.string().min(1), type: z.enum(['Income','Expense']), icon: z.string(), color: z.string() })
type FormData = z.infer<typeof schema>

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', type: 'Expense', icon: '💰', color: '#6366f1' } })

  const handleCreate = async (data: FormData) => { try { await createCategory.mutateAsync(data); setCreateOpen(false); form.reset() } catch {} }
  const handleEdit = async (data: FormData) => { if (!editTarget) return; try { await updateCategory.mutateAsync({ id: editTarget.id, data }); setEditTarget(null) } catch {} }
  const handleDelete = async () => { if (!deleteTarget) return; try { await deleteCategory.mutateAsync(deleteTarget.id); setDeleteTarget(null) } catch {} }
  const openEdit = (category: Category) => { setEditTarget(category); form.reset({ name: category.name, type: category.type, icon: category.icon, color: category.color }) }
  const openCreate = () => { form.reset({ name: '', type: 'Expense', icon: '💰', color: '#6366f1' }); setCreateOpen(true) }

  const incomeCategories = categories?.filter((c) => c.type === 'Income') ?? []
  const expenseCategories = categories?.filter((c) => c.type === 'Expense') ?? []
  const isSaving = createCategory.isPending || updateCategory.isPending
  const dialogOpen = createOpen || !!editTarget

  return (
    <div>
      <PageHeader title="Categorias" action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Categoria</Button>} />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : categories?.length === 0 ? (
        <EmptyState icon={<Tags className="h-12 w-12" />} title="Nenhuma categoria" description="Crie categorias para organizar." action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Criar Categoria</Button>} />
      ) : (
        <div className="space-y-8">
          <CategoryGroup title="Receitas" categories={incomeCategories} onEdit={openEdit} onDelete={(c) => setDeleteTarget(c)} />
          <CategoryGroup title="Despesas" categories={expenseCategories} onEdit={openEdit} onDelete={(c) => setDeleteTarget(c)} />
        </div>
      )}

      <Sheet open={dialogOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditTarget(null) } }}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>{editTarget ? 'Editar Categoria' : 'Nova Categoria'}</SheetTitle></SheetHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Controller name="name" control={form.control} render={({ field }) => <Input {...field} placeholder="Ex: Alimentação" />} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller name="type" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!editTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.entries(categoryTypeLabels) as [CategoryType, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Controller name="icon" control={form.control} render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Controller name="color" control={form.control} render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={editTarget ? form.handleSubmit(handleEdit as () => Promise<void>) : form.handleSubmit(handleCreate as () => Promise<void>)} disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Salvar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} title="Excluir Categoria" message={`Excluir "${deleteTarget?.name}"?`} confirmText="Excluir" destructive onConfirm={handleDelete} loading={deleteCategory.isPending} />
    </div>
  )
}

function CategoryGroup({ title, categories, onEdit, onDelete }: { title: string; categories: Category[]; onEdit: (c: Category) => void; onDelete: (c: Category) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold mb-3">{title}</p>
      {categories.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma categoria de {title.toLowerCase()}.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => <CategoryCard key={category.id} category={category} onEdit={() => onEdit(category)} onDelete={() => onDelete(category)} />)}
        </div>
      )}
    </div>
  )
}

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: category.color + '20' }}>
        {category.icon || <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: category.color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{category.name}</p>
        {category.isDefault && <Badge variant="outline" className="mt-0.5 text-[10px]">Padrão</Badge>}
      </div>
      {!category.isDefault && (
        <div className="flex gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2">
      <div className="flex flex-wrap gap-1">
        {ICON_OPTIONS.map((icon) => (
          <button key={icon} type="button" onClick={() => onChange(icon)}
            className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              value === icon ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'border-transparent hover:bg-muted'
            }`}>{icon}</button>
        ))}
      </div>
      {!ICON_OPTIONS.includes(value) && value && (
        <div className="mt-2 pt-2 border-t flex items-center gap-2">
          <span className="text-xl">{value}</span>
          <p className="text-[10px] text-muted-foreground">Ícone personalizado</p>
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
          <button key={color} type="button" onClick={() => onChange(color)}
            className="w-8 h-8 rounded-full cursor-pointer transition-all border-2"
            style={{
              backgroundColor: color,
              borderColor: value === color ? 'var(--foreground)' : 'transparent',
              transform: value === color ? 'scale(1.2)' : 'scale(1)',
              outline: value === color ? '2px solid var(--background)' : 'none',
              outlineOffset: '1px',
            }} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border flex-shrink-0" style={{ backgroundColor: value }} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="sr-only" />
          <span className="text-xs text-primary hover:underline">Cor personalizada</span>
        </label>
        <p className="text-[10px] text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}
