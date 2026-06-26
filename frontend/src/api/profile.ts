import { api } from '../lib/axios'
import type { User, UpdateProfileRequest, ChangePasswordRequest, ChangeEmailRequest, DeleteAccountRequest } from '../types'

export const profileApi = {
  get: () => api.get<User>('/profile'),
  update: (data: UpdateProfileRequest) => api.put<User>('/profile', data),
  changePassword: (data: ChangePasswordRequest) => api.post<void>('/profile/change-password', data),
  changeEmail: (data: ChangeEmailRequest) => api.post<void>('/profile/change-email', data),
  deleteAccount: (data: DeleteAccountRequest) => api.delete<void>('/profile', { data }),
}
