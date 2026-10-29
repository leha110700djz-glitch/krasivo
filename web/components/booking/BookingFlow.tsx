'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronRight, Calendar, Clock, User, Scissors, Tag, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { useSalonServices } from '@/hooks/useServices'
import { useSalonMasters } from '@/hooks/useMaster'
import { useMasterSlots, useCreateBooking } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, formatDuration } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Service, Master } from '@/types'

interface PromoResult {
  valid: boolean
  code: string
  title: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  discount_amount?: number
  final_price?: number
  message: string
}

interface CertificateResult {
  valid: boolean
  code: string
  title: string
  remaining_amount?: number
  message: string
}

const confirmSchema = z.object({
  client_name: z.string().min(2, 'Введите имя'),
  client_phone: z.string().min(10, 'Введите телефон'),
  notes: z.string().optional(),
})

interface BookingFlowProps {
  salonId: number
  masterId?: number | null
  onSuccess?: () => void
}

const STEPS = ['Услуга', 'Мастер', 'Дата и время', 'Подтверждение']

export default function BookingFlow({ salonId, masterId: preselectedMasterId, onSuccess }: BookingFlowProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const promoInputRef = useRef<HTMLInputElement>(null)
  const [certCode, setCertCode] = useState('')
  const [certResult, setCertResult] = useState<CertificateResult | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [certError, setCertError] = useState('')

  const { data: services } = useSalonServices(salonId)
  const { data: masters } = useSalonMasters(salonId)
  const { data: slots } = useMasterSlots(
    selectedMaster?.id || '',
    selectedDate,
    selectedService?.id || ''
  )
  const createBooking = useCreateBooking()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      client_name: user?.name || '',
      client_phone: user?.phone || '',
      notes: '',
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <User size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Войдите для записи</h3>
        <p className="text-gray-500 mb-6">Чтобы записаться, необходимо авторизоваться</p>
        <Button onClick={() => router.push('/login')}>Войти или зарегистрироваться</Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Запись создана!</h3>
        <p className="text-gray-500 mb-2">
          <strong>{selectedService?.name}</strong> · {selectedDate && format(parseISO(selectedDate), 'd MMMM', { locale: ru })} · {selectedTime}
        </p>
        {selectedMaster && (
          <p className="text-gray-500 mb-6">Мастер: {selectedMaster.name}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/profile')}>Мои записи</Button>
          <Button variant="outline" onClick={onSuccess}>Закрыть</Button>
        </div>
      </div>
    )
  }

  // Step indicators
  const StepIndicator = () => (
    <div className="flex items-center mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < step
                  ? 'bg-primary-700 text-white'
                  : i === step
                  ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className="text-xs text-gray-500 mt-1 hidden sm:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary-600' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  )

  // Step 0: Choose service
  if (step === 0) {
    return (
      <div>
        <StepIndicator />
        <h3 className="font-semibold text-gray-900 mb-4">Выберите услугу</h3>
        {services && services.length > 0 ? (
          <div className="space-y-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service); setStep(1) }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  selectedService?.id === service.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-100 hover:border-primary-300'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={13} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{formatDuration(service.duration_minutes)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary-700">{formatPrice(service.price)}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">Услуги не найдены</p>
        )}
      </div>
    )
  }

  // Step 1: Choose master
  if (step === 1) {
    return (
      <div>
        <StepIndicator />
        <h3 className="font-semibold text-gray-900 mb-4">Выберите мастера</h3>
        {masters && masters.length > 0 ? (
          <div className="space-y-2">
            {masters.map((master) => (
              <button
                key={master.id}
                onClick={() => { setSelectedMaster(master); setStep(2) }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMaster?.id === master.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-100 hover:border-primary-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <User size={20} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{master.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {master.specializations?.slice(0, 2).join(', ')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">Мастера не найдены</p>
        )}
        <Button variant="ghost" className="mt-4" onClick={() => setStep(0)}>
          Назад
        </Button>
      </div>
    )
  }

  // Step 2: Choose date & time
  if (step === 2) {
    const today = new Date()
    const dates = Array.from({ length: 14 }).map((_, i) => addDays(today, i + 1))

    return (
      <div>
        <StepIndicator />
        <h3 className="font-semibold text-gray-900 mb-4">Выберите дату и время</h3>

        {/* Date selection */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {dates.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={dateStr}
                onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
                className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-100 hover:border-primary-300 text-gray-600'
                }`}
              >
                <span className="text-xs capitalize">{format(date, 'EEE', { locale: ru })}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM', { locale: ru })}</span>
              </button>
            )
          })}
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Доступное время</p>
            {slots && slots.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map(({ time, available }) => (
                  <button
                    key={time}
                    disabled={!available}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      !available
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedTime === time
                        ? 'bg-primary-700 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {time.substring(0, 5)}
                  </button>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-primary-700 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => setStep(1)}>Назад</Button>
          <Button
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(3)}
          >
            Далее
          </Button>
        </div>
      </div>
    )
  }

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const price = selectedService?.price
      const params = new URLSearchParams()
      if (price) params.set('price', String(price))
      if (salonId) params.set('salon_id', String(salonId))
      const res = await api.get<PromoResult>(`/promos/check/${code}?${params.toString()}`)
      if (res.data.valid) {
        setPromoResult(res.data)
        setPromoError('')
      } else {
        setPromoResult(null)
        setPromoError(res.data.message)
      }
    } catch {
      setPromoError('Не удалось проверить промокод')
      setPromoResult(null)
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromo = () => {
    setPromoResult(null)
    setPromoCode('')
    setPromoError('')
  }

  const applyCertificate = async () => {
    const code = certCode.trim().toUpperCase()
    if (!code) return
    setCertLoading(true)
    setCertError('')
    try {
      const res = await api.get<CertificateResult>(`/certificates/check/${code}`)
      if (res.data.valid) {
        setCertResult(res.data)
        setCertError('')
      } else {
        setCertResult(null)
        setCertError(res.data.message)
      }
    } catch {
      setCertError('Не удалось проверить сертификат')
      setCertResult(null)
    } finally {
      setCertLoading(false)
    }
  }

  const removeCertificate = () => {
    setCertResult(null)
    setCertCode('')
    setCertError('')
  }

  // Step 3: Confirmation
  const onSubmit = async (data: { client_name: string; client_phone: string; notes?: string }) => {
    if (!selectedService || !selectedMaster || !selectedDate || !selectedTime) return
    setError('')
    try {
      await createBooking.mutateAsync({
        master_id: selectedMaster.id,
        service_id: selectedService.id,
        date: selectedDate,
        time_start: selectedTime,
        notes: data.notes,
        client_name: data.client_name,
        client_phone: data.client_phone,
        ...(promoResult?.valid && { promo_code: promoResult.code }),
        ...(certResult?.valid && { certificate_code: certResult.code }),
      })
      setSuccess(true)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Ошибка при создании записи. Попробуйте ещё раз.')
    }
  }

  return (
    <div>
      <StepIndicator />
      <h3 className="font-semibold text-gray-900 mb-4">Подтверждение записи</h3>

      {/* Summary */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-2">
        {selectedService && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <Scissors size={14} className="text-primary-500" />
              {selectedService.name}
            </span>
            <div className="text-right">
              {promoResult?.discount_amount ? (
                <>
                  <span className="text-gray-400 line-through text-xs mr-1">{formatPrice(selectedService.price)}</span>
                  <span className="font-semibold text-green-600">{formatPrice(promoResult.final_price ?? selectedService.price)}</span>
                </>
              ) : (
                <span className="font-semibold text-primary-700">{formatPrice(selectedService.price)}</span>
              )}
            </div>
          </div>
        )}
        {selectedMaster && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={14} className="text-primary-500" />
            {selectedMaster.name}
          </div>
        )}
        {selectedDate && selectedTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-primary-500" />
            {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: ru })} в {selectedTime}
          </div>
        )}
        {promoResult?.valid && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-green-700">
              <Tag size={12} />
              {promoResult.title}
            </span>
            <span className="text-xs font-medium text-green-600">
              -{promoResult.discount_type === 'percent' ? `${promoResult.discount_value}%` : formatPrice(promoResult.discount_value)}
            </span>
          </div>
        )}
      </div>

      {/* Promo code input */}
      <div className="mb-3">
        {promoResult?.valid ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-green-600" />
              <div>
                <p className="text-xs font-bold text-green-700 tracking-wider">{promoResult.code}</p>
                <p className="text-xs text-green-600">{promoResult.message}</p>
              </div>
            </div>
            <button onClick={removePromo} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary-400 transition-colors">
                <Tag size={15} className="text-gray-400 shrink-0" />
                <input
                  ref={promoInputRef}
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                  placeholder="Промокод (BEAUTY20, KRASIVO10...)"
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 uppercase"
                  maxLength={30}
                />
              </div>
              <button
                type="button"
                onClick={applyPromo}
                disabled={!promoCode.trim() || promoLoading}
                className="px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {promoLoading ? '...' : 'Применить'}
              </button>
            </div>
            {promoError && (
              <p className="text-xs text-red-600 mt-1.5 ml-1">{promoError}</p>
            )}
          </div>
        )}
      </div>

      {/* Gift certificate input */}
      <div className="mb-4">
        {certResult?.valid ? (
          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-purple-600" />
              <div>
                <p className="text-xs font-bold text-purple-700 tracking-wider">{certResult.code}</p>
                <p className="text-xs text-purple-600">
                  {certResult.message}
                  {certResult.remaining_amount !== undefined && ` · Доступно: ${certResult.remaining_amount} ₽`}
                </p>
              </div>
            </div>
            <button onClick={removeCertificate} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-purple-400 transition-colors">
                <Tag size={15} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={certCode}
                  onChange={(e) => setCertCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCertificate())}
                  placeholder="Подарочный сертификат"
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 uppercase"
                  maxLength={12}
                />
              </div>
              <button
                type="button"
                onClick={applyCertificate}
                disabled={!certCode.trim() || certLoading}
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {certLoading ? '...' : 'Применить'}
              </button>
            </div>
            {certError && (
              <p className="text-xs text-red-600 mt-1.5 ml-1">{certError}</p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Ваше имя"
          placeholder="Иван Иванов"
          error={errors.client_name?.message}
          {...register('client_name')}
        />
        <Input
          label="Телефон"
          placeholder="+7 (999) 123-45-67"
          type="tel"
          error={errors.client_phone?.message}
          {...register('client_phone')}
        />
        <Textarea
          label="Комментарий (необязательно)"
          placeholder="Пожелания к мастеру..."
          rows={2}
          {...register('notes')}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => setStep(2)}>Назад</Button>
          <Button type="submit" loading={createBooking.isPending} fullWidth>
            Подтвердить запись
          </Button>
        </div>
      </form>
    </div>
  )
}
