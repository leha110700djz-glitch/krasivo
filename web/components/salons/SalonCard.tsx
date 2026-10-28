import Link from 'next/link'
import { MapPin, Star, CheckCircle, Users } from 'lucide-react'
import type { SalonListItem } from '@/types'
import { getImageUrl } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface SalonCardProps {
  salon: SalonListItem
}

export default function SalonCard({ salon }: SalonCardProps) {
  return (
    <Link href={`/salons/${salon.id}`}>
      <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative h-52 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
          {(salon.cover_photo || salon.avatar_url) ? (
            <img
              src={salon.cover_photo || salon.avatar_url || ''}
              alt={salon.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-primary-300 text-5xl font-bold select-none">
                {salon.name.charAt(0)}
              </div>
            </div>
          )}
          {salon.is_verified && (
            <div className="absolute top-3 left-3">
              <Badge variant="primary" className="bg-white/90 text-primary-700 shadow-sm">
                <CheckCircle size={11} className="mr-1" />
                Проверено
              </Badge>
            </div>
          )}
          {/* Rating overlay */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
            <Star size={13} className="fill-accent-400 text-accent-400" />
            <span className="text-sm font-semibold text-gray-800">{salon.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-primary-700 transition-colors">
            {salon.name}
          </h3>
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{salon.address}</span>
          </div>

          {/* Categories */}
          {salon.categories && salon.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {salon.categories.slice(0, 3).map((cat) => {
                const label = typeof cat === 'string' ? cat : (cat as any).name
                return (
                  <Badge key={label} variant="primary" size="sm">
                    {label}
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={13} />
              <span>
                {salon.masters_count
                  ? `${salon.masters_count} мастер${salon.masters_count === 1 ? '' : salon.masters_count < 5 ? 'а' : 'ов'}`
                  : 'Мастера'}
              </span>
              <span className="mx-1">·</span>
              <span className="text-xs text-gray-400">{salon.reviews_count ?? salon.review_count ?? 0} отзывов</span>
            </div>
            {salon.min_price !== undefined && salon.min_price !== null && (
              <span className="text-sm font-medium text-primary-700">
                от {formatPrice(salon.min_price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
