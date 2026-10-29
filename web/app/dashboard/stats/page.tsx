'use client'

import { TrendingUp, Users, Scissors, Award, BarChart3, BarChart2 } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboard'
import { useDashboardBookings } from '@/hooks/useBookings'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils'

export default function StatsPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: bookings } = useDashboardBookings()

  // Compute top services
  const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {}
  bookings?.forEach((b) => {
    if (b.service) {
      const key = String(b.service.id)
      if (!serviceCount[key]) {
        serviceCount[key] = { name: b.service.name, count: 0, revenue: 0 }
      }
      serviceCount[key].count++
      serviceCount[key].revenue += b.total_price
    }
  })
  const topServices = Object.values(serviceCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Compute booking status breakdown
  const statusCount = {
    completed: bookings?.filter((b) => b.status === 'completed').length || 0,
    pending: bookings?.filter((b) => b.status === 'pending').length || 0,
    confirmed: bookings?.filter((b) => b.status === 'confirmed').length || 0,
    cancelled: bookings?.filter((b) => b.status === 'cancelled').length || 0,
  }
  const totalBookings = Object.values(statusCount).reduce((a, b) => a + b, 0)

  // Revenue by month (from bookings_week)
  const weekRevenue = stats?.bookings_week || []

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          <BarChart2 size={16} />
          Подробная аналитика
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard
              title="Выручка за месяц"
              value={formatPrice(stats?.revenue_month || 0)}
              icon={<TrendingUp size={22} className="text-green-600" />}
              iconBg="bg-green-100"
              trend={8}
            />
            <StatsCard
              title="Записей сегодня"
              value={stats?.bookings_today || 0}
              icon={<BarChart3 size={22} className="text-primary-600" />}
              iconBg="bg-primary-100"
            />
            <StatsCard
              title="Новых клиентов"
              value={stats?.new_clients || 0}
              icon={<Users size={22} className="text-blue-600" />}
              iconBg="bg-blue-100"
              trend={5}
            />
            <StatsCard
              title="Средний рейтинг"
              value={`${(stats?.rating || 0).toFixed(1)} ★`}
              icon={<Award size={22} className="text-accent-500" />}
              iconBg="bg-amber-100"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue chart */}
        {weekRevenue.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Записи и выручка (7 дней)</h2>
            <div className="flex items-end gap-2 h-40">
              {weekRevenue.map((day, i) => {
                const maxRevenue = Math.max(...weekRevenue.map((d) => d.revenue), 1)
                const height = (day.revenue / maxRevenue) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 mb-1">{formatPrice(day.revenue)}</span>
                    <div
                      className="w-full bg-gradient-to-t from-primary-700 to-primary-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs text-gray-400 text-center leading-tight">
                      {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </span>
                    <span className="text-xs font-medium text-gray-700">{day.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Status breakdown */}
        {totalBookings > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Статусы записей</h2>
            <div className="space-y-3">
              {[
                { label: 'Завершено', count: statusCount.completed, color: 'bg-green-500' },
                { label: 'Подтверждено', count: statusCount.confirmed, color: 'bg-blue-500' },
                { label: 'Ожидает', count: statusCount.pending, color: 'bg-yellow-400' },
                { label: 'Отменено', count: statusCount.cancelled, color: 'bg-red-400' },
              ].map(({ label, count, color }) => {
                const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{label}</span>
                      <span className="font-medium text-gray-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top services */}
        {topServices.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Топ услуги</h2>
            <div className="space-y-3">
              {topServices.map((svc, i) => (
                <div key={svc.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{svc.name}</p>
                    <p className="text-xs text-gray-500">{svc.count} записей</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-700">{formatPrice(svc.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder: top masters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Топ мастера</h2>
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <Scissors size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Недостаточно данных</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
