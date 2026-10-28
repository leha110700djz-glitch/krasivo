'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  MapPin,
  ArrowRight,
  Star,
  Clock,
  CheckCircle,
  Smartphone,
  ChevronRight,
  Scissors,
  Sparkles,
  Tag,
  Gift,
  Bell,
  Calendar,
  TrendingUp,
  Users,
  BarChart2,
  Shield,
  Zap,
  ChevronDown,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SalonCard from '@/components/salons/SalonCard'
import Button from '@/components/ui/Button'
import { SalonCardSkeleton } from '@/components/ui/Skeleton'
import { useFeaturedSalons } from '@/hooks/useSalons'

const CATEGORIES = [
  {
    label: 'Парикмахерские',
    slug: 'hair',
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format',
  },
  {
    label: 'Барбершопы',
    slug: 'barbershop',
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80&auto=format',
  },
  {
    label: 'Маникюр',
    slug: 'nails',
    photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&auto=format',
  },
  {
    label: 'Косметология',
    slug: 'cosmetology',
    photo: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80&auto=format',
  },
  {
    label: 'Брови и ресницы',
    slug: 'brows',
    photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&auto=format',
  },
  {
    label: 'Массаж',
    slug: 'massage',
    photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&auto=format',
  },
  {
    label: 'Макияж',
    slug: 'makeup',
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format',
  },
  {
    label: 'Уход за кожей',
    slug: 'skincare',
    photo: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&auto=format',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Выберите мастера',
    description: 'Найдите специалиста по рейтингу, отзывам и фото работ',
    icon: Search,
  },
  {
    number: '02',
    title: 'Запишитесь онлайн',
    description: 'Выберите удобное время и подтвердите запись в один клик',
    icon: Clock,
  },
  {
    number: '03',
    title: 'Наслаждайтесь результатом',
    description: 'Приходите, получите сервис и оставьте отзыв',
    icon: CheckCircle,
  },
]

const CLIENT_FEATURES = [
  { icon: Search, title: 'Поиск по городу', desc: 'Лучшие мастера рядом с вами' },
  { icon: Calendar, title: 'Онлайн-запись', desc: 'Без звонков и ожидания' },
  { icon: Bell, title: 'Напоминания', desc: 'Push-уведомления на телефон' },
  { icon: Gift, title: 'Промокоды', desc: 'Скидки и акции каждую неделю' },
  { icon: Star, title: 'Рейтинги и отзывы', desc: 'Честные оценки реальных клиентов' },
  { icon: Tag, title: 'Акции', desc: 'Специальные предложения от салонов' },
]

const OWNER_FEATURES = [
  { icon: Users, title: 'Управление мастерами', desc: 'Расписание, услуги, фото-портфолио' },
  { icon: BarChart2, title: 'Аналитика и доходы', desc: 'Статистика по записям и выручке' },
  { icon: Bell, title: 'Уведомления клиентам', desc: 'Автоматические напоминания о записи' },
  { icon: Tag, title: 'Промокоды и акции', desc: 'Привлекайте новых клиентов скидками' },
  { icon: TrendingUp, title: 'Рост клиентской базы', desc: 'Выход на тысячи новых клиентов' },
  { icon: Shield, title: 'Безопасные платежи', desc: 'Прозрачный учёт всех транзакций' },
]

const PROMO_CODES = [
  { code: 'BEAUTY20', label: '−20%', desc: 'на первую запись', color: 'from-rose-500 to-pink-600' },
  { code: 'KRASIVO10', label: '−10%', desc: 'для новых клиентов', color: 'from-violet-500 to-purple-600' },
  { code: 'FRIEND15', label: '−15%', desc: 'за приглашение друга', color: 'from-blue-500 to-indigo-600' },
]

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('')
  const { data: featuredData, isLoading } = useFeaturedSalons()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (searchQuery) params.set('search', searchQuery)
    router.push(`/salons?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero — full bleed photo */}
      <section className="relative min-h-[640px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=85&auto=format"
            alt="Салон красоты"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm text-white">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>Более 50 000 записей каждый месяц</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              Ваш лучший<br />
              <span className="text-primary-300">мастер красоты</span><br />
              рядом с вами
            </h1>
            <p className="text-lg text-white/75 mb-9 leading-relaxed">
              Записывайтесь в топовые салоны и барбершопы вашего города. Без звонков, без очередей.
            </p>

            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
              <div className="flex items-center gap-2 flex-1 px-3 border-b sm:border-b-0 sm:border-r border-gray-100 pb-2 sm:pb-0">
                <MapPin size={17} className="text-gray-400 shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 text-gray-800 text-sm outline-none bg-transparent"
                >
                  <option value="">Выберите город</option>
                  <option value="Москва">Москва</option>
                  <option value="Санкт-Петербург">Санкт-Петербург</option>
                  <option value="Новосибирск">Новосибирск</option>
                  <option value="Екатеринбург">Екатеринбург</option>
                  <option value="Казань">Казань</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search size={17} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Стрижка, маникюр, барбершоп..."
                  className="flex-1 text-gray-800 text-sm outline-none bg-transparent"
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0">
                Найти
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              {['Маникюр', 'Стрижка', 'Барбершоп', 'Косметология'].map((q) => (
                <button
                  key={q}
                  onClick={() => router.push(`/salons?search=${q}`)}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-sm px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center gap-10 sm:gap-16 text-white">
              {[
                { value: '1 000+', label: 'мастеров' },
                { value: '500+', label: 'салонов' },
                { value: '50 000+', label: 'записей' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promo codes banner */}
      <section className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 text-white shrink-0">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Скидки для новых клиентов</p>
                <p className="text-white/60 text-xs">Введите код при записи</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 flex-1 justify-center sm:justify-start">
              {PROMO_CODES.map(({ code, label, desc, color }) => (
                <div
                  key={code}
                  className={`bg-gradient-to-r ${color} rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity`}
                  onClick={() => router.push('/salons')}
                >
                  <div className="text-white">
                    <p className="font-black text-lg leading-none">{label}</p>
                    <p className="text-white/80 text-xs">{desc}</p>
                  </div>
                  <div className="bg-white/20 border border-white/30 rounded-lg px-2 py-1">
                    <p className="text-white font-bold text-xs tracking-wider">{code}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/salons" className="text-white/70 hover:text-white text-sm flex items-center gap-1 shrink-0">
              Все акции <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Популярные категории</h2>
            <p className="text-gray-500 mt-1 text-sm">Найдите специалиста по нужной услуге</p>
          </div>
          <Link href="/salons" className="hidden sm:flex items-center gap-1 text-primary-700 hover:text-primary-800 text-sm font-medium">
            Все категории <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {CATEGORIES.map(({ label, slug, photo }) => (
            <Link
              key={slug}
              href={`/salons?category=${slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer block"
            >
              <img
                src={photo}
                alt={label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors" />
              <div className="absolute inset-0 flex items-end p-4">
                <span className="text-white font-semibold text-sm leading-tight">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured salons */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Лучшие салоны</h2>
              <p className="text-gray-500 mt-1 text-sm">По рейтингу и отзывам клиентов</p>
            </div>
            <Link href="/salons?sort=rating" className="hidden sm:flex items-center gap-1 text-primary-700 hover:text-primary-800 text-sm font-medium">
              Смотреть все <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SalonCardSkeleton key={i} />)
              : featuredData?.items.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/salons">
              <Button variant="outline" size="lg">
                Показать все салоны
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Client / Owner split section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Красиво — для всех</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">Единая платформа для клиентов и владельцев бизнеса в сфере красоты</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* For clients */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 rounded-full px-4 py-1.5 mb-6 text-sm text-primary-300">
                  <Scissors size={13} />
                  <span>Для клиентов</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Запись к мастеру<br />за 2 минуты
                </h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Найдите своего идеального мастера, запишитесь онлайн и получайте напоминания о записи
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {CLIENT_FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-primary-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={14} className="text-primary-400" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{title}</p>
                        <p className="text-gray-500 text-xs">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/salons">
                  <button className="bg-primary-600 hover:bg-primary-500 transition-colors text-white rounded-xl px-6 py-3 font-semibold text-sm flex items-center gap-2">
                    Найти мастера
                    <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            </div>

            {/* For owners */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-8 md:p-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-1.5 mb-6 text-sm text-amber-700">
                  <TrendingUp size={13} />
                  <span>Для владельцев</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Управляйте бизнесом<br />в одном окне
                </h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  Зарегистрируйте салон, добавьте мастеров и начните принимать онлайн-записи уже сегодня
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {OWNER_FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-gray-800 text-xs font-medium">{title}</p>
                        <p className="text-gray-500 text-xs">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/register">
                    <button className="bg-amber-500 hover:bg-amber-400 transition-colors text-white rounded-xl px-6 py-3 font-semibold text-sm flex items-center gap-2">
                      Зарегистрировать салон
                      <ArrowRight size={16} />
                    </button>
                  </Link>
                  <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                    Войти в кабинет
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Как это работает</h2>
            <p className="text-gray-500 mt-2 text-sm">Запись к мастеру за 3 простых шага</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map(({ number, title, description, icon: Icon }, i) => (
              <div key={number} className="flex flex-col items-center text-center relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[-50%] h-px bg-gray-200" />
                )}
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center">
                    <Icon size={30} className="text-primary-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {number}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-900 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-white">Нам доверяют</h2>
            <p className="text-white/40 text-sm mt-1">Реальные отзывы клиентов</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: 'Нашла своего мастера по маникюру с первого раза. Теперь хожу только к ней!',
                name: 'Мария К.',
                city: 'Москва',
                rating: 5,
                photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&q=80&auto=format',
              },
              {
                text: 'Барбершоп Brothers — лучшее место в городе. Записываюсь за 5 минут прямо с телефона.',
                name: 'Артём В.',
                city: 'Москва',
                rating: 5,
                photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&auto=format',
              },
              {
                text: 'Удобный сервис, широкий выбор мастеров. Красиво — мой главный помощник в уходе за собой.',
                name: 'Анна Л.',
                city: 'Санкт-Петербург',
                rating: 5,
                photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&auto=format',
              },
            ].map((r, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={r.photo}
                    alt={r.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{r.name}</p>
                    <p className="text-white/40 text-xs">{r.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download app */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-800 to-primary-600 p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5 text-sm">
              <Smartphone size={13} />
              <span>Мобильное приложение</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Скачайте Красиво
            </h2>
            <p className="text-white/70 mb-7 leading-relaxed text-sm">
              Записывайтесь к мастерам, отслеживайте историю записей и получайте уведомления прямо на телефон.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-white text-gray-900 hover:bg-gray-100 transition-colors rounded-xl px-5 py-3 font-medium text-sm flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 transition-colors rounded-xl px-5 py-3 font-medium text-sm flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l12.89-7.44-2.82-2.82-11.06 10.06zm16.34-9.44l2.69-1.55c.49-.28.49-.74 0-1.02l-2.69-1.55-3.06 3.06 3.06 3.06zM3.18.24C2.67-.07 2.09 0 1.65.37L14.25 12 17.07 9.18 3.18.24zm11.69 13.32L3 20.82V3.18l11.87 10.38z"/>
                </svg>
                Google Play
              </button>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative flex-shrink-0">
            <div className="w-48 h-96 bg-white/10 border border-white/20 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
              {/* Status bar */}
              <div className="bg-black/30 h-8 flex items-center justify-between px-4">
                <div className="w-16 h-1.5 bg-white/20 rounded-full" />
                <div className="flex gap-1">
                  <div className="w-4 h-1.5 bg-white/40 rounded-full" />
                  <div className="w-3 h-1.5 bg-white/40 rounded-full" />
                </div>
              </div>
              {/* App header */}
              <div className="bg-primary-700/80 px-4 py-3">
                <p className="text-white font-bold text-sm">Красиво</p>
                <p className="text-white/60 text-xs">Салоны рядом</p>
              </div>
              {/* Fake card items */}
              <div className="flex-1 bg-gray-900/60 p-3 space-y-2">
                {[
                  { name: 'Beauty Studio', stars: 5, img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=80&q=60' },
                  { name: 'Masters BBQ', stars: 4, img: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=80&q=60' },
                  { name: 'Nails Pro', stars: 5, img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=80&q=60' },
                ].map((item) => (
                  <div key={item.name} className="bg-white/10 rounded-xl p-2 flex gap-2 items-center">
                    <img src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: item.stars }).map((_, j) => (
                          <Star key={j} size={8} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Bottom nav */}
              <div className="bg-black/40 px-4 py-2 flex justify-around">
                {[Search, Calendar, Bell, Scissors].map((Icon, i) => (
                  <div key={i} className={`w-6 h-6 flex items-center justify-center ${i === 0 ? 'text-primary-400' : 'text-white/30'}`}>
                    <Icon size={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owner CTA banner */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-1.5 mb-5 text-sm text-white">
            <Zap size={13} />
            <span>Бесплатная регистрация</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Ваш салон — на Красиво
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
            Присоединяйтесь к сотням успешных салонов. Онлайн-запись, управление мастерами, аналитика и промокоды — всё в одном месте.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="bg-white text-amber-700 hover:bg-amber-50 transition-colors rounded-xl px-8 py-3.5 font-bold text-sm flex items-center justify-center gap-2">
                Зарегистрировать бизнес
                <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="bg-white/15 hover:bg-white/25 border border-white/30 transition-colors text-white rounded-xl px-8 py-3.5 font-semibold text-sm">
                Уже есть кабинет
              </button>
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm mx-auto text-white">
            {[
              { v: 'Бесплатно', l: 'регистрация' },
              { v: '5 мин', l: 'настройка' },
              { v: '0%', l: 'комиссия' },
            ].map(({ v, l }) => (
              <div key={l}>
                <p className="text-2xl font-black">{v}</p>
                <p className="text-white/60 text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
