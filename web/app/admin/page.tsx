'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Users, Store, Calendar, TrendingUp, Search } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import StatsCard from '@/components/dashboard/StatsCard'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStats, useAdminSalons, useVerifySalon } from '@/hooks/useDashboard'
import { formatPrice } from '@/lib/utils'

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: salons, isLoading: salonsLoading } = useAdminSalons()
  const verifySalon = useVerifySalon()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
    else if (!isAdmin) router.push('/')
  }, [isAuthenticated, isAdmin, router])

  if (!isAuthenticated || !isAdmin) return null

  const filteredSalons = salons?.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Администрирование</h1>
            <p className="text-gray-500 mt-1">Управление платформой Красиво</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatsCard
                title="Салонов"
                value={stats?.total_salons || 0}
                icon={<Store size={22} className="text-primary-600" />}
                iconBg="bg-primary-100"
              />
              <StatsCard
                title="Пользователей"
                value={stats?.total_users || 0}
                icon={<Users size={22} className="text-blue-600" />}
                iconBg="bg-blue-100"
              />
              <StatsCard
                title="Записей"
                value={stats?.total_bookings || 0}
                icon={<Calendar size={22} className="text-green-600" />}
                iconBg="bg-green-100"
              />
              <StatsCard
                title="Выручка"
                value={formatPrice(stats?.revenue_total || 0)}
                icon={<TrendingUp size={22} className="text-accent-500" />}
                iconBg="bg-amber-100"
              />
            </>
          )}
        </div>

        {/* Pending verifications badge */}
        {stats && stats.pending_verifications > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Store size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                {stats.pending_verifications} салон(ов) ожидают верификации
              </p>
              <p className="text-sm text-amber-600">Просмотрите и подтвердите новые заявки</p>
            </div>
          </div>
        )}

        {/* Salons table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Управление салонами</h2>
            <Input
              placeholder="Поиск..."
              leftIcon={<Search size={15} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>

          {salonsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Салон</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Город</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Статус</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Рейтинг</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalons?.map((salon) => (
                    <tr key={salon.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3.5 px-2">
                        <p className="font-medium text-gray-900">{salon.name}</p>
                        <p className="text-xs text-gray-400">{salon.address}</p>
                      </td>
                      <td className="py-3.5 px-2 text-gray-600">{salon.city}</td>
                      <td className="py-3.5 px-2">
                        {salon.is_verified ? (
                          <Badge variant="success">Верифицирован</Badge>
                        ) : (
                          <Badge variant="warning">Ожидает</Badge>
                        )}
                        {!salon.is_active && (
                          <Badge variant="error" className="ml-1">Заблокирован</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-gray-600">
                        ★ {salon.rating.toFixed(1)} ({salon.reviews_count})
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center justify-end gap-2">
                          {!salon.is_verified ? (
                            <Button
                              size="sm"
                              onClick={() => verifySalon.mutate({ id: salon.id, verify: true })}
                              loading={verifySalon.isPending}
                            >
                              <CheckCircle size={13} />
                              Верифицировать
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => verifySalon.mutate({ id: salon.id, verify: false })}
                            >
                              <XCircle size={13} />
                              Отозвать
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSalons?.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  Салоны не найдены
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
