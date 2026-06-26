export type AccountType = 'Checking' | 'Savings' | 'CreditCard' | 'Investment' | 'Cash' | 'Other'

export type CategoryType = 'Income' | 'Expense'

export type TransactionType = 'Income' | 'Expense' | 'Transfer'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  balance: number
  description?: string
}

export interface UpdateAccountRequest {
  name: string
  description?: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon?: string
  isDefault: boolean
}

export interface CreateCategoryRequest {
  name: string
  type: CategoryType
  icon?: string
}

export interface UpdateCategoryRequest {
  name: string
  icon?: string
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string
  type: TransactionType
  amount: number
  description?: string
  date: string
  toAccountId?: string
  createdAt: string
  updatedAt: string
  account?: Account
  category?: Category
  toAccount?: Account
}

export interface CreateTransactionRequest {
  accountId: string
  categoryId: string
  type: TransactionType
  amount: number
  description?: string
  date: string
  toAccountId?: string
}

export interface UpdateTransactionRequest {
  accountId?: string
  categoryId?: string
  type?: TransactionType
  amount?: number
  description?: string
  date?: string
  toAccountId?: string
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TransactionFilters {
  page?: number
  pageSize?: number
  accountId?: string
  type?: TransactionType
  startDate?: string
  endDate?: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmNewPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface UpdateProfileRequest {
  name: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface ChangeEmailRequest {
  newEmail: string
  password: string
}

export interface DeleteAccountRequest {
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface ApiError {
  code: string
  message: string
}

export interface ValidationErrors {
  errors: Record<string, string[]>
}
