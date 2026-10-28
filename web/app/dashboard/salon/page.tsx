'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Edit2, ImageIcon, Clock, DollarSign } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useOwnerSalon, useUpdateSalon } from '@/hooks/useDashboard'
import { useDashboardServices, useCreateService, useDeleteService } from '@/hooks/useServices'
import { useAuthStore } from '@/store/auth'
import api, { getImageUrl } from '@/lib/api'
import { formatPrice, formatDuration } from '@/lib/utils'

const salonSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  address: z.string().min(5),
  city: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
})

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  duration_minutes: z.number().min(15).max(480),
  price: z.number().min(0),
})

export default function SalonManagePage() {
  const { data: salon, isLoading } = useOwnerSalon()
  const updateSalon = useUpdateSalon()
  const { data: services } = useDashboardServices()
  const createService = useCreateService()
  const deleteService = useDeleteService()
  const { token } = useAuthStore()

  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [photoLoading, setPhotoLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(salonSchema) })

  const {
    register: registerSvc,
    handleSubmit: handleSvcSubmit,
    reset: resetSvc,
    formState: { errors: svcErrors, isSubmitting: svcSubmitting },
  } = useForm({ resolver: zodResolver(serviceSchema) })

  useEffect(() => {
    if (salon) {
      reset({
        name: salon.name,
        description: salon.description,
        address: salon.address,
        city: salon.city,
        phone: salon.phone,
        email: salon.email || '',
        website: salon.website || '',
      })
    }
  }, [salon, reset])

  const onSalonSubmit = async (data: z.infer<typeof salonSchema>) => {
    await updateSalon.mutateAsync(data)
    setSuccessMsg('Данные салона обновлены')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const onServiceSubmit = async (data: z.infer<typeof serviceSchema>) => {
    await createService.mutateAsync(data)
    setServiceModalOpen(false)
    resetSvc()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setPhotoLoading(true)
    try {
      await api.uploadFile('/dashboard/salon/photos', file, token)
    } finally {
      setPhotoLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Мой салон</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5">
          {successMsg}
        </div>
      )}

      {/* Salon info form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Основная информация</h2>
        <form onSubmit={handleSubmit(onSalonSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" error={errors.name?.message} {...register('name')} />
            <Input label="Город" error={errors.city?.message} {...register('city')} />
          </div>
          <Textarea label="Описание" rows={3} {...register('description')} />
          <Input label="Адрес" error={errors.address?.message} {...register('address')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Телефон" type="tel" error={errors.phone?.message} {...register('phone')} />
            <Input label="Email" type="email" {...register('email')} />
          </div>
          <Input label="Сайт" placeholder="https://example.com" {...register('website')} />
          <Button type="submit" loading={isSubmitting}>
            Сохранить изменения
          </Button>
        </form>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Фото салона</h2>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
              <Plus size={16} />
              {photoLoading ? 'Загрузка...' : 'Добавить фото'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        {salon?.photos && salon.photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {salon.photos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="text-white">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
            <ImageIcon size={32} className="mx-auto mb-2" />
            <p className="text-sm">Нет фото. Добавьте фотографии вашего салона.</p>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Услуги</h2>
          <Button size="sm" onClick={() => setServiceModalOpen(true)}>
            <Plus size={15} />
            Добавить услугу
          </Button>
        </div>

        {services && services.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {services.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="font-medium text-gray-900">{svc.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} />
                      {formatDuration(svc.duration_minutes)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary-700">{formatPrice(svc.price)}</span>
                  <button
                    onClick={() => deleteService.mutate(svc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Добавьте услуги вашего салона</p>
        )}
      </div>

      {/* Add service modal */}
      <Modal isOpen={serviceModalOpen} onClose={() => setServiceModalOpen(false)} title="Новая услуга" size="sm">
        <form onSubmit={handleSvcSubmit(onServiceSubmit)} className="space-y-4">
          <Input label="Название услуги" error={svcErrors.name?.message} {...registerSvc('name')} />
          <Textarea label="Описание" rows={2} {...registerSvc('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Длительность (мин)"
              type="number"
              error={svcErrors.duration_minutes?.message}
              {...registerSvc('duration_minutes', { valueAsNumber: true })}
            />
            <Input
              label="Цена (₽)"
              type="number"
              error={svcErrors.price?.message}
              {...registerSvc('price', { valueAsNumber: true })}
            />
          </div>
          <Button type="submit" fullWidth loading={svcSubmitting}>
            Добавить
          </Button>
        </form>
      </Modal>
    </div>
  )
}
