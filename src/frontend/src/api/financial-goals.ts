import { api } from '../lib/axios'
import type { FinancialGoal, CreateFinancialGoalRequest, UpdateFinancialGoalRequest, GoalContribution, AddGoalContributionRequest } from '../types'

export const financialGoalsApi = {
  list: (isCompleted?: boolean) =>
    api.get<FinancialGoal[]>('/financial-goals', { params: { isCompleted } }),
  getById: (id: string) => api.get<FinancialGoal>(`/financial-goals/${id}`),
  create: (data: CreateFinancialGoalRequest) =>
    api.post<FinancialGoal>('/financial-goals', data),
  update: (id: string, data: UpdateFinancialGoalRequest) =>
    api.put<FinancialGoal>(`/financial-goals/${id}`, data),
  delete: (id: string) => api.delete<void>(`/financial-goals/${id}`),
  getContributions: (goalId: string) =>
    api.get<GoalContribution[]>(`/financial-goals/${goalId}/contributions`),
  addContribution: (goalId: string, data: AddGoalContributionRequest) =>
    api.post<GoalContribution>(`/financial-goals/${goalId}/contributions`, data),
}
