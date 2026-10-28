'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, Phone, Mail, Calendar, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'

interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  avatar_url?: string
  bookings_count: number
  last_visit?: string
}

function ClientRow({ client }: { client: Client }) {
  const initials = client.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
        {client.avatar_url ? (
          <img src={client.avatar_url} alt={client.name} className="w-full h-full rounded-xl object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {client.phone && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Phone size={11} />
              {client.phone}
            </span>
          )}
          {client.email && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Mail size={11} />
              {client.email}
            </span>
          )}
        </div>
      </div>

      {/* Bookings count */}
      <div className="text-center hidden sm:block">
        <p className="text-sm font-semibold text-gray-900">{client.bookings_count}</p>
        <p className="text-xs text-gray-400">записей</p>
      </div>

      {/* Last visit */}
      <div className="text-right hidden md:block">
        <p className="text-sm text-gray-600">
          {client.last_visit ? formatDate(client.last_visit) : '—'}
        </p>
        <p className="text-xs text-gray-400">последний визит</p>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: () => api.get('/dashboard/clients').then((r) => r.data),
  })

  const clients: Client[] = data?.items || []

  const filtered = search
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : clients

  const totalBookings = clients.reduce((sum, c) => sum + c.bookings_count, 0)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
        <p className="text-gray-500 mt-1 text-sm">Все клиенты, которые записывались к вам</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <Users size={18} className="text-primary-600" />
            </div>
            <span className="text-sm text-gray-500">Всего клиентов</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Всего записей</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени, телефону или email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-gray-50"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div>Клиент</div>
          <div className="hidden sm:block text-center">Записей</div>
          <div className="hidden md:block text-right">Последний визит</div>
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4">
                <Skeleton className="h-10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search ? 'Клиентов не найдено' : 'Пока нет клиентов'}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
