import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/layout/Providers'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://krasivo.ru'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Красиво — Запись в салоны красоты онлайн',
    template: '%s | Красиво',
  },
  description: 'Найдите лучшие салоны красоты и барбершопы рядом с вами. Онлайн-запись к мастерам в один клик — без звонков и очередей. 500+ салонов, 1000+ мастеров.',
  keywords: ['салон красоты', 'барбершоп', 'маникюр', 'стрижка', 'запись онлайн', 'косметология', 'массаж', 'парикмахерская', 'брови', 'ресницы', 'макияж'],
  authors: [{ name: 'Красиво', url: SITE_URL }],
  creator: 'Красиво',
  publisher: 'Красиво',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: 'Красиво',
    title: 'Красиво — Запись в салоны красоты онлайн',
    description: 'Найдите лучшие салоны красоты и барбершопы рядом с вами. Онлайн-запись в один клик.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Красиво — платформа для записи в салоны красоты',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Красиво — Запись в салоны красоты',
    description: 'Онлайн-запись к мастерам в один клик. 500+ салонов.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'beauty',
}

export const viewport: Viewport = {
  themeColor: '#6d28d9',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
