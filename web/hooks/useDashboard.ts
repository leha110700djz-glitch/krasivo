'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardStats, AdminStats, Salon, SalonFormData } from '@/types'
import { useAuthStore } from '@/store/auth'

export function useDashboardStats() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats', token!),
    enabled: !!token,
    refetchInterval: 60_000,
  })
}

export function useAdminStats() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats', token!),
    enabled: !!token,
  })
}

export function useOwnerSalon() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['owner-salon'],
    queryFn: () => api.get<Salon>('/dashboard/salon', token!),
    enabled: !!token,
  })
}

export function useUpdateSalon() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (data: Partial<SalonFormData>) =>
      api.put<Salon>('/dashboard/salon', data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-salon'] })
    },
  })
}

export function useAdminSalons() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['admin-salons'],
    queryFn: () => api.get<Salon[]>('/admin/salons', token!),
    enabled: !!token,
  })
}

export function useVerifySalon() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ id, verify }: { id: number; verify: boolean }) =>
      api.patch(`/admin/salons/${id}`, { is_verified: verify }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-salons'] })
    },
  })
}
