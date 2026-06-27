import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financialGoalsApi } from '../api/financial-goals'
import type { CreateFinancialGoalRequest, UpdateFinancialGoalRequest, AddGoalContributionRequest } from '../types'

const GOALS_KEY = ['financial-goals'] as const

export function useFinancialGoals(isCompleted?: boolean) {
  return useQuery({
    queryKey: [...GOALS_KEY, { isCompleted }] as const,
    queryFn: () => financialGoalsApi.list(isCompleted).then((r) => r.data),
  })
}

export function useFinancialGoal(id: string) {
  return useQuery({
    queryKey: [...GOALS_KEY, id] as const,
    queryFn: () => financialGoalsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateFinancialGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFinancialGoalRequest) => financialGoalsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useUpdateFinancialGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinancialGoalRequest }) =>
      financialGoalsApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useDeleteFinancialGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financialGoalsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useGoalContributions(goalId: string) {
  return useQuery({
    queryKey: [...GOALS_KEY, goalId, 'contributions'] as const,
    queryFn: () => financialGoalsApi.getContributions(goalId).then((r) => r.data),
    enabled: !!goalId,
  })
}

export function useAddGoalContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: AddGoalContributionRequest }) =>
      financialGoalsApi.addContribution(goalId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
    },
  })
}
