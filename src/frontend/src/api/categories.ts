import { api } from '../lib/axios'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types'

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: CreateCategoryRequest) => api.post<Category>('/categories', data),
  update: (id: string, data: UpdateCategoryRequest) =>
    api.put<Category>(`/categories/${id}`, {
      name: data.name,
      icon: data.icon,
      color: data.color,
    }),
  delete: (id: string) => api.delete<void>(`/categories/${id}`),
}
