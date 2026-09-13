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
import { useMonthlySeries } from '../../hooks/useMonthlySeries'
import { ChartCard } from './ChartCard'
import { CurrencyTooltip } from './ChartTooltip'
import { useChartTheme } from './chartTheme'

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

function compactCurrency(value: number) {
  return `R$ ${compact.format(value)}`
}

export function IncomeExpenseChart() {
  const { series, isLoading, hasData } = useMonthlySeries(6)
  const theme = useChartTheme()

  const last = series[series.length - 1]
  const savingsRate = last && last.income > 0 ? ((last.income - last.expenses) / last.income) * 100 : null

  return (
    <ChartCard
      title="Receitas × Despesas"
      subtitle="Últimos 6 meses"
      loading={isLoading}
      empty={!hasData}
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
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
          <Bar dataKey="income" name="Receita" fill={theme.income} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expenses" name="Despesa" fill={theme.expense} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Line
            type="monotone"
            dataKey="net"
            name="Saldo"
            stroke={theme.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
