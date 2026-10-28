'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Booking, CreateBookingRequest, TimeSlot } from '@/types'
import { useAuthStore } from '@/store/auth'

export function useBookings(status?: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['bookings', status],
    queryFn: () =>
      api.get<Booking[]>('/bookings', token!, status ? { status } : undefined),
    enabled: !!token,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (data: CreateBookingRequest) =>
      api.post<Booking>('/bookings', data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch<Booking>(`/bookings/${id}`, { status }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useMasterSlots(masterId: number | string, date: string, serviceId: number | string) {
  return useQuery({
    queryKey: ['slots', masterId, date, serviceId],
    queryFn: () =>
      api.get<TimeSlot[]>(`/masters/${masterId}/slots`, undefined, {
        date,
        service_id: serviceId,
      }),
    enabled: !!masterId && !!date && !!serviceId,
    staleTime: 30_000,
  })
}

export function useDashboardBookings(filters?: Record<string, unknown>) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['dashboard-bookings', filters],
    queryFn: () =>
      api.get<Booking[]>('/dashboard/bookings', token!, filters),
    enabled: !!token,
  })
}
