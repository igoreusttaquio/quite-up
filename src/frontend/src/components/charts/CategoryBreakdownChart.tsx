import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '../../lib/utils'
import type { DashboardCategoryItem } from '../../types'
import { ChartCard } from './ChartCard'
import { CurrencyTooltip } from './ChartTooltip'
import { CATEGORY_COLORS } from './chartTheme'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const MAX_SLICES = 6

interface Slice {
  categoryId?: string | null
  name: string
  value: number
  percentage: number
  color: string
}

interface CategoryBreakdownChartProps {
  title: string
  subtitle?: string
  items: DashboardCategoryItem[]
  loading?: boolean
  emptyMessage?: string
  /** Categoria selecionada (controlado pelo pai). */
  selectedCategoryId?: string | null
  /**
   * Chamado ao selecionar/desmarcar uma fatia: recebe o id da categoria, ou null ao desmarcar
   * (ou ao escolher "Outros"/"Sem categoria", que não têm id para filtrar).
   */
  onSelectedChange?: (categoryId: string | null) => void
}

export function CategoryBreakdownChart({
  title,
  subtitle,
  items: rawItems,
  loading,
  emptyMessage = 'Sem dados neste período',
  selectedCategoryId,
  onSelectedChange,
}: CategoryBreakdownChartProps) {
  // Destaque local só para fatias sem categoria ("Outros"/"Sem categoria").
  const [localActive, setLocalActive] = useState<number | null>(null)

  const slices = useMemo<Slice[]>(() => {
    const items = [...rawItems].sort((a, b) => b.totalAmount - a.totalAmount)
    const total = items.reduce((sum, item) => sum + item.totalAmount, 0)
    if (total <= 0) return []

    const result: Slice[] = items.slice(0, MAX_SLICES).map((item, index) => ({
      categoryId: item.categoryId,
      name: item.categoryName,
      value: item.totalAmount,
      percentage: (item.totalAmount / total) * 100,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))

    const rest = items.slice(MAX_SLICES)
    if (rest.length > 0) {
      const restTotal = rest.reduce((sum, item) => sum + item.totalAmount, 0)
      result.push({
        name: 'Outros',
        value: restTotal,
        percentage: (restTotal / total) * 100,
        color: '#94a3b8',
      })
    }

    return result
  }, [rawItems])

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const controlledIndex = selectedCategoryId ? slices.findIndex((s) => s.categoryId === selectedCategoryId) : -1
  const active = controlledIndex >= 0 ? controlledIndex : localActive
  const selected = active !== null ? slices[active] : null

  const toggle = (index: number) => {
    const slice = slices[index]
    if (slice?.categoryId) {
      setLocalActive(null)
      onSelectedChange?.(slice.categoryId === selectedCategoryId ? null : slice.categoryId)
    } else {
      setLocalActive((current) => (current === index ? null : index))
      onSelectedChange?.(null)
    }
  }

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={slices.length === 0}
      emptyMessage={emptyMessage}
      action={
        selected ? (
          <button
            type="button"
            onClick={() => {
              setLocalActive(null)
              onSelectedChange?.(null)
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Limpar seleção
          </button>
        ) : undefined
      }
      height={320}
    >
      <div className="flex h-full flex-col items-center gap-3 sm:flex-row sm:gap-6">
        <div className="relative h-[170px] w-[170px] flex-shrink-0 sm:h-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((slice, index) => (
                  <Cell
                    key={`${slice.categoryId ?? 'none'}-${slice.name}`}
                    fill={slice.color}
                    fillOpacity={active === null || active === index ? 1 : 0.25}
                    className="cursor-pointer outline-none"
                    onClick={() => toggle(index)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CurrencyTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {selected ? (
              <>
                <span className="max-w-full truncate text-xs text-muted-foreground">{selected.name}</span>
                <span className="text-sm font-semibold">{brl.format(selected.value)}</span>
                <span className="text-xs text-muted-foreground">{selected.percentage.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">{brl.format(total)}</span>
              </>
            )}
          </div>
        </div>

        <ul className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-0.5 sm:flex sm:flex-col sm:gap-1">
          {slices.map((slice, index) => (
            <li key={`${slice.categoryId ?? 'none'}-${slice.name}`} className="min-w-0">
              <button
                type="button"
                onClick={() => toggle(index)}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                  active === index ? 'bg-accent' : 'hover:bg-accent/60',
                  active !== null && active !== index && 'opacity-50'
                )}
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate text-foreground">{slice.name}</span>
                <span className="flex-shrink-0 tabular-nums text-muted-foreground">
                  {slice.percentage.toFixed(0)}%
                </span>
                <span className="hidden flex-shrink-0 tabular-nums font-medium text-foreground sm:inline">
                  {brl.format(slice.value)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  )
}
