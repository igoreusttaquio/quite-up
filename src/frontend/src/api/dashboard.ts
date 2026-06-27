import { api } from '../lib/axios'
import type { DashboardSummary } from '../types'

export const dashboardApi = {
  get: () => api.get<DashboardSummary>('/dashboard/'),
}
