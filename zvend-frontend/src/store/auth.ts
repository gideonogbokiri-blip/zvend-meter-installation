import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api'
import type { User } from '../types'
import { HOME_BY_ROLE } from '../lib/status'

interface AuthState {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      async login(email, password) {
        const result = await api.login({ email, password })
        set({ token: result.token, user: result.user })
      },
      logout() {
        set({ token: null, user: null })
      },
      setUser(user) {
        set({ user })
      },
    }),
    { name: 'zvend-auth' },
  ),
)

export const homePath = (user: User | null) => (user ? HOME_BY_ROLE[user.role] : '/login')
