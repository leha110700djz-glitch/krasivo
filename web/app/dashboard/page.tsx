'use client'

import { Calendar, TrendingUp, Users, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'
import BookingCard from '@/components/booking/BookingCard'
import { StatCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useDashboardBookings, useUpdateBookingStatus } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: bookings, isLoading: bookingsLoading } = useDashboardBookings({ status: 'pending', per_page: 5 })
  const updateStatus = useUpdateBookingStatus()

  const handleConfirm = (id: number) => updateStatus.mutateAsync({ id, status: 'confirmed' })
  const handleCancel = (id: number) => {
    if (confirm('Отменить запись?')) updateStatus.mutateAsync({ id, status: 'cancelled' })
  }
  const handleComplete = (id: number) => updateStatus.mutateAsync({ id, status: 'completed' })

  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Добрый день, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1 capitalize">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard
              title="Записей сегодня"
              value={stats?.bookings_today || 0}
              icon={<Calendar size={22} className="text-primary-600" />}
              iconBg="bg-primary-100"
              trend={12}
            />
            <StatsCard
              title="Выручка за месяц"
              value={formatPrice(stats?.revenue_month || 0)}
              icon={<TrendingUp size={22} className="text-green-600" />}
              iconBg="bg-green-100"
              trend={8}
            />
            <StatsCard
              title="Новые клиенты"
              value={stats?.new_clients || 0}
              icon={<Users size={22} className="text-blue-600" />}
              iconBg="bg-blue-100"
              trend={5}
            />
            <StatsCard
              title="Рейтинг"
              value={`${(stats?.rating || 0).toFixed(1)} ★`}
              icon={<Star size={22} className="text-accent-500" />}
              iconBg="bg-amber-100"
            />
          </>
        )}
      </div>

      {/* Bookings chart placeholder */}
      {stats?.bookings_week && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Записи за последние 7 дней</h2>
          <div className="flex items-end gap-2 h-32">
            {stats.bookings_week.map((day, i) => {
              const maxCount = Math.max(...stats.bookings_week.map((d) => d.count), 1)
              const height = (day.count / maxCount) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary-600 rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Новые записи</h2>
          <Link href="/dashboard/bookings" className="flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800">
            Все записи <ArrowRight size={14} />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onComplete={handleComplete}
                isOwner
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
            <p>Новых записей нет</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[
          { href: '/dashboard/salon', label: 'Редактировать салон', desc: 'Услуги, фото, описание' },
          { href: '/dashboard/masters', label: 'Управлять мастерами', desc: 'Расписание, портфолио' },
          { href: '/dashboard/stats', label: 'Статистика', desc: 'Выручка, топ услуги' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-primary-200 transition-all">
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
              <ArrowRight size={16} className="text-primary-600 mt-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
