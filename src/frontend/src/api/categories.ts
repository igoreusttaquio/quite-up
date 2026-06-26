import api from '../lib/axios'
import type { Category } from '../types/api'

export const categoriesApi = {
  getAll: (type?: string) =>
    api.get<Category[]>('/categories', { params: { type } }),

  create: (data: { name: string; type: string; icon: string; color: string }) =>
    api.post<Category>('/categories', data),

  update: (id: string, data: { name: string; icon: string; color: string }) =>
    api.put<Category>(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),
}
