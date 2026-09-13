import { useEvolutionReport } from './useReports'
import type { EvolutionReportItem } from '../types'

export interface MonthlyPoint {
  key: string
  label: string
  income: number
  expenses: number
  net: number
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function useMonthlySeries(months = 6) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const current = useEvolutionReport(currentYear)
  const previous = useEvolutionReport(currentYear - 1)

  const byKey = new Map<string, EvolutionReportItem>()
  for (const item of previous.data ?? []) byKey.set(`${item.year}-${item.month}`, item)
  for (const item of current.data ?? []) byKey.set(`${item.year}-${item.month}`, item)

  const series: MonthlyPoint[] = []
  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(currentYear, now.getMonth() - offset, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const item = byKey.get(`${year}-${month}`)

    series.push({
      key: `${year}-${month}`,
      label: `${MONTHS_SHORT[month - 1]}/${String(year).slice(2)}`,
      income: item?.income ?? 0,
      expenses: item?.expenses ?? 0,
      net: item?.netBalance ?? 0,
    })
  }

  return {
    series,
    isLoading: current.isLoading || previous.isLoading,
    hasData: series.some((point) => point.income > 0 || point.expenses > 0),
  }
}
