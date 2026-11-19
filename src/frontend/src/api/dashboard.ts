import { api } from '../lib/axios'
import type { DashboardFilters, DashboardSummary } from '../types'

export const dashboardApi = {
  get: (filters: DashboardFilters) =>
    api.get<DashboardSummary>('/dashboard/', {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type || undefined,
        categoryId: filters.categoryId || undefined,
      },
    }),
}
