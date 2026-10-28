'use client'

import { useState } from 'react'
import { Calendar, Filter, Search } from 'lucide-react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import BookingCard from '@/components/booking/BookingCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDashboardBookings, useUpdateBookingStatus } from '@/hooks/useBookings'

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
]

export default function BookingsManagePage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: bookings, isLoading } = useDashboardBookings({
    status: status || undefined,
    search: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const updateStatus = useUpdateBookingStatus()

  const handleConfirm = (id: number) => updateStatus.mutateAsync({ id, status: 'confirmed' })
  const handleCancel = (id: number) => {
    if (confirm('Отменить запись?')) updateStatus.mutateAsync({ id, status: 'cancelled' })
  }
  const handleComplete = (id: number) => updateStatus.mutateAsync({ id, status: 'completed' })

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление записями</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700">
          <Filter size={15} className="text-primary-600" />
          Фильтры
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input
            placeholder="Поиск по клиенту..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Все статусы"
          />
          <Input
            type="date"
            label="От"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            type="date"
            label="До"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Summary counts */}
      {bookings && (
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            { label: 'Всего', count: bookings.length, color: 'text-gray-900' },
            { label: 'Ожидают', count: bookings.filter(b => b.status === 'pending').length, color: 'text-yellow-700' },
            { label: 'Подтверждены', count: bookings.filter(b => b.status === 'confirmed').length, color: 'text-blue-700' },
            { label: 'Завершены', count: bookings.filter(b => b.status === 'completed').length, color: 'text-green-700' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bookings list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onConfirm={b.status === 'pending' ? handleConfirm : undefined}
              onCancel={['pending', 'confirmed'].includes(b.status) ? handleCancel : undefined}
              onComplete={b.status === 'confirmed' ? handleComplete : undefined}
              isOwner
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Записей нет</h3>
          <p className="text-gray-500 text-sm">Попробуйте изменить параметры фильтрации</p>
        </div>
      )}
    </div>
  )
}
