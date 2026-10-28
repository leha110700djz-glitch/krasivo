import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
  showNumber?: boolean
  reviewsCount?: number
  className?: string
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 14,
  showNumber = false,
  reviewsCount,
  className,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < Math.floor(rating) ? 'fill-accent-400 text-accent-400' : 'fill-gray-200 text-gray-200'
          )}
        />
      ))}
      {showNumber && (
        <span className="text-sm font-medium text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewsCount !== undefined && (
        <span className="text-xs text-gray-400 ml-0.5">({reviewsCount})</span>
      )}
    </div>
  )
}
