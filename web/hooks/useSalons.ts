'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Salon, SalonListItem, PaginatedResponse, SalonFilters } from '@/types'

export function useSalons(filters: SalonFilters = {}) {
  return useQuery({
    queryKey: ['salons', filters],
    queryFn: () =>
      api.get<PaginatedResponse<SalonListItem>>('/salons', undefined, filters as Record<string, unknown>),
    staleTime: 60_000,
  })
}

export function useSalon(id: number | string) {
  return useQuery({
    queryKey: ['salon', id],
    queryFn: () => api.get<Salon>(`/salons/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useFeaturedSalons() {
  return useQuery({
    queryKey: ['salons', 'featured'],
    queryFn: () =>
      api.get<PaginatedResponse<SalonListItem>>('/salons', undefined, {
        sort: 'rating',
        per_page: 6,
      }),
    staleTime: 300_000,
  })
}
