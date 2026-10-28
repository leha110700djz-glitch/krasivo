'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Star, Gift, MessageSquare, Users, ArrowLeft, Trophy, TrendingUp } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoyaltyTransaction {
  id: string
  account_id: string
  points: number
  reason: string
  booking_id: string | null
  description: string
  created_at: string
}

interface LoyaltyAccount {
  id: string
  user_id: string
  points: number
  lifetime_points: number
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  next_level_threshold: number | null
  transactions: LoyaltyTransaction[]
  created_at: string
  updated_at: string
}

// ── Level config ──────────────────────────────────────────────────────────────

const LEVELS = {
  bronze: {
    label: 'Бронза',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    icon: '🥉',
    min: 0,
    max: 499,
  },
  silver: {
    label: 'Серебро',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    bar: 'bg-gray-400',
    icon: '🥈',
    min: 500,
    max: 1999,
  },
  gold: {
    label: 'Золото',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    bar: 'bg-yellow-400',
    icon: '🥇',
    min: 2000,
    max: 4999,
  },
  platinum: {
    label: 'Платина',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    bar: 'bg-purple-500',
    icon: '💎',
    min: 5000,
    max: null,
  },
} as const

function getLevelProgress(lifetime_points: number, level: keyof typeof LEVELS): number {
  const cfg = LEVELS[level]
  if (cfg.max === null) return 100
  const range = cfg.max - cfg.min + 1
  const progress = lifetime_points - cfg.min
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)))
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const { user, isAuthenticated } = useAuth()
  const token = useAuthStore((s) => s.token)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const { data: loyalty, isLoading } = useQuery<LoyaltyAccount>({
    queryKey: ['loyalty', 'me'],
    queryFn: () => api.get<LoyaltyAccount>('/loyalty/me', token!),
    enabled: !!token,
  })

  if (!user) return null

  const levelCfg = loyalty ? LEVELS[loyalty.level] : LEVELS.bronze
  const progress = loyalty ? getLevelProgress(loyalty.lifetime_points, loyalty.level) : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Back link */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Назад в профиль
          </Link>

          {/* Balance card */}
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-2xl mb-4" />
          ) : loyalty ? (
            <div className={`rounded-2xl border ${levelCfg.border} ${levelCfg.bg} p-6 mb-4 shadow-sm`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Мои баллы</p>
                  <p className="text-5xl font-extrabold text-gray-900">
                    {loyalty.points.toLocaleString('ru-RU')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Всего заработано: {loyalty.lifetime_points.toLocaleString('ru-RU')} баллов
                  </p>
                </div>
                <div className={`text-center ${levelCfg.color}`}>
                  <div className="text-4xl mb-1">{levelCfg.icon}</div>
                  <span className="text-sm font-semibold">{levelCfg.label}</span>
                </div>
              </div>

              {/* Progress to next level */}
              {loyalty.next_level_threshold !== null && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{loyalty.lifetime_points} баллов</span>
                    <span>до {loyalty.next_level_threshold} баллов</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${levelCfg.bar}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Ещё {(loyalty.next_level_threshold - loyalty.lifetime_points).toLocaleString('ru-RU')} баллов до следующего уровня
                  </p>
                </div>
              )}

              {loyalty.level === 'platinum' && (
                <p className="text-xs font-medium text-purple-700 mt-2">
                  Максимальный уровень достигнут!
                </p>
              )}

              {/* Redeem hint */}
              <div className="mt-4 pt-4 border-t border-white/50 flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  100 баллов = скидка 50 ₽ на запись
                </p>
                <Link
                  href="/salons"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-primary-200 transition-colors"
                >
                  <Gift size={14} />
                  Потратить баллы
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-4 text-center text-gray-400">
              Аккаунт лояльности не найден
            </div>
          )}

          {/* Levels overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(Object.entries(LEVELS) as [keyof typeof LEVELS, typeof LEVELS[keyof typeof LEVELS]][]).map(([key, cfg]) => (
              <div
                key={key}
                className={`rounded-xl border p-3 text-center transition-all ${
                  loyalty?.level === key
                    ? `${cfg.border} ${cfg.bg} ring-2 ring-offset-1 ring-current ${cfg.color}`
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{cfg.icon}</div>
                <p className={`text-xs font-semibold ${loyalty?.level === key ? cfg.color : 'text-gray-700'}`}>
                  {cfg.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cfg.max === null ? `от ${cfg.min}` : `${cfg.min}–${cfg.max}`}
                </p>
              </div>
            ))}
          </div>

          {/* How to earn */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-600" />
              Как заработать баллы
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-primary-50 border border-primary-100">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                  <Star size={22} className="text-primary-700" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Запись к мастеру</p>
                <p className="text-xs text-gray-500">+20 баллов за каждую завершённую запись</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <MessageSquare size={22} className="text-green-700" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Отзыв 5 звёзд</p>
                <p className="text-xs text-gray-500">+50 баллов за отзыв с оценкой 5 звёзд</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Users size={22} className="text-purple-700" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">Приглашение друга</p>
                <p className="text-xs text-gray-500">Реферальные баллы за каждого приглашённого</p>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-primary-600" />
              История операций
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : loyalty && loyalty.transactions.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {loyalty.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        tx.points > 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Trophy size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">История пока пуста</p>
                <Link href="/salons" className="text-primary-700 text-sm font-medium mt-2 block hover:underline">
                  Записаться и заработать первые баллы
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
