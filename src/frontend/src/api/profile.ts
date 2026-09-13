import { api } from '../lib/axios'
import type { User, UpdateProfileRequest, ChangePasswordRequest, ChangeEmailRequest, DeleteAccountRequest } from '../types'

export const profileApi = {
  get: () => api.get<User>('/profile'),
  update: (data: UpdateProfileRequest) => api.put<User>('/profile', data),
  changePassword: (data: ChangePasswordRequest) => api.post<void>('/profile/change-password', data),
  changeEmail: (data: ChangeEmailRequest) => api.post<void>('/profile/change-email', data),
  deleteAccount: (data: DeleteAccountRequest) => api.delete<void>('/profile', { data }),
  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<User>('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getPhoto: () => api.get<Blob>('/profile/photo', { responseType: 'blob' }),
  deletePhoto: () => api.delete<User>('/profile/photo'),
}
