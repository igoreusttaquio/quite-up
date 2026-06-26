import api from '../lib/axios'
import type { User } from '../types/api'

export const profileApi = {
  get: () => api.get<User>('/profile'),

  updateName: (name: string) => api.put<User>('/profile/name', { name }),

  changeEmail: (email: string, currentPassword: string) =>
    api.put('/profile/email', { email, currentPassword }),

  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) =>
    api.put('/profile/password', { currentPassword, newPassword, confirmNewPassword }),

  deleteAccount: (password: string) =>
    api.delete('/profile', { data: { password } }),
}
