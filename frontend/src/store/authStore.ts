import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  accessToken: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  logout: () => set({ accessToken: null, user: null }),
}))
