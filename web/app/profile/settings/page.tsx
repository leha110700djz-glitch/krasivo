'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Camera, User, Lock } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import api, { getImageUrl } from '@/lib/api'

const profileSchema = z.object({
  name: z.string().min(2, 'Введите имя'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  bio: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6, 'Минимум 6 символов'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
})

export default function ProfileSettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const { token, updateUser } = useAuthStore()
  const router = useRouter()
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', bio: '' },
  })

  const {
    register: registerPwd,
    handleSubmit: handlePasswordSubmit,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
    if (user) {
      reset({ name: user.name, email: user.email || '', bio: user.bio || '' })
    }
  }, [isAuthenticated, user, router, reset])

  const onProfileSubmit = async (data: { name: string; email?: string; bio?: string }) => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const updated = await api.put<typeof user>('/auth/me', data, token!)
      if (updated) updateUser(updated as Partial<typeof user>)
      setSuccessMsg('Профиль обновлён')
    } catch {
      setErrorMsg('Ошибка обновления профиля')
    }
  }

  const onPasswordSubmit = async (data: { current_password: string; new_password: string }) => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await api.post('/auth/change-password', data, token!)
      setSuccessMsg('Пароль изменён')
      resetPwd()
    } catch {
      setErrorMsg('Ошибка смены пароля. Проверьте текущий пароль.')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setAvatarLoading(true)
    try {
      const result = await api.uploadFile('/auth/avatar', file, token)
      updateUser({ avatar: result.url })
      setSuccessMsg('Аватар обновлён')
    } catch {
      setErrorMsg('Ошибка загрузки аватара')
    } finally {
      setAvatarLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 mb-6 transition-colors">
            <ChevronLeft size={16} />
            Назад к профилю
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки профиля</h1>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {errorMsg}
            </div>
          )}

          {/* Avatar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={18} className="text-primary-600" />
              Фото профиля
            </h2>
            <div className="flex items-center gap-5">
              {user.avatar ? (
                <img src={getImageUrl(user.avatar)} alt={user.name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 text-3xl font-bold">{user.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-xl hover:bg-primary-800 transition-colors">
                    {avatarLoading ? 'Загрузка...' : 'Изменить фото'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarLoading} />
                </label>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG. Максимум 5 МБ</p>
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <User size={18} className="text-primary-600" />
              Личные данные
            </h2>
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <Input label="Имя" error={errors.name?.message} {...register('name')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Textarea label="О себе" rows={3} {...register('bio')} />
              <Button type="submit" loading={isSubmitting}>
                Сохранить изменения
              </Button>
            </form>
          </div>

          {/* Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Lock size={18} className="text-primary-600" />
              Изменить пароль
            </h2>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Текущий пароль"
                type="password"
                error={pwdErrors.current_password?.message}
                {...registerPwd('current_password')}
              />
              <Input
                label="Новый пароль"
                type="password"
                error={pwdErrors.new_password?.message}
                {...registerPwd('new_password')}
              />
              <Input
                label="Подтвердите новый пароль"
                type="password"
                error={pwdErrors.confirm_password?.message}
                {...registerPwd('confirm_password')}
              />
              <Button type="submit" loading={pwdSubmitting}>
                Изменить пароль
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
