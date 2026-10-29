'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  DollarSign,
  BarChart2,
  Star,
  Scissors,
  Clock,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | 'year'

interface MetricPair {
  current: number
  prev: number
  change_pct: number
}

interface OverviewData {
  revenue: MetricPair
  bookings_count: MetricPair
  new_clients: MetricPair
  avg_check: MetricPair
  return_rate: number
  cancellation_rate: number
  completion_rate: number
}

interface ChartPoint {
  date: string
  revenue: number
  bookings: number
}

interface TopService {
  service_name: string
  count: number
  revenue: number
  avg_rating: number
}

interface TopMaster {
  master_name: string
  count: number
  revenue: number
  avg_rating: number
  completion_rate: number
}

interface ClientSegments {
  total: number
  new: number
  returning: number
  loyal: number
  sleeping: number
  lost: number
}

interface HeatmapCell {
  hour: number
  weekday: number
  count: number
}

// ── Period config ───────────────────────────────────────────────────────────────

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: '7d', label: '7 дней' },
  { id: '30d', label: '30 дней' },
  { id: '90d', label: '90 дней' },
  { id: 'year', label: 'Год' },
]

function periodToGroup(p: Period): string {
  if (p === 'year') return 'month'
  if (p === '90d') return 'week'
  return 'day'
}

// ── Small helpers ───────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

function StarDisplay({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
      <span className="text-gray-500 ml-1 text-xs">({rating.toFixed(1)})</span>
    </span>
  )
}

// ── KPI card ────────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  change,
  icon,
  iconBg,
  formatter,
}: {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  iconBg: string
  formatter?: (n: number) => string
}) {
  const fmt = formatter ?? ((n: number) => String(Math.round(n)))
  const positive = change >= 0
  const neutral = change === 0
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            neutral
              ? 'bg-gray-100 text-gray-500'
              : positive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          )}
        >
          {neutral ? (
            <Minus size={12} />
          ) : positive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{fmt(value)}</p>
    </div>
  )
}

// ── SVG Area Chart ──────────────────────────────────────────────────────────────

function AreaChart({ data, isLoading }: { data?: ChartPoint[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <div className="w-full h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }
  if (!data?.length) {
    return (
      <div className="h-60 flex flex-col items-center justify-center text-gray-400 gap-2">
        <BarChart2 size={32} className="opacity-40" />
        <p className="text-sm">Нет данных за выбранный период</p>
      </div>
    )
  }

  const W = 800
  const H = 240
  const PL = 72
  const PR = 20
  const PT = 28
  const PB = 48
  const cW = W - PL - PR
  const cH = H - PT - PB
  const bottom = PT + cH

  const maxRev = Math.max(...data.map((d) => d.revenue), 1)
  const maxBk = Math.max(...data.map((d) => d.bookings), 1)
  const N = data.length

  const xOf = (i: number) => PL + (N > 1 ? (i / (N - 1)) * cW : cW / 2)
  const yRev = (v: number) => PT + cH - Math.max(0, Math.min(cH, (v / maxRev) * cH))
  const yBk = (v: number) => PT + cH - Math.max(0, Math.min(cH, (v / maxBk) * cH))

  const revLinePoints = data.map((d, i) => `${xOf(i).toFixed(1)},${yRev(d.revenue).toFixed(1)}`).join(' ')
  const bkLinePoints = data.map((d, i) => `${xOf(i).toFixed(1)},${yBk(d.bookings).toFixed(1)}`).join(' ')

  const revAreaPath =
    `M ${xOf(0).toFixed(1)} ${bottom} ` +
    data.map((d, i) => `L ${xOf(i).toFixed(1)} ${yRev(d.revenue).toFixed(1)}`).join(' ') +
    ` L ${xOf(N - 1).toFixed(1)} ${bottom} Z`

  const labelCount = Math.min(N, 7)
  const labelIndices =
    N <= labelCount
      ? data.map((_, i) => i)
      : Array.from({ length: labelCount }, (_, k) =>
          k === labelCount - 1 ? N - 1 : Math.round((k * (N - 1)) / (labelCount - 1))
        )

  const yGridFractions = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '240px' }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines + y labels */}
      {yGridFractions.map((f) => {
        const y = PT + cH - f * cH
        const val = maxRev * f
        const label = val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${Math.round(val / 1000)}k` : String(Math.round(val))
        return (
          <g key={f}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            {f > 0 && (
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {label}
              </text>
            )}
          </g>
        )
      })}

      {/* Revenue area fill */}
      <path d={revAreaPath} fill="url(#revGrad)" />

      {/* Revenue line */}
      <polyline
        points={revLinePoints}
        fill="none"
        stroke="#6d28d9"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Bookings secondary line */}
      <polyline
        points={bkLinePoints}
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.5"
        strokeDasharray="5,3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* X axis baseline */}
      <line x1={PL} y1={bottom} x2={W - PR} y2={bottom} stroke="#e5e7eb" strokeWidth="1" />

      {/* Date labels */}
      {labelIndices.map((idx) => (
        <text key={idx} x={xOf(idx)} y={H - 12} textAnchor="middle" fontSize="10" fill="#9ca3af">
          {formatDateLabel(data[idx].date)}
        </text>
      ))}

      {/* Dots on revenue line (only for small datasets) */}
      {N <= 16 &&
        data.map((d, i) => (
          <circle key={i} cx={xOf(i)} cy={yRev(d.revenue)} r="2.5" fill="#6d28d9" />
        ))}

      {/* Legend */}
      <rect x={PL} y={10} width="12" height="4" fill="#6d28d9" rx="2" />
      <text x={PL + 16} y={15} fontSize="10" fill="#6b7280">
        Выручка (₽)
      </text>
      <rect x={PL + 105} y={10} width="12" height="4" fill="#16a34a" rx="2" />
      <text x={PL + 121} y={15} fontSize="10" fill="#6b7280">
        Записи
      </text>
    </svg>
  )
}

// ── Heatmap ─────────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => i)

function HeatmapGrid({ data, isLoading }: { data?: HeatmapCell[]; isLoading?: boolean }) {
  const matrix = useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
    if (!data) return m
    for (const cell of data) {
      const row = cell.weekday - 1 // ISODOW: 1=Mon, convert to 0-indexed
      const col = cell.hour
      if (row >= 0 && row < 7 && col >= 0 && col < 24) {
        m[row][col] = cell.count
      }
    }
    return m
  }, [data])

  const maxCount = useMemo(() => {
    let m = 0
    for (const row of matrix) for (const v of row) if (v > m) m = v
    return m || 1
  }, [matrix])

  if (isLoading) {
    return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
  }
  if (!data?.length) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        Нет данных за выбранный период
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Hour axis */}
        <div className="flex mb-1 ml-8">
          {HOUR_LABELS.map((h) => (
            <div key={h} className="flex-1 text-center text-xs text-gray-400">
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {WEEKDAY_LABELS.map((dayLabel, rowIdx) => (
          <div key={rowIdx} className="flex items-center mb-1">
            <div className="w-8 text-xs text-gray-500 text-right pr-2 flex-shrink-0">{dayLabel}</div>
            {HOUR_LABELS.map((col) => {
              const count = matrix[rowIdx][col]
              const intensity = count / maxCount
              return (
                <div
                  key={col}
                  className="flex-1 h-5 rounded-sm mx-px relative group"
                  style={{
                    backgroundColor: count === 0
                      ? '#f3f4f6'
                      : `rgba(109,40,217,${0.1 + intensity * 0.85})`,
                  }}
                  title={count > 0 ? `${dayLabel} ${col}:00 — ${count} записей` : undefined}
                />
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 ml-8">
          <span className="text-xs text-gray-400">меньше</span>
          {[0.05, 0.2, 0.4, 0.65, 0.9].map((op) => (
            <div
              key={op}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `rgba(109,40,217,${op})` }}
            />
          ))}
          <span className="text-xs text-gray-400">больше</span>
        </div>
      </div>
    </div>
  )
}

// ── Client Segments ──────────────────────────────────────────────────────────────

const SEGMENT_CONFIG = [
  { key: 'new' as const, label: 'Новые', desc: '1 визит', color: 'bg-green-50 border-green-200 text-green-700', badge: 'bg-green-100' },
  { key: 'returning' as const, label: 'Возвращающиеся', desc: '2–5 визитов', color: 'bg-blue-50 border-blue-200 text-blue-700', badge: 'bg-blue-100' },
  { key: 'loyal' as const, label: 'Лояльные', desc: '6+ визитов', color: 'bg-violet-50 border-violet-200 text-violet-700', badge: 'bg-violet-100' },
  { key: 'sleeping' as const, label: 'Спящие', desc: '61–180 дней', color: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-100' },
  { key: 'lost' as const, label: 'Потерянные', desc: '>180 дней', color: 'bg-red-50 border-red-200 text-red-700', badge: 'bg-red-100' },
]

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const token = useAuthStore((s) => s.token)
  const group = periodToGroup(period)

  const overviewQ = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => api.get<OverviewData>('/analytics/overview', token ?? undefined, { period }),
    enabled: !!token,
  })

  const chartQ = useQuery({
    queryKey: ['analytics', 'chart', period, group],
    queryFn: () =>
      api.get<ChartPoint[]>('/analytics/revenue_chart', token ?? undefined, { period: period === '7d' ? '30d' : period, group }),
    enabled: !!token,
  })

  const servicesQ = useQuery({
    queryKey: ['analytics', 'services', period],
    queryFn: () => api.get<TopService[]>('/analytics/top_services', token ?? undefined, { period, limit: 10 }),
    enabled: !!token,
  })

  const mastersQ = useQuery({
    queryKey: ['analytics', 'masters', period],
    queryFn: () => api.get<TopMaster[]>('/analytics/top_masters', token ?? undefined, { period, limit: 10 }),
    enabled: !!token,
  })

  const segmentsQ = useQuery({
    queryKey: ['analytics', 'segments'],
    queryFn: () => api.get<ClientSegments>('/analytics/client_segments', token ?? undefined),
    enabled: !!token,
  })

  const heatmapQ = useQuery({
    queryKey: ['analytics', 'heatmap', period],
    queryFn: () => api.get<HeatmapCell[]>('/analytics/hourly_heatmap', token ?? undefined, { period }),
    enabled: !!token,
  })

  const ov = overviewQ.data
  const maxServiceCount = Math.max(...(servicesQ.data?.map((s) => s.count) ?? [1]), 1)
  const maxServiceRev = Math.max(...(servicesQ.data?.map((s) => s.revenue) ?? [1]), 1)

  return (
    <div className="p-6 lg:p-8 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
          <p className="text-sm text-gray-500 mt-0.5">Подробная статистика вашего салона</p>
        </div>
        <Link
          href="/dashboard/stats"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Базовая статистика →
        </Link>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit mb-6 shadow-sm">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              period === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {overviewQ.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-32 animate-pulse">
              <div className="bg-gray-100 rounded-xl w-10 h-10 mb-3" />
              <div className="bg-gray-100 rounded w-24 h-3 mb-2" />
              <div className="bg-gray-100 rounded w-16 h-6" />
            </div>
          ))
        ) : (
          <>
            <KPICard
              title="Выручка"
              value={ov?.revenue.current ?? 0}
              change={ov?.revenue.change_pct ?? 0}
              formatter={formatPrice}
              icon={<DollarSign size={20} className="text-violet-600" />}
              iconBg="bg-violet-100"
            />
            <KPICard
              title="Записей"
              value={ov?.bookings_count.current ?? 0}
              change={ov?.bookings_count.change_pct ?? 0}
              icon={<Calendar size={20} className="text-blue-600" />}
              iconBg="bg-blue-100"
            />
            <KPICard
              title="Новых клиентов"
              value={ov?.new_clients.current ?? 0}
              change={ov?.new_clients.change_pct ?? 0}
              icon={<Users size={20} className="text-green-600" />}
              iconBg="bg-green-100"
            />
            <KPICard
              title="Средний чек"
              value={ov?.avg_check.current ?? 0}
              change={ov?.avg_check.change_pct ?? 0}
              formatter={formatPrice}
              icon={<TrendingUp size={20} className="text-amber-600" />}
              iconBg="bg-amber-100"
            />
          </>
        )}
      </div>

      {/* Secondary KPIs row */}
      {ov && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Возврат клиентов', value: `${ov.return_rate}%`, color: 'text-violet-700' },
            { label: 'Выполнение', value: `${ov.completion_rate}%`, color: 'text-green-700' },
            { label: 'Отмены', value: `${ov.cancellation_rate}%`, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Выручка и записи</h2>
        <AreaChart data={chartQ.data} isLoading={chartQ.isLoading} />
      </div>

      {/* Top services + masters */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Top services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Топ услуги</h2>
          {servicesQ.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !servicesQ.data?.length ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <Scissors size={28} className="opacity-40" />
              <p className="text-sm">Нет данных за период</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servicesQ.data.map((svc, i) => (
                <div key={svc.service_name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{svc.service_name}</p>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{svc.count} зап.</span>
                        <span className="text-xs font-semibold text-primary-700">{formatPrice(svc.revenue)}</span>
                      </div>
                    </div>
                    {/* Revenue bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${(svc.revenue / maxServiceRev) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top masters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Топ мастера</h2>
          {mastersQ.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !mastersQ.data?.length ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <Users size={28} className="opacity-40" />
              <p className="text-sm">Нет данных за период</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mastersQ.data.map((master, i) => (
                <div key={master.master_name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{master.master_name}</p>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{master.count} зап.</span>
                        <span className="text-xs font-semibold text-green-700">{master.completion_rate.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarDisplay rating={master.avg_rating} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client segments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Сегменты клиентов</h2>
          {segmentsQ.data && (
            <span className="text-xs text-gray-500">
              Всего: <strong>{segmentsQ.data.total}</strong> клиентов
            </span>
          )}
        </div>
        {segmentsQ.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !segmentsQ.data || segmentsQ.data.total === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            Нет данных о клиентах
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {SEGMENT_CONFIG.map(({ key, label, desc, color }) => {
              const count = segmentsQ.data[key]
              const pct = segmentsQ.data.total > 0
                ? Math.round((count / segmentsQ.data.total) * 100)
                : 0
              return (
                <div key={key} className={cn('rounded-xl border p-4 text-center', color)}>
                  <p className="text-2xl font-bold mb-0.5">{count}</p>
                  <p className="text-xs font-semibold mb-1">{label}</p>
                  <p className="text-xs opacity-70">{desc}</p>
                  <p className="text-xs font-medium mt-1">{pct}%</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Booking heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Загруженность по часам</h2>
        </div>
        <HeatmapGrid data={heatmapQ.data} isLoading={heatmapQ.isLoading} />
      </div>
    </div>
  )
}
