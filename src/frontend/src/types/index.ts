export type AccountType = 'CheckingAccount' | 'Savings' | 'Wallet' | 'Other'

export type CategoryType = 'Income' | 'Expense'

export type TransactionType = 'Income' | 'Expense' | 'Transfer'

export type DebtType = 'Loan' | 'Financing' | 'CreditCard'

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

// === Debts ===

export interface Debt {
  id: string
  name: string
  type: DebtType
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  interestRate?: number
  dueDate: string
  isPaid: boolean
  notes?: string
  createdAt: string
}

export interface CreateDebtRequest {
  name: string
  type: DebtType
  totalAmount: number
  interestRate?: number
  dueDate: string
  notes?: string
}

export interface UpdateDebtRequest {
  name: string
  type: DebtType
  totalAmount: number
  interestRate?: number
  dueDate: string
  notes?: string
}

export interface DebtPayment {
  id: string
  debtId: string
  debtName: string
  amount: number
  paymentDate: string
  isEarlyPayment: boolean
  discount: number
  notes?: string
  createdAt: string
}

export interface RegisterDebtPaymentRequest {
  amount: number
  paymentDate: string
  isEarlyPayment: boolean
  discount?: number
  notes?: string
}

export interface SnowballStrategyItem {
  debtId: string
  name: string
  type: DebtType
  totalAmount: number
  remainingAmount: number
  dueDate: string
  order: number
}

export interface SnowballStrategy {
  debts: SnowballStrategyItem[]
  totalRemaining: number
  estimatedMonthsToPayOff: number
}

// === Budgets ===

export interface Budget {
  id: string
  categoryId: string
  categoryName?: string
  amount: number
  spent: number
  remaining: number
  month: number
  year: number
  createdAt: string
}

export interface CreateBudgetRequest {
  categoryId: string
  amount: number
  month: number
  year: number
}

export interface UpdateBudgetRequest {
  categoryId: string
  amount: number
  month: number
  year: number
}

// === Financial Goals ===

export interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  progressPercent: number
  targetDate?: string
  isCompleted: boolean
  createdAt: string
}

export interface CreateFinancialGoalRequest {
  name: string
  targetAmount: number
  targetDate?: string
}

export interface UpdateFinancialGoalRequest {
  name: string
  targetAmount: number
  targetDate?: string
}

export interface GoalContribution {
  id: string
  financialGoalId: string
  amount: number
  date: string
  notes?: string
  createdAt: string
}

export interface AddGoalContributionRequest {
  amount: number
  date: string
  notes?: string
}

// === Notifications ===

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  referenceType?: string
  referenceId?: string
  createdAt: string
}

// === Dashboard ===

export interface DashboardSummary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  recentTransactions: Transaction[]
}

// === Reports ===

export interface PeriodReport {
  startDate: string
  endDate: string
  totalIncome: number
  totalExpenses: number
  netBalance: number
  expensesByCategory: CategoryReportItem[]
}

export interface CategoryReportItem {
  categoryId: string
  categoryName: string
  totalAmount: number
  transactionCount: number
  percentage: number
}

export interface EvolutionReportItem {
  year: number
  month: number
  income: number
  expenses: number
  netBalance: number
}
