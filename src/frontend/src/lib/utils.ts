import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Valor de filtro de categoria que significa "sem categoria" (entendido pela API). */
export const UNCATEGORIZED_ID = 'none'

/** Extrai uma mensagem legível de um erro da API (axios), com fallback. */
export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (error as any)?.response?.data
  if (!data) return fallback
  if (typeof data.message === 'string' && data.message) return data.message
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (typeof first?.message === 'string') return first.message
  }
  return fallback
}

/** Formata uma data local como yyyy-MM-dd (sem conversão para UTC). */
export function toDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
