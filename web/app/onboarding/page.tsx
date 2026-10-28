'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Scissors,
  Store,
  Users,
  CheckCircle,
  ChevronRight,
  MapPin,
  Phone,
  Globe,
  Info,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import api from '@/lib/api'

const STEPS = [
  { id: 1, label: 'Салон', icon: Store, title: 'Расскажите о вашем салоне', sub: 'Основная информация' },
  { id: 2, label: 'Мастер', icon: Users, title: 'Добавьте первого мастера', sub: 'Необязательно — можно позже' },
  { id: 3, label: 'Готово', icon: CheckCircle, title: 'Салон готов!', sub: 'Вы в системе' },
]

// ── Step 1 schema ─────────────────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Введите название'),
  address: z.string().min(5, 'Введите адрес'),
  city: z.string().min(2, 'Введите город'),
  phone: z.string().optional(),
  website: z.string().url('Введите корректный URL').optional().or(z.literal('')),
  description: z.string().optional(),
})
type Step1Form = z.infer<typeof step1Schema>

// ── Step 2 schema ─────────────────────────────────────────────────────────────
const step2Schema = z.object({
  name: z.string().min(2, 'Введите имя мастера'),
  specialization: z.string().optional(),
})
type Step2Form = z.infer<typeof step2Schema>

// ── Progress bar ──────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = current > step.id
        const active = current === step.id
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  done
                    ? 'bg-primary-600 text-white'
                    : active
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <CheckCircle size={18} /> : <step.icon size={18} />}
              </div>
              <p className={`text-xs mt-1.5 font-medium ${active || done ? 'text-primary-700' : 'text-gray-400'}`}>
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 mb-5 rounded-full transition-all ${
                  current > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Salon info ────────────────────────────────────────────────────────
function SalonStep({ onNext }: { onNext: (salonId: number) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
  })

  const onSubmit = async (data: Step1Form) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/dashboard/salon', {
        name: data.name,
        address: data.address,
        city: data.city,
        phone: data.phone || null,
        website: data.website || null,
        description: data.description || null,
      })
      onNext(res.data.id)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (typeof detail === 'string' && detail.includes('already exists')) {
        // Salon already exists — fetch it and move on
        try {
          const existing = await api.get('/dashboard/salon')
          onNext(existing.data.id)
        } catch {
          setError('Не удалось получить данные салона.')
        }
      } else {
        setError(typeof detail === 'string' ? detail : 'Ошибка при создании салона.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Название салона *"
            placeholder="Студия красоты «Аура»"
            leftIcon={<Store size={16} />}
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <Input
          label="Город *"
          placeholder="Москва"
          leftIcon={<MapPin size={16} />}
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Адрес *"
          placeholder="ул. Пушкина, 10"
          leftIcon={<MapPin size={16} />}
          error={errors.address?.message}
          {...register('address')}
        />
        <Input
          label="Телефон"
          type="tel"
          placeholder="+7 (999) 123-45-67"
          leftIcon={<Phone size={16} />}
          {...register('phone')}
        />
        <Input
          label="Сайт"
          type="url"
          placeholder="https://mysalon.ru"
          leftIcon={<Globe size={16} />}
          error={errors.website?.message}
          {...register('website')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
        <textarea
          placeholder="Расскажите о вашем салоне..."
          rows={3}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
          {...register('description')}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading} size="lg">
          Далее <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  )
}

// ── Step 2: First master ──────────────────────────────────────────────────────
function MasterStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
  })

  const onSubmit = async (data: Step2Form) => {
    setLoading(true)
    setError('')
    try {
      await api.post('/dashboard/masters', {
        name: data.name,
        specializations: data.specialization ? [data.specialization] : [],
      })
      onNext()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Ошибка при добавлении мастера.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-primary-600 shrink-0 mt-0.5" />
        <p className="text-sm text-primary-700">
          Добавьте хотя бы одного мастера, чтобы клиенты могли записаться. Вы сможете добавить больше позже.
        </p>
      </div>

      <Input
        label="Имя мастера *"
        placeholder="Анна Петрова"
        leftIcon={<Users size={16} />}
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Специализация"
        placeholder="Парикмахер, маникюр, массаж..."
        {...register('specialization')}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Пропустить
        </button>
        <Button type="submit" loading={loading} size="lg">
          Добавить мастера <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  )
}

// ── Step 3: Done ──────────────────────────────────────────────────────────────
function DoneStep() {
  const router = useRouter()

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-200">
        <Sparkles size={36} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ваш салон готов!</h2>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Салон зарегистрирован и появится в каталоге Красиво. Настройте расписание и услуги в личном кабинете.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => router.push('/dashboard')}
          size="lg"
        >
          Перейти в кабинет <ArrowRight size={16} />
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/salons')}
          size="lg"
        >
          Посмотреть каталог
        </Button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [, setSalonId] = useState<number | null>(null)

  const currentStep = STEPS.find((s) => s.id === step)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Scissors size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
              Красиво
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Регистрация бизнеса</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <StepIndicator current={step} />

          {/* Step header */}
          {step < 3 && (
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">{currentStep.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{currentStep.sub}</p>
            </div>
          )}

          {step === 1 && (
            <SalonStep onNext={(id) => { setSalonId(id); setStep(2) }} />
          )}
          {step === 2 && (
            <MasterStep onNext={() => setStep(3)} onSkip={() => setStep(3)} />
          )}
          {step === 3 && <DoneStep />}
        </div>
      </div>
    </div>
  )
}
