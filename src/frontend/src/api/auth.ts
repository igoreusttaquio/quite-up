import api from '../lib/axios'
import type { AuthResponse } from '../types/api'

export const authApi = {
  register: (data: { name: string; email: string; password: string; confirmPassword: string }) =>
    api.post<void>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () => api.post<void>('/auth/logout'),

  refresh: () => api.post<AuthResponse>('/auth/refresh'),

  verifyEmail: (token: string) =>
    api.post<void>('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post<void>('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    api.post<void>('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post<void>('/auth/reset-password', data),
}
