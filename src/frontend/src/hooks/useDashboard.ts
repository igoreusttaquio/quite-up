import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'
import type { DashboardFilters } from '../types'

export const DASHBOARD_KEY = ['dashboard'] as const

export function useDashboard(filters: DashboardFilters) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, filters] as const,
    queryFn: () => dashboardApi.get(filters).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}
