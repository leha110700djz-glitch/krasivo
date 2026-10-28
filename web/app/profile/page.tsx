'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Settings, User, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import BookingCard from '@/components/booking/BookingCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings'
import { getImageUrl } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

interface LoyaltySummary {
  points: number
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const LEVEL_LABELS: Record<string, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
  platinum: 'Платина',
}

const LEVEL_COLORS: Record<string, string> = {
  bronze: 'text-amber-700 bg-amber-50 border-amber-200',
  silver: 'text-gray-600 bg-gray-50 border-gray-300',
  gold: 'text-yellow-700 bg-yellow-50 border-yellow-300',
  platinum: 'text-purple-700 bg-purple-50 border-purple-300',
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth()
  const token = useAuthStore((s) => s.token)
  const router = useRouter()
  const { data: bookings, isLoading } = useBookings()
  const updateStatus = useUpdateBookingStatus()

  const { data: loyalty } = useQuery<LoyaltySummary>({
    queryKey: ['loyalty', 'me'],
    queryFn: () => api.get<LoyaltySummary>('/loyalty/me', token!),
    enabled: !!token,
  })

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const handleCancel = async (id: number) => {
    if (confirm('Отменить запись?')) {
      await updateStatus.mutateAsync({ id, status: 'cancelled' })
    }
  }

  if (!user) return null

  const upcoming = bookings?.filter((b) => b.status === 'pending' || b.status === 'confirmed') || []
  const past = bookings?.filter((b) => b.status === 'completed') || []
  const cancelled = bookings?.filter((b) => b.status === 'cancelled') || []

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user.name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-2xl font-bold">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-sm text-gray-500">{user.phone}</p>
                </div>
              </div>
              <Link href="/profile/settings">
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <Settings size={16} />
                  Настройки
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{bookings?.length || 0}</p>
                <p className="text-xs text-gray-500">Всего записей</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700">{upcoming.length}</p>
                <p className="text-xs text-gray-500">Предстоящих</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{past.length}</p>
                <p className="text-xs text-gray-500">Завершённых</p>
              </div>
            </div>

            {/* Loyalty card */}
            {loyalty && (
              <Link href="/profile/loyalty" className="block mt-4">
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 hover:shadow-sm transition-shadow ${LEVEL_COLORS[loyalty.level] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="shrink-0" />
                    <span className="text-sm font-medium">
                      Мои баллы: <span className="font-bold">{loyalty.points.toLocaleString('ru-RU')}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{LEVEL_LABELS[loyalty.level]}</span>
                    <span className="text-xs opacity-60">→</span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Мои записи</h2>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-5">
                <TabsTrigger value="upcoming">
                  Предстоящие {upcoming.length > 0 && `(${upcoming.length})`}
                </TabsTrigger>
                <TabsTrigger value="past">Прошедшие</TabsTrigger>
                <TabsTrigger value="cancelled">Отменённые</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
                  </div>
                ) : upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {upcoming.map((b) => (
                      <BookingCard key={b.id} booking={b} onCancel={handleCancel} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Нет предстоящих записей</p>
                    <Link href="/salons" className="text-primary-700 text-sm font-medium mt-2 block hover:underline">
                      Найти мастера
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                {past.length > 0 ? (
                  <div className="space-y-3">
                    {past.map((b) => (
                      <BookingCard key={b.id} booking={b} showActions={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Нет завершённых записей</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled">
                {cancelled.length > 0 ? (
                  <div className="space-y-3">
                    {cancelled.map((b) => (
                      <BookingCard key={b.id} booking={b} showActions={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Нет отменённых записей</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
