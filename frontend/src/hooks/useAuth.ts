import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, ResendVerificationRequest } from '../types'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data.accessToken, response.data.user)
      navigate('/dashboard')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      navigate('/login')
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authApi.verifyEmail(data),
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (data: ResendVerificationRequest) => authApi.resendVerification(data),
  })
}
