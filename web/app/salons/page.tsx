'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LayoutGrid, List, Search, Loader2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SalonCard from '@/components/salons/SalonCard'
import SalonFilters from '@/components/salons/SalonFilters'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { SalonCardSkeleton } from '@/components/ui/Skeleton'
import { useSalons } from '@/hooks/useSalons'
import type { SalonFilters as FiltersType } from '@/types'

export default function SalonsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<FiltersType>({
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    sort: (searchParams.get('sort') as FiltersType['sort']) || 'rating',
    page: 1,
    per_page: 12,
  })

  const { data, isLoading, error } = useSalons({ ...filters, search })

  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters((prev) => ({ ...prev, page: 1 }))
  }

  const totalPages = data?.pages || 1
  const currentPage = filters.page || 1

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Салоны красоты</h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск салонов, услуг, мастеров..."
              leftIcon={<Search size={16} />}
              className="max-w-lg"
            />
            <Button type="submit">Найти</Button>
          </form>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex gap-6">
          {/* Sidebar filters */}
          <div className="hidden lg:block w-64 shrink-0">
            <SalonFilters filters={filters} onChange={handleFiltersChange} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" />
                    Загрузка...
                  </span>
                ) : (
                  `Найдено: ${data?.total || 0} салонов`
                )}
              </p>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-400'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-400'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">
                Ошибка загрузки. Попробуйте обновить страницу.
              </div>
            )}

            {/* Grid */}
            {!error && (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'flex flex-col gap-4'
                }
              >
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SalonCardSkeleton key={i} />)
                  : data?.items.map((salon) => <SalonCard key={salon.id} salon={salon} />)}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && data?.items.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Салоны не найдены</h3>
                <p className="text-gray-500">Попробуйте изменить параметры поиска или фильтры</p>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: currentPage - 1 }))}
                >
                  Назад
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setFilters((prev) => ({ ...prev, page }))}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-primary-700 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: currentPage + 1 }))}
                >
                  Вперёд
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
