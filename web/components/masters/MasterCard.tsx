import Link from 'next/link'
import { Star, Award } from 'lucide-react'
import type { Master } from '@/types'
import { getImageUrl } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'

interface MasterCardProps {
  master: Master
  showSalon?: boolean
}

export default function MasterCard({ master, showSalon }: MasterCardProps) {
  return (
    <Link href={`/masters/${master.id}`}>
      <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {master.avatar ? (
              <img
                src={getImageUrl(master.avatar)}
                alt={master.name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {master.name.charAt(0)}
                </span>
              </div>
            )}
            {master.experience_years && master.experience_years >= 5 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center">
                <Award size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
              {master.name}
            </h3>
            {showSalon && master.salon && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{master.salon.name}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-accent-400 text-accent-400" />
                <span className="text-sm font-medium text-gray-700">{master.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-400">({master.reviews_count})</span>
              {master.experience_years && (
                <span className="text-xs text-gray-400">· {master.experience_years} лет опыта</span>
              )}
            </div>
          </div>
        </div>

        {/* Specializations */}
        {master.specializations && master.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
            {master.specializations.slice(0, 4).map((spec, i) => (
              <Badge key={i} variant="primary" size="sm">
                {spec}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
