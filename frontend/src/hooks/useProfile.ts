import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile'
import { useAuthStore } from '../store/authStore'
import type { UpdateProfileRequest, ChangePasswordRequest, ChangeEmailRequest, DeleteAccountRequest } from '../types'

const PROFILE_KEY = ['profile'] as const

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => profileApi.get().then((r) => r.data),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.accessToken)

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.update(data).then((r) => r.data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
      if (token && user) {
        setAuth(token, { ...user, name: response.name })
      }
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileApi.changePassword(data),
  })
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (data: ChangeEmailRequest) => profileApi.changeEmail(data),
    onSuccess: (_data, variables) => {
      const user = useAuthStore.getState().user
      const token = useAuthStore.getState().accessToken
      if (token && user) {
        useAuthStore.getState().setAuth(token, { ...user, email: variables.newEmail })
      }
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: (data: DeleteAccountRequest) => profileApi.deleteAccount(data),
    onSuccess: () => {
      queryClient.clear()
      logout()
      window.location.href = '/login'
    },
  })
}
