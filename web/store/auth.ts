'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import api from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  register: (name: string, phone: string, password: string, role: 'client' | 'owner') => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (phone: string, password: string) => {
        set({ isLoading: true })
        try {
          const data = await api.post<{ access_token: string; token_type: string }>(
            '/auth/login',
            { phone, password }
          )
          set({ token: data.access_token })
          await get().fetchCurrentUser()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (name: string, phone: string, password: string, role: 'client' | 'owner') => {
        set({ isLoading: true })
        try {
          const data = await api.post<{ access_token: string; token_type: string }>(
            '/auth/register',
            { name, phone, password, role }
          )
          set({ token: data.access_token })
          await get().fetchCurrentUser()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, token: null })
      },

      fetchCurrentUser: async () => {
        const { token } = get()
        if (!token) return
        try {
          const user = await api.get<User>('/auth/me', token)
          set({ user })
        } catch {
          set({ user: null, token: null })
        }
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...data } })
        }
      },
    }),
    {
      name: 'krasivo-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
