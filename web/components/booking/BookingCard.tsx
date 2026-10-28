'use client'

import { Calendar, Clock, MapPin, User } from 'lucide-react'
import type { Booking } from '@/types'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getImageUrl } from '@/lib/api'

interface BookingCardProps {
  booking: Booking
  onCancel?: (id: number) => void
  onConfirm?: (id: number) => void
  onComplete?: (id: number) => void
  showActions?: boolean
  isOwner?: boolean
}

export default function BookingCard({
  booking,
  onCancel,
  onConfirm,
  onComplete,
  showActions = true,
  isOwner = false,
}: BookingCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Salon/Master info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {booking.master?.avatar ? (
            <img
              src={getImageUrl(booking.master.avatar)}
              alt={booking.master.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <User size={20} className="text-primary-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {booking.salon && (
              <p className="text-xs text-gray-500 mb-0.5 truncate">{booking.salon.name}</p>
            )}
            {booking.master && (
              <p className="font-semibold text-gray-900 truncate">{booking.master.name}</p>
            )}
            {booking.service && (
              <p className="text-sm text-gray-600 mt-0.5">{booking.service.name}</p>
            )}
            {isOwner && booking.client && (
              <p className="text-xs text-gray-500 mt-1">
                Клиент: {booking.client.name} · {booking.client.phone}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={booking.status} />
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Calendar size={14} className="text-primary-500" />
          <span>{formatDate(booking.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={14} className="text-primary-500" />
          <span>{formatTime(booking.time_start)}</span>
        </div>
        {booking.salon?.address && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin size={14} className="text-primary-500" />
            <span className="truncate max-w-[200px]">{booking.salon.address}</span>
          </div>
        )}
        <div className="ml-auto font-semibold text-primary-700">
          {formatPrice(booking.total_price)}
        </div>
      </div>

      {/* Actions */}
      {showActions && booking.status === 'pending' && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
          {isOwner && onConfirm && (
            <Button
              size="sm"
              onClick={() => onConfirm(booking.id)}
            >
              Подтвердить
            </Button>
          )}
          {isOwner && onComplete && booking.status === 'confirmed' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onComplete(booking.id)}
            >
              Завершить
            </Button>
          )}
          {onCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onCancel(booking.id)}
            >
              Отменить
            </Button>
          )}
        </div>
      )}
      {showActions && booking.status === 'confirmed' && isOwner && onComplete && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
          <Button size="sm" variant="secondary" onClick={() => onComplete(booking.id)}>
            Завершить
          </Button>
          {onCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onCancel(booking.id)}
            >
              Отменить
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
