import { api } from '../lib/axios'
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  AuthResponse,
} from '../types'

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<void>('/auth/register', data),
  logout: () => api.post<void>('/auth/logout'),
  refreshToken: () => api.post<AuthResponse>('/auth/refresh-token'),
  verifyEmail: (data: VerifyEmailRequest) => api.post<void>('/auth/verify-email', data),
  resendVerification: (data: ResendVerificationRequest) => api.post<void>('/auth/resend-verification', data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post<void>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordRequest) => api.post<void>('/auth/reset-password', data),
}
