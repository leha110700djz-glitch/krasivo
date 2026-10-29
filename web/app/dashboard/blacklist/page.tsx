'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldOff, Plus, Trash2, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'

interface BlacklistEntry {
  id: string
  salon_id: string
  client_user_id?: string
  client_phone?: string
  client_name?: string
  reason?: string
  added_by_user_id?: string
  created_at: string
}

interface BlacklistAdd {
  client_phone?: string
  client_name?: string
  reason?: string
}

const emptyForm: BlacklistAdd = {
  client_phone: '',
  client_name: '',
  reason: '',
}

export default function BlacklistPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BlacklistAdd>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data: entries = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ['blacklist'],
    queryFn: async () => {
      const res = await api.get('/blacklist')
      return res.data
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: BlacklistAdd) => {
      await api.post('/blacklist', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blacklist'] })
      setShowForm(false)
      setForm(emptyForm)
      setFormError('')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(typeof msg === 'string' ? msg : 'Ошибка добавления')
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/blacklist/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blacklist'] }),
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_phone) {
      setFormError('Введите номер телефона')
      return
    }
    setFormError('')
    addMutation.mutate({
      client_phone: form.client_phone || undefined,
      client_name: form.client_name || undefined,
      reason: form.reason || undefined,
    })
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Чёрный список</h1>
          <p className="text-gray-500 text-sm mt-1">Клиенты, которым закрыта запись в ваш салон</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={16} />
          Добавить
          <ChevronDown size={14} className={`transition-transform ${showForm ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Добавить в чёрный список</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                <input
                  type="tel"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя клиента</label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Иван Иванов"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Причина</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Опишите причину блокировки..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors resize-none"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{formError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
              <Button type="submit" loading={addMutation.isPending}>
                Добавить
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldOff size={16} className="text-amber-600" />
          </div>
          <p className="text-amber-800 text-xs">
            Клиенты из этого списка не смогут записаться в ваш салон через платформу Красиво.
            При попытке записи они получат отказ.
          </p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Чёрный список пуст</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Добавьте клиентов, которым хотите закрыть доступ к записи
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <ShieldOff size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {entry.client_name || 'Без имени'}
                  </span>
                  {entry.client_phone && (
                    <span className="text-xs text-gray-500 font-mono">{entry.client_phone}</span>
                  )}
                </div>
                {entry.reason && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.reason}</p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(entry.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <button
                onClick={() => removeMutation.mutate(entry.id)}
                disabled={removeMutation.isPending}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                title="Удалить из чёрного списка"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
