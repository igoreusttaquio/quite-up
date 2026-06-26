import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '../api/categories'
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../types'

const CATEGORIES_KEY = ['categories'] as const

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => categoriesApi.list().then((r) => r.data),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoriesApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}
