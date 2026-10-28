'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  MapPin, Phone, Globe, Star, CheckCircle, Clock, ChevronLeft, ImageIcon,
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import MasterCard from '@/components/masters/MasterCard'
import { useSalon } from '@/hooks/useSalons'
import { useSalonServices } from '@/hooks/useServices'
import { useSalonMasters } from '@/hooks/useMaster'
import { getImageUrl } from '@/lib/api'
import { formatPrice, formatDuration } from '@/lib/utils'
import BookingFlow from '@/components/booking/BookingFlow'

export default function SalonPage() {
  const { id } = useParams<{ id: string }>()
  const { data: salon, isLoading } = useSalon(id)
  const { data: services } = useSalonServices(id)
  const { data: masters } = useSalonMasters(id)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedMasterId, setSelectedMasterId] = useState<number | null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
          <Skeleton className="h-72 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Салон не найден</p>
        </div>
        <Footer />
      </div>
    )
  }

  const photos = salon.photos || []
  const coverPhoto = salon.cover_photo || photos[0]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Back */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
          <Link href="/salons" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition-colors">
            <ChevronLeft size={16} />
            Назад к салонам
          </Link>
        </div>

        {/* Photo gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="grid grid-cols-4 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
            <div className="col-span-3 bg-gray-200 relative">
              {coverPhoto ? (
                <img
                  src={getImageUrl(photos[photoIdx] || coverPhoto)}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <ImageIcon size={48} className="text-primary-300" />
                </div>
              )}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              {photos.slice(1, 4).map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIdx(i + 1)}
                  className="flex-1 bg-gray-200 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {photos.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{salon.name}</h1>
                      {salon.is_verified && (
                        <Badge variant="primary">
                          <CheckCircle size={12} className="mr-1" />
                          Проверено
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 mb-3">
                      <MapPin size={15} />
                      <span className="text-sm">{salon.address}, {salon.city}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={salon.rating} showNumber />
                      <span className="text-sm text-gray-400">({salon.reviews_count} отзывов)</span>
                    </div>
                  </div>
                  <Button size="lg" onClick={() => setBookingOpen(true)}>
                    Записаться
                  </Button>
                </div>

                {salon.description && (
                  <p className="text-gray-600 text-sm mt-4 leading-relaxed">{salon.description}</p>
                )}

                {/* Categories */}
                {salon.categories && salon.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {salon.categories.map((cat) => (
                      <Badge key={cat.id} variant="default">{cat.name}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <Tabs defaultValue="services">
                  <TabsList className="mb-6">
                    <TabsTrigger value="services">Услуги</TabsTrigger>
                    <TabsTrigger value="masters">Мастера</TabsTrigger>
                    <TabsTrigger value="reviews">Отзывы</TabsTrigger>
                    <TabsTrigger value="photos">Фото</TabsTrigger>
                  </TabsList>

                  {/* Services */}
                  <TabsContent value="services">
                    {services && services.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between py-4"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              {service.description && (
                                <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1">
                                <Clock size={13} className="text-gray-400" />
                                <span className="text-xs text-gray-500">{formatDuration(service.duration_minutes)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              <span className="font-semibold text-primary-700">{formatPrice(service.price)}</span>
                              <Button
                                size="sm"
                                onClick={() => { setBookingOpen(true) }}
                              >
                                Записаться
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Услуги не указаны</p>
                    )}
                  </TabsContent>

                  {/* Masters */}
                  <TabsContent value="masters">
                    {masters && masters.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {masters.map((master) => (
                          <MasterCard key={master.id} master={master} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Мастера не добавлены</p>
                    )}
                  </TabsContent>

                  {/* Reviews */}
                  <TabsContent value="reviews">
                    <div className="space-y-4">
                      {/* Rating breakdown */}
                      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-gray-900">{salon.rating.toFixed(1)}</p>
                          <StarRating rating={salon.rating} className="justify-center mt-1" />
                          <p className="text-xs text-gray-500 mt-1">{salon.reviews_count} отзывов</p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map((r) => (
                            <div key={r} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-3">{r}</span>
                              <Star size={11} className="fill-accent-400 text-accent-400" />
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-accent-400 rounded-full"
                                  style={{ width: `${r === Math.round(salon.rating) ? 60 : r === 5 ? 30 : 10}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-500 text-center py-4 text-sm">Отзывы загружаются...</p>
                    </div>
                  </TabsContent>

                  {/* Photos */}
                  <TabsContent value="photos">
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((photo, i) => (
                          <button
                            key={i}
                            className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                            onClick={() => setPhotoIdx(i)}
                          >
                            <img
                              src={getImageUrl(photo)}
                              alt={`Фото ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Фото не добавлены</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              {/* Contacts */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Контакты</h3>
                <div className="space-y-3">
                  {salon.phone && (
                    <a href={`tel:${salon.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-primary-700 transition-colors">
                      <Phone size={15} className="text-primary-500" />
                      {salon.phone}
                    </a>
                  )}
                  {salon.website && (
                    <a href={salon.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-primary-700 transition-colors">
                      <Globe size={15} className="text-primary-500" />
                      Сайт
                    </a>
                  )}
                  <div className="flex items-start gap-2.5 text-sm text-gray-600">
                    <MapPin size={15} className="text-primary-500 mt-0.5 shrink-0" />
                    <span>{salon.address}</span>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Карта</p>
                </div>
              </div>

              {/* CTA */}
              <Button fullWidth size="lg" onClick={() => setBookingOpen(true)}>
                Записаться онлайн
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Booking modal */}
      <Modal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} size="xl" title="Запись в салон">
        {salon && (
          <BookingFlow
            salonId={salon.id}
            masterId={selectedMasterId}
            onSuccess={() => setBookingOpen(false)}
          />
        )}
      </Modal>

      <Footer />
    </div>
  )
}
