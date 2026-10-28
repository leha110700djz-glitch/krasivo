'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, Trash2, Copy, Check, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Promo {
  id: string
  code: string
  title: string
  description?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order: number
  max_uses?: number
  uses_count: number
  is_active: boolean
  expires_at?: string
}

interface PromoCreate {
  code: string
  title: string
  description?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order: number
  max_uses?: number
}

function formatDiscount(promo: Promo) {
  if (promo.discount_type === 'percent') return `${promo.discount_value}%`
  return `${(promo.discount_value / 100).toFixed(0)} ₽`
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1 text-gray-400 hover:text-primary-600 transition-colors" title="Скопировать код">
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
    </button>
  )
}

export default function PromosPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PromoCreate>({
    code: '',
    title: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    min_order: 0,
    max_uses: undefined,
  })
  const [formError, setFormError] = useState('')

  const { data: promos = [], isLoading } = useQuery<Promo[]>({
    queryKey: ['promos-mine'],
    queryFn: async () => {
      const res = await api.get('/promos/mine')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: PromoCreate) => {
      await api.post('/promos', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promos-mine'] })
      setShowForm(false)
      setForm({ code: '', title: '', description: '', discount_type: 'percent', discount_value: 10, min_order: 0 })
      setFormError('')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(typeof msg === 'string' ? msg : 'Ошибка создания промокода')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/promos/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promos-mine'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.title) { setFormError('Заполните обязательные поля'); return }
    setFormError('')
    const payload: PromoCreate = {
      ...form,
      code: form.code.toUpperCase(),
      min_order: (form.min_order || 0) * 100,
      discount_value: form.discount_type === 'fixed' ? form.discount_value * 100 : form.discount_value,
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Промокоды и акции</h1>
          <p className="text-gray-500 text-sm mt-1">Создавайте скидки для привлечения клиентов</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={16} />
          Создать
          <ChevronDown size={14} className={`transition-transform ${showForm ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Platform promo codes info */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <Tag size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Платформенные промокоды</p>
            <p className="text-gray-500 text-xs mt-1">
              Красиво автоматически применяет коды <span className="font-bold text-primary-700">BEAUTY20</span>, <span className="font-bold text-primary-700">KRASIVO10</span>, <span className="font-bold text-primary-700">FRIEND15</span> для всех салонов на платформе. Создайте собственные коды для вашего салона ниже.
            </p>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Новый промокод</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Код *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase tracking-wider font-bold outline-none focus:border-primary-400 transition-colors"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип скидки</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors bg-white"
                >
                  <option value="percent">Процент (%)</option>
                  <option value="fixed">Фиксированная (₽)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Летняя скидка 20%"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Краткое описание акции"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.discount_type === 'percent' ? 'Скидка (%)' : 'Скидка (₽)'}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                  min={1}
                  max={form.discount_type === 'percent' ? 99 : 10000}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Мин. сумма (₽)</label>
                <input
                  type="number"
                  value={form.min_order || ''}
                  onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })}
                  min={0}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Макс. использований</label>
                <input
                  type="number"
                  value={form.max_uses || ''}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : undefined })}
                  min={1}
                  placeholder="∞"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
              <Button type="submit" loading={createMutation.isPending}>Создать промокод</Button>
            </div>
          </form>
        </div>
      )}

      {/* Promos list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag size={28} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Нет промокодов</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Создайте первый промокод, чтобы привлечь новых клиентов
          </p>
          <Button onClick={() => setShowForm(true)} className="inline-flex gap-2">
            <Plus size={16} />
            Создать промокод
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`bg-white border rounded-2xl p-5 flex items-center gap-4 ${promo.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Tag size={20} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-gray-900 text-sm tracking-wider">{promo.code}</span>
                  <CopyButton code={promo.code} />
                  {!promo.is_active && (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">Деактивирован</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm truncate">{promo.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-primary-700 font-semibold bg-primary-50 px-2 py-0.5 rounded-full">
                    -{formatDiscount(promo)}
                  </span>
                  {promo.min_order > 0 && (
                    <span className="text-xs text-gray-400">от {promo.min_order / 100} ₽</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ''} использований
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(promo.id)}
                disabled={deleteMutation.isPending}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                title="Деактивировать"
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
