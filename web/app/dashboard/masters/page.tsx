'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Star, Award } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useDashboardMasters, useCreateMaster, useDeleteMaster } from '@/hooks/useMaster'
import { getImageUrl } from '@/lib/api'

const masterSchema = z.object({
  name: z.string().min(2, 'Введите имя мастера'),
  bio: z.string().optional(),
  specializations: z.string().optional(),
  experience_years: z.number().min(0).max(50).optional(),
  user_phone: z.string().optional(),
})

export default function MastersManagePage() {
  const { data: masters, isLoading } = useDashboardMasters()
  const createMaster = useCreateMaster()
  const deleteMaster = useDeleteMaster()
  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(masterSchema) })

  const onSubmit = async (data: z.infer<typeof masterSchema>) => {
    const payload = {
      ...data,
      specializations: data.specializations
        ? data.specializations.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    }
    await createMaster.mutateAsync(payload as Parameters<typeof createMaster.mutateAsync>[0])
    setModalOpen(false)
    reset()
  }

  const handleDelete = (id: number) => {
    if (confirm('Удалить мастера?')) deleteMaster.mutate(id)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мастера</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Добавить мастера
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : masters && masters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {masters.map((master) => (
            <div key={master.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                {master.avatar ? (
                  <img
                    src={getImageUrl(master.avatar)}
                    alt={master.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-xl font-bold">{master.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{master.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="fill-accent-400 text-accent-400" />
                    <span className="text-sm text-gray-600">{master.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({master.reviews_count})</span>
                  </div>
                  {master.experience_years && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Award size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{master.experience_years} лет опыта</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(master.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {master.specializations && master.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {master.specializations.map((s, i) => (
                    <Badge key={i} variant="primary" size="sm">{s}</Badge>
                  ))}
                </div>
              )}

              {master.bio && (
                <p className="text-xs text-gray-500 mt-3 line-clamp-2">{master.bio}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <Award size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Нет мастеров</h3>
          <p className="text-gray-500 text-sm mb-5">Добавьте мастеров вашего салона</p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Добавить мастера
          </Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Новый мастер">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Имя мастера"
            placeholder="Анна Иванова"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Телефон мастера (для регистрации)"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            hint="Если у мастера нет аккаунта, он будет создан"
            {...register('user_phone')}
          />
          <Textarea
            label="О мастере"
            placeholder="Специализация, стиль работы..."
            rows={2}
            {...register('bio')}
          />
          <Input
            label="Специализации"
            placeholder="Стрижки, окрашивание, укладки"
            hint="Перечислите через запятую"
            {...register('specializations')}
          />
          <Input
            label="Лет опыта"
            type="number"
            min={0}
            max={50}
            {...register('experience_years', { valueAsNumber: true })}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Добавить мастера
          </Button>
        </form>
      </Modal>
    </div>
  )
}
