'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gift, Plus, Copy, Check, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'

interface Certificate {
  id: string
  code: string
  title: string
  original_amount: string
  remaining_amount: string
  recipient_name?: string
  recipient_email?: string
  message?: string
  expires_at?: string
  is_active: boolean
  created_at: string
  used_at?: string
}

interface CertificateCreate {
  title: string
  amount: number
  recipient_name?: string
  recipient_email?: string
  message?: string
  expires_at?: string
}

function formatRub(amount: string | number) {
  return `${Number(amount).toLocaleString('ru-RU')} ₽`
}

function getStatus(cert: Certificate): { label: string; cls: string } {
  if (!cert.is_active || Number(cert.remaining_amount) <= 0) {
    return { label: 'Использован', cls: 'bg-gray-100 text-gray-500' }
  }
  if (cert.expires_at && new Date(cert.expires_at) < new Date()) {
    return { label: 'Истёк', cls: 'bg-red-100 text-red-600' }
  }
  return { label: 'Активен', cls: 'bg-green-100 text-green-700' }
}

function CopyButton({ text, title }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
      title={title || 'Скопировать'}
    >
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
    </button>
  )
}

const emptyForm: CertificateCreate = {
  title: '',
  amount: 1000,
  recipient_name: '',
  recipient_email: '',
  message: '',
  expires_at: '',
}

export default function CertificatesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CertificateCreate>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data: certs = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ['certificates-mine'],
    queryFn: async () => {
      const res = await api.get('/certificates')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CertificateCreate) => {
      await api.post('/certificates', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificates-mine'] })
      setShowForm(false)
      setForm(emptyForm)
      setFormError('')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormError(typeof msg === 'string' ? msg : 'Ошибка создания сертификата')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.amount) {
      setFormError('Заполните обязательные поля')
      return
    }
    setFormError('')
    const payload: CertificateCreate = {
      ...form,
      expires_at: form.expires_at || undefined,
      recipient_name: form.recipient_name || undefined,
      recipient_email: form.recipient_email || undefined,
      message: form.message || undefined,
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Подарочные сертификаты</h1>
          <p className="text-gray-500 text-sm mt-1">Создавайте сертификаты для клиентов</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={16} />
          Создать
          <ChevronDown size={14} className={`transition-transform ${showForm ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Новый сертификат</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Подарок на день рождения"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  min={1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Срок действия до</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя получателя</label>
                <input
                  type="text"
                  value={form.recipient_name}
                  onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                  placeholder="Анна Иванова"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email получателя</label>
                <input
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
                  placeholder="anna@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Личное сообщение</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="С днём рождения! Пусть этот сертификат подарит тебе красоту и радость."
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
              <Button type="submit" loading={createMutation.isPending}>
                Создать сертификат
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Нет сертификатов</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Создайте первый подарочный сертификат для вашего клиента
          </p>
          <Button onClick={() => setShowForm(true)} className="inline-flex gap-2">
            <Plus size={16} />
            Создать сертификат
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert) => {
            const status = getStatus(cert)
            return (
              <div
                key={cert.id}
                className="bg-white border border-gray-200 rounded-2xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Gift size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm tracking-wider font-mono">
                        {cert.code}
                      </span>
                      <CopyButton text={cert.code} title="Скопировать код" />
                      <CopyButton
                        text={`https://krasivo.ru/gift/${cert.code}`}
                        title="Копировать ссылку"
                      />
                      <span className="text-xs text-gray-400">— Копировать ссылку</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm font-medium">{cert.title}</p>
                    {cert.recipient_name && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        Получатель: {cert.recipient_name}
                        {cert.recipient_email && ` · ${cert.recipient_email}`}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs">
                        <span className="text-gray-400">Номинал: </span>
                        <span className="font-semibold text-gray-700">{formatRub(cert.original_amount)}</span>
                      </span>
                      <span className="text-xs">
                        <span className="text-gray-400">Остаток: </span>
                        <span className={`font-semibold ${Number(cert.remaining_amount) > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                          {formatRub(cert.remaining_amount)}
                        </span>
                      </span>
                      {cert.expires_at && (
                        <span className="text-xs text-gray-400">
                          до {new Date(cert.expires_at).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
