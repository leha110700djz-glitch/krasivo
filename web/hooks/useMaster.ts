'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Master } from '@/types'
import { useAuthStore } from '@/store/auth'

export function useMaster(id: number | string) {
  return useQuery({
    queryKey: ['master', id],
    queryFn: () => api.get<Master>(`/masters/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useSalonMasters(salonId: number | string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['masters', 'salon', salonId],
    queryFn: () => api.get<Master[]>(`/salons/${salonId}/masters`, token ?? undefined),
    enabled: !!salonId,
  })
}

export function useDashboardMasters() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['dashboard-masters'],
    queryFn: () => api.get<Master[]>('/dashboard/masters', token!),
    enabled: !!token,
  })
}

export function useCreateMaster() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (data: Partial<Master> & { user_phone?: string }) =>
      api.post<Master>('/dashboard/masters', data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-masters'] })
    },
  })
}

export function useUpdateMaster() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Master> }) =>
      api.put<Master>(`/dashboard/masters/${id}`, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-masters'] })
    },
  })
}

export function useDeleteMaster() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (id: number) => api.delete(`/dashboard/masters/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-masters'] })
    },
  })
}
