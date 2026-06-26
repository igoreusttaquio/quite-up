import { api } from '../lib/axios'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types'

const categoryTypeToInt: Record<string, number> = {
  Income: 0,
  Expense: 1,
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: CreateCategoryRequest) =>
    api.post<Category>('/categories', {
      name: data.name,
      type: categoryTypeToInt[data.type],
      icon: data.icon,
      color: data.color,
    }),
  update: (id: string, data: UpdateCategoryRequest) =>
    api.put<Category>(`/categories/${id}`, {
      name: data.name,
      icon: data.icon,
      color: data.color,
    }),
  delete: (id: string) => api.delete<void>(`/categories/${id}`),
}
