'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Star, Award, MapPin, Calendar, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useMaster } from '@/hooks/useMaster'
import { getImageUrl } from '@/lib/api'
import { formatPrice, formatDuration, pluralize } from '@/lib/utils'
import BookingFlow from '@/components/booking/BookingFlow'

export default function MasterPage() {
  const { id } = useParams<{ id: string }>()
  const { data: master, isLoading } = useMaster(id)
  const [bookingOpen, setBookingOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
          <Skeleton className="h-40 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-60 w-full" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!master) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Мастер не найден</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/salons" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 mb-5 transition-colors">
            <ChevronLeft size={16} />
            Назад
          </Link>

          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {master.avatar ? (
                  <img
                    src={getImageUrl(master.avatar)}
                    alt={master.name}
                    className="w-28 h-28 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{master.name.charAt(0)}</span>
                  </div>
                )}
                {master.experience_years && master.experience_years >= 5 && (
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-accent-400 rounded-full flex items-center justify-center shadow-md">
                    <Award size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{master.name}</h1>
                {master.salon && (
                  <Link
                    href={`/salons/${master.salon.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-2"
                  >
                    <MapPin size={13} />
                    {master.salon.name}
                  </Link>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={master.rating} showNumber />
                  <span className="text-sm text-gray-400">({master.reviews_count} отзывов)</span>
                  {master.experience_years && (
                    <span className="text-sm text-gray-500">
                      · {pluralize(master.experience_years, 'год опыта', 'года опыта', 'лет опыта')}
                    </span>
                  )}
                </div>

                {/* Specializations */}
                {master.specializations && master.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {master.specializations.map((spec, i) => (
                      <Badge key={i} variant="primary">{spec}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button size="lg" onClick={() => setBookingOpen(true)}>
                <Calendar size={16} />
                Записаться
              </Button>
            </div>

            {master.bio && (
              <p className="text-gray-600 text-sm mt-5 pt-5 border-t border-gray-100 leading-relaxed">
                {master.bio}
              </p>
            )}
          </div>

          {/* Portfolio */}
          {master.portfolio && master.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Портфолио</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {master.portfolio.map((item) => (
                  <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.description || 'Работа мастера'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {master.services && master.services.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Услуги</h2>
              <div className="divide-y divide-gray-50">
                {master.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDuration(service.duration_minutes)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary-700">{formatPrice(service.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" onClick={() => setBookingOpen(true)}>
              Записаться к {master.name.split(' ')[0]}
            </Button>
          </div>
        </div>
      </main>

      <Modal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        size="xl"
        title={`Запись к мастеру ${master.name}`}
      >
        {master.salon_id && (
          <BookingFlow
            salonId={master.salon_id}
            masterId={master.id}
            onSuccess={() => setBookingOpen(false)}
          />
        )}
      </Modal>

      <Footer />
    </div>
  )
}
