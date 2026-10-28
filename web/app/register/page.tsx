'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, Lock, Eye, EyeOff, User, Scissors } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

const registerSchema = z.object({
  name: z.string().min(2, 'Введите ваше имя'),
  phone: z.string().min(10, 'Введите корректный телефон'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string(),
  role: z.enum(['client', 'owner']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'client' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    try {
      await registerUser(data.name, data.phone, data.password, data.role)
      router.push(data.role === 'owner' ? '/onboarding' : '/')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Ошибка регистрации. Попробуйте ещё раз.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Scissors size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
              Красиво
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Создать аккаунт</h1>
          <p className="text-gray-500 mt-1 text-sm">Присоединяйтесь к Красиво</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Я регистрируюсь как</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'client')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === 'client'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <User size={20} className={selectedRole === 'client' ? 'text-primary-600' : 'text-gray-400'} />
                  <p className="font-medium text-sm mt-2">Клиент</p>
                  <p className="text-xs text-gray-500">Записывайтесь к мастерам</p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'owner')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === 'owner'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Scissors size={20} className={selectedRole === 'owner' ? 'text-primary-600' : 'text-gray-400'} />
                  <p className="font-medium text-sm mt-2">Владелец</p>
                  <p className="text-xs text-gray-500">Управляйте салоном</p>
                </button>
              </div>
            </div>

            <Input
              label="Имя"
              placeholder="Иван Иванов"
              leftIcon={<User size={16} />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Телефон"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              leftIcon={<Phone size={16} />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="Придумайте пароль"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Подтвердите пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="Повторите пароль"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" loading={isLoading} fullWidth size="lg" className="mt-2">
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-primary-700 font-medium hover:text-primary-800">
                Войти
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Регистрируясь, вы принимаете{' '}
          <a href="#" className="text-primary-600 hover:underline">условия использования</a>
        </p>
      </div>
    </div>
  )
}
