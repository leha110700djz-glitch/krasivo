interface SalonJsonLdProps {
  salon: {
    id: string
    name: string
    description?: string
    address?: string
    city?: string
    phone?: string
    website?: string
    rating?: number
    reviews_count?: number
    cover_photo?: string
    photos?: string[]
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://krasivo.ru'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getImageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

export default function SalonJsonLd({ salon }: SalonJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `${SITE_URL}/salons/${salon.id}`,
    name: salon.name,
    description: salon.description,
    url: `${SITE_URL}/salons/${salon.id}`,
    telephone: salon.phone,
    sameAs: salon.website ? [salon.website] : undefined,
    address: salon.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: salon.address,
          addressLocality: salon.city || '',
          addressCountry: 'RU',
        }
      : undefined,
    aggregateRating:
      salon.rating && salon.reviews_count
        ? {
            '@type': 'AggregateRating',
            ratingValue: salon.rating.toFixed(1),
            reviewCount: salon.reviews_count,
            bestRating: '5',
            worstRating: '1',
          }
        : undefined,
    image: salon.cover_photo
      ? [getImageUrl(salon.cover_photo), ...(salon.photos || []).slice(0, 4).map(getImageUrl)].filter(Boolean)
      : undefined,
    priceRange: '₽₽',
    currenciesAccepted: 'RUB',
    paymentAccepted: 'Cash, Credit Card',
    openingHours: 'Mo-Su 09:00-21:00',
    hasMap: salon.address
      ? `https://yandex.ru/maps/?text=${encodeURIComponent(`${salon.name} ${salon.address}`)}`
      : undefined,
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/salons/${salon.id}`,
        actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
      },
      result: {
        '@type': 'Reservation',
        name: 'Запись в салон',
      },
    },
  }

  // Remove undefined fields
  const cleaned = JSON.parse(JSON.stringify(schema, (_, v) => (v === undefined ? undefined : v)))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }}
    />
  )
}
