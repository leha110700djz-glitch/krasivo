'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Service, ServiceFormData } from '@/types'
import { useAuthStore } from '@/store/auth'

export function useSalonServices(salonId: number | string) {
  return useQuery({
    queryKey: ['services', 'salon', salonId],
    queryFn: () => api.get<Service[]>(`/salons/${salonId}/services`),
    enabled: !!salonId,
  })
}

export function useDashboardServices() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['dashboard-services'],
    queryFn: () => api.get<Service[]>('/dashboard/services', token!),
    enabled: !!token,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (data: ServiceFormData) =>
      api.post<Service>('/dashboard/services', data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceFormData> }) =>
      api.put<Service>(`/dashboard/services/${id}`, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-services'] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (id: number) => api.delete(`/dashboard/services/${id}`, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-services'] })
    },
  })
}
