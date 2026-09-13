import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile'
import { useAuthStore } from '../store/authStore'
import { useAppToast } from './useAppToast'
import type { UpdateProfileRequest, ChangePasswordRequest, ChangeEmailRequest, DeleteAccountRequest } from '../types'

const PROFILE_KEY = ['profile'] as const

export function useProfile() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.accessToken)

  const query = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => profileApi.get().then((r) => r.data),
  })

  useEffect(() => {
    if (query.data && token) {
      setAuth(token, query.data)
    }
  }, [query.data, token, setAuth])

  return query
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

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.accessToken)
  const toast = useAppToast()

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadPhoto(file).then((r) => r.data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
      if (token && user) {
        setAuth(token, { ...user, photoUpdatedAt: response.photoUpdatedAt ?? null })
      }
      toast.success('Foto de perfil atualizada', 'Sua nova foto já está sendo exibida.')
    },
    onError: () => {
      toast.error('Erro ao enviar foto', 'Verifique o formato e o tamanho da imagem (máx. 5 MB).')
    },
  })
}

export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.accessToken)
  const toast = useAppToast()

  return useMutation({
    mutationFn: () => profileApi.deletePhoto().then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
      if (token && user) {
        setAuth(token, { ...user, photoUpdatedAt: null })
      }
      toast.success('Foto removida', 'Voltamos a exibir suas iniciais.')
    },
    onError: () => {
      toast.error('Erro ao remover foto', 'Tente novamente.')
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
