import { api } from '../lib/axios'
import type { PeriodReport, EvolutionReportItem } from '../types'

export const reportsApi = {
  getPeriod: (startDate: string, endDate: string) =>
    api.get<PeriodReport>('/reports/period', { params: { startDate, endDate } }),
  getEvolution: (year: number) =>
    api.get<EvolutionReportItem[]>('/reports/evolution', { params: { year } }),
}
