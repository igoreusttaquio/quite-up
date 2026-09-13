import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '../../lib/utils'
import { usePeriodReport } from '../../hooks/useReports'
import { ChartCard } from './ChartCard'
import { CurrencyTooltip } from './ChartTooltip'
import { CATEGORY_COLORS } from './chartTheme'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const MAX_SLICES = 6

interface Slice {
  name: string
  value: number
  percentage: number
  color: string
}

function toDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ExpensesByCategoryChart() {
  const now = new Date()
  const startDate = toDateParam(new Date(now.getFullYear(), now.getMonth(), 1))
  const endDate = toDateParam(new Date(now.getFullYear(), now.getMonth() + 1, 0))

  const { data, isLoading } = usePeriodReport(startDate, endDate, true)
  const [active, setActive] = useState<number | null>(null)

  const slices = useMemo<Slice[]>(() => {
    const items = [...(data?.expensesByCategory ?? [])].sort((a, b) => b.totalAmount - a.totalAmount)
    const total = items.reduce((sum, item) => sum + item.totalAmount, 0)
    if (total <= 0) return []

    const result: Slice[] = items.slice(0, MAX_SLICES).map((item, index) => ({
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
  }, [data])

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const selected = active !== null ? slices[active] : null
  const toggle = (index: number) => setActive((current) => (current === index ? null : index))

  return (
    <ChartCard
      title="Despesas por categoria"
      subtitle={monthLabel.format(now)}
      loading={isLoading}
      empty={slices.length === 0}
      emptyMessage="Sem despesas neste mês"
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
                    key={slice.name}
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
            <li key={slice.name} className="min-w-0">
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
