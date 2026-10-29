'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useDashboardMasters } from '@/hooks/useMaster'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Edit3,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MasterSalaryReport {
  master_id: string
  master_name: string
  rule_type: string
  base_salary: number
  bonus: number
  total: number
  bookings_count: number
  revenue_generated: number
}

interface SalaryRule {
  id: string
  master_id: string
  salon_id: string
  rule_type: string
  fixed_amount: number | null
  revenue_percent: number | null
  per_booking_amount: number | null
  bonus_threshold: number | null
  bonus_percent: number | null
  master_name: string | null
}

interface RuleForm {
  rule_type: string
  fixed_amount: string
  revenue_percent: string
  per_booking_amount: string
  bonus_threshold: string
  bonus_percent: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ruleTypeLabel(type: string): string {
  switch (type) {
    case 'fixed': return 'Фиксированная ставка'
    case 'percent_revenue': return '% от выручки'
    case 'per_booking': return 'За запись'
    default: return type
  }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function lastDayOfMonth(year: number, month: number): string {
  const last = new Date(year, month + 1, 0)
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
}

function defaultRuleForm(rule?: SalaryRule): RuleForm {
  return {
    rule_type: rule?.rule_type ?? 'percent_revenue',
    fixed_amount: rule?.fixed_amount != null ? String(rule.fixed_amount) : '',
    revenue_percent: rule?.revenue_percent != null ? String(rule.revenue_percent) : '40',
    per_booking_amount: rule?.per_booking_amount != null ? String(rule.per_booking_amount) : '',
    bonus_threshold: rule?.bonus_threshold != null ? String(rule.bonus_threshold) : '',
    bonus_percent: rule?.bonus_percent != null ? String(rule.bonus_percent) : '',
  }
}

// ── Salary Report Card ────────────────────────────────────────────────────────

function MasterSalaryCard({ report }: { report: MasterSalaryReport }) {
  const initials = report.master_name.charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{report.master_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{ruleTypeLabel(report.rule_type)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatMoney(report.total)}</p>
          {report.bonus > 0 && (
            <p className="text-xs text-green-600 font-medium">
              + {formatMoney(report.bonus)} бонус
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-400">Записей</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{report.bookings_count}</p>
        </div>
        <div className="text-center border-l border-r border-gray-50">
          <p className="text-xs text-gray-400">Выручка</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatMoney(report.revenue_generated)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">База</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatMoney(report.base_salary)}</p>
        </div>
      </div>
    </div>
  )
}

// ── Edit Rule Modal ───────────────────────────────────────────────────────────

interface EditRuleModalProps {
  masterId: string
  masterName: string
  existingRule?: SalaryRule
  onClose: () => void
  onSave: (data: object) => void
  isSaving: boolean
}

function EditRuleModal({ masterId, masterName, existingRule, onClose, onSave, isSaving }: EditRuleModalProps) {
  const [form, setForm] = useState<RuleForm>(defaultRuleForm(existingRule))

  const set = (field: keyof RuleForm, val: string) => setForm((f) => ({ ...f, [field]: val }))

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      master_id: masterId,
      rule_type: form.rule_type,
    }
    if (form.rule_type === 'fixed') {
      payload.fixed_amount = parseFloat(form.fixed_amount) || 0
    } else if (form.rule_type === 'percent_revenue') {
      payload.revenue_percent = parseFloat(form.revenue_percent) || 40
    } else if (form.rule_type === 'per_booking') {
      payload.per_booking_amount = parseFloat(form.per_booking_amount) || 0
    }
    if (form.bonus_threshold) payload.bonus_threshold = parseFloat(form.bonus_threshold)
    if (form.bonus_percent) payload.bonus_percent = parseFloat(form.bonus_percent)
    onSave(payload)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Настройка зарплаты</h3>
            <p className="text-sm text-gray-500 mt-0.5">{masterName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Rule type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип начисления</label>
            <div className="grid grid-cols-3 gap-2">
              {(['fixed', 'percent_revenue', 'per_booking'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('rule_type', type)}
                  className={`px-3 py-2.5 text-xs font-medium rounded-xl border-2 text-center transition-colors ${
                    form.rule_type === type
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {type === 'fixed' ? 'Фиксированная' : type === 'percent_revenue' ? '% от выручки' : 'За запись'}
                </button>
              ))}
            </div>
          </div>

          {/* Rule-specific field */}
          {form.rule_type === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Оклад в месяц (₽)
              </label>
              <input
                type="number"
                min="0"
                value={form.fixed_amount}
                onChange={(e) => set('fixed_amount', e.target.value)}
                placeholder="Например: 50000"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          )}

          {form.rule_type === 'percent_revenue' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Процент от выручки (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.revenue_percent}
                onChange={(e) => set('revenue_percent', e.target.value)}
                placeholder="Например: 40"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          )}

          {form.rule_type === 'per_booking' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Сумма за запись (₽)
              </label>
              <input
                type="number"
                min="0"
                value={form.per_booking_amount}
                onChange={(e) => set('per_booking_amount', e.target.value)}
                placeholder="Например: 500"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          )}

          {/* Bonus settings */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Бонус{' '}
              <span className="text-gray-400 font-normal">(необязательно)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Порог выручки (₽)</label>
                <input
                  type="number"
                  min="0"
                  value={form.bonus_threshold}
                  onChange={(e) => set('bonus_threshold', e.target.value)}
                  placeholder="Например: 100000"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Бонус % от превышения</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.bonus_percent}
                  onChange={(e) => set('bonus_percent', e.target.value)}
                  placeholder="Например: 10"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            {form.bonus_threshold && form.bonus_percent && (
              <p className="text-xs text-gray-400 mt-2">
                При выручке свыше {form.bonus_threshold} ₽ начисляется {form.bonus_percent}% от суммы превышения
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check size={15} />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SalaryPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const { data: masters } = useDashboardMasters()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [editingMaster, setEditingMaster] = useState<{ id: string; name: string } | null>(null)

  const startDate = firstDayOfMonth(year, month)
  const endDate = lastDayOfMonth(year, month)

  // Salary report
  const { data: report = [], isLoading: reportLoading } = useQuery({
    queryKey: ['salary-report', startDate, endDate],
    queryFn: () =>
      api.get<MasterSalaryReport[]>('/salary/report', token!, {
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: !!token,
  })

  // Salary rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['salary-rules'],
    queryFn: () => api.get<SalaryRule[]>('/salary/rules', token!),
    enabled: !!token,
  })

  const rulesMap: Record<string, SalaryRule> = {}
  for (const r of rules) {
    rulesMap[r.master_id] = r
  }

  // Upsert rule mutation
  const upsertRule = useMutation({
    mutationFn: (data: object) => api.post<SalaryRule>('/salary/rules', data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-rules'] })
      queryClient.invalidateQueries({ queryKey: ['salary-report'] })
      setEditingMaster(null)
    },
  })

  // Month navigation
  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }
  const goToCurrentMonth = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // Totals
  const totalSalary = report.reduce((s, r) => s + r.total, 0)
  const totalRevenue = report.reduce((s, r) => s + r.revenue_generated, 0)
  const totalBookings = report.reduce((s, r) => s + r.bookings_count, 0)

  const editingRule = editingMaster ? rulesMap[editingMaster.id] : undefined

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Зарплаты</h1>
          <p className="text-gray-500 mt-1 text-sm">Расчёт зарплат мастеров за период</p>
        </div>
        {/* Month picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToCurrentMonth}
            className={`px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
              isCurrentMonth
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            Сейчас
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronRight size={18} />
          </button>
          <span className="ml-1 text-sm font-medium text-gray-600 hidden sm:block capitalize">
            {monthLabel(year, month)}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6 sm:hidden capitalize">{monthLabel(year, month)}</p>

      {/* Summary stats */}
      {report.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Всего зарплат</p>
              <p className="text-sm font-bold text-gray-900">{formatMoney(totalSalary)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Общая выручка</p>
              <p className="text-sm font-bold text-gray-900">{formatMoney(totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Записей</p>
              <p className="text-sm font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>
      )}

      {/* Salary Report Section */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={17} className="text-primary-600" />
          Расчёт за период
        </h2>
        {reportLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-gray-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : report.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.map((r) => (
              <MasterSalaryCard key={r.master_id} report={r} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <DollarSign size={20} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Нет данных за выбранный период</p>
            <p className="text-gray-400 text-xs mt-1">Выполненные записи за этот месяц пока отсутствуют</p>
          </div>
        )}
      </div>

      {/* Salary Rules Section */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={17} className="text-primary-600" />
          Настройки зарплат
        </h2>

        {rulesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : masters && masters.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {masters.map((master) => {
                const rule = rulesMap[String(master.id)]
                return (
                  <div key={master.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                      {master.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{master.name}</p>
                      {rule ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ruleTypeLabel(rule.rule_type)}
                          {rule.rule_type === 'fixed' && rule.fixed_amount != null && ` · ${formatMoney(rule.fixed_amount)}/мес`}
                          {rule.rule_type === 'percent_revenue' && rule.revenue_percent != null && ` · ${rule.revenue_percent}%`}
                          {rule.rule_type === 'per_booking' && rule.per_booking_amount != null && ` · ${formatMoney(rule.per_booking_amount)}/запись`}
                          {rule.bonus_threshold != null && rule.bonus_percent != null && ` + бонус ${rule.bonus_percent}% > ${formatMoney(rule.bonus_threshold)}`}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">По умолчанию: 40% от выручки</p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingMaster({ id: String(master.id), name: master.name })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors shrink-0"
                    >
                      <Edit3 size={13} />
                      Изменить
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            Нет мастеров. Добавьте мастеров в разделе «Мастера».
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingMaster && (
        <EditRuleModal
          masterId={editingMaster.id}
          masterName={editingMaster.name}
          existingRule={editingRule}
          onClose={() => setEditingMaster(null)}
          onSave={(data) => upsertRule.mutate(data)}
          isSaving={upsertRule.isPending}
        />
      )}
    </div>
  )
}
