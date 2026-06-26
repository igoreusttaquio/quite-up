export type AccountType = 'CheckingAccount' | 'Savings' | 'Wallet' | 'Other'

export type CategoryType = 'Income' | 'Expense'

export type TransactionType = 'Income' | 'Expense' | 'Transfer'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  isActive: boolean
  createdAt: string
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  initialBalance: number
}

export interface UpdateAccountRequest {
  name: string
  type: AccountType
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  isDefault: boolean
}

export interface CreateCategoryRequest {
  name: string
  type: CategoryType
  icon: string
  color: string
}

export interface UpdateCategoryRequest {
  name: string
  icon: string
  color: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  date: string
  description?: string
  accountId: string
  accountName: string
  categoryId?: string
  categoryName?: string
  destinationAccountId?: string
  destinationAccountName?: string
  createdAt: string
}

export interface CreateTransactionRequest {
  type: TransactionType
  amount: number
  date: string
  accountId: string
  categoryId?: string
  destinationAccountId?: string
  description?: string
}

export interface UpdateTransactionRequest {
  amount: number
  date: string
  categoryId?: string
  description?: string
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
  currentPassword: string
}

export interface DeleteAccountRequest {
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresAt: string
}

export interface ApiError {
  code: string
  message: string
}

export interface ValidationErrors {
  errors: Record<string, string[]>
}
