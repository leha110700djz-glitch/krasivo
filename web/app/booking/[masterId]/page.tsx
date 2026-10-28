'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BookingFlow from '@/components/booking/BookingFlow'
import { useMaster } from '@/hooks/useMaster'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'

export default function BookingPage() {
  const { masterId } = useParams<{ masterId: string }>()
  const { data: master, isLoading } = useMaster(masterId)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking/${masterId}`)
    }
  }, [isAuthenticated, masterId, router])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link
            href={master?.id ? `/masters/${master.id}` : '/salons'}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 mb-6 transition-colors"
          >
            <ChevronLeft size={16} />
            Назад
          </Link>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-96 w-full rounded-xl" />
              </div>
            ) : master ? (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-6">
                  Запись к мастеру {master.name}
                </h1>
                <BookingFlow
                  salonId={master.salon_id}
                  masterId={master.id}
                  onSuccess={() => router.push('/profile')}
                />
              </>
            ) : (
              <p className="text-gray-500">Мастер не найден</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
