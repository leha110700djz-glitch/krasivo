'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export function useAuth() {
  const { user, token, isLoading, login, register, logout, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser()
    }
  }, [token, user, fetchCurrentUser])

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
  }
}
