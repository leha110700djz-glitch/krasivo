'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOwner, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!isOwner && !isAdmin) {
      router.push('/profile')
    }
  }, [isAuthenticated, isOwner, isAdmin, router])

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
