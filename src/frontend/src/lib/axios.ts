import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        data.forEach(mapResponseEnums)
      } else if ('items' in data) {
        data.items?.forEach(mapResponseEnums)
      } else {
        mapResponseEnums(data)
      }
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const currentUser = useAuthStore.getState().user
        useAuthStore.getState().setAuth(data.accessToken, currentUser ?? { id: '', name: '', email: '' })
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

const accountTypeMap: Record<number, string> = {
  0: 'CheckingAccount',
  1: 'Savings',
  2: 'Wallet',
  3: 'Other',
}

const categoryTypeMap: Record<number, string> = {
  0: 'Income',
  1: 'Expense',
}

const transactionTypeMap: Record<number, string> = {
  0: 'Income',
  1: 'Expense',
  2: 'Transfer',
}

function mapResponseEnums(obj: Record<string, unknown>) {
  if (!obj || typeof obj !== 'object') return

  if ('type' in obj && typeof obj.type === 'number') {
    const numType = obj.type as number
    if (numType in accountTypeMap) obj.type = accountTypeMap[numType]
    else if (numType in categoryTypeMap) obj.type = categoryTypeMap[numType]
    else if (numType in transactionTypeMap) obj.type = transactionTypeMap[numType]
  }

  if ('currentBalance' in obj && typeof obj.currentBalance === 'number') {
    obj.balance = obj.currentBalance
    delete obj.currentBalance
  }
  if ('initialBalance' in obj) {
    delete obj.initialBalance
  }
}

export { api }
