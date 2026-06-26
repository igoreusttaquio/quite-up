import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { AccountsPage } from './pages/AccountsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { ProfilePage } from './pages/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
