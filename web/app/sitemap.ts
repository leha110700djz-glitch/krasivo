import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://krasivo.ru'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/salons`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    const res = await fetch(`${API_URL}/salons?per_page=500`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      const salon_pages: MetadataRoute.Sitemap = (data.items || []).map((salon: { id: string; updated_at?: string }) => ({
        url: `${SITE_URL}/salons/${salon.id}`,
        lastModified: salon.updated_at ? new Date(salon.updated_at) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
      return [...static_pages, ...salon_pages]
    }
  } catch {
    // fallback to static
  }

  return static_pages
}
