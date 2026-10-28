'use client'

import { useForm } from 'react-hook-form'
import type { SalonFilters } from '@/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { SlidersHorizontal } from 'lucide-react'

const CITIES = [
  { value: '', label: 'Все города' },
  { value: 'Москва', label: 'Москва' },
  { value: 'Санкт-Петербург', label: 'Санкт-Петербург' },
  { value: 'Новосибирск', label: 'Новосибирск' },
  { value: 'Екатеринбург', label: 'Екатеринбург' },
  { value: 'Казань', label: 'Казань' },
]

const CATEGORIES = [
  { value: '', label: 'Все категории' },
  { value: 'hair', label: 'Парикмахерская' },
  { value: 'barbershop', label: 'Барбершоп' },
  { value: 'nails', label: 'Маникюр/Педикюр' },
  { value: 'cosmetology', label: 'Косметология' },
  { value: 'massage', label: 'Массаж' },
  { value: 'brows', label: 'Брови и ресницы' },
]

const SORT_OPTIONS = [
  { value: 'rating', label: 'По рейтингу' },
  { value: 'newest', label: 'Новые' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
]

interface Props {
  filters: SalonFilters
  onChange: (filters: SalonFilters) => void
}

export default function SalonFilters({ filters, onChange }: Props) {
  const { register, handleSubmit, reset } = useForm<SalonFilters>({
    defaultValues: filters,
  })

  const onSubmit = (data: SalonFilters) => {
    onChange({ ...data, page: 1 })
  }

  const handleReset = () => {
    reset({})
    onChange({ page: 1 })
  }

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5 h-fit">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <SlidersHorizontal size={16} className="text-primary-600" />
        <h3 className="font-semibold text-gray-900">Фильтры</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Город"
          options={CITIES}
          {...register('city')}
        />

        <Select
          label="Категория"
          options={CATEGORIES}
          {...register('category')}
        />

        <Select
          label="Сортировка"
          options={SORT_OPTIONS}
          {...register('sort')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Минимальный рейтинг
          </label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            className="w-full accent-primary-600"
            {...register('rating_min', { valueAsNumber: true })}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>5</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Цена от"
            type="number"
            placeholder="0"
            {...register('price_min', { valueAsNumber: true })}
          />
          <Input
            label="Цена до"
            type="number"
            placeholder="10000"
            {...register('price_max', { valueAsNumber: true })}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" fullWidth>
            Применить
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={handleReset}>
            Сбросить
          </Button>
        </div>
      </form>
    </aside>
  )
}
