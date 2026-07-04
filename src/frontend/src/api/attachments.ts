import { api } from '../lib/axios'
import type { Attachment } from '../types'

export const attachmentsApi = {
  upload: (transactionId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<Attachment>(`/transactions/${transactionId}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getUrl: (attachmentId: string) => `/api/attachments/${attachmentId}`,
  delete: (attachmentId: string) => api.delete<void>(`/attachments/${attachmentId}`),
  deleteByTransaction: (transactionId: string) => api.delete<void>(`/transactions/${transactionId}/attachment`),
}
