export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface Account {
  id: string
  name: string
  type: 'Checking' | 'Savings' | 'Cash' | 'Other'
  balance: number
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  type: 'Income' | 'Expense'
  icon: string
  color: string
  isDefault: boolean
}

export interface Transaction {
  id: string
  type: 'Income' | 'Expense' | 'Transfer'
  value: number
  date: string
  accountId: string
  accountName: string
  categoryId?: string
  categoryName?: string
  destinationAccountId?: string
  destinationAccountName?: string
  description?: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}
