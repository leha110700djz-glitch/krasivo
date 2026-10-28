import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: 'Красиво — Запись в салоны красоты',
  description: 'Найдите лучшие салоны красоты и барбершопы рядом с вами. Онлайн-запись к мастерам в один клик.',
  keywords: 'салон красоты, барбершоп, маникюр, стрижка, запись онлайн',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
