'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Users,
  Calendar,
  BarChart3,
  BarChart2,
  Scissors,
  LogOut,
  Clock,
  UserCheck,
  Tag,
  Gift,
  ShieldOff,
  MessageSquare,
  Megaphone,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Обзор' },
  { href: '/dashboard/salon', icon: Store, label: 'Мой салон' },
  { href: '/dashboard/masters', icon: Users, label: 'Мастера' },
  { href: '/dashboard/schedule', icon: Clock, label: 'Расписание' },
  { href: '/dashboard/salary', icon: DollarSign, label: 'Зарплаты' },
  { href: '/dashboard/bookings', icon: Calendar, label: 'Записи' },
  { href: '/dashboard/clients', icon: UserCheck, label: 'Клиенты' },
  { href: '/dashboard/stats', icon: BarChart3, label: 'Статистика' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Аналитика' },
  { href: '/dashboard/promos', icon: Tag, label: 'Промокоды' },
  { href: '/dashboard/certificates', icon: Gift, label: 'Сертификаты' },
  { href: '/dashboard/blacklist', icon: ShieldOff, label: 'Чёрный список' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Сообщения' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'Рассылки' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Scissors size={15} className="text-white" />
        </div>
        <span className="font-bold text-lg">Красиво</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-gray-800 pt-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Scissors size={18} />
          На сайт
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900 hover:text-red-300 transition-all w-full mt-1"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
