import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '../api/accounts'
import type { CreateAccountRequest, UpdateAccountRequest } from '../types'

const ACCOUNTS_KEY = ['accounts'] as const
const DASHBOARD_KEY = ['dashboard'] as const

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: () => accountsApi.list().then((r) => r.data),
  })
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, id] as const,
    queryFn: () => accountsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountRequest }) =>
      accountsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}
