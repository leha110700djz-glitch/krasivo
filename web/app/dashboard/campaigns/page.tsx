'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Trash2, Send, ChevronDown, Users } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useOwnerSalon } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  salon_id: string
  title: string
  body: string
  target_segment: string
  target_min_visits?: number | null
  scheduled_at?: string | null
  sent_at?: string | null
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  recipients_count: number
  created_at: string
}

interface CampaignCreate {
  salon_id: string
  title: string
  body: string
  target_segment: string
  target_min_visits?: number | null
  scheduled_at?: string | null
}

const SEGMENTS = [
  {
    value: 'all',
    label: 'Все клиенты',
    description: 'Все, кто хоть раз записывался',
  },
  {
    value: 'new',
    label: 'Новые',
    description: 'Ровно 1 визит',
  },
  {
    value: 'returning',
    label: 'Возвращающиеся',
    description: '2–5 визитов',
  },
  {
    value: 'loyal',
    label: 'Лояльные',
    description: '6 и более визитов',
  },
  {
    value: 'sleeping',
    label: 'Засыпающие',
    description: 'Последний визит > 60 дней назад',
  },
  {
    value: 'lost',
    label: 'Потерянные',
    description: 'Последний визит > 180 дней назад',
  },
]

const STATUS_CONFIG: Record<
  Campaign['status'],
  { label: string; className: string }
> = {
  draft: {
    label: 'Черновик',
    className: 'bg-gray-100 text-gray-600',
  },
  scheduled: {
    label: 'Запланирована',
    className: 'bg-blue-100 text-blue-700',
  },
  sent: {
    label: 'Отправлена',
    className: 'bg-green-100 text-green-700',
  },
  cancelled: {
    label: 'Отменена',
    className: 'bg-red-50 text-red-500',
  },
}

function segmentLabel(value: string) {
  return SEGMENTS.find((s) => s.value === value)?.label ?? value
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CampaignsPage() {
  const token = useAuthStore((s) => s.token)
  const { data: salon } = useOwnerSalon()
  const qc = useQueryClient()
  const salonId = salon?.id

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CampaignCreate, 'salon_id'>>({
    title: '',
    body: '',
    target_segment: 'all',
    target_min_visits: null,
    scheduled_at: null,
  })
  const [formError, setFormError] = useState('')
  const [sendNow, setSendNow] = useState(true)

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns', salonId],
    queryFn: () =>
      api.get<Campaign[]>('/campaigns', token!, { salon_id: salonId }),
    enabled: !!token && !!salonId,
  })

  const createMutation = useMutation({
    mutationFn: async (data: CampaignCreate) => {
      return api.post<Campaign>('/campaigns', data, token!)
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post<Campaign>(`/campaigns/${id}/send`, {}, token!)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', salonId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/${id}`, token!)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', salonId] })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim()) {
      setFormError('Укажите название рассылки')
      return
    }
    if (!form.body.trim()) {
      setFormError('Укажите текст сообщения')
      return
    }
    if (form.body.length > 1000) {
      setFormError('Текст сообщения слишком длинный (макс. 1000 символов)')
      return
    }
    if (!salonId) {
      setFormError('Не найден салон')
      return
    }

    const payload: CampaignCreate = {
      salon_id: salonId,
      title: form.title.trim(),
      body: form.body.trim(),
      target_segment: form.target_segment,
      target_min_visits: form.target_min_visits || null,
      scheduled_at: sendNow ? null : form.scheduled_at,
    }

    try {
      const created = await createMutation.mutateAsync(payload)
      if (sendNow) {
        await sendMutation.mutateAsync(created.id)
      }
      qc.invalidateQueries({ queryKey: ['campaigns', salonId] })
      setShowForm(false)
      setForm({
        title: '',
        body: '',
        target_segment: 'all',
        target_min_visits: null,
        scheduled_at: null,
      })
      setSendNow(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(typeof msg === 'string' ? msg : 'Ошибка создания рассылки')
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Рассылки</h1>
          <p className="text-gray-500 text-sm mt-1">
            Push-уведомления для сегментов клиентов
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Создать рассылку
          <ChevronDown
            size={14}
            className={cn('transition-transform', showForm ? 'rotate-180' : '')}
          />
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Новая рассылка</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Акция для постоянных клиентов"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                maxLength={200}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст уведомления *
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Только для вас — скидка 20% на все услуги в ноябре! Запишитесь сейчас."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors resize-none"
                maxLength={1000}
              />
              <p className="text-right text-xs text-gray-400 mt-1">
                {form.body.length}/1000
              </p>
            </div>

            {/* Segment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сегмент получателей
              </label>
              <select
                value={form.target_segment}
                onChange={(e) => setForm({ ...form, target_segment: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors bg-white"
              >
                {SEGMENTS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label} — {seg.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Send time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время отправки
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSendNow(true)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                    sendNow
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                  )}
                >
                  Отправить сейчас
                </button>
                <button
                  type="button"
                  onClick={() => setSendNow(false)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                    !sendNow
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                  )}
                >
                  Запланировать
                </button>
              </div>
              {!sendNow && (
                <input
                  type="datetime-local"
                  value={form.scheduled_at ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_at: e.target.value || null })
                  }
                  className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              )}
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError('') }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || sendMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending || sendMutation.isPending ? (
                  <span>Отправка...</span>
                ) : (
                  <>
                    <Send size={15} />
                    {sendNow ? 'Отправить сейчас' : 'Запланировать'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone size={28} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Нет рассылок</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Создайте первую рассылку, чтобы сообщить клиентам об акциях и новостях
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Создать рассылку
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const statusCfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft
            return (
              <div
                key={campaign.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4"
              >
                {/* Icon */}
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone size={20} className="text-primary-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {campaign.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {campaign.body}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full',
                        statusCfg.className
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3">
                    {/* Segment */}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users size={11} />
                      {segmentLabel(campaign.target_segment)}
                    </span>

                    {/* Delivered count */}
                    {campaign.status === 'sent' && (
                      <span className="text-xs text-green-600 font-medium">
                        Доставлено {campaign.recipients_count} клиентам
                      </span>
                    )}

                    {/* Scheduled at */}
                    {campaign.status === 'scheduled' && campaign.scheduled_at && (
                      <span className="text-xs text-blue-600">
                        {formatDatetime(campaign.scheduled_at)}
                      </span>
                    )}

                    {/* Sent at */}
                    {campaign.sent_at && (
                      <span className="text-xs text-gray-400">
                        {formatDatetime(campaign.sent_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                    <button
                      onClick={() => sendMutation.mutate(campaign.id)}
                      disabled={sendMutation.isPending}
                      title="Отправить сейчас"
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                    >
                      <Send size={15} />
                    </button>
                  )}
                  {campaign.status !== 'sent' && (
                    <button
                      onClick={() => deleteMutation.mutate(campaign.id)}
                      disabled={deleteMutation.isPending}
                      title="Удалить"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
