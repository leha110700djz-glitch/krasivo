'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Check, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useDashboardMasters } from '@/hooks/useMaster'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkShift {
  id: string
  master_id: string
  salon_id: string
  shift_date: string
  start_time: string
  end_time: string
  is_day_off: boolean
  note?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function weekStart(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  const dow = copy.getDay() // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow
  copy.setDate(copy.getDate() + diff)
  return copy
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatWeekLabel(mon: Date, sun: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${mon.toLocaleDateString('ru-RU', opts)} — ${sun.toLocaleDateString('ru-RU', opts)}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ModalState {
  masterId: string
  date: string
  shift?: WorkShift
}

interface FormState {
  start_time: string
  end_time: string
  is_day_off: boolean
  note: string
}

export default function SchedulePage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const { data: masters, isLoading: mastersLoading } = useDashboardMasters()

  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState<FormState>({
    start_time: '10:00',
    end_time: '20:00',
    is_day_off: false,
    note: '',
  })

  // ── Week dates ───────────────────────────────────────────────────────────────
  const today = useMemo(() => new Date(), [])
  const monday = useMemo(() => addDays(weekStart(today), weekOffset * 7), [today, weekOffset])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday])
  const startDate = toISO(monday)
  const endDate = toISO(weekDays[6])
  const todayISO = toISO(today)

  // ── Fetch shifts ─────────────────────────────────────────────────────────────
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', startDate, endDate],
    queryFn: () => api.get<WorkShift[]>('/shifts', token!, { start_date: startDate, end_date: endDate }),
    enabled: !!token,
  })

  // Build lookup: master_id → date → shift
  const shiftMap = useMemo(() => {
    const map: Record<string, Record<string, WorkShift>> = {}
    for (const s of shifts) {
      if (!map[s.master_id]) map[s.master_id] = {}
      map[s.master_id][s.shift_date] = s
    }
    return map
  }, [shifts])

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shifts'] })

  const upsertMutation = useMutation({
    mutationFn: (data: object) => api.post<WorkShift>('/shifts', data, token!),
    onSuccess: () => { invalidate(); setModal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`, token!),
    onSuccess: () => { invalidate(); setModal(null) },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openModal = (masterId: string, date: string) => {
    const shift = shiftMap[masterId]?.[date]
    setModal({ masterId, date, shift })
    setForm(shift
      ? { start_time: shift.start_time.substring(0, 5), end_time: shift.end_time.substring(0, 5), is_day_off: shift.is_day_off, note: shift.note || '' }
      : { start_time: '10:00', end_time: '20:00', is_day_off: false, note: '' }
    )
  }

  const handleSave = () => {
    if (!modal) return
    upsertMutation.mutate({
      master_id: modal.masterId,
      shift_date: modal.date,
      start_time: form.start_time,
      end_time: form.end_time,
      is_day_off: form.is_day_off,
      note: form.note || null,
    })
  }

  const handleDelete = () => {
    if (!modal?.shift) return
    deleteMutation.mutate(modal.shift.id)
  }

  const modalDateLabel = modal
    ? new Date(modal.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  const isCurrentWeek = weekOffset === 0
  const isLoading = mastersLoading || shiftsLoading

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Смены</h1>
          <p className="text-gray-500 mt-1 text-sm">Планирование рабочих смен мастеров по дням</p>
        </div>
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            aria-label="Предыдущая неделя"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
              isCurrentWeek
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            Сегодня
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            aria-label="Следующая неделя"
          >
            <ChevronRight size={18} />
          </button>
          <span className="ml-1 text-sm font-medium text-gray-600 hidden sm:block">
            {formatWeekLabel(monday, weekDays[6])}
          </span>
        </div>
      </div>

      {/* Mobile week label */}
      <p className="text-sm text-gray-500 mb-4 sm:hidden">{formatWeekLabel(monday, weekDays[6])}</p>

      {/* Week grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header row */}
          <div
            className="grid border-b border-gray-100 bg-gray-50"
            style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}
          >
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Мастер
            </div>
            {weekDays.map((d, i) => {
              const isToday = toISO(d) === todayISO
              return (
                <div
                  key={i}
                  className={`px-2 py-3 text-center border-l border-gray-100 ${
                    isToday ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-primary-600' : 'text-gray-400'}`}>
                    {DAY_LABELS[i]}
                  </div>
                  <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Master rows */}
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Загрузка...</div>
          ) : masters && masters.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {masters.map((master) => (
                <div
                  key={master.id}
                  className="grid hover:bg-gray-50/30 transition-colors"
                  style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}
                >
                  {/* Master name */}
                  <div className="px-4 py-3 flex items-center gap-2.5 border-r border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                      {master.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate" title={master.name}>
                      {master.name.split(' ')[0]}
                    </span>
                  </div>

                  {/* Day cells */}
                  {weekDays.map((d, i) => {
                    const dateStr = toISO(d)
                    const shift = shiftMap[String(master.id)]?.[dateStr]
                    const isToday = dateStr === todayISO

                    let cellBg = 'hover:bg-primary-50/50'
                    if (shift) {
                      cellBg = shift.is_day_off
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-green-50/60 hover:bg-green-50'
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => openModal(String(master.id), dateStr)}
                        className={`px-1 py-2 border-l border-gray-50 transition-colors min-h-[58px] flex flex-col items-center justify-center gap-0.5 ${cellBg} ${isToday ? 'ring-1 ring-inset ring-primary-300' : ''}`}
                        title={shift ? (shift.is_day_off ? 'Выходной — нажмите для изменения' : `${shift.start_time.substring(0,5)}–${shift.end_time.substring(0,5)}`) : 'Не запланировано — нажмите, чтобы добавить'}
                      >
                        {shift ? (
                          shift.is_day_off ? (
                            <span className="text-[11px] text-gray-400 font-medium leading-tight">Выходной</span>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-green-700 leading-tight">
                                {shift.start_time.substring(0, 5)}
                              </span>
                              <span className="text-[10px] text-green-500 leading-none">—</span>
                              <span className="text-xs font-bold text-green-700 leading-tight">
                                {shift.end_time.substring(0, 5)}
                              </span>
                            </>
                          )
                        ) : (
                          <span className="text-lg text-gray-200 leading-none">+</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">
              Нет мастеров. Добавьте мастеров в разделе «Мастера».
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-200 inline-block" />
          Рабочая смена
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200 inline-block" />
          Выходной
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-gray-200 inline-block" />
          Не запланировано
        </div>
        <span className="text-gray-400">Нажмите на ячейку, чтобы изменить смену</span>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 capitalize">{modalDateLabel}</h3>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 ml-2 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Day off toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_day_off}
                  onClick={() => setForm((f) => ({ ...f, is_day_off: !f.is_day_off }))}
                  className={`relative w-10 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300`}
                  style={{
                    height: 22,
                    backgroundColor: form.is_day_off ? '#6b7280' : '#d1d5db',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: form.is_day_off ? 20 : 2,
                      width: 18,
                      height: 18,
                      background: 'white',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      transition: 'left 0.15s',
                    }}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">Выходной день</span>
              </label>

              {!form.is_day_off && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Начало смены
                    </label>
                    <select
                      value={form.start_time}
                      onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Конец смены
                    </label>
                    <select
                      value={form.end_time}
                      onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Заметка <span className="text-gray-400 font-normal">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Например: сокращённый день"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-6">
              {modal.shift && (
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="p-2.5 text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                  title="Удалить смену"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={upsertMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check size={15} />
                Сохранить
              </button>
            </div>

            {(upsertMutation.isError || deleteMutation.isError) && (
              <p className="mt-3 text-xs text-red-600 text-center">
                Ошибка. Попробуйте ещё раз.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
