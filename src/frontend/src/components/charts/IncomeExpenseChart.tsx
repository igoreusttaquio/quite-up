import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '../../lib/utils'
import type { DashboardSeriesPoint } from '../../types'
import { ChartCard } from './ChartCard'
import { CurrencyTooltip } from './ChartTooltip'
import { useChartTheme } from './chartTheme'

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

function compactCurrency(value: number) {
  return `R$ ${compact.format(value)}`
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function pointLabel(date: string, granularity: 'day' | 'month') {
  const [year, month, day] = date.split('-')
  return granularity === 'day'
    ? `${day}/${month}`
    : `${MONTHS_SHORT[Number(month) - 1]}/${year.slice(2)}`
}

interface IncomeExpenseChartProps {
  series: DashboardSeriesPoint[]
  granularity: 'day' | 'month'
  subtitle?: string
  loading?: boolean
  /** Restringe o gráfico a uma das séries. */
  type?: 'Income' | 'Expense'
}

export function IncomeExpenseChart({ series, granularity, subtitle, loading, type }: IncomeExpenseChartProps) {
  const theme = useChartTheme()

  const data = series.map((point) => ({ ...point, label: pointLabel(point.date, granularity) }))
  const hasData = series.some((point) => point.income > 0 || point.expenses > 0)
  const showIncome = type !== 'Expense'
  const showExpense = type !== 'Income'

  const totalIncome = series.reduce((sum, p) => sum + p.income, 0)
  const totalExpenses = series.reduce((sum, p) => sum + p.expenses, 0)
  const savingsRate = !type && totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null

  const title = type === 'Income' ? 'Receitas' : type === 'Expense' ? 'Despesas' : 'Receitas × Despesas'

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={!hasData}
      emptyMessage="Sem movimentações neste período"
      height={280}
      action={
        savingsRate !== null ? (
          <span className={cn('text-sm font-medium', savingsRate >= 0 ? 'text-income' : 'text-expense')}>
            {savingsRate >= 0 ? '↑' : '↓'} {Math.abs(savingsRate).toFixed(1)}%
          </span>
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: theme.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={compactCurrency}
          />
          <Tooltip content={<CurrencyTooltip />} cursor={{ fill: theme.grid, fillOpacity: 0.35 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          {showIncome && (
            <Bar dataKey="income" name="Receita" fill={theme.income} radius={[4, 4, 0, 0]} maxBarSize={26} />
          )}
          {showExpense && (
            <Bar dataKey="expenses" name="Despesa" fill={theme.expense} radius={[4, 4, 0, 0]} maxBarSize={26} />
          )}
          {showIncome && showExpense && (
            <Line
              type="monotone"
              dataKey="net"
              name="Saldo"
              stroke={theme.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
