'use client'

import { useState, useEffect } from 'react'
import { Clock, Save, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDashboardMasters } from '@/hooks/useMaster'
import api from '@/lib/api'

const DAYS = [
  { key: 0, label: 'Пн', full: 'Понедельник' },
  { key: 1, label: 'Вт', full: 'Вторник' },
  { key: 2, label: 'Ср', full: 'Среда' },
  { key: 3, label: 'Чт', full: 'Четверг' },
  { key: 4, label: 'Пт', full: 'Пятница' },
  { key: 5, label: 'Сб', full: 'Суббота' },
  { key: 6, label: 'Вс', full: 'Воскресенье' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0')
  return { value: `${h}:00`, label: `${h}:00` }
})

interface DaySchedule {
  day_of_week: number
  is_working: boolean
  start_time: string
  end_time: string
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((d) => ({
  day_of_week: d.key,
  is_working: d.key < 5,
  start_time: '10:00',
  end_time: '20:00',
}))

export default function SchedulePage() {
  const { data: masters, isLoading: mastersLoading } = useDashboardMasters()
  const [selectedMasterId, setSelectedMasterId] = useState<string>('')
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Auto-select first master
  useEffect(() => {
    if (masters && masters.length > 0 && !selectedMasterId) {
      setSelectedMasterId(String(masters[0].id))
    }
  }, [masters, selectedMasterId])

  // Load schedule when master changes
  useEffect(() => {
    if (!selectedMasterId) return
    setLoading(true)
    setError('')
    api.get<DaySchedule[]>(`/masters/${selectedMasterId}/schedule`)
      .then((res) => {
        const data = res.data
        if (data && data.length > 0) {
          // Merge with defaults for any missing days
          const merged = DAYS.map((d) => {
            const found = data.find((s) => s.day_of_week === d.key)
            return found
              ? { day_of_week: d.key, is_working: found.is_working, start_time: found.start_time.substring(0, 5), end_time: found.end_time.substring(0, 5) }
              : { day_of_week: d.key, is_working: d.key < 5, start_time: '10:00', end_time: '20:00' }
          })
          setSchedule(merged)
        } else {
          setSchedule(DEFAULT_SCHEDULE)
        }
      })
      .catch(() => setSchedule(DEFAULT_SCHEDULE))
      .finally(() => setLoading(false))
  }, [selectedMasterId])

  const toggleDay = (dayKey: number) => {
    setSchedule((prev) =>
      prev.map((s) => s.day_of_week === dayKey ? { ...s, is_working: !s.is_working } : s)
    )
  }

  const setTime = (dayKey: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule((prev) =>
      prev.map((s) => s.day_of_week === dayKey ? { ...s, [field]: value } : s)
    )
  }

  const handleSave = async () => {
    if (!selectedMasterId) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.put(`/masters/${selectedMasterId}/schedule`, { schedule })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Не удалось сохранить расписание. Попробуйте ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const copyToAll = (sourceDay: number) => {
    const src = schedule.find((s) => s.day_of_week === sourceDay)
    if (!src) return
    setSchedule((prev) =>
      prev.map((s) =>
        s.day_of_week !== sourceDay && s.is_working
          ? { ...s, start_time: src.start_time, end_time: src.end_time }
          : s
      )
    )
  }

  const selectedMaster = masters?.find((m) => String(m.id) === selectedMasterId)
  const workingDays = schedule.filter((s) => s.is_working).length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Расписание</h1>
          <p className="text-gray-500 mt-1 text-sm">Настройте рабочие часы для каждого мастера</p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={!selectedMasterId}>
          <Save size={16} />
          Сохранить
        </Button>
      </div>

      {/* Master selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Выберите мастера</label>
        {mastersLoading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-32 rounded-xl" />)}
          </div>
        ) : masters && masters.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {masters.map((master) => (
              <button
                key={master.id}
                onClick={() => setSelectedMasterId(String(master.id))}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  selectedMasterId === String(master.id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                  {master.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{master.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{(master.specializations || []).slice(0, 2).join(', ') || 'Мастер'}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Нет мастеров. Добавьте мастеров в разделе «Мастера».</p>
        )}
      </div>

      {/* Schedule grid */}
      {selectedMasterId && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={15} className="text-primary-600" />
              <span>{selectedMaster?.name} — <strong>{workingDays} рабочих дней</strong></span>
            </div>
            {saved && (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle size={15} />
                Расписание сохранено
              </div>
            )}
            {error && (
              <div className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={15} />
                {error}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[140px_1fr_1fr_auto] gap-0 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div>День</div>
              <div>Начало</div>
              <div>Конец</div>
              <div className="w-24">Действие</div>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50">
                {DAYS.map((d) => (
                  <div key={d.key} className="px-5 py-4">
                    <Skeleton className="h-10 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {schedule.map((daySchedule) => {
                  const day = DAYS.find((d) => d.key === daySchedule.day_of_week)!
                  const isWeekend = daySchedule.day_of_week >= 5
                  return (
                    <div
                      key={daySchedule.day_of_week}
                      className={`grid grid-cols-[140px_1fr_1fr_auto] gap-4 px-5 py-4 items-center transition-colors ${
                        !daySchedule.is_working ? 'bg-gray-50/50 opacity-70' : ''
                      }`}
                    >
                      {/* Day toggle */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleDay(daySchedule.day_of_week)}
                          className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none ${
                            daySchedule.is_working ? 'bg-primary-600' : 'bg-gray-200'
                          }`}
                          style={{ height: '22px' }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                              daySchedule.is_working ? 'translate-x-4.5' : ''
                            }`}
                            style={{ width: '18px', height: '18px', transform: daySchedule.is_working ? 'translateX(18px)' : 'translateX(0)' }}
                          />
                        </button>
                        <div>
                          <p className={`text-sm font-medium ${daySchedule.is_working ? 'text-gray-900' : 'text-gray-400'}`}>
                            {day.full}
                          </p>
                          {isWeekend && (
                            <p className="text-xs text-gray-400">Выходной</p>
                          )}
                        </div>
                      </div>

                      {/* Start time */}
                      <select
                        value={daySchedule.start_time}
                        onChange={(e) => setTime(daySchedule.day_of_week, 'start_time', e.target.value)}
                        disabled={!daySchedule.is_working}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                      >
                        {HOURS.map((h) => (
                          <option key={h.value} value={h.value}>{h.label}</option>
                        ))}
                      </select>

                      {/* End time */}
                      <select
                        value={daySchedule.end_time}
                        onChange={(e) => setTime(daySchedule.day_of_week, 'end_time', e.target.value)}
                        disabled={!daySchedule.is_working}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                      >
                        {HOURS.map((h) => (
                          <option key={h.value} value={h.value}>{h.label}</option>
                        ))}
                      </select>

                      {/* Copy action */}
                      {daySchedule.is_working && (
                        <button
                          onClick={() => copyToAll(daySchedule.day_of_week)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium whitespace-nowrap px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors w-24 text-center"
                        >
                          Скопировать
                        </button>
                      )}
                      {!daySchedule.is_working && <div className="w-24" />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div className="mt-5 flex flex-wrap gap-3">
            <p className="text-sm text-gray-500 self-center mr-1">Быстрые шаблоны:</p>
            <button
              onClick={() => setSchedule(DAYS.map((d) => ({ day_of_week: d.key, is_working: d.key < 5, start_time: '09:00', end_time: '18:00' }))}
              className="text-sm bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 px-4 py-2 rounded-xl transition-colors"
            >
              Пн-Пт 9:00–18:00
            </button>
            <button
              onClick={() => setSchedule(DAYS.map((d) => ({ day_of_week: d.key, is_working: d.key < 6, start_time: '10:00', end_time: '20:00' }))}
              className="text-sm bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 px-4 py-2 rounded-xl transition-colors"
            >
              Пн-Сб 10:00–20:00
            </button>
            <button
              onClick={() => setSchedule(DAYS.map((d) => ({ day_of_week: d.key, is_working: true, start_time: '10:00', end_time: '22:00' }))}
              className="text-sm bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 px-4 py-2 rounded-xl transition-colors"
            >
              Ежедневно 10:00–22:00
            </button>
          </div>
        </>
      )}
    </div>
  )
}
