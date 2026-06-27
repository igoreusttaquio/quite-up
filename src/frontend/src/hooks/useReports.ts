import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api/reports'

export function usePeriodReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'period', startDate, endDate] as const,
    queryFn: () => reportsApi.getPeriod(startDate, endDate).then((r) => r.data),
    enabled: !!startDate && !!endDate,
  })
}

export function useEvolutionReport(year: number) {
  return useQuery({
    queryKey: ['reports', 'evolution', year] as const,
    queryFn: () => reportsApi.getEvolution(year).then((r) => r.data),
    enabled: !!year,
  })
}
